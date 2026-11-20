import { Board } from "./board.js";
import { Player } from "./player.js";
import { TTSCache, pickBrowserVoice } from "./tts.js";
import { generateLesson } from "./llm.js";
import { DEMO_LESSONS } from "./demo-lesson.js";

const $ = (id) => document.getElementById(id);
const KEY = "visual-tutor-settings";
const DEFAULTS = { mode: "direct", model: "claude-opus-5-5", tts: "browser", rate: 1, azureVoice: "ar-SA-HamedNeural", elevenModel: "eleven_multilingual_v2", openaiVoice: "coral" };
let settings = { ...DEFAULTS };
try { Object.assign(settings, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch { /* ignore */ }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(settings)); } catch { /* ignore */ } };

// أسعار تقريبية بالدولار لتقدير تكلفة كل درس (راجع README للمصادر)
const LLM_PRICE = { // لكل مليون توكن: إدخال، إخراج، قراءة من الكاش
  "claude-opus-5-5": [4, 20, 0.2], "claude-sonnet-5-5": [2, 10, 0.1], "claude-haiku-5-5": [0.1, 0.5, 0.01],
};
const TTS_PRICE_PER_1K = { browser: 0, azure: 0.015, openai: 0.019, elevenlabs: 0.10, eleven_flash: 0.05, server: 0 };

await document.fonts.ready.catch(() => {});
const board = new Board($("board"));
const tts = new TTSCache(() => settings);
tts.onError = (e) => setStatus(`تعذّر الصوت المختار، استخدمت صوت المتصفح: ${e.message}`, true);
const player = new Player({
  board, tts, subtitleEl: $("subtitle"), settings: () => settings,
  onScene: (i, n, done) => drawProgress(i, n, done),
  onState: (s) => {
    $("btnPause").disabled = !(s === "playing" || s === "paused" || s === "silent");
    $("btnPause").textContent = s === "paused" ? "▶" : "⏸";
    const msg = { thinking: "✍️ المعلّم يجهّز المشهد التالي...", loading: "🔊 تجهيز الصوت...", playing: "▶ يشرح الآن", paused: "⏸ متوقف", ended: "✅ انتهى الشرح — اسأل سؤالاً آخر أو أعد", silent: "🔇 لا يوجد صوت عربي في هذا المتصفح؛ اختر مزوّد صوت من الإعدادات", blocked: "اضغط ▶ لتشغيل الصوت" }[s];
    if (msg && !generating) setStatus(msg);
    if (s === "blocked") { $("btnPause").disabled = false; $("btnPause").textContent = "▶"; }
    if (s === "ended") $("btnReplay").disabled = false;
  },
});

let generating = false, lastLesson = null, controller = null, image = null;

function setStatus(t, err = false) { $("status").textContent = t; $("status").classList.toggle("err", err); }
function drawProgress(i, n, done) {
  const total = done ? n : Math.max(n, i + 2);
  $("progress").replaceChildren(...Array.from({ length: total }, (_, k) => {
    const el = document.createElement("i");
    if (k < i) el.className = "done"; else if (k === i) el.className = "cur";
    return el;
  }));
}
function showStage() { $("empty").classList.add("hide"); }

function estimateCost(lesson, usage, model) {
  const chars = lesson.scenes.reduce((s, sc) => s + sc.narration.length, 0);
  const ttsKey = settings.tts === "elevenlabs" && settings.elevenModel === "eleven_flash_v2_5" ? "eleven_flash" : settings.tts;
  const ttsCost = (chars / 1000) * (TTS_PRICE_PER_1K[ttsKey] ?? 0);
  let llm = 0;
  if (usage) {
    const p = LLM_PRICE[model] || LLM_PRICE[settings.model] || LLM_PRICE["claude-opus-5-5"];
    llm = ((usage.input_tokens || 0) * p[0] + (usage.cache_creation_input_tokens || 0) * p[0] * 1.25
      + (usage.cache_read_input_tokens || 0) * p[2] + (usage.output_tokens || 0) * p[1]) / 1e6;
  }
  return { chars, ttsCost, llm, total: ttsCost + llm };
}
function showCost(c, note = "") {
  const f = (v) => `$${v.toFixed(v < 0.01 ? 4 : 3)}`;
  $("cost").textContent = `تكلفة تقريبية لهذا الدرس: العقل ${f(c.llm)} + الصوت ${f(c.ttsCost)} (${c.chars} حرف) = ${f(c.total)} ${note}`;
}

// ---------- تشغيل درس جاهز ----------
function playLesson(lesson) {
  showStage();
  lastLesson = lesson;
  player.start(lesson.title);
  lesson.scenes.forEach((s) => player.addScene(s));
  player.finish();
  $("btnReplay").disabled = false;
}

