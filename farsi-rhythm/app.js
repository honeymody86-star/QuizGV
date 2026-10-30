/* فارسي بالإيقاع — تعلّم ٦٠٠ كلمة فارسية بالغناء للمتحدثين بالعربية */
'use strict';

const { lessons: LESSONS, words: WORDS, sentences: SENTS } = COURSE;
const $app = document.getElementById('app');
const CHALLENGE_MS = 30 * 60 * 1000;
const BLOCK_SIZE = 10; // دروس في كل تحدٍّ = ١٠٠ كلمة
const PASS_SCORE = 60;

/* ---------- أدوات صغيرة ---------- */
const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const n2a = n => String(n).replace(/\d/g, d => AR_DIGITS[d]);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const firstMeaning = ar => ar.split('/')[0].replace(/\(.*?\)/g, '').trim();
const fmtTime = ms => { const s = Math.max(0, Math.round(ms / 1000)); return n2a(String(s / 60 | 0).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0')); };

/* ---------- التخزين ---------- */
const Store = {
  key: 'farsiRhythm.v1',
  data: null,
  load() {
    let d = null;
    try { d = JSON.parse(localStorage.getItem(this.key)); } catch (e) { /* تخزين غير متاح */ }
    this.data = Object.assign({ words: {}, challenges: [], block: 0, days: {}, stages: {}, exams: [], saved: null }, d || {});
    this.data.settings = Object.assign(
      { bpm: 104, music: 55, voice: 'auto', faVoice: '', arabic: true, speak: true, theme: '' },
      (d && d.settings) || {});
  },
  save() { try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* تجاهل */ } },
  get s() { return this.data.settings; },
  w(id) { return this.data.words[id] || (this.data.words[id] = { m: 0, c: 0, x: 0, sp: 0 }); },
  mastered(id) { return !!(this.data.words[id] && this.data.words[id].m); },
  masteredIn(ids) { return ids.filter(id => this.mastered(id)).length; },
};
Store.load();
function applyTheme() {
  if (Store.s.theme) document.documentElement.setAttribute('data-theme', Store.s.theme);
  else document.documentElement.removeAttribute('data-theme');
}
applyTheme();

/* ---------- الموسيقى والإيقاع (Web Audio) ---------- */
const Music = {
  ctx: null, out: null, duck: 1,
  init() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      this.ctx = new AC();
      this.out = this.ctx.createGain();
      this.out.connect(this.ctx.destination);
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate);
      const ch = this.noise.getChannelData(0);
      for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.setVolume();
    return this.ctx;
  },
  setVolume() { if (this.out) this.out.gain.setTargetAtTime((Store.s.music / 100) * 0.6 * this.duck, this.ctx.currentTime, 0.05); },
  setDuck(on) { this.duck = on ? 0.35 : 1; this.setVolume(); },
  env(t, g, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); },
  kick(t) {
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.15);
    this.env(t, g, 0.9, 0.22); o.connect(g).connect(this.out); o.start(t); o.stop(t + 0.25);
  },
  noiseHit(t, freq, peak, dur, type) {
    const s = this.ctx.createBufferSource(), f = this.ctx.createBiquadFilter(), g = this.ctx.createGain();
    s.buffer = this.noise; f.type = type; f.frequency.value = freq;
    this.env(t, g, peak, dur); s.connect(f).connect(g).connect(this.out); s.start(t); s.stop(t + dur + 0.02);
  },
  clap(t) { this.noiseHit(t, 1500, 0.5, 0.12, 'bandpass'); this.noiseHit(t + 0.012, 1500, 0.35, 0.1, 'bandpass'); },
  hat(t) { this.noiseHit(t, 8000, 0.18, 0.04, 'highpass'); },
  bell(t, freq, peak = 0.18) {
    if (!freq) return;
    [1, 2.01].forEach((m, i) => {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain();
      o.type = i ? 'sine' : 'triangle'; o.frequency.value = freq * m;
      this.env(t, g, i ? peak * 0.25 : peak, 0.45); o.connect(g).connect(this.out); o.start(t); o.stop(t + 0.5);
    });
  },
};
// لحن طفولي بسيط على السلّم الخماسي (يشبه «تلألأ يا نجم»)
const MELODY = [523.3, 523.3, 784, 784, 880, 880, 784, 0, 698.5, 698.5, 659.3, 659.3, 587.3, 587.3, 523.3, 0];

class Groove {
  constructor(onBeat) { this.onBeat = onBeat; this.beat = 0; this.timer = null; }
  get spb() { return 60 / Store.s.bpm; }
  start() {
    const ctx = Music.init();
    if (!ctx) { // لا يوجد Web Audio: إيقاع بصري فقط
      this.timer = setInterval(() => this.onBeat(this.beat++, 0), this.spb * 1000);
      return;
    }
    this.next = ctx.currentTime + 0.08;
    this.timer = setInterval(() => this.tick(), 25);
  }
  tick() {
    const ctx = Music.ctx;
    while (this.next < ctx.currentTime + 0.12) {
      const b = this.beat, t = this.next, half = this.spb / 2;
      if (b % 2 === 0) Music.kick(t); else Music.clap(t);
      Music.hat(t + half);
      Music.bell(t, MELODY[b % 16]);
      // نستدعي قبل الضربة بقليل ليُجدوَل الصوت المسجّل على وقتها بالضبط
      setTimeout(() => { if (this.timer) this.onBeat(b, t); }, Math.max(0, (t - ctx.currentTime) * 1000 - 40));
      this.next += this.spb; this.beat++;
    }
  }
  stop() { clearInterval(this.timer); this.timer = null; }
}

/* ---------- التسجيلات الصوتية الطبيعية (audio/*.mp3) ---------- */
const firstMeaningOf = ar => ar.split('/')[0].replace(/\(.*?\)/g, '').trim();
// نص ← مفتاح الملف؛ يطابق tools/texts.js
const CLIP_KEYS = { fa: new Map(), ar: new Map() };
WORDS.forEach(w => { CLIP_KEYS.fa.set(w.fa, 'fa/w' + w.id); CLIP_KEYS.fa.set(w.voc, 'fa/w' + w.id); CLIP_KEYS.ar.set(firstMeaningOf(w.ar), 'ar/w' + w.id); });
SENTS.forEach(s => { CLIP_KEYS.fa.set(s.fa, 'fa/s' + s.id); CLIP_KEYS.ar.set(s.ar, 'ar/s' + s.id); });
SONGS.forEach(g => g.lines.forEach(l => { CLIP_KEYS.fa.set(l.fa, `fa/l${g.id}_${l.i}`); CLIP_KEYS.ar.set(l.ar, `ar/l${g.id}_${l.i}`); }));
const Clips = {
  avail: new Set(), bufs: new Map(), loading: new Map(), src: null, out: null,
  get ready() { return this.avail.size > 0; },
  async init() {
    try {
      const r = await fetch('audio/index.json', { cache: 'no-cache' });
      if (r.ok) Object.keys((await r.json()).texts).forEach(k => this.avail.add(k));
    } catch (e) { /* لا توجد تسجيلات: نستخدم أصوات الجهاز */ }
    if (this.ready && !session && document.querySelector('.hero')) VIEWS.home(); // حدّث حالة الصوت في الرئيسية
  },
  key(text, lang) { const k = CLIP_KEYS[lang] && CLIP_KEYS[lang].get(text); return k && this.avail.has(k) ? k : null; },
  load(key) {
    if (this.bufs.has(key)) return Promise.resolve(this.bufs.get(key));
    if (this.loading.has(key)) return this.loading.get(key);
    const ctx = Music.init();
    if (!ctx) return Promise.resolve(null);
    const p = fetch('audio/' + key + '.mp3').then(r => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
      .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
      .then(buf => { this.bufs.set(key, buf); this.loading.delete(key); if (this.bufs.size > 300) this.bufs.delete(this.bufs.keys().next().value); return buf; })
      .catch(() => { this.loading.delete(key); this.avail.delete(key); return null; });
    this.loading.set(key, p);
    return p;
  },
  /** يشغّل التسجيل عند الوقت when (وقت AudioContext) بسرعة/نبرة rate */
  play(buf, when, rate) {
    const ctx = Music.ctx;
    if (!this.out) { this.out = ctx.createGain(); this.out.gain.value = 1.4; this.out.connect(ctx.destination); }
    const src = ctx.createBufferSource();
    src.buffer = buf; src.playbackRate.value = rate; src.connect(this.out);
    const at = Math.max(ctx.currentTime, when || 0);
    src.start(at);
    this.stop(); this.src = src;
    return new Promise(resolve => {
      src.onended = () => { if (this.src === src) this.src = null; resolve(); };
      setTimeout(resolve, (at - ctx.currentTime + buf.duration / rate) * 1000 + 400); // احتياط
    });
  },
  stop() { if (this.src) { try { this.src.stop(); } catch (e) { /* انتهى */ } this.src = null; } },
};
Clips.init();

// ملف WAV صامت صغير يُشغَّل بلا توقف ليعمل صوت Web Audio على iPhone حتى في الوضع الصامت
function silentWav() {
  const n = 4000, b = new DataView(new ArrayBuffer(44 + n));
  const str = (o, t) => [...t].forEach((c, i) => b.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF'); b.setUint32(4, 36 + n, true); str(8, 'WAVEfmt '); b.setUint32(16, 16, true);
  b.setUint16(20, 1, true); b.setUint16(22, 1, true); b.setUint32(24, 8000, true); b.setUint32(28, 8000, true);
  b.setUint16(32, 1, true); b.setUint16(34, 8, true); str(36, 'data'); b.setUint32(40, n, true);
  for (let i = 0; i < n; i++) b.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}

/* ---------- الصوت (نطق فارسي/عربي) ---------- */
const Voice = {
  list: [], current: null, onlineFailed: { fa: false, ar: false }, player: new Audio(), unlocked: false,
  /** يفتح الصوت على iOS/Safari: يجب أن يُستدعى داخل لمسة المستخدم */
  unlock() {
    if (this.unlocked) return; this.unlocked = true;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* غير مدعوم */ }
    Music.init();
    const keep = new Audio(silentWav()); keep.loop = true; keep.setAttribute('playsinline', ''); keep.play().catch(() => {});
    if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); }
    this.player.src = silentWav(); this.player.play().catch(() => {});
  },
  init() {
    if (!('speechSynthesis' in window)) return;
    const load = () => { this.list = speechSynthesis.getVoices(); };
    load(); speechSynthesis.onvoiceschanged = load;
  },
  voicesFor(lang) { return this.list.filter(v => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(lang)); },
  native(lang) {
    const vs = this.voicesFor(lang);
    if (!vs.length) return null;
    if (lang === 'fa' && Store.s.faVoice) { const v = vs.find(v => v.name === Store.s.faVoice); if (v) return v; }
    return vs.find(v => /natural|neural|google|online/i.test(v.name)) || vs[0];
  },
  mode(lang) {
    const pref = Store.s.voice;
    if (pref === 'auto' && Clips.ready) return 'clips';
    if (pref === 'online') return 'online';
    if (pref === 'native') return this.native(lang) ? 'native' : 'none';
    return this.native(lang) ? 'native' : (this.onlineFailed[lang] ? 'none' : 'online');
  },
  url(text, lang) {
    return 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + lang + '&q=' + encodeURIComponent(text.slice(0, 190));
  },
  cache: new Map(),
  preload(text, lang = 'fa') {
    const ck = Store.s.voice === 'auto' && Clips.key(text, lang);
    if (ck) { Clips.load(ck); return; }
    if (this.mode(lang) !== 'online') return;
    const u = this.url(text, lang);
    if (this.cache.has(u)) return;
    const a = new Audio(); a.preload = 'auto'; a.src = u;
    this.cache.set(u, a);
    if (this.cache.size > 80) this.cache.delete(this.cache.keys().next().value);
  },
  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    this.player.pause(); Clips.stop();
    this.current = null;
  },
  /** ينطق النص ويعيد وعداً ينتهي عند انتهاء النطق. pitch: 0.5–2 */
  speak(text, { lang = 'fa', pitch = 1, rate = 1, when = 0 } = {}) {
    const ck = Store.s.voice === 'auto' && Music.init() && Clips.key(text, lang);
    if (ck) {
      // التسجيل الطبيعي: نرفع النبرة والسرعة معاً فيصير «غناءً» على الإيقاع
      return Clips.load(ck).then(buf => buf
        ? Clips.play(buf, when, Math.min(1.45, Math.max(0.75, rate * (1 + (pitch - 1) * 0.4))))
        : this.speakTTS(text, { lang, pitch, rate }));
    }
    return this.speakTTS(text, { lang, pitch, rate });
  },
  speakTTS(text, { lang, pitch, rate }) {
    let mode = this.mode(lang);
    if (mode === 'clips') mode = this.native(lang) ? 'native' : (this.onlineFailed[lang] ? 'none' : 'online');
    const est = 1200 + text.length * 170 / rate;
    if (mode === 'none') return sleep(Math.min(est, 2500));
    return new Promise(resolve => {
      let done = false;
      const finish = () => { if (!done) { done = true; clearTimeout(guard); resolve(); } };
      const guard = setTimeout(finish, est + 2500);
      if (mode === 'native') {
        const u = new SpeechSynthesisUtterance(text);
        const v = this.native(lang); u.voice = v; u.lang = v.lang;
        u.pitch = Math.min(2, Math.max(0, pitch)); u.rate = rate * (lang === 'fa' ? 0.9 : 1);
        u.onend = finish; u.onerror = finish;
        this.current = u;
        speechSynthesis.speak(u);
      } else {
        const a = this.player; // عنصر واحد مشترك (المُحمَّل مسبقاً يأتي من ذاكرة المتصفح)
        a.src = this.url(text, lang);
        a.preservesPitch = false; a.mozPreservesPitch = false; a.webkitPreservesPitch = false;
        a.playbackRate = Math.min(1.5, Math.max(0.6, rate * (1 + (pitch - 1) * 0.3)));
        a.onended = finish;
        a.onerror = () => { this.onlineFailed[lang] = true; finish(); };
        a.play().catch(() => { this.onlineFailed[lang] = true; finish(); });
      }
    });
  },
  statusText() {
    const m = this.mode('fa');
    if (m === 'clips') return '🎙️ نطق فارسي طبيعي مسجّل يُغنّى على الإيقاع — يعمل على iPhone وكل الأجهزة';
    if (m === 'native') return '🔊 صوت فارسي من جهازك: ' + this.native('fa').name;
    if (m === 'online') return '🌐 صوت فارسي أونلاين (Google) — يحتاج إنترنت';
    return '🔇 لا يوجد صوت فارسي متاح — جرّب متصفح Chrome أو Edge، أو فعّل الصوت الأونلاين من الإعدادات';
  },
};
Voice.init();

