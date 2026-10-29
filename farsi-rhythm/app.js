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
    this.data = Object.assign({ words: {}, challenges: [], block: 0 }, d || {});
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
      this.timer = setInterval(() => this.onBeat(this.beat++), this.spb * 1000);
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
      setTimeout(() => { if (this.timer) this.onBeat(b); }, Math.max(0, (t - ctx.currentTime) * 1000));
      this.next += this.spb; this.beat++;
    }
  }
  stop() { clearInterval(this.timer); this.timer = null; }
}

/* ---------- الصوت (نطق فارسي/عربي) ---------- */
const Voice = {
  list: [], current: null, onlineFailed: { fa: false, ar: false }, player: new Audio(), unlocked: false,
  /** يفتح الصوت على iOS/Safari: يجب أن يُستدعى داخل لمسة المستخدم */
  unlock() {
    if (this.unlocked) return; this.unlocked = true;
    Music.init();
    if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); }
    this.player.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
    this.player.play().catch(() => {});
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
    if (pref === 'online') return 'online';
    if (pref === 'native') return this.native(lang) ? 'native' : 'none';
    return this.native(lang) ? 'native' : (this.onlineFailed[lang] ? 'none' : 'online');
  },
  url(text, lang) {
    return 'https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=' + lang + '&q=' + encodeURIComponent(text.slice(0, 190));
  },
  cache: new Map(),
  preload(text, lang = 'fa') {
    if (this.mode(lang) !== 'online') return;
    const u = this.url(text, lang);
    if (this.cache.has(u)) return;
    const a = new Audio(); a.preload = 'auto'; a.src = u;
    this.cache.set(u, a);
    if (this.cache.size > 80) this.cache.delete(this.cache.keys().next().value);
  },
  stop() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    this.player.pause();
    this.current = null;
  },
  /** ينطق النص ويعيد وعداً ينتهي عند انتهاء النطق. pitch: 0.5–2 */
  speak(text, { lang = 'fa', pitch = 1, rate = 1 } = {}) {
    const mode = this.mode(lang);
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
const tleft = () => session.limit ? session.limit - (Date.now() - session.start) : Infinity;

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
  return lines;
}

