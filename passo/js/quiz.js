/*
 * Passo a Passo — quick quizzes.
 * Types: build (tap the words in order), tense (which tense?), verb (fill the verb),
 * listen (hear Italian, pick the meaning), speak (say it), transform (change the tense).
 * A wrong answer comes back once more at the end of the round.
 */
(function (root) {
  'use strict';
  const { esc } = root.PassoStage;
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uniq = (a) => Array.from(new Set(a));
  const stripEnd = (s) => s.replace(/[.?!]$/, '');

  // Every sentence × tense row of a lesson model is one quiz item.
  function itemsOf(model) {
    const out = [];
    model.sentences.forEach((sent) => sent.rows.forEach((row, r) => out.push({ id: row.id, row, sent, r, model })));
    return out;
  }

  function verbToken(item) {
    return item.row.tokens.find((t) => t.conj) || item.row.tokens.find((t) => t.role === 'verb');
  }

  function makeQuestion(type, item, pool, ctx) {
    const rows = item.model.rows;
    const lang = ctx.lang;
    switch (type) {
      case 'tense':
        if (rows.length < 2) return null;
        return { type, item, options: rows.map((r, i) => ({ html: `${esc(r.icon)} ${esc(r.label[lang])} <small dir="ltr">${esc(r.it)}</small>`, ok: i === item.r })) };
      case 'verb': {
        const vt = verbToken(item);
        if (!vt) return null;
        const forms = item.sent.segs[vt.seg].cells.map((c) => c.text);
        if (vt.conj) {
          const { conjugate } = ctx.pack.conj;
          [0, 1, 2, 3, 5].forEach((p) => { try { forms.push(conjugate(vt.conj.inf, vt.tense, p, 'm', { mid: vt.conj.mid }).text); } catch (e) { /* ignore */ } });
        }
        const wrong = shuffle(uniq(forms).filter((f) => f !== vt.text)).slice(0, 3);
        if (!wrong.length) return null;
        const words = item.row.tokens.map((t, i) => (i === vt.seg ? '<span class="blank">____</span>' : esc(i === 0 ? root.PassoModel.cap(t.text) : t.text) + esc(t.post)));
        return { type, item, sentenceHtml: words.join(' ') + esc(item.sent.src.end || '.'), answer: vt.text,
          options: shuffle([vt.text, ...wrong]).map((f) => ({ html: esc(f), ok: f === vt.text, say: f })) };
      }
      case 'listen': {
        const others = item.sent.rows.filter((_, i) => i !== item.r).map((r) => r.gloss[lang]);
        const extra = shuffle(pool.filter((p) => p.sent !== item.sent)).slice(0, 1).map((p) => p.row.gloss[lang]);
        const opts = uniq([item.row.gloss[lang], ...others, ...extra]).slice(0, 4);
        if (opts.length < 2) return null;
        return { type, item, options: shuffle(opts).map((g) => ({ html: esc(g), ok: g === item.row.gloss[lang] })) };
      }
      case 'transform': {
        if (rows.length < 2) return null;
        const targets = rows.map((_, i) => i).filter((i) => i !== item.r);
        const t = targets[Math.floor(Math.random() * targets.length)];
        const correct = item.sent.rows[t].full;
        const extra = pool.filter((p) => p.sent !== item.sent && p.r === t).map((p) => p.row.full);
        const opts = uniq([correct, ...item.sent.rows.filter((_, i) => i !== t).map((r) => r.full), ...shuffle(extra).slice(0, 1)]).slice(0, 4);
        return { type, item, target: t, answer: correct, options: shuffle(opts).map((s) => ({ html: esc(s), ok: s === correct, say: s })) };
      }
      case 'speak':
        if (!ctx.micOn()) return null;
        return { type, item };
      case 'build':
      default: {
        const words = stripEnd(item.row.full).split(' ');
        const others = item.sent.rows.filter((_, i) => i !== item.r).flatMap((r) => stripEnd(r.full).split(' '));
        const distract = shuffle(uniq(others.filter((w) => !words.includes(w)))).slice(0, 2);
        return { type: 'build', item, words, tiles: shuffle([...words, ...distract]) };
      }
    }
  }

  const MIX = ['build', 'verb', 'tense', 'listen', 'build', 'transform', 'speak', 'verb', 'listen', 'build'];

  function generate(pool, count, ctx) {
    const qs = [];
    let items = shuffle(pool);
    for (let i = 0; qs.length < count && i < count * 4; i++) {
      if (!items.length) items = shuffle(pool);
      const item = items.pop();
      const type = MIX[(i + Math.floor(Math.random() * 3)) % MIX.length];
      const q = makeQuestion(type, item, pool, ctx) || makeQuestion('build', item, pool, ctx);
      if (q) qs.push(q);
    }
    return qs;
  }

  // ---------- Running a round ----------
  // state persists across pause/resume: { queue, pos, correct, total, wrong:Set, retried:Set }
  function newState(questions) {
    return { queue: questions.slice(), pos: 0, correct: 0, total: questions.length, wrong: new Set(), retried: new Set() };
  }

  async function run(ctx, state, signal) {
    while (state.pos < state.queue.length) {
      if (signal.aborted) return state;
      const q = state.queue[state.pos];
      const ok = await ask(ctx, q, state, signal);
      if (signal.aborted) return state;
      const firstTry = !state.retried.has(q);
      if (ok && firstTry) state.correct++;
      if (!ok) {
        state.wrong.add(q.item.id);
        if (!state.retried.has(q)) {
          // Ask the same item again later, as a build or speak question
          const again = makeQuestion(ctx.micOn() ? 'speak' : 'build', q.item, [], ctx) || q;
          state.retried.add(again);
          state.queue.push(again);
        }
      }
      state.pos++;
    }
    return state;
  }

  function header(ctx, q, state) {
    const t = ctx.t;
    const label = { build: t.qBuild, tense: t.qTense, verb: t.qVerb, listen: t.qListen, speak: t.qSpeak, transform: t.qTransform }[q.type];
    const extra = q.type === 'transform' ? ' ' + esc(q.item.model.rows[q.target].label[ctx.lang]) : '';
    const dots = state.queue.map((_, i) => `<i class="${i < state.pos ? 'd' : i === state.pos ? 'c' : ''}"></i>`).join('');
    return `<div class="q-head"><span class="q-type">${esc(label)}${extra}</span><span class="q-dots">${dots}</span></div>`;
  }

  async function ask(ctx, q, state, signal) {
    const N = ctx.N;
    const item = q.item;
    const gloss = item.row.gloss[ctx.lang];
    const panel = ctx.stage.panel(`<div class="quiz">${header(ctx, q, state)}<div class="q-body"></div><div class="q-feedback" aria-live="polite"></div></div>`);
    const body = panel.querySelector('.q-body');
    const fb = panel.querySelector('.q-feedback');
    const promptAc = new AbortController();
    const onAbort = () => promptAc.abort();
    signal.addEventListener('abort', onAbort, { once: true });
    const sayItalian = (s, sig) => ctx.speakTarget(s, sig || promptAc.signal);
    let answered;
    const answer = new Promise((res) => { answered = res; });

    const choiceUi = (opts, cls) => `<div class="choices ${cls || ''}">${opts.map((o, i) => `<button class="choice" data-i="${i}" dir="auto">${o.html}</button>`).join('')}</div>`;
    const bindChoices = () => {
      body.querySelectorAll('.choice').forEach((b) => b.addEventListener('click', () => {
        if (body.classList.contains('locked')) return;
        body.classList.add('locked');
        const o = q.options[+b.dataset.i];
        b.classList.add(o.ok ? 'right' : 'bad');
        if (!o.ok) body.querySelectorAll('.choice').forEach((x) => { if (q.options[+x.dataset.i].ok) x.classList.add('right'); });
        answered(o.ok);
      }));
    };

    let promptLine;
    if (q.type === 'tense') {
      body.innerHTML = `<button class="hear big-it" dir="ltr">🔊 ${esc(item.row.full)}</button>${choiceUi(q.options)}`;
      promptLine = N.q.tense;
      bindChoices();
    } else if (q.type === 'verb') {
      body.innerHTML = `<div class="q-gloss" dir="auto">${esc(gloss)}</div><div class="big-it" dir="ltr">${q.sentenceHtml}</div>${choiceUi(q.options, 'inline')}`;
      promptLine = N.q.verb;
      bindChoices();
    } else if (q.type === 'listen') {
      body.innerHTML = `<button class="hear big-ear" aria-label="${esc(ctx.t.tapToHear)}">🔊</button>${choiceUi(q.options)}`;
      promptLine = N.q.listen;
      bindChoices();
    } else if (q.type === 'transform') {
      body.innerHTML = `<div class="big-it" dir="ltr">${esc(item.row.full)}</div><div class="q-arrow">⬇ ${esc(item.model.rows[q.target].icon)} ${esc(item.model.rows[q.target].label[ctx.lang])}</div>${choiceUi(q.options)}`;
      promptLine = N.q.transform(item.model.rows[q.target].label[ctx.lang]);
      bindChoices();
    } else if (q.type === 'speak') {
      body.innerHTML = `<div class="q-gloss big" dir="auto">${esc(gloss)}</div>`;
      promptLine = N.q.speak(gloss);
    } else {
      body.innerHTML = `<div class="q-gloss big" dir="auto">${esc(gloss)}</div>
        <div class="build-line" dir="ltr"></div><div class="tiles" dir="ltr">${q.tiles.map((w, i) => `<button class="tile" data-i="${i}">${esc(w)}</button>`).join('')}</div>`;
      promptLine = N.q.build(gloss);
      const line = body.querySelector('.build-line');
      const placed = [];
      const check = () => {
        if (placed.length !== q.words.length) return;
        body.classList.add('locked');
        const ok = placed.map((b) => q.tiles[+b.dataset.i]).join(' ') === q.words.join(' ');
        line.classList.add(ok ? 'right' : 'bad');
        answered(ok);
      };
      body.querySelectorAll('.tile').forEach((b) => b.addEventListener('click', () => {
        if (body.classList.contains('locked')) return;
        if (b.parentElement === line) {
          placed.splice(placed.indexOf(b), 1);
          body.querySelector('.tiles').appendChild(b);
        } else {
          placed.push(b);
          line.appendChild(b);
          ctx.sfx('tap');
          check();
        }
      }));
    }
    body.querySelectorAll('.hear').forEach((b) => b.addEventListener('click', () => sayItalian(item.row.full)));

    // Instructor reads the prompt (and the Italian when the question is about hearing)
    const prompt = (async () => {
      await ctx.say(promptLine, promptAc.signal);
      if (q.type === 'tense' || q.type === 'listen') await sayItalian(item.row.full);
    })();

    let ok;
    if (q.type === 'speak') {
      await prompt;
      if (signal.aborted) return false;
      const res = await ctx.turn(item.row.full, signal, { quiz: true });
      ok = !!res.ok;
    } else {
      ok = await Promise.race([answer, new Promise((r) => signal.addEventListener('abort', () => r(null), { once: true }))]);
    }
    signal.removeEventListener('abort', onAbort);
    promptAc.abort();
    if (signal.aborted || ok === null) return false;

    // Feedback
    ctx.sfx(ok ? 'good' : 'bad');
    const correctIt = q.answer && q.type !== 'verb' ? q.answer : item.row.full;
    fb.innerHTML = ok
      ? `<div class="fb good">✓ ${esc(ctx.t.correct)}</div>`
      : `<div class="fb bad">${esc(ctx.t.wrong)} <b dir="ltr">${esc(correctIt)}</b><span dir="auto">${esc(gloss)}</span></div>`;
    if (ok) {
      await ctx.say(N.praise(), signal);
      if (q.type === 'build' || q.type === 'verb') await sayItalian(item.row.full, signal);
    } else {
      await ctx.say(N.wrongIs, signal);
      await sayItalian(correctIt, signal);
    }
    await root.PassoSpeech.sleep(450, signal);
    return ok;
  }

  root.PassoQuiz = { itemsOf, generate, newState, run, makeQuestion };
})(typeof self !== 'undefined' ? self : this);