/* ---------- التعرّف على الكلام (تقييم النطق) ---------- */
const Ear = {
  Rec: window.SpeechRecognition || window.webkitSpeechRecognition,
  rec: null, broken: false,
  get ok() { return !!this.Rec && !this.broken && Store.s.speak; },
  stop() { try { this.rec && this.rec.abort(); } catch (e) { /* تجاهل */ } this.rec = null; },
  /** يستمع ويعيد {texts:[...]} أو {error} */
  listen(ms = 5000) {
    return new Promise(resolve => {
      let texts = [], err = null, done = false;
      const r = new this.Rec();
      this.rec = r;
      r.lang = 'fa-IR'; r.interimResults = false; r.maxAlternatives = 5; r.continuous = false;
      const end = () => { if (done) return; done = true; clearTimeout(t); this.rec = null; resolve(err && !texts.length ? { error: err } : { texts }); };
      r.onresult = e => { for (const res of e.results) for (const alt of res) texts.push(alt.transcript); };
      r.onerror = e => { err = e.error; if (e.error === 'not-allowed' || e.error === 'service-not-allowed' || e.error === 'language-not-supported') this.broken = true; };
      r.onend = end;
      const t = setTimeout(() => { try { r.stop(); } catch (e) { /* تجاهل */ } setTimeout(end, 600); }, ms);
      try { r.start(); } catch (e) { err = 'start'; end(); }
    });
  },
};

const HARAKAT = /[ً-ْٰـ]/g;
const NUM_WORDS = { 0: 'صفر', 1: 'یک', 2: 'دو', 3: 'سه', 4: 'چهار', 5: 'پنج', 6: 'شش', 7: 'هفت', 8: 'هشت', 9: 'نه', 10: 'ده', 20: 'بیست', 30: 'سی', 40: 'چهل', 50: 'پنجاه', 100: 'صد', 1000: 'هزار' };
function normFa(s) {
  s = String(s).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => AR_DIGITS.indexOf(d));
  s = s.replace(/\d+/g, d => NUM_WORDS[+d] || d);
  return s.replace(HARAKAT, '').replace(/ي/g, 'ی').replace(/ى/g, 'ی').replace(/ك/g, 'ک')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ؤ/g, 'و').replace(/[‌\s]+/g, '').replace(/[^؀-ۿ0-9]/g, '');
}
function lev(a, b) {
  const m = a.length, n = b.length; if (!m) return n; if (!n) return m;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[n];
}
function scoreSpeech(target, texts) {
  const t = normFa(target); let best = 0, bestText = '';
  for (const raw of texts) {
    const h = normFa(raw); if (!h) continue;
    const sc = h.includes(t) ? 100 : Math.round(100 * (1 - lev(t, h) / Math.max(t.length, h.length)));
    if (sc > best) { best = sc; bestText = raw; }
  }
  return { score: Math.max(0, best), heard: bestText || texts[0] || '' };
}

/* ---------- الجلسة (للإلغاء وانتهاء الوقت) ---------- */
let session = null;
class Abort extends Error {}
function newSession(opts = {}) {
  endSession();
  const s = { id: Math.random(), cancelled: false, limit: opts.limit || 0, start: Date.now(), timer: null, ...opts };
  s.abortP = new Promise((_, rej) => { s.reject = rej; });
  s.abortP.catch(() => {});
  if (s.limit) s.timer = setInterval(() => {
    if (s.frozen) return;
    const left = s.limit - (Date.now() - s.start);
    const el = document.getElementById('timer');
    if (el) { el.textContent = '⏱ ' + fmtTime(left); el.classList.toggle('low', left < 120000); }
    if (left <= 0) abortSession('timeup');
  }, 500);
  session = s;
  return s;
}
function abortSession(reason) {
  if (!session || session.cancelled) return;
  session.cancelled = reason; session.reject(new Abort(reason));
  Voice.stop(); Ear.stop(); if (session.groove) session.groove.stop(); Music.setDuck(false);
  clearInterval(session.timer);
}
function endSession() { if (session) { abortSession('end'); session = null; } }
const guard = p => Promise.race([p, session.abortP]);
const check = () => { if (session.cancelled) throw new Abort(session.cancelled); };
const elapsedOf = s => (s.frozen || Date.now()) - s.start;
const tleft = () => session.limit ? session.limit - elapsedOf(session) : Infinity;
/** يوقف المؤقّت مؤقتاً (مثلاً أثناء اختبار المرحلة) */
function freeze(on) {
  if (!session) return;
  if (on && !session.frozen) session.frozen = Date.now();
  if (!on && session.frozen) { session.start += Date.now() - session.frozen; session.frozen = 0; }
}

/* ---------- الغناء: سطور تُنطق على ضربات الإيقاع ---------- */
function wordLines(w, ui, short) {
  const lines = [
    { text: w.fa, lang: 'fa', pitch: 1.25, align: 4, on: () => ui.word(w, 'fa') },
    { text: w.fa, lang: 'fa', pitch: 1.6, align: 2, on: () => ui.hl('fa') },
  ];
  if (Store.s.arabic) lines.push({ text: firstMeaning(w.ar), lang: 'ar', pitch: 1.1, align: 2, on: () => ui.hl('ar') });
  else lines.push({ rest: 2, on: () => ui.hl('ar') });
  if (!short) lines.push({ text: w.fa, lang: 'fa', pitch: 0.95, align: 2, on: () => ui.hl('fa') });
  return lines;
}
function sentLines(s, ui, short) {
  const lines = [{ text: s.fa, lang: 'fa', pitch: 1.15, rate: 0.95, align: 4, on: () => ui.sentence(s, 'fa') }];
  if (Store.s.arabic) lines.push({ text: s.ar, lang: 'ar', pitch: 1.05, align: 2, on: () => ui.hl('sar') });
  if (!short) lines.push({ text: s.fa, lang: 'fa', pitch: 1.35, rate: 0.95, align: 2, on: () => ui.hl('sfa') });
  // وقت للقراءة: تبقى الجملة على الشاشة بضع ضربات حسب طولها
  lines.push({ rest: readBeats(s.fa, short), on: () => ui.hl('read') });
  return lines;
}
const wordCount = t => t.trim().split(/\s+/).length;
const readBeats = (t, short) => (short ? 4 : 6) + 2 * Math.ceil(wordCount(t) / 3);
const readMs = t => 2500 + wordCount(t) * 450;

/** يشغّل الإيقاع وينطق السطور واحداً تلو الآخر، كل سطر يبدأ على ضربة (align). */
function sing(lines, ui) {
  return new Promise((resolve, reject) => {
    let i = 0, busy = false, restUntil = -1, finished = false;
    const pre = k => { const l = lines[k]; if (l && l.text) Voice.preload(l.text, l.lang); };
    pre(0); pre(1);
    const groove = new Groove((beat, t) => {
      ui.beat(beat);
      if (finished || busy || beat < restUntil) return;
      if (i >= lines.length) { finished = true; groove.stop(); resolve(); return; }
      const l = lines[i];
      if (beat % (l.align || 2)) return;
      i++; pre(i + 1);
      if (l.on) l.on();
      if (l.rest) { restUntil = beat + l.rest; return; }
      busy = true; Music.setDuck(true);
      Voice.speak(l.text, { ...l, when: t }).then(() => { busy = false; Music.setDuck(false); ui.hl(null); });
    });
    session.groove = groove;
    session.abortP.catch(e => { finished = true; groove.stop(); reject(e); });
    groove.start();
  });
}

/* ---------- واجهة المسرح ---------- */
function stageUI(root) {
  const q = s => root.querySelector(s);
  let lastHl = null;
  return {
    beat(b) {
      const dots = root.querySelectorAll('.dots span');
      dots.forEach((d, k) => { d.classList.toggle('on', k === b % 4); d.classList.toggle('down', k === 0); });
      const em = q('.stage .em'); if (em) { em.classList.add('bump'); setTimeout(() => em.classList.remove('bump'), 140); }
    },
    word(w, hl) {
      q('.stage').innerHTML = `<div class="tag">🎵 كلمة جديدة</div><div class="em">${w.icon}</div>
        <div class="fa" data-k="fa">${esc(w.voc)}</div><div class="ar" data-k="ar">${esc(w.ar)}</div>`;
      this.hl(hl);
    },
    sentence(s, hl) {
      q('.stage').innerHTML = `<div class="tag">🎶 جملة</div><div class="em">${s.icon}</div>
        <div data-k="read"><div class="sfa" data-k="sfa">${markSentence(s)}</div><div class="sar" data-k="sar">${esc(s.ar)}</div></div>
        <div class="chips">${s.words.map(id => `<span class="chip">${WORDS[id].icon} ${esc(WORDS[id].fa)}</span>`).join('')}</div>`;
      this.hl(hl === 'fa' ? 'sfa' : hl);
    },
    hl(k) {
      if (lastHl) lastHl.classList.remove('sing');
      lastHl = k ? q(`[data-k="${k}"]`) : null;
      if (lastHl) lastHl.classList.add('sing');
    },
  };
}
function markSentence(s) {
  const text = s.fa;
  const marks = new Array(text.length).fill(false);
  for (const id of s.words) {
    const f = WORDS[id].fa; if (f.length < 2) continue;
    let k = text.indexOf(f);
    while (k >= 0) { for (let j = k; j < k + f.length; j++) marks[j] = true; k = text.indexOf(f, k + f.length); }
  }
  let out = '', on = false;
  for (let j = 0; j < text.length; j++) {
    if (marks[j] !== on) { out += marks[j] ? '<span class="hl">' : '</span>'; on = marks[j]; }
    out += esc(text[j]);
  }
  return out + (on ? '</span>' : '');
}

/* ---------- الشاشات ---------- */
let songAudio = null; // مشغّل الأغنية الحالي (يُوقف عند تغيير الشاشة)
function go(view, ...args) {
  endSession(); Voice.stop();
  if (songAudio) { songAudio.pause(); songAudio = null; }
  window.scrollTo(0, 0); VIEWS[view](...args);
}

