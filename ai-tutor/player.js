// المشغّل: يزامن الصوت مع الرسم. كل أمر رسم مربوط بعبارة (cue) داخل نص المشهد،
// ونعرف موضع النطق الحالي (رقم الحرف) من:
//  1) أزمنة الحروف من ElevenLabs (تزامن دقيق)
//  2) أحداث boundary من صوت المتصفح
//  3) أو تقدير نسبي: (الزمن الحالي / المدة) × طول النص
import { pickBrowserVoice } from "./tts.js";

const strip = (s) => s.normalize("NFC").replace(/[ً-ْـ]/g, ""); // إزالة التشكيل والتطويل

// يحدد رقم الحرف الذي يظهر عنده كل أمر
export function scheduleActions(narration, actions) {
  const plain = strip(narration);
  // خريطة من فهرس النص بدون تشكيل إلى الأصلي
  const map = [];
  for (let i = 0; i < narration.length; i++) if (!/[ً-ْـ]/.test(narration[i])) map.push(i);
  let from = 0;
  const n = actions.length;
  return actions.map((a, k) => {
    let at = -1;
    if (a.cue) {
      const c = strip(a.cue).trim();
      let idx = plain.indexOf(c, from);
      if (idx < 0) idx = plain.indexOf(c);
      if (idx >= 0) { at = map[idx] ?? idx; from = idx; }
    }
    if (at < 0) at = Math.round((k / Math.max(n, 1)) * narration.length * 0.85);
    return { at, action: a };
  });
}

export class Player {
  constructor({ board, tts, subtitleEl, settings, onScene, onState }) {
    Object.assign(this, { board, tts, subtitleEl, settings, onScene, onState });
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.scenes = [];
    this.done = false;
    this.stopped = true;
    this.paused = false;
    this.waiters = [];
  }

  // يُستدعى عند أول نقرة: iOS يحتاج تفاعل المستخدم لتشغيل الصوت لاحقاً
  unlock() {
    try {
      this.audio.src = "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
      this.audio.play().catch(() => {});
      speechSynthesis.cancel();
      speechSynthesis.speak(new SpeechSynthesisUtterance(""));
    } catch { /* ignore */ }
  }

  start(lessonTitle) {
    this.stop();
    this.scenes = [];
    this.done = false;
    this.stopped = false;
    this.paused = false;
    this.board.reset();
    if (lessonTitle) this.board.apply({ type: "heading", text: lessonTitle });
    this.run();
  }
  setTitle(t) { this.board.apply({ type: "heading", text: t }); }

  addScene(scene) {
    const i = this.scenes.length;
    this.scenes.push(scene);
    if (i <= 1) this.tts.get(scene.narration); // ابدأ تجهيز الصوت فوراً
    this.wake();
  }
  finish() { this.done = true; this.wake(); }

  wake() { this.waiters.splice(0).forEach((f) => f()); }
  waitForChange() { return new Promise((r) => this.waiters.push(r)); }

  stop() {
    this.stopped = true;
    this.audio.pause();
    speechSynthesis.cancel();
    cancelAnimationFrame(this.raf);
    this.wake();
  }
  pause() {
    if (this.stopped) return;
    this.paused = true;
    this.audio.pause();
    speechSynthesis.pause();
    this.onPauseChange?.(true);
    this.onState?.("paused");
  }
  resume() {
    if (!this.paused) return;
    this.paused = false;
    if (this.cur?.kind === "audio") this.audio.play();
    else speechSynthesis.resume();
    this.onPauseChange?.(false);
    this.onState?.("playing");
  }

  async run() {
    const myRun = (this.runId = (this.runId || 0) + 1);
    for (let i = 0; ; i++) {
      while (i >= this.scenes.length && !this.done && !this.stopped) {
        this.onState?.("thinking");
        await this.waitForChange();
      }
      if (this.stopped || myRun !== this.runId || i >= this.scenes.length) break;
      const scene = this.scenes[i];
      const next = this.scenes[i + 1];
      if (next) this.tts.get(next.narration); // تحميل مسبق للمشهد التالي
      this.onScene?.(i, this.scenes.length, this.done);
      this.onState?.("loading");
      const voice = await this.tts.get(scene.narration);
      if (this.stopped || myRun !== this.runId) return;
      this.onState?.("playing");
      await this.playScene(scene, voice);
      if (this.stopped || myRun !== this.runId) return;
      await new Promise((r) => setTimeout(r, 350));
    }
    if (!this.stopped && myRun === this.runId) { this.onState?.("ended"); this.stopped = true; }
  }

