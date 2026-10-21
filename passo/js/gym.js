/*
 * Passo a Passo — training gym.
 * Short, timed games that push sentence production until it becomes automatic:
 *   sprint  meaning → Italian sentence, against the clock (production speed)
 *   radar   Italian sentence → which tense (recognition reflex)
 *   chunk   build the sentence from its chunks as fast as possible ("one word")
 *   flash   the sentence flashes, then rebuild it from memory (focus)
 *   scenes  "Alone in Italy": real situations, Italian only, a ticking clock
 */
(function (root) {
  'use strict';
  const S = root.PassoSpeech;
  const { esc } = root.PassoStage;
  const I = (n, c) => root.PassoIcon(n, c);
  const $ = (sel, el) => (el || document).querySelector(sel);
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = (a) => Array.from(new Set(a));
  const stripEnd = (s) => s.replace(/[.?!]$/, '');
  const now = () => performance.now();

  const GAMES = [
    { id: 'sprint', icon: 'bolt', hue: 'amber', title: { ar: 'سباق الأزمنة', en: 'Tense sprint' },
      desc: { ar: 'تشوف المعنى والزمن، تختار الجملة الإيطالية قبل ما يخلص الوقت. كل ما زادت السلسلة صار أسرع.', en: 'See the meaning and the tense, pick the Italian sentence before time runs out. The longer your combo, the faster it gets.' }, unit: 'pts' },
    { id: 'radar', icon: 'radar', hue: 'blue', title: { ar: 'رادار الأزمنة', en: 'Tense radar' },
      desc: { ar: 'جملة إيطالية تطلع، وأنت تحدد زمنها بلمحة. يدرّب أذنك وعينك على الأزمنة.', en: 'An Italian sentence appears — name its tense at a glance. Trains instant tense recognition.' }, unit: 'pts' },
    { id: 'chunk', icon: 'layers', hue: 'green', title: { ar: 'مكبس الجمل', en: 'Chunk press' },
      desc: { ar: 'ركّب الجملة من قطعها بأسرع وقت. الهدف: أقل من ٣ ثواني، كأن الجملة كلمة وحدة.', en: 'Snap the sentence together from its chunks. Target: under 3 seconds, as if it were one word.' }, unit: 's' },
    { id: 'flash', icon: 'eye', hue: 'violet', title: { ar: 'ومضة', en: 'Flash' },
      desc: { ar: 'الجملة تظهر ثانية وتختفي، وأنت تركّبها من ذاكرتك. تطول الجمل كل ما نجحت.', en: 'The sentence flashes and vanishes — rebuild it from memory. Sentences grow as you succeed.' }, unit: 'pts' },
    { id: 'scenes', icon: 'plane', hue: 'rose', title: { ar: 'وحيد في إيطاليا', en: 'Alone in Italy' },
      desc: { ar: 'مواقف حقيقية: مقهى، قطار، فندق، مطعم. الإيطالي بس، والوقت يمشي. تتصرّف ولا تضيع؟', en: 'Real situations: café, train, hotel, restaurant. Italian only, the clock is ticking. Will you cope?' }, unit: 'pts' },
  ];

  // Same sentence with the verb in another person — a tempting wrong answer
  function wrongPerson(pack, item) {
    const vt = item.row.tokens.find((t) => t.conj);
    if (!vt) return null;
    const p = [0, 1, 2, 3, 4, 5].filter((x) => x !== vt.person)[Math.floor(Math.random() * 5)];
    try {
      const f = pack.conj.conjugate(vt.conj.inf, vt.tense, p, 'm', { mid: vt.conj.mid }).text;
      if (f === vt.text) return null;
      const words = item.row.tokens.map((t, i) => (i === vt.seg ? f : t.text) + t.post);
      words[0] = root.PassoModel.cap(words[0]);
      return words.join(' ') + (item.sent.src.end || '.');
    } catch (e) { return null; }
  }

  function createGym(el, o) {
    const { lang, t, pack } = o;
    let ac = null;
    let ttsAc = null;

    const say = (text, mul) => {
      if (ttsAc) ttsAc.abort();
      ttsAc = new AbortController();
      return S.speak(text, 'it', { rate: o.settings.rateIt * (mul || 1) * (o.settings.speed || 1), signal: ttsAc.signal });
    };
    const stopAll = () => { if (ac) ac.abort(); if (ttsAc) ttsAc.abort(); S.cancel(); };

    function shell(game, extra) {
      el.innerHTML = `
        <div class="gym-shell hue-${game.hue}">
          <header class="g-top">
            <button class="icon-btn" data-g="exit" aria-label="exit">${I('close')}</button>
            <div class="g-title">${I(game.icon)}<b>${esc(game.title[lang])}</b></div>
            <div class="g-score"><small>${esc(t.gScore)}</small><b id="g-score">0</b></div>
          </header>
          <div class="g-bar"><i id="g-time"></i></div>
          <div class="g-meta">${extra || ''}</div>
          <main class="g-arena" id="g-arena"></main>
        </div>`;
      $('[data-g="exit"]', el).onclick = () => { stopAll(); o.onExit(); };
      return $('#g-arena', el);
    }

    async function countdown(arena, sig) {
      for (const n of ['3', '2', '1', t.go]) {
        if (sig.aborted) return;
        arena.innerHTML = `<div class="count3d"><span>${esc(n)}</span></div>`;
        o.sfx(n === t.go ? 'good' : 'tap');
        await S.sleep(S.FAST ? 5 : 650, sig);
      }
    }

    // Generic choice question, resolves { ok, ms } or null on timeout
    function choose(arena, html, options, limitMs, sig, onTick) {
      return new Promise((resolve) => {
        arena.innerHTML = html + `<div class="g-choices">${options.map((op, i) => `<button class="g-choice ${op.cls || ''}" data-i="${i}" dir="auto">${op.html}</button>`).join('')}</div>`;
        const t0 = now();
        let done = false;
        const finish = (res) => { if (done) return; done = true; clearInterval(iv); resolve(res); };
        const iv = setInterval(() => {
          const left = 1 - (now() - t0) / limitMs;
          if (onTick) onTick(Math.max(0, left));
          if (left <= 0) finish(null);
          if (sig.aborted) finish(null);
        }, 50);
        arena.querySelectorAll('.g-choice').forEach((b) => b.addEventListener('click', () => {
          if (done) return;
          const op = options[+b.dataset.i];
          b.classList.add(op.ok ? 'right' : 'bad');
          if (!op.ok) arena.querySelectorAll('.g-choice').forEach((x) => { if (options[+x.dataset.i].ok) x.classList.add('right'); });
          finish({ ok: op.ok, ms: now() - t0 });
        }));
      });
    }

    function setScore(v) { const s = $('#g-score', el); if (s) { s.textContent = v; s.classList.remove('bump'); void s.offsetWidth; s.classList.add('bump'); } }
    function setTime(f) { const b = $('#g-time', el); if (b) b.style.transform = `scaleX(${Math.max(0, f)})`; }
    function setMeta(html) { const m = $('.g-meta', el); if (m) m.innerHTML = html; }

    // ---------- Sprint ----------
    async function sprint(game, sig) {
      const pool = o.items();
      const arena = shell(game);
      await countdown(arena, sig);
      const TOTAL = S.FAST ? 1500 : 60000;
      const end = now() + TOTAL;
      let score = 0, combo = 0, best = 0, right = 0, asked = 0;
      const timer = setInterval(() => setTime((end - now()) / TOTAL), 100);
      while (now() < end && !sig.aborted) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        const row = item.model.rows[item.r];
        const opts = uniq([item.row.full, ...item.sent.rows.filter((_, i) => i !== item.r).map((r) => r.full), wrongPerson(pack, item)].filter(Boolean));
        const options = shuffle(opts.slice(0, 4)).map((s) => ({ html: esc(s), ok: s === item.row.full }));
        const limit = Math.max(2600, 7500 - combo * 450) / (o.settings.speed || 1);
        setMeta(`<span class="combo ${combo >= 3 ? 'hot' : ''}">${I('flame')} ${esc(t.gCombo)} ×${combo}</span>`);
        const html = `<div class="g-card flip-in"><span class="tense-tag t-${row.time}">${esc(row.icon)} ${esc(row.label[lang])}</span><div class="g-gloss" dir="auto">${esc(item.row.gloss[lang])}</div><div class="q-timer"><i></i></div></div>`;
        asked++;
        const res = await choose(arena, html, options, limit, sig, (f) => { const q = $('.q-timer i', arena); if (q) q.style.transform = `scaleX(${f})`; });
        if (sig.aborted) break;
        if (res && res.ok) {
          combo++; right++; best = Math.max(best, combo);
          score += 10 * (1 + Math.floor(combo / 3)) + Math.max(0, Math.round((limit - res.ms) / 200));
          o.sfx('good');
          say(item.row.full, 1.1);
        } else {
          combo = 0;
          o.sfx('bad');
          if (!res) arena.querySelectorAll('.g-choice').forEach((x, i) => { if (options[i].ok) x.classList.add('right'); });
        }
        setScore(score);
        await S.sleep(S.FAST ? 5 : res && res.ok ? 380 : 900, sig);
      }
      clearInterval(timer);
      return { score, stats: [[t.gAcc, `${asked ? Math.round((right / asked) * 100) : 0}%`], [t.gCombo, `×${best}`], ['✓', `${right}/${asked}`]] };
    }

    // ---------- Radar ----------
    async function radar(game, sig) {
      const pool = o.items().filter((it) => it.model.rows.length > 1);
      const arena = shell(game);
      await countdown(arena, sig);
      const TOTAL = S.FAST ? 1500 : 45000;
      const end = now() + TOTAL;
      let score = 0, combo = 0, right = 0, asked = 0, fastest = Infinity;
      const timer = setInterval(() => setTime((end - now()) / TOTAL), 100);
      while (now() < end && !sig.aborted) {
        const item = pool[Math.floor(Math.random() * pool.length)];
        const rows = item.model.rows;
        const options = rows.map((r, i) => ({ html: `<span class="dot t-${r.time}"></span>${esc(r.label[lang])}<small dir="ltr">${esc(r.it)}</small>`, ok: i === item.r, cls: `t-${r.time}` }));
        const limit = Math.max(1600, 4200 - combo * 200) / (o.settings.speed || 1);
        setMeta(`<span class="combo ${combo >= 3 ? 'hot' : ''}">${I('flame')} ${esc(t.gCombo)} ×${combo}</span>`);
        asked++;
        const res = await choose(arena, `<div class="g-card zoom-in"><div class="g-it" dir="ltr">${esc(item.row.full)}</div><div class="q-timer"><i></i></div></div>`, options, limit, sig,
          (f) => { const q = $('.q-timer i', arena); if (q) q.style.transform = `scaleX(${f})`; });
        if (sig.aborted) break;
        if (res && res.ok) {
          combo++; right++; fastest = Math.min(fastest, res.ms);
          score += 10 + Math.max(0, Math.round((limit - res.ms) / 100)) + combo * 2;
          o.sfx('good');
        } else { combo = 0; o.sfx('bad'); }
        setScore(score);
        await S.sleep(S.FAST ? 5 : res && res.ok ? 250 : 800, sig);
      }
      clearInterval(timer);
      return { score, stats: [[t.gAcc, `${asked ? Math.round((right / asked) * 100) : 0}%`], ['⚡', fastest < Infinity ? `${(fastest / 1000).toFixed(2)}${t.gSec}` : '—'], ['✓', `${right}/${asked}`]] };
    }

    // Tap-tiles builder used by chunk & flash. Resolves { ok, ms, mistakes }
    function buildTiles(arena, head, pieces, extra, sig, perMistake) {
      return new Promise((resolve) => {
        const tiles = shuffle([...pieces.map((p, i) => ({ p, i })), ...extra.map((p) => ({ p, i: -1 }))]);
        arena.innerHTML = `${head}<div class="g-line" dir="ltr"></div><div class="g-tiles" dir="ltr">${tiles.map((x, k) => `<button class="g-tile r-${x.role || 'x'}" data-k="${k}">${esc(x.p.text || x.p)}</button>`).join('')}</div>`;
        const line = $('.g-line', arena);
        const t0 = now();
        let next = 0, mistakes = 0, done = false;
        arena.querySelectorAll('.g-tile').forEach((b) => {
          const x = tiles[+b.dataset.k];
          if (x.p.role) b.classList.add('r-' + x.p.role);
          b.addEventListener('click', () => {
            if (done || sig.aborted) return;
            const want = pieces[next];
            const same = (x.p.text || x.p) === (want.text || want);
            if (same) {
              line.appendChild(b); b.disabled = true; next++; o.sfx('tap');
              if (next === pieces.length) { done = true; resolve({ ok: mistakes === 0, ms: now() - t0 + mistakes * (perMistake || 0), mistakes }); }
            } else {
              mistakes++; b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); o.sfx('bad');
            }
          });
        });
        sig.addEventListener('abort', () => { if (!done) { done = true; resolve(null); } }, { once: true });
      });
    }

    // ---------- Chunk press ----------
    async function chunk(game, sig) {
      const pool = shuffle(o.items());
      const arena = shell(game);
      await countdown(arena, sig);
      const ROUNDS = S.FAST ? 2 : 8;
      const times = [];
      let score = 0, clean = 0;
      for (let k = 0; k < ROUNDS && !sig.aborted; k++) {
        const item = pool[k % pool.length];
        setTime(1 - k / ROUNDS);
        setMeta(`<span class="combo">${k + 1} / ${ROUNDS}</span>${times.length ? `<span class="combo">${I('timer')} ${(times[times.length - 1] / 1000).toFixed(1)}${t.gSec}</span>` : ''}`);
        const pieces = item.row.tokens.map((tok, i) => ({ text: (i === 0 ? root.PassoModel.cap(tok.text) : tok.text) + tok.post, role: tok.role }));
        const others = item.sent.rows.filter((_, i) => i !== item.r).flatMap((r) => r.tokens).map((tok) => ({ text: tok.text + tok.post, role: tok.role }));
        const extra = shuffle(others.filter((x) => !pieces.some((p) => p.text.toLowerCase() === x.text.toLowerCase()))).slice(0, 2);
        const row = item.model.rows[item.r];
        const res = await buildTiles(arena, `<div class="g-card"><span class="tense-tag t-${row.time}">${esc(row.icon)} ${esc(row.label[lang])}</span><div class="g-gloss" dir="auto">${esc(item.row.gloss[lang])}</div></div>`, pieces, extra, sig, 1000);
        if (!res) break;
        times.push(res.ms);
        if (res.ok) clean++;
        const sec = res.ms / 1000;
        score += Math.max(5, Math.round(60 - sec * 8)) + (res.ok ? 10 : 0);
        setScore(score);
        o.sfx(sec < 3 ? 'good' : 'tap');
        $('.g-line', arena).classList.add(sec < 3 ? 'fast' : sec < 6 ? 'ok' : 'slow');
        say(item.row.full, 1.1);
        await S.sleep(S.FAST ? 5 : 700, sig);
      }
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0;
      return { score, stats: [[t.gAvg, `${avg.toFixed(1)}${t.gSec}`], ['⚡', times.length ? `${(Math.min(...times) / 1000).toFixed(1)}${t.gSec}` : '—'], ['✓', `${clean}/${times.length}`]] };
    }

    // ---------- Flash ----------
    async function flash(game, sig) {
      const pool = o.items().slice().sort((a, b) => a.row.full.length - b.row.full.length);
      const arena = shell(game);
      await countdown(arena, sig);
      const ROUNDS = S.FAST ? 2 : 8;
      let score = 0, right = 0, lvl = 0;
      for (let k = 0; k < ROUNDS && !sig.aborted; k++) {
        const band = Math.min(pool.length - 1, Math.floor((lvl / ROUNDS) * pool.length + Math.random() * (pool.length / 4)));
        const item = pool[band];
        setTime(1 - k / ROUNDS);
        const words = stripEnd(item.row.full).split(' ');
        const show = S.FAST ? 5 : (1100 + 260 * words.length) / (o.settings.speed || 1);
        setMeta(`<span class="combo">${k + 1} / ${ROUNDS}</span><span class="combo">${I('brain')} ${words.length}</span>`);
        arena.innerHTML = `<div class="g-card"><div class="g-hint">${esc(t.flashMemorize)}</div><div class="g-it flash" dir="ltr">${esc(item.row.full)}</div><div class="g-gloss" dir="auto">${esc(item.row.gloss[lang])}</div></div>`;
        say(item.row.full, 1);
        await S.sleep(show, sig);
        if (sig.aborted) break;
        const others = item.sent.rows.filter((_, i) => i !== item.r).flatMap((r) => stripEnd(r.full).split(' '));
        const extra = shuffle(uniq(others.filter((w) => !words.includes(w)))).slice(0, 2);
        const res = await buildTiles(arena, `<div class="g-card"><div class="g-hint">${esc(t.flashBuild)}</div><div class="g-gloss" dir="auto">${esc(item.row.gloss[lang])}</div></div>`, words, extra, sig, 0);
        if (!res) break;
        if (res.ok) { right++; lvl += 1.4; score += 15 * words.length; o.sfx('good'); } else { lvl = Math.max(0, lvl - 0.5); score += 4 * words.length; }
        setScore(score);
        await S.sleep(S.FAST ? 5 : 600, sig);
      }
      return { score, stats: [[t.gAcc, `${Math.round((right / ROUNDS) * 100)}%`], ['✓', `${right}/${ROUNDS}`]] };
    }

    // ---------- Alone in Italy ----------
    function scenePicker(game) {
      const arena = shell(game);
      setMeta('');
      $('.g-bar', el).hidden = true;
      arena.innerHTML = `<p class="g-sub">${esc(t.scenesSub)}</p><div class="scene-list">${o.scenes.map((sc) => {
        const rec = o.record('scenes:' + sc.id);
        return `<button class="scene-card" data-sc="${sc.id}" style="--a:${sc.sky[0]};--b:${sc.sky[1]}">
          <span class="sc-ic" aria-hidden="true">${sc.icon}</span><span class="sc-it" dir="ltr">${esc(sc.it)}</span><b>${esc(sc.place[lang])}</b>
          <small>${esc(sc.level)}${rec ? ` · ${esc(t.best)} ${rec}` : ''}</small></button>`;
      }).join('')}</div>`;
      arena.querySelectorAll('[data-sc]').forEach((b) => b.addEventListener('click', () => start('scenes', o.scenes.find((s) => s.id === b.dataset.sc))));
    }

    async function scene(game, sig, sc) {
      const arena = shell(game);
      let hearts = 3, sos = 2, score = 0;
      const log = [];
      const hud = () => setMeta(`<span class="hearts">${[0, 1, 2].map((i) => `<i class="${i < hearts ? 'on' : ''}">${I('heart')}</i>`).join('')}</span><button class="sos" ${sos ? '' : 'disabled'}>${I('sos')} ${esc(t.sosLeft(sos))}</button>`);
      arena.innerHTML = `<div class="chat-sky" style="--a:${sc.sky[0]};--b:${sc.sky[1]}"><span class="sky-ic">${sc.icon}</span><b>${esc(sc.it)}</b><p dir="auto">${esc(sc.intro[lang])}</p></div><div class="chat" id="chat"></div><div class="chat-reply" id="reply"></div>`;
      const chat = $('#chat', arena);
      const reply = $('#reply', arena);
      let sosAction = null;
      // The HUD is re-rendered often, so listen on its container
      $('.g-meta', el).addEventListener('click', (e) => { if (e.target.closest('.sos') && sosAction) sosAction(); });
      hud();
      const bubble = (who, text, m) => {
        const d = document.createElement('div');
        d.className = `bub ${who}`;
        d.innerHTML = `${who === 'npc' ? `<span class="who">${sc.npcIcon}</span>` : ''}<div><span dir="ltr">${esc(text)}</span>${m ? `<small dir="auto" hidden>${esc(m)}</small>` : ''}</div>`;
        chat.appendChild(d);
        d.scrollIntoView({ block: 'end', behavior: 'smooth' });
        return d;
      };
      await S.sleep(S.FAST ? 5 : 1200, sig);
      let lastNpc = null;
      for (const line of sc.lines) {
        if (sig.aborted || hearts <= 0) break;
        if (line.who === 'npc') {
          lastNpc = bubble('npc', line.it, line.m[lang]);
          log.push(line);
          await say(line.it, 0.95);
          continue;
        }
        // The learner's turn: Italian choices, ticking clock
        const limit = (S.FAST ? 40 : 11000) / Math.sqrt(o.settings.speed || 1);
        const correct = line.choices[0];
        const options = shuffle(line.choices).map((c) => ({ html: esc(c), ok: c === correct }));
        sosAction = () => {
          if (!sos) return;
          sos--; hud();
          const tr = lastNpc && lastNpc.querySelector('small');
          if (tr) tr.hidden = false;
          const h = document.createElement('div'); h.className = 'sos-hint'; h.setAttribute('dir', 'auto'); h.textContent = '💡 ' + line.m[lang];
          reply.prepend(h);
        };
        const res = await choose(reply, '', options, limit, sig, (f) => setTime(f));
        sosAction = null;
        if (sig.aborted) break;
        if (res && res.ok) { score += 20 + Math.max(0, Math.round((limit - res.ms) / 250)); o.sfx('good'); }
        else { hearts--; o.sfx('bad'); hud(); }
        setScore(score);
        const b = bubble('you', correct, line.m[lang]);
        if (!(res && res.ok)) b.classList.add('fixed');
        log.push({ who: 'you', it: correct, m: line.m });
        reply.innerHTML = '';
        await say(correct, 1);
      }
      const ok = hearts > 0 && !sig.aborted;
      if (ok) score += hearts * 25;
      return {
        score, key: 'scenes:' + sc.id, title: ok ? t.survived : t.failed, good: ok,
        stats: [[t.hearts, `${hearts}/3`]],
        after: `<details class="transcript"><summary>${esc(t.transcript)}</summary>${log.map((l) => `<p class="${l.who}"><b dir="ltr">${esc(l.it)}</b><span dir="auto">${esc(l.m[lang])}</span></p>`).join('')}</details>`,
      };
    }

    // ---------- Flow ----------
    async function start(id, sc) {
      stopAll();
      ac = new AbortController();
      const sig = ac.signal;
      const game = GAMES.find((g) => g.id === id);
      S.unlock();
      let res;
      if (id === 'scenes' && !sc) return scenePicker(game);
      if (id === 'sprint') res = await sprint(game, sig);
      else if (id === 'radar') res = await radar(game, sig);
      else if (id === 'chunk') res = await chunk(game, sig);
      else if (id === 'flash') res = await flash(game, sig);
      else res = await scene(game, sig, sc);
      if (sig.aborted || !el.isConnected) return;
      const key = res.key || id;
      const rec = o.onRecord(key, res.score);
      o.sfx(rec.isRecord ? 'good' : 'pop');
      const arena = $('#g-arena', el);
      setTime(0);
      arena.innerHTML = `
        <div class="g-end ${res.good === false ? 'bad' : ''}">
          ${rec.isRecord ? `<div class="record">${I('trophy')} ${esc(t.newRecord)}</div>` : ''}
          ${res.title ? `<h3 dir="auto">${esc(res.title)}</h3>` : ''}
          <div class="big-score">${res.score}</div>
          <div class="g-best">${esc(t.best)}: ${rec.best}</div>
          <div class="g-stats">${res.stats.map(([k, v]) => `<div><b>${esc(v)}</b><small>${esc(k)}</small></div>`).join('')}</div>
          ${res.after || ''}
          <div class="g-actions"><button class="btn primary big" data-g="again">${I('replay')} ${esc(t.playAgain)}</button><button class="btn ghost" data-g="back">${esc(t.backHome)}</button></div>
        </div>`;
      $('[data-g="again"]', arena).onclick = () => start(id, sc);
      $('[data-g="back"]', arena).onclick = () => { stopAll(); o.onExit(); };
      if (rec.isRecord) confetti(el);
    }

    function confetti(host) {
      const c = document.createElement('canvas');
      c.className = 'confetti-canvas';
      host.appendChild(c);
      const ctx = c.getContext('2d');
      const W = (c.width = host.clientWidth), H = (c.height = Math.max(400, host.clientHeight));
      const colors = ['#22c55e', '#f8fafc', '#ef4444', '#f59e0b', '#60a5fa'];
      const ps = Array.from({ length: 90 }, () => ({ x: W / 2, y: H / 3, vx: (Math.random() - 0.5) * 9, vy: -Math.random() * 9 - 3, r: Math.random() * 360, s: 4 + Math.random() * 5, c: colors[Math.floor(Math.random() * colors.length)] }));
      let f = 0;
      (function tick() {
        ctx.clearRect(0, 0, W, H);
        ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.25; p.r += 8; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate((p.r * Math.PI) / 180); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore(); });
        if (++f < 110) requestAnimationFrame(tick); else c.remove();
      })();
    }

    return { start, stop: stopAll };
  }

  root.PassoGym = { GAMES, createGym };
})(typeof self !== 'undefined' ? self : this);