const VIEWS = {
  home() {
    const total = Object.values(Store.data.words).filter(w => w.m).length;
    const best = Store.data.challenges.reduce((m, c) => Math.max(m, c.mastered), 0);
    const sv = Store.data.saved, due = dueWords(), lvl = levelOf(total);
    const blocks = Array.from({ length: LESSONS.length / BLOCK_SIZE }, (_, b) => {
      const ids = blockWords(b), m = Store.masteredIn(ids);
      return `<button class="block ${b === Store.data.block ? 'sel' : ''}" data-b="${b}">
        الكلمات ${n2a(b * 100 + 1)}–${n2a(b * 100 + 100)}<div class="bar"><i style="width:${m}%"></i></div></button>`;
    }).join('');
    $app.innerHTML = `
      <div class="top"><div class="logo"><span class="em">🎵</span><div><h1>فارسي بالإيقاع</h1>
        <div class="muted small">أهم ٦٠٠ كلمة فارسية تُغنّى لك جملةً جملة — لغتك الأم: العربية</div></div></div>
        <button class="iconbtn" id="set" aria-label="الإعدادات">⚙️</button></div>
      <div class="stack">
        ${sv ? `<div class="card resume"><div class="row between"><div><b>⏸ لديك تحدٍّ متوقّف</b>
          <div class="small muted">الكلمات ${n2a(sv.block * 100 + 1)}–${n2a(sv.block * 100 + 100)} · المجموعة ${n2a(sv.group + 1)}/١٠ · متبقٍّ ⏱ ${fmtTime(CHALLENGE_MS - sv.elapsed)}</div></div>
          <div class="row"><button class="btn pink" id="resume">▶ أكمل</button><button class="btn alt sm" id="drop">✕</button></div></div></div>` : ''}
        <div class="card hero">
          <h2>🏆 تحدّي ١٠٠ كلمة في ٣٠ دقيقة</h2>
          <div class="muted small">لكل مجموعة من ١٠ كلمات: تسمع الأغنية والإيقاع 🎶 ← تختبر السمع 🎧 ← تقيّم نطقك 🎤. الكلمة تُحسب «متقَنة» عندما تنجح في السمع والنطق.</div>
          <div class="blocks">${blocks}</div>
          <div class="row between"><button class="btn big" id="startCh">ابدأ التحدّي ▶</button>
          <span class="small muted">١٠ دروس · ١٠٠ كلمة · ⏱ ٣٠:٠٠</span></div>
        </div>
        <div class="features">
          <button class="feat" id="review" ${due.length ? '' : 'disabled'}><span class="em">📅</span><b>مراجعة اليوم</b>
            <span class="small muted">${due.length ? n2a(due.length) + ' كلمة حان وقتها' : 'لا شيء مستحق الآن ✔'}</span></button>
          <button class="feat" id="exam"><span class="em">🎓</span><b>اختبار القدرات</b><span class="small muted">موقوت بأقسام · درجة من ١٠٠</span></button>
          <button class="feat" id="mara"><span class="em">🌅</span><b>ماراثون اليوم</b><span class="small muted">٦٠٠ كلمة في يوم؟ · ${n2a(today().rounds.length)}/٦</span></button>
        </div>
        <div class="stats">
          <div class="card stat"><b>${n2a(total)}</b><span class="small muted">كلمة متقَنة من ٦٠٠</span></div>
          <div class="card stat"><b>${lvl[2]} ${lvl[1]}</b><span class="small muted">مستواك</span></div>
          <div class="card stat"><b>🔥 ${n2a(streak())}</b><span class="small muted">أيام متتالية</span></div>
        </div>
        <div class="notice">${esc(Voice.statusText())}<br>${Ear.Rec ? '🎤 تقييم النطق بالميكروفون متاح' : '🎤 متصفحك لا يدعم التعرّف على الكلام — سيكون تقييم النطق ذاتياً (استخدم Chrome لتقييم آلي)'}</div>
        <div class="row between"><h2 style="margin:0">🎤 أغاني الدروس (${n2a(SONGS.length)})</h2></div>
        <div class="lessons">${SONGS.map(g => `<button class="lesson" data-song="${g.id}"><div class="em">${LESSONS[g.lesson].icon}🎤</div>
          <div class="small muted">أغنية الدرس ${n2a(g.lesson + 1)}</div><div class="t fa" style="font-size:17px">${esc(g.fa)}</div>
          <div class="small muted">${esc(g.ar)} <span data-badge="${g.id}"></span></div></button>`).join('')}</div>
        <div class="row between"><h2 style="margin:0">📚 الدروس (${n2a(LESSONS.length)})</h2>
          ${weakWords().length ? `<button class="btn sm alt" id="weak">💪 راجع الكلمات الضعيفة (${n2a(Math.min(10, weakWords().length))})</button>` : ''}</div>
        <div class="lessons">${LESSONS.map(l => {
          const m = Store.masteredIn(l.words);
          return `<button class="lesson" data-l="${l.id}"><div class="em">${l.icon}</div>
            <div class="small muted">الدرس ${n2a(l.id + 1)}</div><div class="t">${esc(l.title)}</div>
            <div class="prog"><i style="width:${m * 10}%"></i></div></button>${l.id % 5 === 4 ? stageCard(l.id / 5 | 0) : ''}`;
        }).join('')}</div>
        ${historyHtml()}
      </div>`;
    $app.querySelectorAll('.block').forEach(b => b.onclick = () => { Store.data.block = +b.dataset.b; Store.save(); VIEWS.home(); });
    $app.querySelectorAll('.lesson[data-l]').forEach(b => b.onclick = () => go('lesson', +b.dataset.l));
    $app.querySelectorAll('.lesson[data-song]').forEach(b => b.onclick = () => go('song', +b.dataset.song));
    SONGS.forEach(async g => { const src = await SongFiles.source(g.id); const el = $app.querySelector(`[data-badge="${g.id}"]`); if (el) el.textContent = src ? '· 🎵 جاهزة' : '· ✍️ اصنعها في Suno'; });
    $app.querySelector('#startCh').onclick = () => {
      if (sv && !confirm('عندك تحدٍّ متوقف — بدء تحدٍّ جديد يلغيه. متأكد؟')) return;
      Store.data.saved = null; go('challenge', Store.data.block);
    };
    if (sv) {
      $app.querySelector('#resume').onclick = () => go('challenge', sv.block, true);
      $app.querySelector('#drop').onclick = () => { if (confirm('إلغاء التحدي المتوقف؟')) { Store.data.saved = null; Store.save(); VIEWS.home(); } };
    }
    $app.querySelector('#review').onclick = () => go('review');
    $app.querySelector('#exam').onclick = () => go('exam');
    $app.querySelector('#mara').onclick = () => go('marathon');
    $app.querySelectorAll('.stagecard').forEach(b => b.onclick = () => go('stage', +b.dataset.stage));
    $app.querySelector('#set').onclick = () => go('settings');
    const wk = $app.querySelector('#weak'); if (wk) wk.onclick = () => go('practice', weakWords().slice(0, 10), 'مراجعة الكلمات الضعيفة');
  },

  lesson(id) {
    const l = LESSONS[id];
    $app.innerHTML = `
      <div class="top"><button class="iconbtn" id="back" aria-label="رجوع">→</button>
        <div style="flex:1"><div class="small muted">الدرس ${n2a(id + 1)} · الكلمات ${n2a(id * 10 + 1)}–${n2a(id * 10 + 10)}</div><h1>${l.icon} ${esc(l.title)}</h1></div></div>
      <div class="stack">
        <div class="row"><button class="btn pink big" id="singAll">🎵 غنِّ لي الدرس</button>
          ${SONGS.some(g => g.lesson === id) ? '<button class="btn big" id="song">🎤 أغنية الدرس</button>' : ''}
          <button class="btn alt big" id="quiz">📝 اختبرني</button></div>
        <div class="words">${l.words.map(wid => { const w = WORDS[wid]; return `
          <button class="wcard" data-w="${wid}">${Store.mastered(wid) ? '<span class="done">⭐</span>' : ''}
          <div class="em">${w.icon}</div><div class="fa">${esc(w.voc)}</div><div class="ar">${esc(w.ar)}</div></button>`; }).join('')}</div>
        <h2>🎶 الجمل (${n2a(l.sentences.length)})</h2>
        ${l.sentences.map(sid => { const s = SENTS[sid]; return `
          <button class="sent" data-s="${sid}"><span class="em">${s.icon}</span><div><div class="fa">${markSentence(s)}</div>
          <div class="muted small">${esc(s.ar)}</div></div></button>`; }).join('')}
        <div class="row center">${id > 0 ? '<button class="btn alt sm" id="prev">→ الدرس السابق</button>' : ''}
          ${id < LESSONS.length - 1 ? '<button class="btn alt sm" id="next">الدرس التالي ←</button>' : ''}</div>
      </div>`;
    $app.querySelector('#back').onclick = () => go('home');
    $app.querySelector('#singAll').onclick = () => go('practice', l.words, l.title, { learnOnly: true, lesson: id });
    const sg = $app.querySelector('#song'); if (sg) sg.onclick = () => go('song', SONGS.find(g => g.lesson === id).id);
    $app.querySelector('#quiz').onclick = () => go('practice', l.words, l.title, { lesson: id });
    $app.querySelectorAll('.wcard').forEach(b => b.onclick = () => quickSing([...wordLines(WORDS[+b.dataset.w], nullUI, false)]));
    $app.querySelectorAll('.sent').forEach(b => b.onclick = () => quickSing(sentLines(SENTS[+b.dataset.s], nullUI, false)));
    const p = $app.querySelector('#prev'); if (p) p.onclick = () => go('lesson', id - 1);
    const n = $app.querySelector('#next'); if (n) n.onclick = () => go('lesson', id + 1);
  },

  /** تحدّي ١٠٠ كلمة في ٣٠ دقيقة */
  async challenge(block, resume) {
    const saved = resume && Store.data.saved;
    const s = newSession({ limit: CHALLENGE_MS, kind: 'challenge', block, results: {}, sent: { ok: 0, n: 0 }, done: new Set() });
    let start = 0, phase = 'learn';
    if (saved) {
      block = s.block = saved.block; start = saved.group; phase = saved.phase;
      s.start = Date.now() - saved.elapsed; s.results = saved.results; s.sent = saved.sent; s.done = new Set(saved.done);
    }
    const lessonIds = Array.from({ length: BLOCK_SIZE }, (_, k) => block * BLOCK_SIZE + k);
    try {
      await countdown(saved ? 'نكمل من حيث توقفت 💪' : null);
      for (let k = start; k < lessonIds.length; k++) {
        const l = LESSONS[lessonIds[k]];
        const label = `المجموعة ${n2a(k + 1)}/${n2a(lessonIds.length)} · ${l.icon} ${l.title}`;
        s.group = k;
        if (phase === 'learn') { s.done = new Set(); saveChallenge('learn'); await learn(l.words, l.sentences, label, true); phase = 'test'; }
        if (phase === 'test') { saveChallenge('test'); await test(l.words, l.sentences, label, true); phase = 'check'; }
        // 🏁 اختبار المرحلة بعد كل خمسة دروس (المؤقّت متوقف أثناءه)
        if (phase === 'check' && (k + 1) % 5 === 0) {
          saveChallenge('check');
          const ids = lessonIds.slice(k - 4, k + 1);
          freeze(true);
          const r = await checkpoint(ids, true);
          freeze(false);
          await stageInterlude(ids, r);
        }
        phase = 'learn';
      }
    } catch (e) {
      if (!(e instanceof Abort)) console.error(e);
      if (!(e instanceof Abort) || e.message !== 'timeup') return; // الخروج والإيقاف يعرضان شاشتهما بنفسهما
    }
    finishRun(s, 100);
  },

  paused() {
    const sv = Store.data.saved;
    if (!sv) return go('home');
    $app.innerHTML = `<div class="card stage" style="min-height:70vh">
      <div class="em">⏸</div><h1>التحدّي متوقّف</h1>
      <div class="muted">الكلمات ${n2a(sv.block * 100 + 1)}–${n2a(sv.block * 100 + 100)} · المجموعة ${n2a(sv.group + 1)}/١٠</div>
      <div class="timer" style="margin:10px 0">⏱ متبقٍّ ${fmtTime(CHALLENGE_MS - sv.elapsed)}</div>
      <div class="small muted">حُفظ تقدّمك. تقدر تقفل التطبيق وترجع لاحقاً — ستجد زر «أكمل» في الصفحة الرئيسية.</div>
      <div class="row center" style="margin-top:14px"><button class="btn big pink" id="res">▶ أكمل</button><button class="btn alt" id="home">🏠 الرئيسية</button></div></div>`;
    $app.querySelector('#res').onclick = () => go('challenge', sv.block, true);
    $app.querySelector('#home').onclick = () => go('home');
  },

  /** درس أو مراجعة بدون مؤقّت */
  async practice(ids, title, opts = {}) {
    const s = newSession({ kind: 'practice', results: {}, sent: { ok: 0, n: 0 }, ...opts });
    const sids = opts.lesson != null ? LESSONS[opts.lesson].sentences
      : [...new Set(ids.map(id => WORDS[id].sentences[0]))];
    try {
      await learn(ids, sids, title, false);
      if (opts.learnOnly) { go('lesson', opts.lesson); return; }
      await test(ids, sids, title, false);
    } catch (e) { if (!(e instanceof Abort)) console.error(e); if (!(e instanceof Abort) || e.message === 'end') return; }
    finishRun(s, ids.length);
  },

  report(s, total) {
    const res = Object.entries(s.results);
    const mastered = res.filter(([, r]) => r.mastered).length;
    const first = res.filter(([, r]) => r.first).length;
    const sp = res.filter(([, r]) => typeof r.speak === 'number');
    const avgSp = sp.length ? Math.round(sp.reduce((a, [, r]) => a + r.speak, 0) / sp.length) : null;
    const elapsed = Date.now() - s.start;
    const weak = res.filter(([, r]) => !r.mastered).map(([id]) => +id);
    const win = s.kind === 'challenge' && mastered >= 100;
    $app.innerHTML = `
      <div class="top"><h1>${win ? '🏆 أنجزت التحدّي!' : s.kind === 'challenge' ? '📊 نتيجة التحدّي' : '📊 النتيجة'}</h1>
        <button class="iconbtn" id="home" aria-label="الرئيسية">🏠</button></div>
      <div class="stack">
        <div class="card center row" style="flex-direction:column">
          <div class="bignum">${n2a(mastered)}<span style="font-size:24px"> / ${n2a(total)}</span></div>
          <div class="muted">كلمة متقَنة (سماع ✔ + نطق ✔)</div>
          <div class="meter" style="max-width:420px"><i style="width:${mastered / total * 100}%;background:linear-gradient(90deg,#7c3aed,#ec4899)"></i></div>
          ${s.cancelled === 'timeup' ? '<div class="fb bad">⏰ انتهى الوقت!</div>' : ''}
        </div>
        <div class="grid2">
          <div class="card stat"><b>${fmtTime(elapsed)}</b><span class="small muted">الوقت المستغرق</span></div>
          <div class="card stat"><b>${n2a(first)}</b><span class="small muted">صحيحة من أول محاولة</span></div>
          <div class="card stat"><b>${avgSp == null ? '—' : n2a(avgSp) + '٪'}</b><span class="small muted">متوسط دقة النطق</span></div>
          <div class="card stat"><b>${n2a(s.sent.ok)}/${n2a(s.sent.n)}</b><span class="small muted">جمل فهمتها بالسمع</span></div>
        </div>
        ${weak.length ? `<div class="card"><h3>💪 كلمات تحتاج مراجعة (${n2a(weak.length)})</h3>
          <div class="chips" style="justify-content:flex-start">${weak.map(id => `<span class="chip bad">${WORDS[id].icon} ${esc(WORDS[id].fa)} · ${esc(firstMeaning(WORDS[id].ar))}</span>`).join('')}</div>
          <div class="row" style="margin-top:12px"><button class="btn" id="redo">🔁 راجعها الآن</button></div></div>` : ''}
        <div class="row center"><button class="btn pink big" id="again">${s.kind === 'challenge' ? 'تحدٍّ جديد ▶' : 'العودة'}</button></div>
      </div>`;
    if (win) confetti();
    $app.querySelector('#home').onclick = () => go('home');
    $app.querySelector('#again').onclick = () => s.kind === 'challenge' ? go('home') : (s.lesson != null ? go('lesson', s.lesson) : go('home'));
    const r = $app.querySelector('#redo'); if (r) r.onclick = () => go('practice', weak.slice(0, 10), 'مراجعة');
  },

  settings() {
    const S = Store.s, fav = Voice.voicesFor('fa');
    $app.innerHTML = `
      <div class="top"><button class="iconbtn" id="back" aria-label="رجوع">→</button><h1 style="flex:1">⚙️ الإعدادات</h1></div>
      <div class="stack"><div class="card">
        <label class="set"><span>🥁 سرعة الإيقاع: <b id="bpmv">${n2a(S.bpm)}</b> نبضة/دقيقة</span><input type="range" id="bpm" min="80" max="132" step="4" value="${S.bpm}"></label>
        <label class="set"><span>🎹 مستوى الموسيقى</span><input type="range" id="music" min="0" max="100" step="5" value="${S.music}"></label>
        <label class="set"><span>🗣️ مصدر الصوت</span><select id="voice">
          <option value="auto" ${S.voice === 'auto' ? 'selected' : ''}>تلقائي (تسجيلات طبيعية)</option>
          <option value="native" ${S.voice === 'native' ? 'selected' : ''}>صوت الجهاز فقط</option>
          <option value="online" ${S.voice === 'online' ? 'selected' : ''}>صوت أونلاين (Google)</option></select></label>
        ${fav.length > 1 ? `<label class="set"><span>🇮🇷 الصوت الفارسي</span><select id="faVoice"><option value="">افتراضي</option>${fav.map(v => `<option ${S.faVoice === v.name ? 'selected' : ''}>${esc(v.name)}</option>`).join('')}</select></label>` : ''}
        <label class="set"><span>🔤 نطق المعنى بالعربية أثناء الغناء</span><input type="checkbox" id="arabic" ${S.arabic ? 'checked' : ''}></label>
        <label class="set"><span>🎤 تقييم النطق بالميكروفون</span><input type="checkbox" id="speak" ${S.speak ? 'checked' : ''}></label>
        <label class="set"><span>🌗 المظهر</span><select id="theme">
          <option value="" ${!S.theme ? 'selected' : ''}>حسب الجهاز</option><option value="light" ${S.theme === 'light' ? 'selected' : ''}>فاتح</option><option value="dark" ${S.theme === 'dark' ? 'selected' : ''}>داكن</option></select></label>
      </div>
      <div class="notice" id="vstat">${esc(Voice.statusText())}</div>
      <div class="row"><button class="btn" id="tv">🔊 جرّب الصوت</button><button class="btn alt" id="tm" ${Ear.Rec ? '' : 'disabled'}>🎤 جرّب الميكروفون</button></div>
      <div class="notice" id="mout" hidden></div>
      <div class="notice">💡 نصائح: أفضل تجربة على <b>Google Chrome</b> (أندرويد/كمبيوتر) أو <b>Microsoft Edge</b> الذي يحتوي أصواتاً فارسية طبيعية. الميكروفون يحتاج فتح الصفحة عبر https.</div>
      <button class="btn alt" id="reset" style="color:var(--bad)">🗑️ مسح كل التقدّم</button></div>`;
    const upd = (k, v) => { S[k] = v; Store.save(); };
    const el = id => $app.querySelector('#' + id);
    el('back').onclick = () => go('home');
    el('bpm').oninput = e => { upd('bpm', +e.target.value); el('bpmv').textContent = n2a(S.bpm); };
    el('music').oninput = e => { upd('music', +e.target.value); Music.setVolume(); };
    el('voice').onchange = e => { upd('voice', e.target.value); Voice.onlineFailed = { fa: false, ar: false }; el('vstat').textContent = Voice.statusText(); };
    if (el('faVoice')) el('faVoice').onchange = e => { upd('faVoice', e.target.value); el('vstat').textContent = Voice.statusText(); };
    el('arabic').onchange = e => upd('arabic', e.target.checked);
    el('speak').onchange = e => upd('speak', e.target.checked);
    el('theme').onchange = e => { upd('theme', e.target.value); applyTheme(); };
    el('tv').onclick = async () => { await Voice.speak('سلام! من فارسی یاد می‌گیرم.', { pitch: 1.2 }); el('vstat').textContent = Voice.statusText(); };
    el('tm').onclick = async () => {
      const o = el('mout'); o.hidden = false; o.textContent = '🎤 قل: «سلام»...';
      Ear.broken = false;
      const r = await Ear.listen(5000);
      o.textContent = r.error ? '⚠️ خطأ: ' + r.error + (r.error === 'not-allowed' ? ' — اسمح للميكروفون من إعدادات المتصفح' : '')
        : `سمعتُ: «${r.texts[0] || '—'}» · الدقة ${n2a(scoreSpeech('سلام', r.texts).score)}٪`;
    };
    el('reset').onclick = () => { if (confirm('هل تريد مسح كل التقدّم؟')) { Store.data.words = {}; Store.data.challenges = []; Store.save(); go('home'); } };
  },
};