// ---------- سؤال جديد ----------
async function ask(question) {
  if (!question.trim() && !image) return;
  player.unlock();
  controller?.abort();
  controller = new AbortController();
  showStage();
  generating = true;
  $("cost").textContent = "";
  $("btnReplay").disabled = true;
  setStatus("🧠 المعلّم يفكّر في أفضل طريقة للشرح...");
  player.start(null);
  drawProgress(0, 1, false);
  let gotScene = false;
  try {
    const out = await generateLesson(question || "اشرح لي ما في الصورة", settings, {
      signal: controller.signal,
      image,
      onTitle: (t) => player.setTitle(t),
      onScene: (scene) => { gotScene = true; generating = false; player.addScene(scene); },
      onProgress: (n) => { if (!gotScene) setStatus(`🧠 يكتب سيناريو الشرح... (${n} حرف)`); },
    });
    generating = false;
    player.finish();
    lastLesson = out.lesson;
    showCost(estimateCost(out.lesson, out.usage, out.model), out.cached ? "(من الكاش: الذكاء مجاني)" : "");
  } catch (e) {
    generating = false;
    if (e.name === "AbortError") return;
    console.error(e);
    player.finish();
    setStatus(`خطأ: ${e.message}`, true);
  } finally {
    image = null;
    $("camLbl").classList.remove("has");
  }
}

// ---------- الواجهة ----------
$("askForm").addEventListener("submit", (e) => { e.preventDefault(); const q = $("q").value; $("q").value = ""; ask(q); });
$("btnPause").addEventListener("click", () => {
  if (player.blockedResume) { const f = player.blockedResume; player.blockedResume = null; f(); return; }
  player.paused ? player.resume() : player.pause();
});
$("btnReplay").addEventListener("click", () => { if (lastLesson) { player.unlock(); playLesson(lastLesson); } });
$("rate").value = String(settings.rate || 1);
$("rate").addEventListener("change", (e) => { settings.rate = +e.target.value; save(); });

const chips = $("chips");
DEMO_LESSONS.forEach((d) => {
  const b = document.createElement("button");
  b.className = "chip";
  b.textContent = `▶ تجربة مجانية: ${d.question}`;
  b.onclick = () => { player.unlock(); controller?.abort(); $("cost").textContent = "درس تجريبي محفوظ: تكلفة الذكاء صفر"; setStatus("▶ يشرح الآن"); playLesson(d.lesson); };
  chips.appendChild(b);
});
["ما الفرق بين الميتوز والميوز؟", "كيف تعمل الدورة الدموية؟", "اشرح الدالة التربيعية برسم"].forEach((q) => {
  const b = document.createElement("button");
  b.className = "chip";
  b.textContent = q;
  b.onclick = () => ask(q);
  chips.appendChild(b);
});

// صورة السؤال (يُصغَّر حجمها لتقليل التوكنات)
$("file").addEventListener("change", async (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const bmp = await createImageBitmap(f);
  const s = Math.min(1, 1280 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * s); c.height = Math.round(bmp.height * s);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  image = { type: "image/jpeg", data: c.toDataURL("image/jpeg", 0.85).split(",")[1] };
  $("camLbl").classList.add("has");
  setStatus("📷 تم إرفاق الصورة — اكتب سؤالك أو اضغط ➤");
  e.target.value = "";
});

// السؤال بالصوت
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) $("btnMic").classList.add("hide");
else {
  let rec = null;
  $("btnMic").addEventListener("click", () => {
    if (rec) { rec.stop(); return; }
    player.unlock();
    rec = new SR();
    rec.lang = "ar-SA";
    rec.interimResults = true;
    rec.onresult = (e) => { $("q").value = [...e.results].map((r) => r[0].transcript).join(" "); };
    rec.onend = () => { $("btnMic").classList.remove("rec"); const q = $("q").value; rec = null; if (q.trim()) { $("q").value = ""; ask(q); } };
    rec.onerror = () => {};
    $("btnMic").classList.add("rec");
    rec.start();
  });
}

// ---------- الإعدادات ----------
const dlg = $("dlg"), form = $("settingsForm");
function fillVoices() {
  const sel = form.browserVoice;
  const voices = speechSynthesis.getVoices().filter((v) => /^ar/i.test(v.lang));
  const best = pickBrowserVoice("ar", settings.browserVoice);
  sel.replaceChildren(...(voices.length ? voices : [{ name: "", lang: "لا توجد أصوات عربية في هذا المتصفح" }]).map((v) => {
    const o = document.createElement("option");
    o.value = v.name; o.textContent = v.name ? `${v.name} (${v.lang})` : v.lang;
    if (best && v.name === best.name) o.selected = true;
    return o;
  }));
}
speechSynthesis.onvoiceschanged = fillVoices;
function syncVisibility() {
  form.querySelectorAll("[data-mode]").forEach((el) => el.classList.toggle("hide", el.dataset.mode !== form.mode.value));
  form.querySelectorAll("[data-tts]").forEach((el) => el.classList.toggle("hide", el.dataset.tts !== form.tts.value));
}
form.addEventListener("change", syncVisibility);
$("btnSettings").addEventListener("click", () => {
  fillVoices();
  for (const el of form.elements) if (el.name && settings[el.name] != null) el.value = settings[el.name];
  syncVisibility();
  dlg.showModal();
});
dlg.addEventListener("close", () => {
  if (dlg.returnValue !== "save") return;
  for (const el of form.elements) if (el.name) settings[el.name] = el.value.trim();
  save();
  setStatus("✅ تم حفظ الإعدادات");
});

// تشغيل سؤال من الرابط ?q=...
const qp = new URLSearchParams(location.search).get("q");
if (qp) $("q").value = qp;
