/*
 * Passo a Passo — turns a lesson into the instructor's step-by-step script.
 *
 * A step is { run(ctx, signal), apply?(ctx), checkpoint?, beat? }.
 *   run       plays the step (speech, animation, waiting for the learner)
 *   apply     silently restores its visual effect (used when jumping back/forward)
 *   checkpoint the step sets up a new scene — restoring starts from here
 *   beat      a place the ⏮ / ⏭ buttons can jump to
 *
 * Lesson flow (per sentence):
 *   intro → reveal each segment in every tense row with explanation →
 *   read the full sentences → repeat after me → quick recall question.
 * Every two sentences: a mini quiz. At the end: spoken review + final quiz.
 */
(function (root) {
  'use strict';
  const { N: NARR, ROLE, OVERVIEW, UI } = root.PassoI18n;
  const M = root.PassoModel;
  const Q = root.PassoQuiz;
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  const say = (line) => ({ beat: true, run: (c, sig) => c.say(line, sig) });
  const act = (fn, opts) => Object.assign({ run: async (c, sig) => fn(c, true, sig), apply: (c) => fn(c, false) }, opts);
  const scene = (fn) => act(fn, { checkpoint: true, beat: true });

  // ---------- Verb notes ----------
  function verbNote(N, tok) {
    const c = tok.conj;
    if (!c) return '';
    const n = N.note;
    switch (c.kind) {
      case 'compound':
        if (c.tense === 'pp') return c.aux.inf === 'essere' ? n.pp_essere(c.aux.text, c.part) : n.pp_avere(c.aux.text, c.part);
        return n[c.tense] ? n[c.tense](c.aux.text, c.part) : '';
      case 'prog': return n.prog(c.aux.text, c.part);
      default:
        if (c.irregular && c.tense !== 'fut' && c.tense !== 'cond') return n.irregular(c.text);
        if (c.tense === 'pres') return c.end ? n.pres_split(c.end) : '';
        if (c.tense === 'fut') return n.fut_split(c.base, c.end);
        if (c.tense === 'imp') return n.imp_split(c.end);
        if (c.tense === 'cond') return n.cond_split(c.end);
        if (c.tense === 'cong') return c.end ? n.cong_split(c.end) : '';
        return '';
    }
  }
  // Key used to explain each kind of form only once per lesson
  const noteKey = (tok) => (tok.conj ? [tok.conj.kind, tok.conj.tense, tok.conj.aux && tok.conj.aux.inf, tok.conj.irregular ? tok.conj.inf : '', tok.person].join('|') : '');

  // ---------- Standard lesson ----------
  function lessonSteps(pack, lesson, lang, opts) {
    const N = NARR[lang];
    const roles = ROLE[lang];
    const model = M.buildLesson(pack, lesson);
    const labels = model.rows.map((r) => r.label[lang]);
    const steps = [];
    const seen = new Set();
    const showGrid = (s) => (c) => c.stage.grid(model, s, { lang, showMeaning: c.settings.meanings });

    steps.push(scene((c) => c.stage.title({ badge: `${lesson.unit.level} · ${lesson.unit.title[lang]}`, title: lesson.title[lang], goal: lesson.goal[lang], rows: model.rows.map((r) => Object.assign({}, r, { label: r.label[lang] })) })));
    steps.push(say(N.lessonIntro(lesson.title[lang], lesson.goal[lang])));
    if (model.rows.length > 1) steps.push(say(N.rowsIntro(labels)));

    model.sentences.forEach((s, si) => {
      const mid = model.rows.findIndex((r) => r.key === 'pres');
      const introGloss = s.rows[mid >= 0 ? mid : 0].gloss[lang];
      steps.push(scene(showGrid(s)));
      steps.push(say(N.sentenceIntro(si + 1, introGloss)));

      // Build the sentence, one segment (column) at a time, in every row together
      let firstSeg = true;
      s.segs.forEach((seg, k) => {
        steps.push(act((c, anim) => c.stage.reveal(k, anim), { beat: true }));
        steps.push(...segmentSteps(N, roles, model, s, seg, k, firstSeg, seen, lang));
        firstSeg = false;
      });
      if (si === 0 && model.rows.length > 1 && s.segs.some((g) => g.role === 'verb')) steps.push(say(N.compareClose));
      if (s.note) steps.push(say(s.note[lang]));

      // Full sentences, row by row, with their meaning
      steps.push(say(N.readAll));
      s.rows.forEach((row, r) => {
        steps.push(act(async (c, anim, sig) => {
          c.stage.showGloss(r, true);
          if (!anim) return;
          c.stage.focusRow(r);
          await c.speakTarget(row.full, sig);
          await c.say(N.means(row.gloss[lang]), sig);
          c.stage.focusRow(null);
        }, { beat: true }));
      });

      // Repeat after me (Pimsleur style: model → your turn → confirmation)
      steps.push(say(N.repeatIntro));
      s.rows.forEach((row, r) => steps.push({ beat: true, run: (c, sig) => repeatRow(c, N, row, r, sig) }));

      // Recall without looking
      const askRows = shuffle(s.rows.map((_, r) => r)).slice(0, Math.min(2, s.rows.length));
      steps.push(say(N.askIntro));
      askRows.forEach((r) => steps.push({ beat: true, run: (c, sig) => anticipate(c, N, s.rows[r], r, sig, true) }));

      // Mini quiz every two sentences
      if (si % 2 === 1 && si < model.sentences.length - 1) {
        const pool = Q.itemsOf({ rows: model.rows, sentences: model.sentences.slice(0, si + 1) });
        steps.push(...quizSteps(N.miniQuiz, pool, 4, 'mini' + si));
      }
    });

    // Spoken review of every sentence, mixed tenses, grid hidden
    const reviewItems = shuffle(Q.itemsOf(model)).slice(0, Math.min(6, model.sentences.length * model.rows.length));
    steps.push(scene((c) => c.stage.panel(`<div class="review-card"><div class="big-ear">🎧</div><p>${UI[lang].yourTurn}</p></div>`)));
    steps.push(say(N.reviewIntro));
    reviewItems.forEach((it) => steps.push({ beat: true, run: (c, sig) => anticipate(c, N, it.row, null, sig, false) }));

    // Final quiz
    steps.push(...quizSteps(N.quizIntro, Q.itemsOf(model), Math.min(12, Math.max(8, model.sentences.length * 3)), 'final', true));
    steps.push(say(N.lessonEnd));
    return { steps, model };
  }

  function segmentSteps(N, roles, model, s, seg, k, first, seen, lang) {
    const out = [];
    const cells = seg.cells;
    const role = roles[seg.role] || seg.role;
    const m0 = cells[0].m && cells[0].m[lang];

    if (seg.role === 'verb' && cells[0].conj) {
      const inf = cells[0].conj.inf;
      out.push(say(N.verbIntro(inf, m0)));
      cells.forEach((tok, r) => {
        const key = noteKey(tok);
        const note = seen.has(key) ? '' : verbNote(N, tok);
        seen.add(key);
        const line = N.rowLine(model.rows[r].label[lang], tok.text) + (note ? ' — ' + note : '.');
        out.push(rowLine(r, k, line));
      });
      return out;
    }

    if (seg.same) {
      out.push(say((first ? N.roleFirst : N.roleNext)(role, cells[0].text, m0 || '')));
      if (seg.role === 'subj' && !seen.has('subjNote')) { seen.add('subjNote'); out.push(say(N.subjNote)); }
      else if (seg.role === 'neg' && !seen.has('negNote')) { seen.add('negNote'); out.push(say(N.negNote)); }
      else if (first && model.rows.length > 1 && !seen.has('sameAll')) { seen.add('sameAll'); out.push(say(N.sameAll)); }
      return out;
    }

    // A word that differs per row (time words, the "so / penso" verb, …)
    out.push(say(seg.role === 'verb' ? N.verbFixedIntro : N.perRowIntro(role)));
    cells.forEach((tok, r) => {
      const m = tok.m && tok.m[lang];
      out.push(rowLine(r, k, N.rowLine(model.rows[r].label[lang], tok.text) + (m ? ` — «${m}».` : '.')));
    });
    return out;
  }

  function rowLine(r, k, line) {
    return {
      beat: true,
      run: async (c, sig) => {
        c.stage.focusRow(r);
        c.stage.focusCell(r, k);
        await c.say(line, sig);
        c.stage.focusCell(null);
        c.stage.focusRow(null);
      },
    };
  }

  async function repeatRow(c, N, row, r, sig) {
    c.stage.focusRow(r);
    await c.speakTarget(row.full, sig, 0.82);
    if (sig.aborted) return;
    const res = await c.turn(row.full, sig);
    if (sig.aborted) return;
    if (res.ok) {
      await c.say(N.praise(), sig);
    } else if (res.heard) {
      await c.say(N.close, sig);
      await c.speakTarget(row.full, sig, 0.82);
    } else {
      await c.speakTarget(row.full, sig);
    }
    c.stage.focusRow(null);
  }

  async function anticipate(c, N, row, r, sig, cover) {
    if (cover) { c.stage.cover(true); c.stage.focusRow(r); }
    await c.say(N.ask(row.gloss[c.lang]), sig);
    if (sig.aborted) return;
    const res = await c.turn(row.full, sig, { hint: row.gloss[c.lang] });
    if (sig.aborted) return;
    if (cover) c.stage.cover(false);
    if (res.ok) await c.say(N.praise(), sig);
    else { c.markWeak(row.id); await c.say(N.answerIs, sig); }
    await c.speakTarget(row.full, sig);
    if (!res.ok) await c.speakTarget(row.full, sig, 0.82);
    if (cover) c.stage.focusRow(null);
  }

  function quizSteps(introLine, pool, count, key, final) {
    let qs = null;
    let state = null;
    return [
      scene((c) => c.stage.panel(`<div class="review-card"><div class="big-ear">⚡</div><p>${final ? '🏁' : ''}</p></div>`)),
      say(introLine),
      {
        beat: true,
        run: async (c, sig) => {
          if (!qs) { qs = Q.generate(pool, count, c); state = Q.newState(qs); }
          await Q.run(c, state, sig);
          if (!sig.aborted) c.recordQuiz(key, state, final);
        },
      },
    ];
  }

  // ---------- Overview lesson (unit 0) ----------
  function overviewSteps(pack, lesson, lang) {
    const O = OVERVIEW[lang];
    const T = pack.lex.TENSES;
    const ui = UI[lang];
    const order = ['pres', 'pp', 'fut', 'imp', 'prog_pres', 'cond', 'trap', 'fant', 'cong'];
    const steps = [];

    steps.push(scene((c) => c.stage.title({ badge: ui.overviewTag, title: lesson.title[lang], goal: lesson.goal[lang] })));
    steps.push(say(O.hello));
    steps.push(say(O.method));

    steps.push(scene((c) => c.stage.timeline({
      heads: { past: ui.past, present: ui.present, future: ui.future },
      tenses: order.map((k) => ({ key: k, it: T[k].it, name: T[k].name[lang], time: T[k].time, freq: T[k].freq })),
    })));
    steps.push(say(O.timeline));
    order.forEach((k) => {
      steps.push(act((c, anim) => c.stage.tlReveal(k, anim)));
      steps.push(say(O.tense(T[k].it, T[k].name[lang], T[k].use[lang])));
    });
    steps.push(act((c) => c.stage.tlMark(['pres', 'pp', 'imp'])));
    steps.push(say(O.mostUsed));
    steps.push(act((c) => c.stage.tlMark(['pp', 'pres', 'fut'])));
    steps.push(say(O.trios));

    // Sentence anatomy, using the real grid with one row
    const demo = { id: 'demo', rows: ['pres'], sentences: [{ segs: [{ r: 'subj', p: 'io' }, { r: 'verb', v: 'mangiare' }, { r: 'obj', it: 'una mela', ic: '🍎', m: { ar: 'تفاحة', en: 'an apple' } }], g: { ar: ['آكلُ تفاحة'], en: ['I eat an apple'] } }] };
    const dm = M.buildLesson(pack, demo);
    steps.push(scene((c) => c.stage.grid(dm, dm.sentences[0], { lang, showMeaning: true })));
    steps.push(say(O.anatomy));
    [0, 1, 2].forEach((k) => steps.push(act(async (c, anim, sig) => { c.stage.reveal(k, anim); if (anim) await root.PassoSpeech.sleep(450, sig); })));
    steps.push(say(O.anatomyWords));
    steps.push(act((c) => c.stage.showGloss(0, true)));

    // Structure ladder
    const ex = [
      ['<i class="c-subj">Io</i> <i class="c-verb">mangio</i> <i class="c-obj">una mela</i>.', { ar: 'آكل تفاحة.', en: 'I eat an apple.' }],
      ['<i class="c-subj">Io</i> <i class="c-verb">mangio</i> <i class="c-obj">la pizza</i> <i class="c-conj">e</i> <i class="c-subj">tu</i> <i class="c-verb">bevi</i> <i class="c-obj">l\'acqua</i>.', { ar: 'آكل البيتزا وأنت تشرب الماء.', en: 'I eat pizza and you drink water.' }],
      ['<i class="c-subj">Io</i> <i class="c-verb">mangio</i> <i class="c-conj">perché</i> <i class="c-verb">ho</i> <i class="c-obj">fame</i>.', { ar: 'آكل لأنني جائع.', en: 'I eat because I am hungry.' }],
      ['<i class="c-conj">Quando</i> <i class="c-verb">arrivo</i>, <i class="c-verb">cucino</i> <i class="c-conj">e poi</i> <i class="c-verb">guardo</i> <i class="c-obj">un film</i>.', { ar: 'عندما أصل أطبخ ثم أشاهد فيلمًا.', en: 'When I arrive, I cook and then watch a film.' }],
    ];
    steps.push(scene((c) => c.stage.ladder({ steps: ex.map((e, i) => ({ name: ui.ladder[i], html: e[0], gloss: e[1][lang] })) })));
    steps.push(say(O.ladder));
    ex.forEach((_, i) => {
      steps.push(act((c, anim) => c.stage.ladderReveal(i, anim)));
      steps.push(say(O.ladderStep[i]));
    });

    steps.push(scene((c) => c.stage.road({ units: pack.course.units.filter((u) => u.id !== 'u0').map((u) => ({ level: u.level, title: u.title[lang] })) })));
    steps.push(say(O.road));

    // First taste: repeat one sentence
    steps.push(scene((c) => { c.stage.grid(dm, dm.sentences[0], { lang, showMeaning: true }); c.stage.revealAll(); c.stage.showGloss(0, true); }));
    steps.push(say(O.try));
    steps.push({ beat: true, run: async (c, sig) => { c.stage.focusRow(0); await c.speakTarget(dm.sentences[0].rows[0].full, sig, 0.82); } });
    steps.push(say(O.tryAsk));
    steps.push({ beat: true, run: (c, sig) => repeatRow(c, NARR[lang], dm.sentences[0].rows[0], 0, sig) });
    steps.push(say(O.bye));
    return { steps, model: null };
  }

  // ---------- Smart review (items from finished lessons) ----------
  function reviewSteps(pack, lang, ids) {
    const N = NARR[lang];
    const byLesson = {};
    M.allLessons(pack).filter((l) => l.sentences).forEach((l) => { byLesson[l.id] = Q.itemsOf(M.buildLesson(pack, l)); });
    let pool = [];
    ids.forEach((id) => {
      const it = (byLesson[id.split(':')[0]] || []).find((x) => x.id === id);
      if (it) pool.push(it);
    });
    pool = shuffle(pool);
    const steps = [];
    steps.push(scene((c) => c.stage.title({ badge: '🔁', title: UI[lang].reviewTitle, goal: UI[lang].reviewSub })));
    shuffle(pool).slice(0, 4).forEach((it) => steps.push({ beat: true, run: (c, sig) => anticipate(c, N, it.row, null, sig, false) }));
    steps.push(...quizSteps(N.miniQuiz, pool, Math.min(12, Math.max(6, pool.length)), 'review', true));
    return { steps, model: null };
  }

  function build(pack, lesson, lang, opts) {
    if (lesson.type === 'overview') return overviewSteps(pack, lesson, lang);
    if (lesson.type === 'review') return reviewSteps(pack, lang, lesson.ids);
    return lessonSteps(pack, lesson, lang, opts);
  }

  root.PassoBuilder = { build, verbNote };
})(typeof self !== 'undefined' ? self : this);