/* ---------- مراحل التعلّم والاختبار ---------- */
const nullUI = { beat() {}, word() {}, sentence() {}, hl() {} };
async function quickSing(lines) {
  newSession({ kind: 'quick' });
  try { await sing(lines, nullUI); } catch (e) { /* أُلغي */ }
}

function hud(label, extra = '') {
  const pause = session.kind === 'challenge' ? '<button class="iconbtn" id="pause" aria-label="إيقاف مؤقت">⏸</button>' : '';
  const timer = !session.limit ? '<span></span>'
    : `<span class="timer" id="timer">${session.frozen ? '⏸ المؤقّت متوقف' : '⏱ ' + fmtTime(tleft())}</span>`;
  return `<div class="hud"><div class="row" style="gap:6px;flex-wrap:nowrap"><button class="iconbtn" id="quit" aria-label="خروج">✕</button>${pause}</div>
    <span class="pill">${esc(label)}</span>${timer}</div>${extra}`;
}
function bindQuit() {
  $app.querySelector('#quit').onclick = () => {
    if (session && session.kind === 'challenge') {
      if (!confirm('إنهاء التحدّي وعرض النتيجة؟')) return;
      const s = session; abortSession('quit'); finishRun(s, 100);
    } else if (session && session.kind === 'exam') {
      if (!confirm('إنهاء الاختبار الآن؟ الأسئلة الباقية تُحسب خطأ.')) return;
      abortSession('quit');
    } else go('home');
  };
  const p = $app.querySelector('#pause');
  if (p) p.onclick = () => pauseChallenge();
}

async function countdown(msg) {
  for (const n of ['٣', '٢', '١', '🎵']) {
    $app.innerHTML = hud('استعد!') + `<div class="card stage"><div class="em" style="font-size:120px">${n}</div><div class="muted">${msg || 'صفّق مع الإيقاع واردد بعد الصوت 👏'}</div></div>`;
    bindQuit(); Music.init(); if (Music.ctx) Music.kick(Music.ctx.currentTime + 0.01);
    await guard(sleep(600));
  }
}

async function learn(ids, sids, label, challenge) {
  check();
  $app.innerHTML = hud(label) + `
    <div class="chips" id="prog" style="margin-bottom:10px">${ids.map(id => `<span class="chip" data-p="${id}">${WORDS[id].icon}</span>`).join('')}</div>
    <div class="card"><div class="dots"><span></span><span></span><span></span><span></span></div><div class="stage"></div></div>
    <div class="row center" style="margin-top:12px"><button class="btn alt" id="skip">⏭ إلى الاختبار</button></div>`;
  bindQuit();
  const ui = stageUI($app);
  let skip;
  const skipP = new Promise(r => { skip = r; });
  $app.querySelector('#skip').onclick = () => { Voice.stop(); if (session.groove) session.groove.stop(); skip(); };
  const lines = [];
  ids.forEach(id => {
    const ls = wordLines(WORDS[id], ui, false);
    const on0 = ls[0].on;
    ls[0].on = () => { on0(); $app.querySelectorAll('#prog .chip').forEach(c => c.classList.toggle('cur', +c.dataset.p === id)); };
    lines.push(...ls);
  });
  sids.forEach(sid => lines.push(...sentLines(SENTS[sid], ui, challenge)));
  lines.forEach(l => l.text && Voice.preload(l.text, l.lang)); // حمّل تسجيلات المجموعة كلها مسبقاً
  await guard(Promise.race([sing(lines, ui), skipP]));
  if (session.groove) session.groove.stop();
  Music.setDuck(false);
}

// null = اختبار النطق مُعطّل فلا يُحتسب
const speakOk = sc => sc === null || sc === true || (typeof sc === 'number' && sc >= PASS_SCORE);
function wordResult(id) { return session.results[id] || (session.results[id] = { first: false, mastered: false, speak: null, tries: 0 }); }

