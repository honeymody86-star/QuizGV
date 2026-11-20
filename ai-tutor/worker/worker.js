// خادم وسيط على Cloudflare Workers (الخطة المجانية: 100 ألف طلب يومياً).
// الفائدة: 1) المفاتيح لا تصل للمتصفح  2) كاش للدروس والأصوات المتكررة = تكلفة صفر عند التكرار
//          3) حدّ يومي لكل مستخدم يحميك من فاتورة مفاجئة.
import Anthropic from "@anthropic-ai/sdk";
import { LESSON_SCHEMA, SYSTEM_PROMPT } from "../lesson-spec.js";

const MODELS = new Set(["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"]);
export const RESET = "\u0000RESET\u0000"; // يخبر الواجهة أن نموذجاً بديلاً سيعيد كتابة الدرس

const sha = async (s) => {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
};
const norm = (q) => q.trim().replace(/[ً-ْـ]/g, "").replace(/[؟?!.،,]+/g, "").replace(/\s+/g, " ").replace(/[أإآ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

function cors(env, req) {
  const origin = req.headers.get("origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "*").split(",").map((s) => s.trim());
  return {
    "access-control-allow-origin": allowed.includes("*") ? "*" : allowed.includes(origin) ? origin : allowed[0],
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "access-control-expose-headers": "x-cache",
  };
}

async function rateLimit(env, req, kind) {
  const limit = Number(env[kind === "lesson" ? "DAILY_LESSONS" : "DAILY_TTS"] || (kind === "lesson" ? 30 : 400));
  const ip = req.headers.get("cf-connecting-ip") || "anon";
  const key = `rl:${kind}:${new Date().toISOString().slice(0, 10)}:${ip}`;
  const n = Number((await env.CACHE.get(key)) || 0);
  if (n >= limit) return false;
  await env.CACHE.put(key, String(n + 1), { expirationTtl: 60 * 60 * 26 });
  return true;
}

async function lesson(req, env, h) {
  const { question = "", model: m, image } = await req.json();
  if (!question.trim() || question.length > 2000) return new Response("bad question", { status: 400, headers: h });
  const model = MODELS.has(m) ? m : env.DEFAULT_MODEL || "claude-sonnet-5-5";
  const cacheKey = image ? null : `lesson:${model}:${await sha(norm(question))}`;
  if (cacheKey) {
    const hit = await env.CACHE.get(cacheKey);
    if (hit) return new Response(hit, { headers: { ...h, "content-type": "text/plain; charset=utf-8", "x-cache": "HIT" } });
  }
  if (!(await rateLimit(env, req, "lesson"))) return new Response("وصلت للحد اليومي من الأسئلة", { status: 429, headers: h });

  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  const content = [];
  if (image?.data) content.push({ type: "image", source: { type: "base64", media_type: image.type || "image/jpeg", data: image.data } });
  content.push({ type: "text", text: `سؤال الطالب: ${question}` });
  const params = {
    model,
    max_tokens: 16000,
    system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content }],
    output_config: { effort: "low", format: { type: "json_schema", schema: LESSON_SCHEMA } },
  };
  const stream = model.startsWith("claude-haiku")
    ? client.messages.stream(params)
    : client.beta.messages.stream({ ...params, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" });

  const enc = new TextEncoder();
  const body = new ReadableStream({
    async start(ctrl) {
      let full = "";
      try {
        for await (const ev of stream) {
          if (ev.type === "content_block_start" && ev.content_block?.type === "fallback") {
            full = "";
            ctrl.enqueue(enc.encode(RESET));
          } else if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            full += ev.delta.text;
            ctrl.enqueue(enc.encode(ev.delta.text));
          }
        }
        const msg = await stream.finalMessage();
        if (msg.stop_reason === "end_turn" && cacheKey) {
          try { JSON.parse(full); await env.CACHE.put(cacheKey, full, { expirationTtl: 60 * 60 * 24 * 60 }); } catch { /* لا نخزّن درساً تالفاً */ }
        }
      } catch (e) {
        console.error(e);
      }
      ctrl.close();
    },
  });
  return new Response(body, { headers: { ...h, "content-type": "text/plain; charset=utf-8", "x-cache": "MISS" } });
}

async function tts(req, env, h) {
  const { text = "" } = await req.json();
  if (!text.trim() || text.length > 1500) return new Response("bad text", { status: 400, headers: h });
  const provider = env.TTS_PROVIDER || "azure";
  const voice = provider === "elevenlabs" ? env.ELEVEN_VOICE_ID : env.AZURE_VOICE || "ar-SA-HamedNeural";
  const key = `tts:${provider}:${voice}:${await sha(text)}`;
  const hit = await env.CACHE.get(key);
  if (hit) return new Response(hit, { headers: { ...h, "content-type": "application/json", "x-cache": "HIT" } });
  if (!(await rateLimit(env, req, "tts"))) return new Response("limit", { status: 429, headers: h });

  let out;
  if (provider === "elevenlabs") {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": env.ELEVENLABS_API_KEY, "content-type": "application/json" },
      body: JSON.stringify({ text, model_id: env.ELEVEN_MODEL || "eleven_multilingual_v2", voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25 } }),
    });
    if (!r.ok) return new Response(await r.text(), { status: 502, headers: h });
    const j = await r.json();
    out = { audio_base64: j.audio_base64, mime: "audio/mpeg", alignment: j.alignment };
  } else {
    const esc = text.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));
    const lang = voice.split("-").slice(0, 2).join("-");
    const r = await fetch(`https://${env.AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY, "Content-Type": "application/ssml+xml", "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3" },
      body: `<speak version="1.0" xml:lang="${lang}" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="${voice}"><prosody rate="-4%">${esc}</prosody></voice></speak>`,
    });
    if (!r.ok) return new Response(await r.text(), { status: 502, headers: h });
    const buf = new Uint8Array(await r.arrayBuffer());
    let bin = "";
    for (let i = 0; i < buf.length; i += 0x8000) bin += String.fromCharCode(...buf.subarray(i, i + 0x8000));
    out = { audio_base64: btoa(bin), mime: "audio/mpeg" };
  }
  const json = JSON.stringify(out);
  await env.CACHE.put(key, json, { expirationTtl: 60 * 60 * 24 * 90 });
  return new Response(json, { headers: { ...h, "content-type": "application/json", "x-cache": "MISS" } });
}

export default {
  async fetch(req, env) {
    const h = cors(env, req);
    if (req.method === "OPTIONS") return new Response(null, { headers: h });
    const { pathname } = new URL(req.url);
    try {
      if (req.method === "POST" && pathname === "/lesson") return await lesson(req, env, h);
      if (req.method === "POST" && pathname === "/tts") return await tts(req, env, h);
    } catch (e) {
      console.error(e);
      return new Response("server error", { status: 500, headers: h });
    }
    return new Response("not found", { status: 404, headers: h });
  },
};
