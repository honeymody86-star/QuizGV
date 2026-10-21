/*
 * Passo a Passo — voice layer.
 *
 * Two providers:
 *   browser  speechSynthesis voices (free, quality depends on the device)
 *   gemini   Google Gemini TTS with a prebuilt voice such as "Puck" (needs the
 *            learner's own API key; audio is cached and prefetched)
 *
 * Every spoken line reports the word being spoken (onWord), so captions and
 * the sentence grid can highlight words karaoke-style.
 */
(function (root) {
  'use strict';
  const synth = root.speechSynthesis || null;
  const Rec = root.SpeechRecognition || root.webkitSpeechRecognition || null;
  const LOCALE = { ar: 'ar-SA', en: 'en-US', it: 'it-IT' };
  // ?fast (development): no voices, near-instant timing — used by the end-to-end test
  const FAST = typeof location !== 'undefined' && /[?&]fast\b/.test(location.search);

  let voices = [];
  const prefs = {};
  const keep = new Set(); // Chrome drops events of garbage-collected utterances
  const listeners = new Set();

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices() || [];
    listeners.forEach((fn) => fn(voices));
  }
  if (synth) {
    loadVoices();
    if ('onvoiceschanged' in synth) synth.onvoiceschanged = loadVoices;
    let tries = 0;
    const iv = setInterval(() => { loadVoices(); if (voices.length || ++tries > 20) clearInterval(iv); }, 250);
  }

  const voicesFor = (lang) => voices.filter((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith(lang));
  function score(v, lang) {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/natural|neural|online/.test(n)) s += 6;
    if (/google/.test(n)) s += 4;
    if (/premium|enhanced|siri/.test(n)) s += 3;
    if ((v.lang || '').replace('_', '-') === LOCALE[lang]) s += 1;
    if (lang === 'ar' && /sa|saudi|hamed|zariyah/i.test(v.lang + v.name)) s += 2;
    return s;
  }
  function voiceFor(lang) {
    const list = voicesFor(lang);
    if (!list.length) return null;
    if (prefs[lang]) { const c = list.find((v) => v.voiceURI === prefs[lang]); if (c) return c; }
    return list.slice().sort((a, b) => score(b, lang) - score(a, lang))[0];
  }

  function sleep(ms, signal) {
    return new Promise((resolve) => {
      if (signal && signal.aborted) return resolve();
      const t = setTimeout(done, ms);
      function done() { clearTimeout(t); if (signal) signal.removeEventListener('abort', done); resolve(); }
      if (signal) signal.addEventListener('abort', done, { once: true });
    });
  }
  const readingTime = (text, rate) => (FAST ? 5 : Math.max(450, (text.length * 64) / (rate || 1)));

  // ---------- Words & karaoke timing ----------
  function wordsOf(text) {
    const out = [];
    const re = /\S+/g;
    let m;
    while ((m = re.exec(text))) out.push({ w: m[0], start: m.index });
    return out;
  }
  const charToWord = (words, ci) => { let i = 0; while (i + 1 < words.length && words[i + 1].start <= ci) i++; return i; };
  // Index of the word reached after a fraction of the audio, weighting words by length
  function fracToWord(words, f) {
    const total = words.reduce((s, w) => s + w.w.length + 1, 0);
    let acc = 0;
    for (let i = 0; i < words.length; i++) { acc += words[i].w.length + 1; if (acc / total >= f) return i; }
    return words.length - 1;
  }
  // Fallback when the engine gives no word boundaries: estimate from elapsed time
  function estimator(words, durationMs, onWord, stopFlag) {
    if (!onWord || !words.length) return () => {};
    const t0 = performance.now();
    let last = -1;
    const iv = setInterval(() => {
      if (stopFlag.boundary) return clearInterval(iv);
      const i = fracToWord(words, Math.min(1, (performance.now() - t0) / durationMs));
      if (i !== last) { last = i; onWord(i); }
    }, 70);
    return () => clearInterval(iv);
  }

  // ---------- Browser provider ----------
  function speakBrowser(text, lang, opts) {
    const { signal, rate = 1, onWord } = opts;
    const words = wordsOf(text);
    const voice = !FAST && synth && voiceFor(lang);
    if (!voice) {
      const stop = estimator(words, readingTime(text, rate), onWord, {});
      if (onWord) onWord(0);
      return sleep(readingTime(text, rate), signal).then(stop);
    }
    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice; u.lang = voice.lang; u.rate = Math.min(2.5, rate);
      keep.add(u);
      const flag = { boundary: false };
      let stopEst = () => {};
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true; keep.delete(u); clearTimeout(watchdog); stopEst();
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve();
      };
      const onAbort = () => { synth.cancel(); finish(); };
      const watchdog = setTimeout(finish, readingTime(text, rate) * 2.2 + 2500);
      u.onstart = () => { if (onWord) onWord(0); stopEst = estimator(words, readingTime(text, rate) * 0.95, onWord, flag); };
      u.onboundary = (e) => { if (!onWord || (e.name && e.name !== 'word')) return; flag.boundary = true; onWord(charToWord(words, e.charIndex)); };
      u.onend = finish; u.onerror = finish;
      if (signal) signal.addEventListener('abort', onAbort, { once: true });
      synth.speak(u);
      if (synth.paused) synth.resume();
    });
  }

  // ---------- Gemini provider (Puck) ----------
  const gem = { on: false, key: '', voice: 'Puck', models: ['gemini-2.5-flash-preview-tts', 'gemini-3.1-flash-tts-preview'], status: '', fails: 0 };
  const cache = new Map(); // prompt -> Promise<{url, duration}>
  const STYLE = {
    ar: 'Say in a warm, upbeat Saudi Arabic dialect, like a friendly teacher, pronouncing any Italian words with native Italian pronunciation: ',
    en: 'Say in a warm, upbeat teacher voice, pronouncing any Italian words with native Italian pronunciation: ',
    it: 'Say clearly and naturally in native Italian: ',
  };

  let idb = null;
  function db() {
    if (idb) return idb;
    idb = new Promise((res) => {
      try {
        const r = indexedDB.open('passo-audio', 1);
        r.onupgradeneeded = () => r.result.createObjectStore('a');
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(null);
      } catch (e) { res(null); }
    });
    return idb;
  }
  async function idbGet(k) { const d = await db(); if (!d) return null; return new Promise((res) => { try { const q = d.transaction('a').objectStore('a').get(k); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch (e) { res(null); } }); }
  async function idbPut(k, v) { const d = await db(); if (!d) return; try { d.transaction('a', 'readwrite').objectStore('a').put(v, k); } catch (e) { /* ignore */ } }

  function pcmToWav(bytes, rate) {
    const h = new ArrayBuffer(44);
    const v = new DataView(h);
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + bytes.length, true); w(8, 'WAVE'); w(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
    w(36, 'data'); v.setUint32(40, bytes.length, true);
    return new Blob([h, bytes], { type: 'audio/wav' });
  }

  async function geminiFetch(prompt) {
    let lastErr;
    for (const model of gem.models) {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': gem.key },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: gem.voice } } } },
        }),
      });
      if (r.status === 404 || r.status === 400) { lastErr = new Error(`${model}: HTTP ${r.status}`); continue; }
      if (!r.ok) throw new Error(`HTTP ${r.status}${r.status === 429 ? ' (quota)' : r.status === 403 ? ' (key)' : ''}`);
      const j = await r.json();
      const part = (((j.candidates || [])[0] || {}).content || { parts: [] }).parts.find((p) => p.inlineData);
      if (!part) throw new Error('no audio');
      const rate = +((part.inlineData.mimeType || '').match(/rate=(\d+)/) || [0, 24000])[1];
      const bin = atob(part.inlineData.data);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      gem.models = [model, ...gem.models.filter((m) => m !== model)];
      return { blob: pcmToWav(bytes, rate), duration: bytes.length / 2 / rate };
    }
    throw lastErr || new Error('no model');
  }

  function geminiAudio(prompt) {
    if (!cache.has(prompt)) {
      const k = gem.voice + '|' + prompt;
      cache.set(prompt, (async () => {
        let rec = await idbGet(k);
        if (!rec) { rec = await geminiFetch(prompt); idbPut(k, rec); }
        return { url: URL.createObjectURL(rec.blob), duration: rec.duration };
      })());
      cache.get(prompt).then(() => { gem.fails = 0; gem.status = 'ok'; }, (e) => {
        cache.delete(prompt);
        gem.status = e.message || 'error';
        if (++gem.fails >= 3) gem.on = false; // give up for this session, use browser voices
      });
    }
    return cache.get(prompt);
  }

  const player = typeof Audio !== 'undefined' ? new Audio() : null;
  if (player) { player.preservesPitch = true; player.mozPreservesPitch = true; player.webkitPreservesPitch = true; }

  async function speakGemini(prompt, words, opts) {
    const { signal, rate = 1, onWord } = opts;
    const a = await geminiAudio(prompt);
    if (signal && signal.aborted) return;
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true; clearInterval(iv); clearTimeout(wd);
        player.onended = null; player.onerror = null;
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve();
      };
      const onAbort = () => { player.pause(); finish(); };
      player.src = a.url;
      player.playbackRate = Math.max(0.5, Math.min(2.5, rate));
      player.onended = finish; player.onerror = finish;
      let last = -1;
      const iv = setInterval(() => {
        if (!onWord || !a.duration) return;
        const i = fracToWord(words, player.currentTime / a.duration);
        if (i !== last) { last = i; onWord(i); }
      }, 60);
      const wd = setTimeout(finish, (a.duration / player.playbackRate) * 1000 + 4000);
      if (signal) signal.addEventListener('abort', onAbort, { once: true });
      if (onWord) onWord(0);
      player.play().catch(finish);
    });
  }

  const useGemini = () => gem.on && gem.key && !FAST && typeof fetch !== 'undefined';

  // ---------- Public speaking API ----------
  // "Hello [[ciao]] friend" → parts with their words and global word offsets
  function parse(line) {
    const parts = [];
    let offset = 0;
    String(line).split(/(\[\[[^\]]+\]\])/).forEach((chunk) => {
      if (!chunk) return;
      const m = chunk.match(/^\[\[([^\]]+)\]\]$/);
      const text = m ? m[1] : chunk;
      const words = wordsOf(text);
      parts.push({ target: !!m, text, words, offset });
      offset += words.length;
    });
    return parts;
  }
  const plain = (line) => parse(line).map((p) => p.text).join('').replace(/\s+/g, ' ').trim();

  /** Speak target-language text. opts: { rate, signal, onWord } */
  async function speak(text, lang, opts) {
    opts = opts || {};
    text = String(text || '').trim();
    if (!text || (opts.signal && opts.signal.aborted)) return;
    if (useGemini()) {
      try { return await speakGemini(STYLE[lang] + text, wordsOf(text), opts); } catch (e) { /* fall back */ }
    }
    return speakBrowser(text, lang, opts);
  }

  /** Speak an instructor line with mixed languages; onWord(globalIndex) */
  async function speakLine(line, cfg, signal, onWord) {
    const parts = parse(line);
    if (useGemini()) {
      try {
        const all = parts.flatMap((p) => p.words);
        return await speakGemini(STYLE[cfg.native] + plain(line), all, { signal, rate: cfg.rateNative, onWord });
      } catch (e) { /* fall back to browser voices */ }
    }
    for (const part of parts) {
      if (signal && signal.aborted) return;
      let text = part.text.trim();
      if (part.target) text = text.replace(/^-/, '');
      if (!/[\p{L}\p{N}]/u.test(text)) continue;
      const lead = part.text.length - part.text.trimStart().length;
      const words = wordsOf(part.text);
      await speakBrowser(text, part.target ? cfg.target : cfg.native, {
        rate: part.target ? cfg.rateTarget : cfg.rateNative, signal,
        onWord: onWord && ((i) => { const w = wordsOf(text)[i]; onWord(part.offset + (w ? charToWord(words, w.start + lead) : 0)); }),
      });
    }
  }

  // Warm the Gemini cache for lines that are coming up
  let queue = [];
  let running = 0;
  function pump() {
    while (running < 2 && queue.length) {
      const p = queue.shift();
      if (cache.has(p)) continue;
      running++;
      geminiAudio(p).catch(() => {}).finally(() => { running--; pump(); });
    }
  }
  function prefetch(items) {
    if (!useGemini()) return;
    items.forEach((it) => {
      const p = it.line != null ? STYLE[it.native] + plain(it.line) : STYLE.it + String(it.target).trim();
      if (!cache.has(p) && !queue.includes(p)) queue.push(p);
    });
    queue = queue.slice(-8);
    pump();
  }

  function cancel() { if (synth) synth.cancel(); if (player) player.pause(); }

  function unlock() {
    try { if (synth) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } } catch (e) { /* ignore */ }
    try { if (player) { player.src = URL.createObjectURL(pcmToWav(new Uint8Array(480), 24000)); player.play().catch(() => {}); } } catch (e) { /* ignore */ }
  }

  function listen(opts) {
    return new Promise((resolve) => {
      if (!Rec) return resolve({ heard: false, unsupported: true, alts: [] });
      const rec = new Rec();
      rec.lang = opts.lang; rec.interimResults = true; rec.maxAlternatives = 4; rec.continuous = false;
      let best = { heard: false, transcript: '', alts: [] };
      let done = false;
      const finish = (extra) => {
        if (done) return;
        done = true; clearTimeout(timer);
        if (opts.signal) opts.signal.removeEventListener('abort', onAbort);
        try { rec.abort(); } catch (e) { /* ignore */ }
        resolve(Object.assign(best, extra));
      };
      const onAbort = () => finish({ aborted: true });
      const timer = setTimeout(() => finish({ timeout: true }), opts.timeout || 7000);
      rec.onresult = (ev) => {
        const res = ev.results[ev.results.length - 1];
        const alts = Array.from(res).map((a) => a.transcript);
        best = { heard: true, transcript: alts[0], alts };
        if (opts.onInterim) opts.onInterim(alts[0], res.isFinal);
        if (res.isFinal) finish({});
      };
      rec.onerror = (ev) => finish({ error: ev.error });
      rec.onend = () => finish({});
      if (opts.signal) opts.signal.addEventListener('abort', onAbort, { once: true });
      try { rec.start(); } catch (e) { finish({ error: 'start' }); }
    });
  }

  function configureGemini(o) {
    Object.assign(gem, { on: !!(o.on && o.key), key: o.key || '', voice: o.voice || 'Puck' });
    if (o.model) gem.models = [o.model, ...gem.models.filter((m) => m !== o.model)];
    gem.fails = 0; gem.status = '';
    cache.clear();
  }
  async function testGemini() {
    try { await geminiFetch(STYLE.ar + 'هلا والله! أنا مدرّبك.'); gem.status = 'ok'; return { ok: true }; } catch (e) { gem.status = e.message; return { ok: false, error: e.message }; }
  }

  root.PassoSpeech = {
    LOCALE, FAST, speak, speakLine, parse, plain, wordsOf, cancel, unlock, listen, sleep, prefetch,
    voicesFor, voiceFor, hasVoice: (lang) => !!(synth && voiceFor(lang)),
    canListen: !!Rec, canSpeak: !!synth,
    setVoice: (lang, uri) => { if (uri) prefs[lang] = uri; else delete prefs[lang]; },
    onVoices: (fn) => { listeners.add(fn); fn(voices); },
    configureGemini, testGemini, gemini: gem,
  };
})(typeof self !== 'undefined' ? self : this);