async function test(ids, sids, label, challenge) {
  for (const id of shuffle(ids)) {
    check();
    if (session.done && session.done.has(id)) continue; // أُجيب قبل الإيقاف المؤقت
    const r = wordResult(id);
    const okL = await askListen(id, label);
    const sc = await askSpeak(id, label, true);
    const okS = speakOk(sc);
    if (typeof sc === 'number') r.speak = sc;
    r.first = okL && okS; r.mastered = r.first; r.tries = 1;
    record(id, r.mastered);
    if (session.done) { session.done.add(id); if (session.kind === 'challenge') saveChallenge('test'); }
  }
  const failed = ids.filter(id => !session.results[id] || !session.results[id].mastered);
  // فهم الجمل بالسمع
  const sq = challenge ? shuffle(sids).slice(0, 2) : sids;
  for (const sid of sq) { check(); const ok = await askSentence(sid, label); session.sent.n++; if (ok) session.sent.ok++; }
  // جولة إعادة للكلمات الخاطئة: غناء قصير ثم اختبار
  if (failed.length && (!challenge || tleft() > failed.length * 15000)) {
    await learnShort(failed, label);
    for (const id of failed) {
      check();
      const r = wordResult(id);
      const okL = await askListen(id, label + ' · إعادة');
      const sc = await askSpeak(id, label + ' · إعادة', true);
      const okS = speakOk(sc);
      if (typeof sc === 'number') r.speak = Math.max(r.speak || 0, sc);
      r.mastered = okL && okS; r.tries = 2;
      record(id, r.mastered);
    }
  }
}
async function learnShort(ids, label) {
  check();
  $app.innerHTML = hud(label + ' · 🔁 مراجعة سريعة') + `<div class="card"><div class="dots"><span></span><span></span><span></span><span></span></div><div class="stage"></div></div>`;
  bindQuit();
  const ui = stageUI($app);
  const lines = []; ids.forEach(id => lines.push(...wordLines(WORDS[id], ui, true)));
  await guard(sing(lines, ui));
}
// مراجعة متباعدة (صناديق لايتنر): بعد كم يوم نعيد الكلمة حسب صندوقها
const SRS_DAYS = [0, 1, 2, 4, 7, 15, 30];
const DAY = 864e5;
function record(id, ok) {
  const w = Store.w(id);
  if (ok) { w.c++; w.m = 1; w.b = Math.min((w.b || 0) + 1, SRS_DAYS.length - 1); }
  else { w.x++; w.m = 0; w.b = 1; }
  w.due = Date.now() + SRS_DAYS[w.b] * DAY - 3600e3; // ساعة سماح
  const d = today(); d.n++; if (ok) d.ok++;
  Store.save();
}
function dayKey(t = Date.now()) { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function today() { return Store.data.days[dayKey()] || (Store.data.days[dayKey()] = { n: 0, ok: 0, rounds: [] }); }
function streak() { let n = 0; for (let t = Date.now(); Store.data.days[dayKey(t)]; t -= DAY) n++; return n; }
function dueWords() {
  const now = Date.now();
  return Object.entries(Store.data.words).filter(([, w]) => w.due && w.due <= now).sort((a, b) => a[1].due - b[1].due).map(([id]) => +id);
}
const LEVELS = [[0, 'مبتدئ', '🌱'], [50, 'متعلّم', '🌿'], [150, 'متحدّث', '🌳'], [300, 'طليق', '🦁'], [500, 'أستاذ', '👑']];
function levelOf(n) { let l = LEVELS[0]; LEVELS.forEach(x => { if (n >= x[0]) l = x; }); return l; }
function weakWords() {
  return Object.entries(Store.data.words).filter(([, w]) => !w.m && w.x > 0).map(([id]) => +id);
}

function pickDistractors(id, n) {
  const w = WORDS[id];
  const pool = shuffle(WORDS.filter(x => x.id !== id && x.icon !== w.icon && firstMeaning(x.ar) !== firstMeaning(w.ar)
    && Math.abs(x.lesson - w.lesson) <= 6));
  const out = [], icons = new Set([w.icon]);
  for (const x of pool) { if (!icons.has(x.icon)) { icons.add(x.icon); out.push(x.id); } if (out.length >= n) break; }
  return out;
}

/** سؤال السمع: تسمع الكلمة وتختار الصورة/المعنى */
function askListen(id, label) {
  const w = WORDS[id];
  const opts = shuffle([id, ...pickDistractors(id, 3)]);
  $app.innerHTML = hud(label) + `<div class="card stage">
    <div class="tag">🎧 استمع واختر المعنى</div>
    <button class="play" id="pl" aria-label="استمع">🔊</button>
    <div class="opts">${opts.map(o => `<button class="opt" data-o="${o}"><span class="em">${WORDS[o].icon}</span>${esc(firstMeaning(WORDS[o].ar))}</button>`).join('')}</div>
    <div class="fb" id="fb"></div></div>`;
  bindQuit();
  const play = () => Voice.speak(w.fa, { pitch: 1.15 });
  $app.querySelector('#pl').onclick = play;
  play();
  return guard(new Promise(resolve => {
    $app.querySelectorAll('.opt').forEach(b => b.onclick = async () => {
      const ok = +b.dataset.o === id;
      $app.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (+x.dataset.o === id) x.classList.add('ok'); });
      if (!ok) b.classList.add('bad');
      const fb = $app.querySelector('#fb');
      fb.className = 'fb ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = ok ? '✔ أحسنت!' : `✘ الصحيح: ${w.icon} <span class="fa" style="font-size:20px">${esc(w.voc)}</span> = ${esc(w.ar)}`;
      if (!ok) await Voice.speak(w.fa, { pitch: 1 }); else await sleep(450);
      resolve(ok);
    });
  }));
}

/** سؤال النطق: تقول الكلمة ويقيّمها التعرّف على الكلام. يعيد رقماً (٠–١٠٠) أو true/false في التقييم الذاتي */
function askSpeak(id, label, skipModel) {
  if (!Store.s.speak) return Promise.resolve(null);
  const w = WORDS[id];
  $app.innerHTML = hud(label) + `<div class="card stage">
    <div class="tag">🎤 قلها بصوتك</div><div class="em">${w.icon}</div>
    <div class="fa">${esc(w.voc)}</div><div class="ar">${esc(w.ar)}</div>
    <div class="row center"><button class="btn alt sm" id="model">🔊 اسمع النطق</button></div>
    <button class="mic" id="mic" aria-label="سجّل">🎤</button>
    <div class="meter"><i id="mt" style="width:0"></i></div>
    <div class="fb" id="fb"></div><div class="small muted" id="heard"></div>
    <div class="row center" id="self" hidden><button class="btn" id="yes">✅ نطقتها صحيحاً</button><button class="btn alt" id="no">🔁 لم أُتقنها</button></div>
    <button class="btn alt sm" id="skipS">تخطي</button></div>`;
  bindQuit();
  const q = s => $app.querySelector(s);
  q('#model').onclick = () => Voice.speak(w.fa, { pitch: 1.1 });
  return guard(new Promise(resolve => {
    let tries = 0, best = 0, busy = false;
    q('#skipS').onclick = () => { Ear.stop(); resolve(best || 0); };
    const selfMode = () => {
      q('#mic').hidden = true; q('.meter').hidden = true; q('#self').hidden = false;
      q('#fb').className = 'fb'; q('#fb').textContent = 'قلها بصوت عالٍ، ثم قيّم نفسك 👇';
      q('#yes').onclick = () => resolve(true); q('#no').onclick = () => resolve(false);
    };
    const attempt = async () => {
      if (busy) return; busy = true;
      if (!Ear.ok) { busy = false; selfMode(); return; }
      tries++;
      q('#mic').classList.add('on'); q('#fb').className = 'fb'; q('#fb').textContent = 'أستمع إليك... 👂';
      const r = await Ear.listen(4500);
      if (!session || session.cancelled) return;
      q('#mic').classList.remove('on'); busy = false;
      if (r.error) {
        if (Ear.broken || r.error === 'network') { Ear.broken = Ear.broken || r.error === 'network'; selfMode(); return; }
        q('#fb').className = 'fb bad'; q('#fb').textContent = r.error === 'no-speech' ? 'لم أسمع شيئاً، اضغط 🎤 وحاول مجدداً' : 'حاول مجدداً';
        if (tries >= 3) resolve(best); return;
      }
      // بعض الأجهزة (مثل iPhone) لا تدعم الإملاء بالفارسية فتكتب بلغة أخرى: ننتقل للتقييم الذاتي
      if (r.texts.length && !r.texts.some(t => /[\u0600-\u06FF]/.test(t))) { Ear.broken = true; selfMode(); return; }
      const { score, heard } = scoreSpeech(w.fa, r.texts);
      best = Math.max(best, score);
      const mt = q('#mt'); mt.style.width = score + '%'; mt.style.background = score >= PASS_SCORE ? 'var(--ok)' : score >= 35 ? 'var(--warn)' : 'var(--bad)';
      q('#heard').textContent = heard ? `سمعتُ: «${heard}»` : '';
      const ok = score >= PASS_SCORE;
      q('#fb').className = 'fb ' + (ok ? 'ok' : 'bad');
      q('#fb').textContent = ok ? `👏 ممتاز! ${n2a(score)}٪` : `${n2a(score)}٪ — ${tries < 2 ? 'اسمع وحاول مرة أخرى' : 'سنراجعها لاحقاً'}`;
      if (ok || tries >= 2) { await sleep(ok ? 650 : 1100); resolve(best); return; }
      await Voice.speak(w.fa, { pitch: 1 });
      attempt();
    };
    q('#mic').onclick = attempt;
    (async () => { if (!skipModel) await Voice.speak(w.fa); attempt(); })();
  }));
}

/** سؤال الجملة: تسمع الجملة وتختار ترجمتها */
function askSentence(sid, label) {
  const s = SENTS[sid];
  const others = shuffle(SENTS.filter(x => x.id !== sid && Math.abs(x.lesson - s.lesson) <= 3)).slice(0, 2);
  const opts = shuffle([s, ...others]);
  $app.innerHTML = hud(label) + `<div class="card stage">
    <div class="tag">🎶 استمع للجملة واختر معناها</div>
    <button class="play" id="pl" aria-label="استمع">🔊</button>
    <div class="opts">${opts.map(o => `<button class="opt wide" data-o="${o.id}">${esc(o.ar)}</button>`).join('')}</div>
    <div class="fb" id="fb"></div><div id="nx"></div></div>`;
  bindQuit();
  const play = () => Voice.speak(s.fa, { pitch: 1.1, rate: 0.95 });
  $app.querySelector('#pl').onclick = play;
  play();
  return guard(new Promise(resolve => {
    $app.querySelectorAll('.opt').forEach(b => b.onclick = async () => {
      const ok = +b.dataset.o === sid;
      $app.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (+x.dataset.o === sid) x.classList.add('ok'); });
      if (!ok) b.classList.add('bad');
      const fb = $app.querySelector('#fb'); fb.className = 'fb ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = `${ok ? '✔' : '✘'} ${s.icon} <span class="fa" style="font-size:22px">${markSentence(s)}</span><div class="small muted" style="font-weight:600">${esc(s.ar)}</div>`;
      Voice.speak(s.fa, { rate: 0.95 });
      await waitNext(readMs(s.fa) + (ok ? 0 : 1500));
      resolve(ok);
    });
  }));
}

function finishRun(s, total) {
  clearInterval(s.timer);
  Voice.stop(); Ear.stop(); if (s.groove) s.groove.stop();
  if (s.kind === 'challenge') {
    Store.data.saved = null;
    today().rounds.push(s.block);
    const mastered = Object.values(s.results).filter(r => r.mastered).length;
    Store.data.challenges.unshift({ at: Date.now(), block: s.block, mastered, ms: Date.now() - s.start, timeup: s.cancelled === 'timeup' });
    Store.data.challenges = Store.data.challenges.slice(0, 20);
    Store.save();
  }
  if (session === s) session = null;
  window.scrollTo(0, 0);
  VIEWS.report(s, total);
}

function stageCard(st) {
  const best = Store.data.stages[st];
  return `<button class="lesson stagecard" data-stage="${st}"><div class="em">🏁</div>
    <div class="small muted">بعد الدرس ${n2a(st * 5 + 5)}</div><div class="t">اختبار المرحلة ${n2a(st + 1)}</div>
    <div class="small muted">${best != null ? `أفضل نتيجة: ${n2a(best)}٪ ${gradeOf(best)[1]}` : 'كل كلمات وجمل ٥ دروس'}</div></button>`;
}
function blockWords(b) { return LESSONS.slice(b * BLOCK_SIZE, b * BLOCK_SIZE + BLOCK_SIZE).flatMap(l => l.words); }
function historyHtml() {
  const h = Store.data.challenges.slice(0, 5);
  if (!h.length) return '';
  return `<div class="card"><h3>🗓️ آخر التحديات</h3>${h.map(c => `<div class="row between small" style="padding:6px 0;border-bottom:1px solid var(--border)">
    <span>${new Date(c.at).toLocaleDateString('ar')} · الكلمات ${n2a(c.block * 100 + 1)}–${n2a(c.block * 100 + 100)}</span>
    <b>${n2a(c.mastered)}/١٠٠ · ${fmtTime(c.ms)}${c.timeup ? ' ⏰' : ''}</b></div>`).join('')}</div>`;
}
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  box.innerHTML = Array.from({ length: 40 }, () => `<i style="right:${Math.random() * 100}%;animation-delay:${Math.random()}s">${['🎉', '⭐', '🎵', '🌸', '✨'][Math.random() * 5 | 0]}</i>`).join('');
  document.body.appendChild(box); setTimeout(() => box.remove(), 3600);
}