  renderSubtitle(text) {
    // كل كلمة في span لتلوين الكلمة المنطوقة حالياً (كاريوكي)
    this.subtitleEl.replaceChildren();
    this.words = [];
    const re = /\S+/g;
    let m, last = 0;
    while ((m = re.exec(text))) {
      this.subtitleEl.append(text.slice(last, m.index));
      const s = document.createElement("span");
      s.textContent = m[0];
      this.subtitleEl.append(s);
      this.words.push({ start: m.index, end: m.index + m[0].length, el: s });
      last = m.index + m[0].length;
    }
  }
  markWord(ci) {
    for (const w of this.words) {
      w.el.classList.toggle("on", ci >= w.start && ci < w.end + 1);
      w.el.classList.toggle("said", ci >= w.end + 1);
    }
  }

  playScene(scene, voice) {
    this.cur = voice;
    this.onPauseChange = null;
    const text = scene.narration;
    const queue = scheduleActions(text, scene.actions || []).sort((a, b) => a.at - b.at);
    this.renderSubtitle(text);
    let qi = 0;
    const fireUntil = (ci) => {
      while (qi < queue.length && queue[qi].at <= ci) this.board.apply(queue[qi++].action);
      this.markWord(ci);
    };
    fireUntil(0);

    return new Promise((resolve) => {
      const finish = () => { cancelAnimationFrame(this.raf); fireUntil(Infinity); this.markWord(text.length + 1); resolve(); };

      if (voice.kind === "audio") {
        const a = this.audio;
        a.src = voice.url;
        a.playbackRate = this.settings().rate || 1;
        const times = voice.charTimes;
        const charAt = (t) => {
          if (times) { // بحث ثنائي في أزمنة الحروف
            let lo = 0, hi = times.length - 1;
            while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (times[mid] <= t) lo = mid; else hi = mid - 1; }
            return lo;
          }
          return a.duration ? Math.floor((t / a.duration) * text.length) : 0;
        };
        const loop = () => { fireUntil(charAt(a.currentTime + 0.08)); this.raf = requestAnimationFrame(loop); };
        a.onended = finish;
        a.onerror = finish;
        a.play().then(() => { this.raf = requestAnimationFrame(loop); }).catch((e) => { console.warn(e); this.onState?.("blocked"); this.blockedResume = () => a.play().then(() => { this.raf = requestAnimationFrame(loop); }); });
        return;
      }

      // صوت المتصفح
      const u = new SpeechSynthesisUtterance(text);
      const s = this.settings();
      const v = pickBrowserVoice(s.lang || "ar", s.browserVoice);
      if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "ar-SA";
      u.rate = s.rate || 1;
      let boundary = 0, gotBoundary = false, t0 = 0, started = false, silent = false, ended = false;
      let pausedAt = 0, pausedTotal = 0;
      const cps = 13 * u.rate; // حروف في الثانية تقريباً للعربية
      const end = () => { if (!ended) { ended = true; finish(); } };
      u.onboundary = (e) => { gotBoundary = true; boundary = e.charIndex; };
      u.onstart = () => { started = true; t0 = performance.now(); };
      const goSilent = () => {
        if (silent || ended || this.stopped) return;
        silent = true; t0 = performance.now(); pausedTotal = 0;
        speechSynthesis.cancel();
        this.onState?.("silent");
      };
      u.onend = u.onerror = () => { if (silent) return; if (started) end(); else goSilent(); };
      this.onPauseChange = (p) => { if (p) pausedAt = performance.now(); else pausedTotal += performance.now() - pausedAt; };
      const loop = () => {
        if (ended) return;
        if (!this.paused) {
          const est = t0 ? ((performance.now() - t0 - pausedTotal) / 1000) * cps : 0;
          if (silent && est >= text.length) { end(); return; }
          fireUntil(gotBoundary ? boundary : Math.min(est, text.length - 1));
        }
        this.raf = requestAnimationFrame(loop);
      };
      speechSynthesis.cancel();
      speechSynthesis.speak(u);
      this.raf = requestAnimationFrame(loop);
      // إن لم يبدأ النطق (لا يوجد صوت عربي في الجهاز) نكمل العرض بتوقيت تقديري مع الترجمة النصية
      setTimeout(() => { if (!started) goSilent(); }, 1800);
    });
  }
}