/** يشغّل الإيقاع وينطق السطور واحداً تلو الآخر، كل سطر يبدأ على ضربة (align). */
function sing(lines, ui) {
  return new Promise((resolve, reject) => {
    let i = 0, busy = false, restUntil = -1, finished = false;
    const pre = k => { const l = lines[k]; if (l && l.text) Voice.preload(l.text, l.lang); };
    pre(0); pre(1);
    const groove = new Groove(beat => {
      ui.beat(beat);
      if (finished || busy || beat < restUntil) return;
      if (i >= lines.length) { finished = true; groove.stop(); resolve(); return; }
      const l = lines[i];
      if (beat % (l.align || 2)) return;
      i++; pre(i + 1);
      if (l.on) l.on();
      if (l.rest) { restUntil = beat + l.rest; return; }
      busy = true; Music.setDuck(true);
      Voice.speak(l.text, l).then(() => { busy = false; Music.setDuck(false); ui.hl(null); });
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
        <div class="sfa" data-k="sfa">${markSentence(s)}</div><div class="sar" data-k="sar">${esc(s.ar)}</div>
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
function go(view, ...args) { endSession(); Voice.stop(); window.scrollTo(0, 0); VIEWS[view](...args); }

const VIEWS = {
  home() {
    const total = Object.values(Store.data.words).filter(w => w.m).length;
    const best = Store.data.challenges.reduce((m, c) => Math.max(m, c.mastered), 0);
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
        <div class="card hero">
          <h2>🏆 تحدّي ١٠٠ كلمة في ٣٠ دقيقة</h2>
          <div class="muted small">لكل مجموعة من ١٠ كلمات: تسمع الأغنية والإيقاع 🎶 ← تختبر السمع 🎧 ← تقيّم نطقك 🎤. الكلمة تُحسب «متقَنة» عندما تنجح في السمع والنطق.</div>
          <div class="blocks">${blocks}</div>
          <div class="row between"><button class="btn big" id="startCh">ابدأ التحدّي ▶</button>
          <span class="small muted">١٠ دروس · ١٠٠ كلمة · ⏱ ٣٠:٠٠</span></div>
        </div>
        <div class="stats">
          <div class="card stat"><b>${n2a(total)}</b><span class="small muted">كلمة متقَنة من ٦٠٠</span></div>
          <div class="card stat"><b>${n2a(best)}</b><span class="small muted">أفضل نتيجة تحدٍّ</span></div>
          <div class="card stat"><b>${n2a(SENTS.length)}</b><span class="small muted">جملة مُغنّاة</span></div>
        </div>
        <div class="notice">${esc(Voice.statusText())}<br>${Ear.Rec ? '🎤 تقييم النطق بالميكروفون متاح' : '🎤 متصفحك لا يدعم التعرّف على الكلام — سيكون تقييم النطق ذاتياً (استخدم Chrome لتقييم آلي)'}</div>
        <div class="row between"><h2 style="margin:0">📚 الدروس (${n2a(LESSONS.length)})</h2>
          ${weakWords().length ? `<button class="btn sm alt" id="weak">💪 راجع الكلمات الضعيفة (${n2a(Math.min(10, weakWords().length))})</button>` : ''}</div>
        <div class="lessons">${LESSONS.map(l => {
          const m = Store.masteredIn(l.words);
          return `<button class="lesson" data-l="${l.id}"><div class="em">${l.icon}</div>
            <div class="small muted">الدرس ${n2a(l.id + 1)}</div><div class="t">${esc(l.title)}</div>
            <div class="prog"><i style="width:${m * 10}%"></i></div></button>`;
        }).join('')}</div>
        ${historyHtml()}
      </div>`;
    $app.querySelectorAll('.block').forEach(b => b.onclick = () => { Store.data.block = +b.dataset.b; Store.save(); VIEWS.home(); });
    $app.querySelectorAll('.lesson').forEach(b => b.onclick = () => go('lesson', +b.dataset.l));
    $app.querySelector('#startCh').onclick = () => go('challenge', Store.data.block);
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
    $app.querySelector('#quiz').onclick = () => go('practice', l.words, l.title, { lesson: id });
    $app.querySelectorAll('.wcard').forEach(b => b.onclick = () => quickSing([...wordLines(WORDS[+b.dataset.w], nullUI, false)]));
    $app.querySelectorAll('.sent').forEach(b => b.onclick = () => quickSing(sentLines(SENTS[+b.dataset.s], nullUI, false)));
    const p = $app.querySelector('#prev'); if (p) p.onclick = () => go('lesson', id - 1);
    const n = $app.querySelector('#next'); if (n) n.onclick = () => go('lesson', id + 1);
  },

  /** تحدّي ١٠٠ كلمة في ٣٠ دقيقة */
  async challenge(block) {
    const s = newSession({ limit: CHALLENGE_MS, kind: 'challenge', block, results: {}, sent: { ok: 0, n: 0 } });
    const lessonIds = Array.from({ length: BLOCK_SIZE }, (_, k) => block * BLOCK_SIZE + k);
    try {
      await countdown();
      for (let k = 0; k < lessonIds.length; k++) {
        const l = LESSONS[lessonIds[k]];
        const label = `المجموعة ${n2a(k + 1)}/${n2a(lessonIds.length)} · ${l.icon} ${l.title}`;
        await learn(l.words, l.sentences, label, true);
        await test(l.words, l.sentences, label, true);
      }
    } catch (e) {
      if (!(e instanceof Abort)) console.error(e);
      if (!(e instanceof Abort) || e.message !== 'timeup') return; // الخروج اليدوي يعرض النتيجة بنفسه
    }
    finishRun(s, 100);
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
          <div class="big">${n2a(mastered)}<span style="font-size:24px"> / ${n2a(total)}</span></div>
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
          <option value="auto" ${S.voice === 'auto' ? 'selected' : ''}>تلقائي (الجهاز ثم أونلاين)</option>
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
  return `<div class="hud"><button class="iconbtn" id="quit" aria-label="خروج">✕</button>
    <span class="pill">${esc(label)}</span>${session.limit ? `<span class="timer" id="timer">⏱ ${fmtTime(tleft())}</span>` : '<span></span>'}</div>${extra}`;
}
function bindQuit() {
  $app.querySelector('#quit').onclick = () => {
    if (session && session.kind === 'challenge') {
      if (!confirm('إنهاء التحدّي وعرض النتيجة؟')) return;
      const s = session; abortSession('quit'); finishRun(s, 100);
    } else go('home');
  };
}

async function countdown() {
  for (const n of ['٣', '٢', '١', '🎵']) {
    $app.innerHTML = hud('استعد!') + `<div class="card stage"><div class="em" style="font-size:120px">${n}</div><div class="muted">صفّق مع الإيقاع واردد بعد الصوت 👏</div></div>`;
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
  await guard(Promise.race([sing(lines, ui), skipP]));
  if (session.groove) session.groove.stop();
  Music.setDuck(false);
}

// null = اختبار النطق مُعطّل فلا يُحتسب
const speakOk = sc => sc === null || sc === true || (typeof sc === 'number' && sc >= PASS_SCORE);
function wordResult(id) { return session.results[id] || (session.results[id] = { first: false, mastered: false, speak: null, tries: 0 }); }

async function test(ids, sids, label, challenge) {
  const failed = [];
  for (const id of shuffle(ids)) {
    check();
    const r = wordResult(id);
    const okL = await askListen(id, label);
    const sc = await askSpeak(id, label, true);
    const okS = speakOk(sc);
    if (typeof sc === 'number') r.speak = sc;
    r.first = okL && okS; r.mastered = r.first; r.tries = 1;
    record(id, r.mastered);
    if (!r.mastered) failed.push(id);
  }
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
function record(id, ok) {
  const w = Store.w(id);
  if (ok) { w.c++; w.m = 1; } else { w.x++; if (w.c === 0) w.m = 0; }
  Store.save();
}
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
    <div class="fb" id="fb"></div></div>`;
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
      fb.innerHTML = `${s.icon} <span class="fa" style="font-size:20px">${markSentence(s)}</span>`;
      await sleep(ok ? 700 : 1600);
      resolve(ok);
    });
  }));
}

function finishRun(s, total) {
  clearInterval(s.timer);
  Voice.stop(); Ear.stop(); if (s.groove) s.groove.stop();
  if (s.kind === 'challenge') {
    const mastered = Object.values(s.results).filter(r => r.mastered).length;
    Store.data.challenges.unshift({ at: Date.now(), block: s.block, mastered, ms: Date.now() - s.start, timeup: s.cancelled === 'timeup' });
    Store.data.challenges = Store.data.challenges.slice(0, 20);
    Store.save();
  }
  if (session === s) session = null;
  window.scrollTo(0, 0);
  VIEWS.report(s, total);
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

document.addEventListener('pointerdown', () => Voice.unlock(), { once: true, capture: true });
VIEWS.home();