/* ---------- الإيقاف المؤقت للتحدّي ---------- */
function saveChallenge(phase) {
  const s = session; if (!s || s.kind !== 'challenge') return;
  Store.data.saved = { block: s.block, group: s.group || 0, phase, elapsed: elapsedOf(s), results: s.results, sent: s.sent, done: [...(s.done || [])] };
  Store.save();
}
function pauseChallenge() {
  if (!session || session.kind !== 'challenge') return;
  freeze(false);
  saveChallenge(Store.data.saved ? Store.data.saved.phase : 'learn');
  abortSession('pause');
  session = null;
  VIEWS.paused();
}

/* ---------- محرّك الأسئلة (على نمط اختبار القدرات) ---------- */
function waitNext(ms) {
  const nx = $app.querySelector('#nx');
  if (!nx) return sleep(ms);
  nx.innerHTML = '<button class="btn sm alt" id="nextBtn" style="margin-top:6px">التالي ⏭</button>';
  return guard(new Promise(r => { const t = setTimeout(r, ms); nx.querySelector('#nextBtn').onclick = () => { clearTimeout(t); r(); }; }));
}
/** سؤال اختيار من متعدد عام. options: [{key, html}] */
function askChoice({ label, tag, prompt, options, correct, audio, explain, wide, wait = 700, onAnswer }) {
  $app.innerHTML = hud(label) + `<div class="card stage">
    <div class="tag">${tag}</div>${audio ? '<button class="play" id="pl" aria-label="استمع">🔊</button>' : ''}
    <div class="qprompt">${prompt || ''}</div>
    <div class="opts">${options.map(o => `<button class="opt ${wide ? 'wide' : ''}" data-o="${o.key}">${o.html}</button>`).join('')}</div>
    <div class="fb" id="fb"></div><div id="nx"></div></div>`;
  bindQuit();
  if (audio) { $app.querySelector('#pl').onclick = audio; audio(); }
  return guard(new Promise(resolve => {
    $app.querySelectorAll('.opt').forEach(b => b.onclick = async () => {
      const ok = b.dataset.o === String(correct);
      $app.querySelectorAll('.opt').forEach(x => { x.disabled = true; if (x.dataset.o === String(correct)) x.classList.add('ok'); });
      if (!ok) b.classList.add('bad');
      const fb = $app.querySelector('#fb'); fb.className = 'fb ' + (ok ? 'ok' : 'bad');
      fb.innerHTML = (ok ? '✔ أحسنت! ' : '✘ ') + (explain || '');
      if (onAnswer) onAnswer(ok);
      await waitNext(ok ? wait : wait + 1800);
      resolve(ok);
    });
  }));
}
const faHtml = (t, size = 22) => `<span class="fa" style="font-size:${size}px">${esc(t)}</span>`;
const wordExplain = w => `${w.icon} ${faHtml(w.voc)} = ${esc(w.ar)}`;

/** المعاني: تقرأ الكلمة الفارسية وتختار معناها */
function qRead(id, label) {
  const w = WORDS[id], opts = shuffle([id, ...pickDistractors(id, 3)]);
  return askChoice({ label, tag: '📖 ما معنى الكلمة؟', prompt: `<div class="fa" style="font-size:46px">${esc(w.voc)}</div>`,
    options: opts.map(o => ({ key: o, html: esc(firstMeaning(WORDS[o].ar)) })), correct: id, explain: wordExplain(w),
    onAnswer: () => Voice.speak(w.fa) });
}
/** العكس: ترى المعنى والصورة وتختار الكلمة الفارسية */
function qReverse(id, label) {
  const w = WORDS[id], opts = shuffle([id, ...pickDistractors(id, 3)]);
  return askChoice({ label, tag: '🔁 اختر الكلمة الفارسية', prompt: `<div class="em">${w.icon}</div><div class="ar" style="font-size:24px">${esc(w.ar)}</div>`,
    options: opts.map(o => ({ key: o, html: faHtml(WORDS[o].voc, 24) })), correct: id, explain: wordExplain(w),
    onAnswer: () => Voice.speak(w.fa) });
}
/** إكمال الجمل: جملة فيها فراغ */
const FILLS = SENTS.flatMap(s => s.words.filter(id => WORDS[id].fa.length >= 2 && s.fa.includes(WORDS[id].fa)).map(id => ({ sid: s.id, wid: id })));
function qFill({ sid, wid }, label) {
  const s = SENTS[sid], w = WORDS[wid];
  const opts = shuffle([wid, ...pickDistractors(wid, 3)]);
  const blank = esc(s.fa).replace(esc(w.fa), '<span class="blank">؟؟؟</span>');
  return askChoice({ label, tag: '✏️ أكمل الجملة', prompt: `<div class="em" style="font-size:54px">${s.icon}</div><div class="sfa">${blank}</div><div class="sar">${esc(s.ar)}</div>`,
    options: opts.map(o => ({ key: o, html: faHtml(WORDS[o].voc, 22) })), correct: wid, wait: readMs(s.fa),
    explain: `<div class="fa" style="font-size:22px">${markSentence(s)}</div>`, onAnswer: () => Voice.speak(s.fa, { rate: 0.95 }) });
}
/** التناظر اللفظي: أ : ب :: ج : ؟ */
const ANALOGY_RAW = {
  'أضداد': 'بزرگ:کوچک گرم:سرد بلند:کوتاه نو:کهنه خوب:بد پر:خالی تند:آهسته ارزان:گران سنگین:سبک تمیز:کثیف درست:غلط چاق:لاغر شیرین:تلخ ثروتمند:فقیر خوشحال:ناراحت آسان:سخت زیاد:کم همیشه:هرگز قبل:بعد زود:دیر بالا:پایین جلو:پشت نزدیک:دور داخل:بیرون آمدن:رفتن خریدن:فروختن باز_کردن:بستن خندیدن:گریه_کردن شروع_کردن:تمام_کردن روز:شب فردا:دیروز سفید:سیاه بله:نه سلام:خداحافظ پیر:جوان نرم:سفت تابستان:زمستان نشستن:ایستادن سوار_شدن:پیاده_شدن گم_کردن:پیدا_کردن',
  'مذكّر ومؤنّث': 'پدر:مادر برادر:خواهر پسر:دختر شوهر:زن پدربزرگ:مادربزرگ عمو:عمه دایی:خاله آقا:خانم داماد:عروس',
};
const BY_FA = new Map(WORDS.map(w => [w.fa, w.id]));
const ANALOGIES = Object.entries(ANALOGY_RAW).map(([rel, list]) => ({ rel,
  pairs: list.split(' ').map(p => p.split(':').map(x => BY_FA.get(x.replace(/_/g, ' ')))).filter(p => p.every(x => x != null)) }));
function analogyQuestions(scope, n) {
  const inScope = new Set(scope), out = [];
  ANALOGIES.forEach(g => {
    const ps = g.pairs.filter(p => inScope.has(p[0]) && inScope.has(p[1]));
    shuffle(ps).forEach((p, i) => { const other = ps[(i + 1) % ps.length]; if (ps.length > 1) out.push({ a: other, b: p, rel: g.rel }); });
  });
  return shuffle(out).slice(0, n);
}
function qAnalogy({ a, b, rel }, label) {
  const [A, B] = a.map(x => WORDS[x]), [C, D] = b.map(x => WORDS[x]);
  const opts = shuffle([D.id, ...pickDistractors(D.id, 3).filter(x => x !== C.id && x !== A.id && x !== B.id).slice(0, 3)]);
  return askChoice({ label, tag: '🔗 التناظر اللفظي',
    prompt: `<div class="analogy">${faHtml(A.voc, 23)} <b>:</b> ${faHtml(B.voc, 23)} <b>::</b> ${faHtml(C.voc, 23)} <b>:</b> <span class="blank">؟</span></div>`,
    options: opts.map(o => ({ key: o, html: faHtml(WORDS[o].voc, 22) })), correct: D.id, wait: 2500,
    explain: `<div class="small" style="font-weight:600">${esc(rel)}: ${esc(firstMeaning(A.ar))} : ${esc(firstMeaning(B.ar))} :: ${esc(firstMeaning(C.ar))} : ${esc(firstMeaning(D.ar))}</div>` });
}

/** يشغّل قائمة أسئلة ويعيد النتيجة بالأقسام. q: {sec, word?, run(label)} */
async function runQuiz(qs, title) {
  const res = { ok: 0, n: qs.length, secs: {}, wrong: [] };
  qs.forEach(q => { res.secs[q.sec] = res.secs[q.sec] || { ok: 0, n: 0 }; res.secs[q.sec].n++; });
  for (let i = 0; i < qs.length; i++) {
    check();
    const q = qs[i];
    const ok = await q.run(`${title} · ${q.sec} · ${n2a(i + 1)}/${n2a(qs.length)}`);
    if (ok) { res.ok++; res.secs[q.sec].ok++; } else if (q.word != null) res.wrong.push(q.word);
    if (q.word != null) record(q.word, ok);
  }
  return res;
}
const SEC = { listen: '🎧 السمع', read: '📖 المعاني', reverse: '🔁 المفردات', fill: '✏️ إكمال الجمل', sent: '🎶 الاستيعاب المسموع', analogy: '🔗 التناظر اللفظي' };
function wordQ(id) {
  const t = ['listen', 'read', 'reverse'][Math.random() * 3 | 0];
  const run = t === 'listen' ? l => askListen(id, l) : t === 'read' ? l => qRead(id, l) : l => qReverse(id, l);
  return { sec: SEC[t], word: id, run };
}

/** 🏁 اختبار المرحلة: كل كلمات خمسة دروس + جملها */
async function checkpoint(lessonIds, inChallenge) {
  const words = lessonIds.flatMap(i => LESSONS[i].words);
  const sids = lessonIds.flatMap(i => LESSONS[i].sentences);
  const fills = shuffle(FILLS.filter(f => sids.includes(f.sid)));
  const usedS = new Set(), fq = [];
  for (const f of fills) { if (!usedS.has(f.sid)) { usedS.add(f.sid); fq.push(f); } if (fq.length >= 6) break; }
  const qs = [
    ...shuffle(words).map(wordQ),
    ...fq.map(f => ({ sec: SEC.fill, run: l => qFill(f, l) })),
    ...shuffle(sids.filter(x => !usedS.has(x))).slice(0, 4).map(sid => ({ sec: SEC.sent, run: l => askSentence(sid, l) })),
    ...analogyQuestions(words, 2).map(a => ({ sec: SEC.analogy, run: l => qAnalogy(a, l) })),
  ];
  const stage = lessonIds[0] / 5 | 0;
  await stageIntro(stage, words.length, qs.length, inChallenge);
  const r = await runQuiz(qs, `🏁 المرحلة ${n2a(stage + 1)}`);
  const pct = Math.round(r.ok / r.n * 100);
  Store.data.stages[stage] = Math.max(Store.data.stages[stage] || 0, pct); Store.save();
  return { ...r, pct, stage };
}
async function stageIntro(stage, nw, nq, inChallenge) {
  $app.innerHTML = hud('🏁 اختبار المرحلة') + `<div class="card stage">
    <div class="em">🏁</div><h1>اختبار المرحلة ${n2a(stage + 1)}</h1>
    <div class="muted">الدروس ${n2a(stage * 5 + 1)}–${n2a(stage * 5 + 5)} · ${n2a(nw)} كلمة مع جملها · ${n2a(nq)} سؤالاً</div>
    <div class="small muted">أسئلة متنوّعة: سمع، معانٍ، مفردات، إكمال جمل، استيعاب مسموع، تناظر لفظي${inChallenge ? '<br>⏸ مؤقّت التحدّي متوقف أثناء هذا الاختبار' : ''}</div>
    <button class="btn big pink" id="go" style="margin-top:12px">ابدأ ▶</button></div>`;
  bindQuit();
  await guard(new Promise(r => { $app.querySelector('#go').onclick = r; }));
}
function gradeOf(p) {
  return p >= 90 ? ['ممتاز مرتفع', '🏅'] : p >= 80 ? ['ممتاز', '🌟'] : p >= 70 ? ['جيد جداً', '👍'] : p >= 60 ? ['جيد', '🙂'] : ['يحتاج مراجعة', '💪'];
}
function secBars(secs) {
  return Object.entries(secs).map(([k, v]) => { const p = Math.round(v.ok / v.n * 100); return `
    <div style="margin:8px 0"><div class="row between small"><b>${k}</b><span>${n2a(v.ok)}/${n2a(v.n)} · ${n2a(p)}٪</span></div>
    <div class="meter" style="max-width:none"><i style="width:${p}%;background:${p >= 80 ? 'var(--ok)' : p >= 60 ? 'var(--warn)' : 'var(--bad)'}"></i></div></div>`; }).join('');
}
async function stageInterlude(lessonIds, r) {
  const [g, e] = gradeOf(r.pct);
  if (r.pct >= 80) confetti();
  $app.innerHTML = hud('🏁 نتيجة المرحلة') + `<div class="card stage">
    <div class="bignum">${n2a(r.pct)}٪</div><div class="fb ${r.pct >= 80 ? 'ok' : 'bad'}">${e} ${g}</div>
    <div style="width:100%;text-align:right">${secBars(r.secs)}</div>
    <button class="btn big pink" id="go">نكمل التحدّي ▶</button></div>`;
  bindQuit();
  await guard(new Promise(res => { $app.querySelector('#go').onclick = res; }));
}

