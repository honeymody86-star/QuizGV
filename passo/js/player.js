/*
 * Passo a Passo — lesson player.
 * Runs the instructor's script continuously, keeps captions in sync with the
 * voice, waits for the learner ("your turn"), and supports pause / skip / back.
 */
(function (root) {
  'use strict';
  const S = root.PassoSpeech;
  const { esc, captionHtml } = root.PassoStage;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const I = (n, c) => root.PassoIcon(n, c);
  const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];

  // ---------- Sound effects ----------
  let audio;
  function sfx(kind) {
    try {
      audio = audio || new (root.AudioContext || root.webkitAudioContext)();
      const notes = { good: [660, 880], bad: [300, 220], tap: [520], pop: [740] }[kind] || [600];
      const t0 = audio.currentTime;
      notes.forEach((f, i) => {
        const o = audio.createOscillator();
        const g = audio.createGain();
        o.type = kind === 'bad' ? 'triangle' : 'sine';
        o.frequency.value = f;
        const t = t0 + i * 0.11;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(kind === 'tap' ? 0.05 : 0.12, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
        o.connect(g).connect(audio.destination);
        o.start(t);
        o.stop(t + 0.18);
      });
    } catch (e) { /* no audio */ }
  }

  // ---------- Runner ----------
  class Runner {
    constructor(steps, ctx, hooks) {
      Object.assign(this, { steps, ctx, hooks, i: 0, ac: null, playing: false, token: 0 });
    }

    async play() {
      if (this.playing) return;
      this.playing = true;
      const my = ++this.token;
      this.hooks.state(true);
      while (this.i < this.steps.length) {
        const ac = new AbortController();
        this.ac = ac;
        this.hooks.progress(this.i, this.steps.length);
        if (this.hooks.ahead) this.hooks.ahead(this.steps.slice(this.i, this.i + 6));
        try { await this.steps[this.i].run(this.ctx, ac.signal); } catch (e) { console.error(e); }
        if (ac.signal.aborted || my !== this.token) return;
        this.i++;
      }
      this.playing = false;
      this.hooks.progress(this.i, this.steps.length);
      this.hooks.state(false);
      this.hooks.done();
    }

    stop() {
      this.token++;
      this.playing = false;
      if (this.ac) this.ac.abort();
      S.cancel();
      this.ctx.endTalking();
      this.hooks.state(false);
    }

    toggle() { if (this.playing) this.stop(); else this.resume(); }

    resume() { if (this.i >= this.steps.length) return; this.restore(this.i); this.play(); }

    jump(dir) {
      this.stop();
      let j = this.i + dir;
      while (j > 0 && j < this.steps.length && !this.steps[j].beat) j += dir;
      this.i = Math.max(0, Math.min(this.steps.length - 1, j));
      this.restore(this.i);
      this.play();
    }

    // Rebuild the screen as it should look right before step i
    restore(i) {
      let cp = i;
      while (cp > 0 && !this.steps[cp].checkpoint) cp--;
      for (let j = cp; j < i; j++) if (this.steps[j].apply) this.steps[j].apply(this.ctx);
      const st = this.ctx.stage;
      st.focusRow(null); st.focusCell(null); st.cover(false);
    }
  }

  // ---------- Player ----------
  function createPlayer(el, opts) {
    const { lang, settings, t, N, pack, onExit, onDone, onWeak, onSettings } = opts;
    const onSpeed = opts.onSpeed || (() => {});
    el.innerHTML = `
      <header class="p-top">
        <button class="icon-btn" data-act="exit" aria-label="exit">${I('close')}</button>
        <div class="p-title"><b dir="auto"></b><div class="progress"><i></i></div></div>
        <button class="icon-btn" data-act="settings" aria-label="settings">${I('gear')}</button>
      </header>
      <section class="instructor">
        <div class="avatar" aria-hidden="true">
          <svg viewBox="0 0 64 64"><defs><linearGradient id="tri" x1="0" x2="1"><stop offset="0" stop-color="#16a34a"/><stop offset=".5" stop-color="#f8fafc"/><stop offset="1" stop-color="#dc2626"/></linearGradient></defs>
          <circle cx="32" cy="32" r="31" fill="url(#tri)"/><circle cx="32" cy="32" r="28" class="bgc"/>
          <path d="M14 58c2-10 9-14 18-14s16 4 18 14z" class="shirt"/><path d="M27 44l5 6 5-6" class="collar"/>
          <circle cx="32" cy="29" r="13" class="face"/><path d="M19 27c0-9 6-14 13-14s13 5 13 14c-3-5-8-7-13-7s-10 2-13 7z" class="hair"/>
          <circle cx="27" cy="29" r="1.8" class="eye"/><circle cx="37" cy="29" r="1.8" class="eye"/>
          <path d="M24.5 25.5q2.5-1.5 5 0M34.5 25.5q2.5-1.5 5 0" class="brow"/>
          <ellipse cx="32" cy="35.5" rx="3.6" ry="1.6" class="mouth"/></svg>
          <span class="flag">${esc(pack.lex.flag)}</span>
        </div>
        <div class="caption" aria-live="polite" dir="auto"></div>
      </section>
      <main class="stage"></main>
      <div class="turn hidden" role="dialog">
        <div class="turn-ring"><svg viewBox="0 0 44 44"><circle cx="22" cy="22" r="20"/></svg><span class="turn-ic"></span></div>
        <div class="turn-body"><b class="turn-title"></b><div class="turn-hint" dir="auto"></div><div class="turn-heard" dir="ltr"></div></div>
        <div class="turn-actions"><button class="btn small ok" data-turn="ok"></button><button class="btn small ghost" data-turn="skip"></button></div>
      </div>
      <footer class="p-controls">
        <button class="ctl speed" data-act="speed" aria-label="${esc(t.speed)}" title="${esc(t.speed)}"><b></b><small>${I('gauge')}</small></button>
        <button class="ctl" data-act="prev" aria-label="previous">${I('prev', 'flip')}</button>
        <button class="ctl play" data-act="toggle" aria-label="play / pause">${I('pause')}</button>
        <button class="ctl" data-act="next" aria-label="next">${I('next', 'flip')}</button>
        <button class="ctl" data-act="replay" aria-label="replay">${I('replay')}</button>
      </footer>
      <div class="paused-note hidden"></div>`;

    const stage = new root.PassoStage.Stage($('.stage', el));
    const caption = $('.caption', el);
    const avatar = $('.avatar', el);
    const turnEl = $('.turn', el);
    let micBlocked = false;

    const setCaption = (html, isTarget) => { caption.innerHTML = html; caption.classList.toggle('target', !!isTarget); };
    const talking = (on) => avatar.classList.toggle('talking', on);

    const speed = () => settings.speed || 1;
    // Karaoke in the caption: words before i are "sung", word i is "now"
    const singCaption = (i) => {
      caption.querySelectorAll('.cw').forEach((w) => {
        const k = +w.dataset.w;
        w.classList.toggle('sung', k < i);
        w.classList.toggle('now', k === i);
      });
    };
    // Which grid token holds the i-th word of a row's full sentence
    const wordToToken = (row) => row.tokens.flatMap((tok, k) => tok.text.split(/\s+/).map(() => k));

    const ctx = {
      lang, pack, settings, t, N, stage, sfx,
      pause: (ms, sig) => S.sleep(ms / speed(), sig),
      say: async (line, sig) => {
        if (!line || (sig && sig.aborted)) return;
        setCaption(captionHtml(line));
        talking(true);
        await S.speakLine(line, { native: lang, target: 'it', rateNative: settings.rate * speed(), rateTarget: settings.rateIt * speed() }, sig, singCaption);
        singCaption(1e9);
        talking(false);
      },
      // ref = { r, row } to light up the grid tokens of that row while speaking
      speakTarget: async (text, sig, mul, ref) => {
        if (sig && sig.aborted) return;
        setCaption(`<span class="it big" dir="ltr">${captionHtml(text)}</span>`, true);
        const map = ref && ref.row ? wordToToken(ref.row) : null;
        talking(true);
        await S.speak(text, 'it', {
          rate: settings.rateIt * (mul || 1) * speed(), signal: sig,
          onWord: (i) => { singCaption(i); if (map) stage.karaoke(ref.r, map[Math.min(i, map.length - 1)]); },
        });
        singCaption(1e9);
        if (map) stage.karaoke(null);
        talking(false);
      },
      endTalking: () => talking(false),
      micOn: () => settings.mic && S.canListen && !micBlocked,
      turn: (expected, sig, o) => yourTurn(expected, sig, o || {}),
      markWeak: (id) => onWeak(id, false),
      result: { correct: 0, total: 0 },
      recordQuiz: (key, state, final) => {
        state.wrong.forEach((id) => onWeak(id, false));
        if (final) ctx.result = { correct: state.correct, total: state.total };
      },
    };

    // "Your turn": listen with the microphone, or let the learner confirm by tapping.
    function yourTurn(expected, sig, o) {
      const words = expected.split(' ').length;
      const wait = S.FAST ? 30 : ((2200 + 450 * words) * settings.wait) / Math.sqrt(speed());
      const useMic = ctx.micOn();
      $('.turn-title', turnEl).textContent = useMic ? t.listening : t.yourTurn;
      $('.turn-hint', turnEl).textContent = o.hint || '';
      $('.turn-heard', turnEl).textContent = '';
      $('.turn-ic', turnEl).innerHTML = I(useMic ? 'mic' : 'speak');
      $('[data-turn="ok"]', turnEl).textContent = t.iSaidIt;
      $('[data-turn="ok"]', turnEl).hidden = useMic;
      $('[data-turn="skip"]', turnEl).textContent = t.showAnswer;
      turnEl.style.setProperty('--wait', `${(useMic ? wait + 2500 : wait) / 1000}s`);
      turnEl.classList.remove('hidden', 'go', 'good', 'bad');
      void turnEl.offsetWidth; // restart the ring animation
      turnEl.classList.add('go');
      if (useMic) turnEl.classList.add('mic');
      else turnEl.classList.remove('mic');

      return new Promise((resolve) => {
        const local = new AbortController();
        let settled = false;
        const finish = (res) => {
          if (settled) return;
          settled = true;
          local.abort();
          sig.removeEventListener('abort', onAbort);
          turnEl.querySelectorAll('[data-turn]').forEach((b) => { b.onclick = null; });
          turnEl.classList.add(res.ok ? 'good' : res.heard ? 'bad' : 'none');
          setTimeout(() => turnEl.classList.add('hidden'), res.ok || res.heard ? 500 : 0);
          resolve(res);
        };
        const onAbort = () => finish({ ok: false, heard: false, aborted: true });
        sig.addEventListener('abort', onAbort, { once: true });
        $('[data-turn="ok"]', turnEl).onclick = () => finish({ ok: true, heard: false, self: true });
        $('[data-turn="skip"]', turnEl).onclick = () => finish({ ok: false, heard: false, skipped: true });

        if (useMic) {
          S.listen({
            lang: S.LOCALE.it, timeout: wait + 2500, signal: local.signal,
            onInterim: (txt) => { $('.turn-heard', turnEl).textContent = txt; },
          }).then((r) => {
            if (settled) return;
            if (r.error === 'not-allowed' || r.error === 'service-not-allowed' || r.unsupported) {
              // Microphone refused: continue this turn (and the rest) in tap-to-confirm mode
              micBlocked = true;
              turnEl.classList.remove('mic');
              $('.turn-title', turnEl).textContent = t.yourTurn;
              $('.turn-ic', turnEl).innerHTML = I('speak');
              $('[data-turn="ok"]', turnEl).hidden = false;
              return S.sleep(wait, sig).then(() => finish({ ok: false, heard: false, timeout: true }));
            }
            if (!r.heard) return finish({ ok: false, heard: false });
            const j = root.PassoMatch.judge(expected, r.alts);
            if (j.ok) sfx('good');
            finish({ ok: j.ok, heard: true, transcript: r.transcript });
          });
        } else {
          S.sleep(wait, local.signal).then(() => finish({ ok: false, heard: false, timeout: true }));
        }
      });
    }

    let runner = null;
    const progressBar = $('.progress i', el);
    const playBtn = $('[data-act="toggle"]', el);
    const pausedNote = $('.paused-note', el);
    pausedNote.textContent = t.paused;
    const speedBtn = $('[data-act="speed"] b', el);
    const showSpeed = () => { speedBtn.textContent = `${speed()}×`; };
    showSpeed();

    function load(lesson, built) {
      $('.p-title b', el).textContent = lesson.title ? lesson.title[lang] : t.reviewTitle;
      runner = new Runner(built.steps, ctx, {
        progress: (i, n) => { progressBar.style.width = `${Math.round((i / n) * 100)}%`; },
        state: (playing) => {
          playBtn.innerHTML = I(playing ? 'pause' : 'play');
          pausedNote.classList.toggle('hidden', playing || !runner || runner.i >= runner.steps.length);
          if (!playing) turnEl.classList.add('hidden');
        },
        done: () => onDone(ctx.result),
        ahead: (steps) => S.prefetch(steps.flatMap((st) => st.pre || (st.line ? [{ line: st.line, native: lang }] : []))),
      });
      runner.play();
    }

    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      if (!b || !runner) return;
      const a = b.dataset.act;
      if (a === 'toggle') runner.toggle();
      else if (a === 'next') runner.jump(1);
      else if (a === 'prev') runner.jump(-1);
      else if (a === 'replay') { runner.stop(); runner.resume(); }
      else if (a === 'speed') {
        settings.speed = SPEEDS[(SPEEDS.indexOf(speed()) + 1) % SPEEDS.length];
        showSpeed();
        onSpeed();
      }
      else if (a === 'settings') { runner.stop(); onSettings(); }
      else if (a === 'exit') { runner.stop(); onExit(); }
    });

    const onKey = (e) => {
      if (!runner || !el.isConnected || el.hidden || e.target.closest('input,select,textarea')) return;
      if (e.code === 'Space') { e.preventDefault(); runner.toggle(); }
      else if (e.key === 'ArrowRight') runner.jump(document.dir === 'rtl' ? -1 : 1);
      else if (e.key === 'ArrowLeft') runner.jump(document.dir === 'rtl' ? 1 : -1);
    };
    document.addEventListener('keydown', onKey);

    return {
      load,
      stop: () => runner && runner.stop(),
      resume: () => runner && runner.resume(),
      destroy: () => { if (runner) runner.stop(); document.removeEventListener('keydown', onKey); },
    };
  }

  root.PassoPlayer = { createPlayer, Runner, sfx };
})(typeof self !== 'undefined' ? self : this);
