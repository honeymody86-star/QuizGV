/*
 * Passo a Passo — voice layer.
 * speak(): text-to-speech per language, cancellable with an AbortSignal.
 *          When the browser has no voice for a language, it waits a natural
 *          reading time instead so the lesson keeps its rhythm.
 * listen(): speech recognition for the learner's answers.
 */
(function (root) {
  'use strict';
  const synth = root.speechSynthesis || null;
  const Rec = root.SpeechRecognition || root.webkitSpeechRecognition || null;
  const LOCALE = { ar: 'ar-SA', en: 'en-US', it: 'it-IT' };
  // ?fast (development): no voices, near-instant timing — used by the end-to-end test
  const FAST = typeof location !== 'undefined' && /[?&]fast\b/.test(location.search);

  let voices = [];
  const prefs = {}; // lang -> voiceURI chosen by the user
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
    // Some browsers never fire voiceschanged: poll briefly.
    let tries = 0;
    const iv = setInterval(() => { loadVoices(); if (voices.length || ++tries > 20) clearInterval(iv); }, 250);
  }

  function voicesFor(lang) {
    return voices.filter((v) => (v.lang || '').toLowerCase().replace('_', '-').startsWith(lang));
  }

  function score(v, lang) {
    const n = v.name.toLowerCase();
    let s = 0;
    if (/natural|neural|online/.test(n)) s += 6;
    if (/google/.test(n)) s += 4;
    if (/premium|enhanced|siri/.test(n)) s += 3;
    if ((v.lang || '').replace('_', '-') === LOCALE[lang]) s += 1;
    return s;
  }

  function voiceFor(lang) {
    const list = voicesFor(lang);
    if (!list.length) return null;
    if (prefs[lang]) {
      const chosen = list.find((v) => v.voiceURI === prefs[lang]);
      if (chosen) return chosen;
    }
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

  const readingTime = (text, rate) => (FAST ? 5 : Math.max(500, (text.length * 62) / (rate || 1)));

  function speak(text, lang, opts) {
    opts = opts || {};
    const signal = opts.signal;
    const rate = opts.rate || 1;
    text = String(text || '').trim();
    if (!text || (signal && signal.aborted)) return Promise.resolve();
    const voice = !FAST && synth && voiceFor(lang);
    if (!voice) return sleep(readingTime(text, rate), signal);

    return new Promise((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.voice = voice;
      u.lang = voice.lang;
      u.rate = rate;
      u.pitch = opts.pitch || 1;
      keep.add(u);
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        keep.delete(u);
        clearTimeout(watchdog);
        if (signal) signal.removeEventListener('abort', onAbort);
        resolve();
      };
      const onAbort = () => { synth.cancel(); finish(); };
      // Safety net: some engines never fire "end".
      const watchdog = setTimeout(finish, readingTime(text, rate) * 2.2 + 2500);
      u.onend = finish;
      u.onerror = finish;
      if (signal) signal.addEventListener('abort', onAbort, { once: true });
      if (opts.onstart) u.onstart = opts.onstart;
      synth.speak(u);
      if (synth.paused) synth.resume();
    });
  }

  // "Hello [[ciao]] friend" → [{lang:'native', text:'Hello'}, {lang:'target', text:'ciao'}, …]
  function parse(line) {
    const parts = [];
    String(line).split(/(\[\[[^\]]+\]\])/).forEach((chunk) => {
      if (!chunk) return;
      const m = chunk.match(/^\[\[([^\]]+)\]\]$/);
      parts.push(m ? { target: true, text: m[1] } : { target: false, text: chunk });
    });
    return parts;
  }

  async function speakLine(line, cfg, signal) {
    for (const part of parse(line)) {
      if (signal && signal.aborted) return;
      let text = part.text.trim();
      if (part.target) text = text.replace(/^-/, '');
      if (!/[\p{L}\p{N}]/u.test(text)) continue;
      await speak(text, part.target ? cfg.target : cfg.native, {
        rate: part.target ? cfg.rateTarget : cfg.rateNative, signal,
      });
    }
  }

  function cancel() { if (synth) synth.cancel(); }

  // Must be called from a user gesture once (iOS / Safari autoplay rules).
  function unlock() {
    if (!synth) return;
    try {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      synth.speak(u);
    } catch (e) { /* ignore */ }
  }

  /**
   * listen({ lang:'it-IT', timeout, signal, onInterim }) → { heard, transcript, alts }
   */
  function listen(opts) {
    return new Promise((resolve) => {
      if (!Rec) return resolve({ heard: false, unsupported: true, alts: [] });
      const rec = new Rec();
      rec.lang = opts.lang;
      rec.interimResults = true;
      rec.maxAlternatives = 4;
      rec.continuous = false;
      let best = { heard: false, transcript: '', alts: [] };
      let done = false;
      const finish = (extra) => {
        if (done) return;
        done = true;
        clearTimeout(timer);
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

  root.PassoSpeech = {
    LOCALE, FAST, speak, speakLine, parse, cancel, unlock, listen, sleep,
    voicesFor, voiceFor, hasVoice: (lang) => !!(synth && voiceFor(lang)),
    canListen: !!Rec, canSpeak: !!synth,
    setVoice: (lang, uri) => { if (uri) prefs[lang] = uri; else delete prefs[lang]; },
    onVoices: (fn) => { listeners.add(fn); fn(voices); },
  };
})(typeof self !== 'undefined' ? self : this);