/* ---------- 🎓 اختبار القدرات الفارسي ---------- */
const EXAM_MS = 25 * 60 * 1000;
function examScope(kind) {
  if (kind === 'all') return WORDS.map(w => w.id);
  if (kind === 'learned') return Object.keys(Store.data.words).map(Number);
  return blockWords(+kind);
}
function buildExam(scope) {
  const sset = new Set(scope);
  const sids = SENTS.filter(s => s.words.every(id => sset.has(id))).map(s => s.id);
  const fills = shuffle(FILLS.filter(f => sids.includes(f.sid)));
  const ws = shuffle(scope);
  const take = (n) => ws.splice(0, n);
  return [
    ...analogyQuestions(scope, 8).map(a => ({ sec: SEC.analogy, run: l => qAnalogy(a, l) })),
    ...fills.slice(0, 12).map(f => ({ sec: SEC.fill, run: l => qFill(f, l) })),
    ...shuffle(sids).slice(0, 10).map(sid => ({ sec: SEC.sent, run: l => askSentence(sid, l) })),
    ...take(6).map(id => ({ sec: SEC.read, word: id, run: l => qRead(id, l) })),
    ...take(6).map(id => ({ sec: SEC.reverse, word: id, run: l => qReverse(id, l) })),
    ...take(8).map(id => ({ sec: SEC.listen, word: id, run: l => askListen(id, l) })),
  ];
}

VIEWS.exam = function () {
  const learned = Object.keys(Store.data.words).length;
  const last = Store.data.exams[0];
  $app.innerHTML = `
    <div class="top"><button class="iconbtn" id="back" aria-label="رجوع">→</button><div style="flex:1"><h1>🎓 اختبار القدرات الفارسي</h1>
      <div class="muted small">على نمط «القدرات»: أسئلة موقوتة بأقسام، ودرجة من ١٠٠</div></div></div>
    <div class="stack">
      <div class="card"><h3>📋 الأقسام</h3><div class="small" style="line-height:2">
        ${SEC.analogy} — أ : ب :: ج : ؟<br>${SEC.fill} — اختر الكلمة الناقصة<br>${SEC.sent} — تسمع جملة وتختار معناها<br>
        ${SEC.read} و${SEC.reverse} — من الفارسية للعربية والعكس<br>${SEC.listen} — تسمع كلمة وتختار صورتها</div>
        <div class="notice" style="margin-top:8px">⏱ ٢٥ دقيقة · حتى ٥٠ سؤالاً · بدون رجوع للسؤال السابق</div></div>
      <div class="card"><h3>🎯 نطاق الاختبار</h3>
        <div class="blocks" style="grid-template-columns:repeat(2,1fr)">
          <button class="opt" data-k="learned" ${learned < 20 ? 'disabled' : ''}>📚 كل ما تعلّمته<br><span class="small muted">${n2a(learned)} كلمة</span></button>
          <button class="opt" data-k="all">🌍 الـ ٦٠٠ كلمة كلها</button>
          ${[0, 1, 2, 3, 4, 5].map(b => `<button class="opt" data-k="${b}">الكلمات ${n2a(b * 100 + 1)}–${n2a(b * 100 + 100)}</button>`).join('')}
        </div></div>
      ${last ? `<div class="card small">آخر نتيجة: <b>${n2a(last.score)}</b> من ١٠٠ · ${new Date(last.at).toLocaleDateString('ar')}</div>` : ''}
    </div>`;
  $app.querySelector('#back').onclick = () => go('home');
  $app.querySelectorAll('.opt[data-k]').forEach(b => b.onclick = () => go('examRun', b.dataset.k));
};
VIEWS.examRun = async function (kind) {
  const scope = examScope(kind);
  const s = newSession({ kind: 'exam', limit: EXAM_MS, results: {}, sent: { ok: 0, n: 0 } });
  const qs = buildExam(scope);
  let r = { ok: 0, n: qs.length, secs: {}, wrong: [] };
  qs.forEach(q => { r.secs[q.sec] = r.secs[q.sec] || { ok: 0, n: 0 }; r.secs[q.sec].n++; });
  try {
    await countdown('ركّز… الاختبار بدأ 🎓');
    // نشغّل الأسئلة ونحفظ التقدّم في r لكي تُحسب النتيجة حتى لو انتهى الوقت
    for (let i = 0; i < qs.length; i++) {
      check();
      const ok = await qs[i].run(`${qs[i].sec} · ${n2a(i + 1)}/${n2a(qs.length)}`);
      if (ok) { r.ok++; r.secs[qs[i].sec].ok++; } else if (qs[i].word != null) r.wrong.push(qs[i].word);
      if (qs[i].word != null) record(qs[i].word, ok);
    }
  } catch (e) {
    if (!(e instanceof Abort)) console.error(e);
    if (e instanceof Abort && e.message === 'end') return;
  }
  clearInterval(s.timer); Voice.stop();
  const score = Math.round(r.ok / r.n * 100);
  Store.data.exams.unshift({ at: Date.now(), kind, score, ms: elapsedOf(s) }); Store.data.exams = Store.data.exams.slice(0, 20); Store.save();
  if (session === s) session = null;
  const [g, e] = gradeOf(score);
  if (score >= 80) confetti();
  window.scrollTo(0, 0);
  $app.innerHTML = `
    <div class="top"><h1>🎓 نتيجة اختبار القدرات</h1><button class="iconbtn" id="home" aria-label="الرئيسية">🏠</button></div>
    <div class="stack">
      <div class="card stage" style="min-height:0"><div class="small muted">الدرجة</div><div class="bignum" style="font-size:80px">${n2a(score)}</div>
        <div class="fb ${score >= 70 ? 'ok' : 'bad'}">${e} ${g}</div>
        <div class="small muted">${n2a(r.ok)} صحيحة من ${n2a(r.n)} · الوقت ${fmtTime(elapsedOf(s))}${s.cancelled === 'timeup' ? ' · ⏰ انتهى الوقت' : ''}</div></div>
      <div class="card"><h3>📊 الأداء حسب القسم</h3>${secBars(r.secs)}</div>
      ${r.wrong.length ? `<div class="card"><h3>💪 كلمات أخطأت فيها</h3><div class="chips" style="justify-content:flex-start">${r.wrong.map(id => `<span class="chip bad">${WORDS[id].icon} ${esc(WORDS[id].fa)} · ${esc(firstMeaning(WORDS[id].ar))}</span>`).join('')}</div>
        <div class="row" style="margin-top:10px"><button class="btn" id="redo">🔁 راجعها بالغناء</button></div></div>` : ''}
      <div class="row center"><button class="btn pink big" id="again">اختبار جديد</button></div>
    </div>`;
  $app.querySelector('#home').onclick = () => go('home');
  $app.querySelector('#again').onclick = () => go('exam');
  const rd = $app.querySelector('#redo'); if (rd) rd.onclick = () => go('practice', r.wrong.slice(0, 10), 'مراجعة أخطاء الاختبار');
};

/* ---------- 🏁 صفحة اختبار المرحلة (من قائمة الدروس) ---------- */
VIEWS.stage = async function (stage) {
  const ids = [0, 1, 2, 3, 4].map(k => stage * 5 + k);
  newSession({ kind: 'stage', results: {}, sent: { ok: 0, n: 0 } });
  let r;
  try { r = await checkpoint(ids, false); } catch (e) { if (!(e instanceof Abort)) console.error(e); return; }
  session = null;
  const [g, e] = gradeOf(r.pct);
  if (r.pct >= 80) confetti();
  $app.innerHTML = `<div class="top"><h1>🏁 نتيجة المرحلة ${n2a(stage + 1)}</h1><button class="iconbtn" id="home" aria-label="الرئيسية">🏠</button></div>
    <div class="stack"><div class="card stage" style="min-height:0"><div class="bignum">${n2a(r.pct)}٪</div><div class="fb ${r.pct >= 80 ? 'ok' : 'bad'}">${e} ${g}</div>
      <div class="small muted">${n2a(r.ok)} صحيحة من ${n2a(r.n)}</div></div>
      <div class="card">${secBars(r.secs)}</div>
      ${r.wrong.length ? `<div class="row center"><button class="btn" id="redo">🔁 راجع أخطاءك بالغناء (${n2a(Math.min(10, r.wrong.length))})</button></div>` : ''}</div>`;
  $app.querySelector('#home').onclick = () => go('home');
  const rd = $app.querySelector('#redo'); if (rd) rd.onclick = () => go('practice', r.wrong.slice(0, 10), 'مراجعة المرحلة');
};

/* ---------- 📅 المراجعة المتباعدة ---------- */
VIEWS.review = async function () {
  const ids = dueWords().slice(0, 20);
  if (!ids.length) return go('home');
  newSession({ kind: 'review', results: {}, sent: { ok: 0, n: 0 } });
  let r;
  try { r = await runQuiz(shuffle(ids).map(wordQ), '📅 مراجعة اليوم'); } catch (e) { if (!(e instanceof Abort)) console.error(e); return; }
  session = null;
  $app.innerHTML = `<div class="top"><h1>📅 انتهت المراجعة</h1><button class="iconbtn" id="home" aria-label="الرئيسية">🏠</button></div>
    <div class="stack"><div class="card stage" style="min-height:0"><div class="bignum">${n2a(r.ok)}/${n2a(r.n)}</div>
    <div class="muted">الكلمات الصحيحة تنتقل لصندوق أبعد (تُراجع بعد أيام أكثر)، والخاطئة ترجع للغد 🧠</div></div>
    <div class="row center">${dueWords().length ? '<button class="btn pink big" id="more">مراجعة المزيد ▶</button>' : ''}
    ${r.wrong.length ? '<button class="btn" id="redo">🔁 غنِّ لي أخطائي</button>' : ''}</div></div>`;
  $app.querySelector('#home').onclick = () => go('home');
  const m = $app.querySelector('#more'); if (m) m.onclick = () => go('review');
  const rd = $app.querySelector('#redo'); if (rd) rd.onclick = () => go('practice', r.wrong.slice(0, 10), 'مراجعة الأخطاء');
};

/* ---------- 🌅 ماراثون: ٦٠٠ كلمة في يوم واحد ---------- */
VIEWS.marathon = function () {
  const d = today(), done = new Set(d.rounds);
  const next = [0, 1, 2, 3, 4, 5].find(b => !done.has(b));
  const total = Object.values(Store.data.words).filter(w => w.m).length;
  $app.innerHTML = `
    <div class="top"><button class="iconbtn" id="back" aria-label="رجوع">→</button><div style="flex:1"><h1>🌅 ماراثون ٦٠٠ كلمة في يوم</h1>
      <div class="muted small">ست جولات × ٣٠ دقيقة، مع اختبار مرحلة كل خمسة دروس، ثم اختبار قدرات نهائي</div></div></div>
    <div class="stack">
      <div class="card"><h3>🤔 هل يمكن إتقان ٦٠٠ كلمة مع جملها في يوم واحد؟</h3>
        <div class="small" style="line-height:1.9">
        <b>المرور عليها كلها واجتياز اختباراتها في يوم واحد: نعم، ممكن</b> لكنه تحدٍّ قاسٍ: ست جولات × ٣٠ دقيقة + اختبارات المراحل + استراحات ≈ <b>٥–٦ ساعات</b> من التركيز.<br>
        <b>لكن «الإتقان» الحقيقي</b> (أن تتذكرها بعد أسبوع) لا يحدث في يوم واحد: الدماغ ينسى معظم ما يتعلمه في جلسة واحدة خلال أيام إن لم يُراجعه.
        الحل هو <b>المراجعة المتباعدة</b>: بعد يوم، ثم ٢، ثم ٤، ثم ٧ أيام. التطبيق يجدول لك ذلك تلقائياً في «📅 مراجعة اليوم».<br>
        <b>خطتي لك:</b> يوم الماراثون للتعرّف والحفظ الأولي ← ثم ١٥–٢٠ دقيقة مراجعة يومياً لأسبوعين ← فتثبت معظم الـ ٦٠٠ كلمة 🎯</div></div>
      <div class="card"><h3>📍 تقدّم اليوم</h3>
        <div class="grid2" style="margin-bottom:10px">
          <div class="stat"><b>${n2a(done.size)}/٦</b><span class="small muted">جولات منجزة اليوم</span></div>
          <div class="stat"><b>${n2a(d.ok)}</b><span class="small muted">إجابة صحيحة اليوم</span></div></div>
        ${[0, 1, 2, 3, 4, 5].map(b => `<div class="row between" style="padding:8px 0;border-bottom:1px solid var(--border)">
          <span>${done.has(b) ? '✅' : b === next ? '▶️' : '⬜'} الجولة ${n2a(b + 1)} · الكلمات ${n2a(b * 100 + 1)}–${n2a(b * 100 + 100)}</span>
          <span class="small muted">${n2a(Store.masteredIn(blockWords(b)))}/١٠٠ متقنة</span></div>`).join('')}
        <div class="row" style="margin-top:12px">${next != null
          ? `<button class="btn big pink" id="go">ابدأ الجولة ${n2a(next + 1)} ▶</button>`
          : '<button class="btn big pink" id="final">🎓 الاختبار النهائي (٦٠٠ كلمة)</button>'}</div>
        ${done.size && next != null ? '<div class="small muted" style="margin-top:8px">☕ نصيحة: خذ استراحة ١٠ دقائق بين الجولات — المشي وشرب الماء يساعدان الذاكرة.</div>' : ''}</div>
      <div class="notice">🧠 إجمالي ما أتقنته: <b>${n2a(total)}</b> من ٦٠٠ · ${levelOf(total)[2]} مستواك: ${levelOf(total)[1]}</div>
    </div>`;
  $app.querySelector('#back').onclick = () => go('home');
  const g = $app.querySelector('#go'); if (g) g.onclick = () => { Store.data.block = next; Store.save(); go('challenge', next); };
  const f = $app.querySelector('#final'); if (f) f.onclick = () => go('examRun', 'all');
};

