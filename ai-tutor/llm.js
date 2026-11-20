// توليد سيناريو الدرس من Claude مع بثّ (streaming) تدريجي:
// كل مشهد يكتمل في النص المتدفق يُسلَّم فوراً للمشغّل، فيبدأ الشرح قبل أن ينتهي النموذج من الكتابة.
// يُحمَّل SDK عند الحاجة فقط، فيعمل الدرس التجريبي حتى لو تعذّر تحميله
const SDK_URL = "./vendor/anthropic-sdk.js"; // @anthropic-ai/sdk 1.6.0 مجمّعة للمتصفح
import { LESSON_SCHEMA, SYSTEM_PROMPT } from "./lesson-spec.js";

// محلّل تدريجي: يستخرج كائنات المشاهد المكتملة من نص JSON غير مكتمل.
export class SceneStreamParser {
  constructor(onTitle, onScene) {
    this.buf = "";
    this.pos = -1;      // موضع البحث داخل مصفوفة scenes
    this.onTitle = onTitle;
    this.onScene = onScene;
    this.titleSent = false;
    this.count = 0;
  }
  reset() { this.buf = ""; this.pos = -1; this.titleSent = false; this.count = 0; }
  push(chunk) {
    this.buf += chunk;
    if (!this.titleSent) {
      const m = this.buf.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (m) { this.titleSent = true; this.onTitle(JSON.parse(`"${m[1]}"`)); }
    }
    if (this.pos < 0) {
      const m = this.buf.match(/"scenes"\s*:\s*\[/);
      if (!m) return;
      this.pos = m.index + m[0].length;
    }
    // ابحث عن كائنات { ... } متوازنة على المستوى الأول داخل المصفوفة
    while (true) {
      let i = this.pos;
      while (i < this.buf.length && this.buf[i] !== "{" && this.buf[i] !== "]") i++;
      if (i >= this.buf.length || this.buf[i] === "]") return;
      let depth = 0, inStr = false, esc = false, end = -1;
      for (let j = i; j < this.buf.length; j++) {
        const c = this.buf[j];
        if (inStr) {
          if (esc) esc = false; else if (c === "\\") esc = true; else if (c === '"') inStr = false;
        } else if (c === '"') inStr = true;
        else if (c === "{") depth++;
        else if (c === "}") { depth--; if (depth === 0) { end = j; break; } }
      }
      if (end < 0) return; // المشهد لم يكتمل بعد
      const raw = this.buf.slice(i, end + 1);
      this.pos = end + 1;
      try { this.onScene(JSON.parse(raw), this.count++); } catch (e) { console.warn("scene parse", e, raw); }
    }
  }
}

function userContent(question, image) {
  const content = [];
  if (image) content.push({ type: "image", source: { type: "base64", media_type: image.type, data: image.data } });
  content.push({ type: "text", text: `سؤال الطالب: ${question}` });
  return content;
}

/**
 * يولّد الدرس ويستدعي onTitle/onScene أثناء البث.
 * settings: { mode: "direct"|"server", apiKey, model, serverUrl }
 */
export async function generateLesson(question, settings, { onTitle, onScene, onProgress, signal, image }) {
  const parser = new SceneStreamParser(onTitle, onScene);

  if (settings.mode === "server") {
    // الخادم الوسيط يُخفي المفاتيح، ويخزّن الدروس المتكررة (توفير كبير في التكلفة)
    const res = await fetch(`${settings.serverUrl.replace(/\/$/, "")}/lesson`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ question, model: settings.model, image }),
      signal,
    });
    if (!res.ok) throw new Error(`الخادم: ${res.status} ${await res.text()}`);
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let total = 0;
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      let t = dec.decode(value, { stream: true });
      const r = t.lastIndexOf("\u0000RESET\u0000");
      if (r >= 0) { parser.reset(); t = t.slice(r + 7); } // نموذج بديل سيعيد كتابة الدرس
      total += t.length;
      onProgress?.(total);
      parser.push(t);
    }
    return { lesson: JSON.parse(parser.buf), cached: res.headers.get("x-cache") === "HIT" };
  }

  if (!settings.apiKey) throw new Error("أدخل مفتاح Claude API من الإعدادات ⚙️ أو جرّب الدرس التجريبي.");
  const { default: Anthropic } = await import(SDK_URL);
  const client = new Anthropic({ apiKey: settings.apiKey, dangerouslyAllowBrowser: true });

  const model = settings.model || "claude-opus-5-5";
  const params = {
    model,
    max_tokens: 16000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: userContent(question, image) }],
    output_config: { effort: "low", format: { type: "json_schema", schema: LESSON_SCHEMA } },
  };
  // Haiku لا يدعم التحويل التلقائي لنموذج بديل عند الرفض؛ بقية النماذج نعم
  const withFallback = !model.startsWith("claude-haiku");
  const stream = withFallback
    ? client.beta.messages.stream({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }, { signal })
    : client.messages.stream(params, { signal });

  let total = 0;
  for await (const ev of stream) {
    if (ev.type === "content_block_start" && ev.content_block?.type === "fallback") {
      parser.reset(); // نموذج بديل سيعيد كتابة الدرس من البداية
    } else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
      total += ev.delta.text.length;
      onProgress?.(total);
      parser.push(ev.delta.text);
    }
  }
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") throw new Error("اعتذر النموذج عن الإجابة على هذا السؤال.");
  if (msg.stop_reason === "max_tokens") throw new Error("انقطع الدرس لأنه طويل جداً، جرّب سؤالاً أضيق.");
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  const u = msg.usage;
  console.info("usage", u);
  return { lesson: JSON.parse(text), usage: u, model: msg.model };
}