/* ---------- أغاني Suno: ملفات الأغاني ومزامنة الكلمات ---------- */
const SongFiles = {
  p: null, repo: new Map(),
  open() {
    if (!this.p) this.p = new Promise((res, rej) => {
      const r = indexedDB.open('farsiRhythmSongs', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('songs');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    return this.p;
  },
  async req(mode, fn) {
    const db = await this.open();
    return new Promise((res, rej) => {
      const tx = db.transaction('songs', mode), q = fn(tx.objectStore('songs'));
      tx.oncomplete = () => res(q && q.result); tx.onerror = () => rej(tx.error);
    });
  },
  get(id) { return this.req('readonly', st => st.get(id)).catch(() => null); },
  put(id, blob) { return this.req('readwrite', st => st.put(blob, id)); },
  del(id) { return this.req('readwrite', st => st.delete(id)); },
  /** مصدر الأغنية: ملف أضافه المستخدم على جهازه، أو ملف مرفوع في المستودع songs/<id>.mp3 */
  async source(id) {
    const blob = await this.get(id);
    if (blob) return { url: URL.createObjectURL(blob), local: true };
    if (!this.repo.has(id)) {
      this.repo.set(id, fetch(`songs/${id}.mp3`, { method: 'HEAD' }).then(r => r.ok).catch(() => false));
    }
    return (await this.repo.get(id)) ? { url: `songs/${id}.mp3`, local: false } : null;
  },
};

function sunoLyrics(g) { return g.lines.map(l => (l.section ? (l.i ? '\n' : '') + l.section + '\n' : '') + l.fa).join('\n'); }
async function copyText(text, btn) {
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
    const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch (e2) { /* تجاهل */ } ta.remove();
  }
  const old = btn.textContent; btn.textContent = ok ? '✔ نُسخ!' : '⚠️ انسخ يدوياً من الأسفل'; setTimeout(() => { btn.textContent = old; }, 1600);
}

VIEWS.song = async function (id) {
  const g = SONGS[id], l = LESSONS[g.lesson];
  const syncs = Store.data.songSync || (Store.data.songSync = {});
  let times = syncs[id] || null;
  $app.innerHTML = `
    <div class="top"><button class="iconbtn" id="back" aria-label="رجوع">→</button>
      <div style="flex:1"><div class="small muted">🎤 أغنية الدرس ${n2a(g.lesson + 1)} · ${l.icon} ${esc(l.title)}</div>
      <h1 class="fa">${esc(g.fa)}</h1><div class="muted">${esc(g.ar)}</div></div></div>
    <div class="stack">
      <div class="card" id="player"></div>
      <details class="card" id="suno"><summary style="font-weight:800;cursor:pointer">🎼 اصنع الأغنية في Suno</summary>
        <ol class="small" style="line-height:2;padding-inline-start:20px">
          <li>اضغط «انسخ الكلمات»، ثم افتح Suno واختر <b>Custom</b>.</li>
          <li>الصق في خانة <b>Lyrics</b>، ثم انسخ «الأسلوب» والصقه في <b>Style of Music</b>.</li>
          <li>اضغط <b>Create</b>، اختر النسخة الأجمل، ثم <b>Download → MP3</b> (تُحفظ في تطبيق «الملفات»).</li>
          <li>ارجع هنا واضغط «📂 أضف ملف الأغنية».</li>
        </ol>
        <div class="row"><button class="btn sm" id="cpL">📋 انسخ الكلمات</button><button class="btn sm alt" id="cpS">📋 انسخ الأسلوب</button>
          <a class="btn sm alt" href="https://suno.com/create" target="_blank" rel="noopener" style="text-decoration:none">🔗 افتح Suno</a></div>
        <textarea readonly dir="rtl" style="width:100%;min-height:140px;margin-top:10px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font:inherit;padding:8px">${esc(sunoLyrics(g))}</textarea>
        <textarea readonly dir="ltr" style="width:100%;min-height:60px;margin-top:6px;border-radius:12px;border:1px solid var(--border);background:var(--bg);color:var(--text);font:inherit;font-size:13px;padding:8px">${esc(g.style)}</textarea>
      </details>
      <div class="card"><h3>🧩 كلمات الأغنية الأساسية</h3>
        <div class="chips" style="justify-content:flex-start">${l.words.map(w => `<button class="chip" data-w="${w}" style="border:0">${WORDS[w].icon} ${esc(WORDS[w].fa)} · ${esc(firstMeaning(WORDS[w].ar))}</button>`).join('')}</div>
        <div class="row" style="margin-top:12px"><button class="btn" id="quiz">📝 اختبرني على كلمات الأغنية</button></div></div>
      <div class="card" id="lyrics">${g.lines.map(x => `${x.section ? `<div class="tag" style="margin-top:${x.i ? 14 : 0}px">${esc(x.section.replace(/[\[\]]/g, ''))}</div>` : ''}
        <button class="lyric" data-i="${x.i}"><div class="fa">${markSentence({ fa: x.fa, words: l.words })}</div><div class="muted small">${esc(x.ar)}</div></button>`).join('')}</div>
    </div>`;
  const q = s => $app.querySelector(s);
  q('#back').onclick = () => go('home');
  q('#cpL').onclick = e => copyText(sunoLyrics(g), e.target);
  q('#cpS').onclick = e => copyText(g.style, e.target);
  q('#quiz').onclick = () => go('practice', l.words, g.fa, { lesson: g.lesson });
  $app.querySelectorAll('.chip[data-w]').forEach(b => b.onclick = () => quickSing(wordLines(WORDS[+b.dataset.w], nullUI, true)));

  const src = await SongFiles.source(id);
  if (!src) q('#suno').open = true;
  let audio = null, cur = -1, loop = false;
  const lyricEls = [...$app.querySelectorAll('.lyric')];
  const setCur = i => {
    if (i === cur) return;
    if (lyricEls[cur]) lyricEls[cur].classList.remove('now');
    cur = i;
    if (lyricEls[cur]) { lyricEls[cur].classList.add('now'); lyricEls[cur].scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  };
  const lineAt = t => { if (!times) return -1; let i = -1; times.forEach((s, k) => { if (s <= t) i = k; }); return i; };

  const renderPlayer = () => {
    const p = q('#player');
    if (!src) {
      p.innerHTML = `<h3>🎵 لا يوجد ملف للأغنية بعد</h3><div class="small muted">اصنعها في Suno (الخطوات بالأسفل)، ثم أضف ملف MP3. وحتى ذلك الحين: اضغط أي سطر لتسمع نطقه بصوت طبيعي 👇</div>
        <div class="row" style="margin-top:10px"><label class="btn">📂 أضف ملف الأغنية<input type="file" id="file" accept="audio/*,.mp3,.m4a,.wav" hidden></label></div>`;
    } else {
      p.innerHTML = `<audio id="au" controls playsinline preload="auto" src="${src.url}" style="width:100%"></audio>
        <div class="row" style="margin-top:10px">
          <button class="btn sm" id="sync">⏱️ ${times ? 'أعد مزامنة الكلمات' : 'زامن الكلمات مع الأغنية'}</button>
          <button class="btn sm alt" id="loop" ${times ? '' : 'disabled'}>🔁 كرّر السطر</button>
          <button class="btn sm alt" id="rate">🐢 أبطأ</button>
          <label class="btn sm alt">📂 غيّر الملف<input type="file" id="file" accept="audio/*,.mp3,.m4a,.wav" hidden></label>
        </div>
        <div class="small muted" id="hint" style="margin-top:8px">${times ? 'اضغط أي سطر لتقفز إليه في الأغنية. «كرّر السطر» يعيده حتى تحفظه 🧠' : 'زامن الكلمات مرة واحدة: شغّل الأغنية واضغط الزر عند بداية كل سطر، فيصير لديك كاريوكي 🎤'}</div>
        <div id="syncbox"></div>`;
      audio = songAudio = q('#au');
      audio.ontimeupdate = () => {
        if (!times || q('#syncbox').childElementCount) return;
        const t = audio.currentTime;
        if (loop && cur >= 0 && times[cur + 1] != null && t >= times[cur + 1] - 0.05) { audio.currentTime = times[cur]; return; }
        setCur(lineAt(t));
      };
      q('#loop').onclick = e => { loop = !loop; e.target.classList.toggle('pink', loop); e.target.textContent = loop ? '🔁 يكرّر السطر…' : '🔁 كرّر السطر'; };
      q('#rate').onclick = e => { const slow = audio.playbackRate === 1; audio.playbackRate = slow ? 0.8 : 1; e.target.textContent = slow ? '🐇 السرعة العادية' : '🐢 أبطأ'; };
      q('#sync').onclick = startSync;
    }
    q('#file').onchange = async e => {
      const f = e.target.files[0]; if (!f) return;
      await SongFiles.put(id, f);
      delete syncs[id]; Store.save();
      go('song', id);
    };
  };

  function startSync() {
    const box = q('#syncbox'), marks = [];
    loop = false; setCur(-1);
    box.innerHTML = `<div class="notice" style="margin-top:10px;text-align:center">
      <div class="small">اضغط الزر الكبير عند بداية كل سطر 👇</div>
      <div class="fa" id="nextL" style="font-size:22px;margin:8px 0"></div>
      <button class="btn big pink" id="tap" style="width:100%">👆 بدأ السطر</button>
      <button class="btn sm alt" id="cancel" style="margin-top:8px">إلغاء</button></div>`;
    const show = () => { const n = g.lines[marks.length]; box.querySelector('#nextL').textContent = n ? n.fa : '✔'; };
    show();
    audio.currentTime = 0; audio.playbackRate = 1; audio.play();
    const finish = () => {
      if (marks.length >= 2) { while (marks.length < g.lines.length) marks.push(marks[marks.length - 1] + 3); syncs[id] = marks; times = marks; Store.save(); }
      box.innerHTML = ''; audio.onended = null; renderPlayer();
    };
    box.querySelector('#tap').onclick = () => {
      marks.push(Math.max(0, audio.currentTime - 0.25)); // تعويض زمن ردّ الفعل
      setCur(marks.length - 1); show();
      if (marks.length >= g.lines.length) finish();
    };
    box.querySelector('#cancel').onclick = () => { audio.pause(); box.innerHTML = ''; setCur(-1); };
    audio.onended = finish;
  }

  lyricEls.forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    if (audio && times && !q('#syncbox').childElementCount) { audio.currentTime = times[i]; audio.play(); setCur(i); return; }
    // بلا أغنية: نطق طبيعي للسطر ثم معناه
    Voice.stop(); setCur(i);
    Voice.speak(g.lines[i].fa, { lang: 'fa', rate: 0.95 }).then(() => Store.s.arabic && Voice.speak(g.lines[i].ar, { lang: 'ar' }));
  });
  renderPlayer();
};

document.addEventListener('pointerdown', () => Voice.unlock(), { once: true, capture: true });
VIEWS.home();
