/* Passo a Passo — screens, settings, progress and statistics. */
(function (root) {
  'use strict';
  const { UI, N, LEVELS } = root.PassoI18n;
  const S = root.PassoSpeech;
  const M = root.PassoModel;
  const Q = root.PassoQuiz;
  const { esc } = root.PassoStage;
  const I = (n, c) => root.PassoIcon(n, c);
  const $ = (sel, el) => (el || document).querySelector(sel);

  const PACKS = { it: { conj: root.ItConj, lex: root.ItLex, course: root.ItCourse, scenes: root.ItScenes || [] } };
  const TARGETS = [
    { id: 'it', flag: '🇮🇹', name: 'Italiano', ready: true },
    { id: 'es', flag: '🇪🇸', name: 'Español' },
    { id: 'fr', flag: '🇫🇷', name: 'Français' },
    { id: 'de', flag: '🇩🇪', name: 'Deutsch' },
  ];
  const GEMINI_VOICES = ['Puck', 'Kore', 'Charon', 'Fenrir', 'Aoede', 'Zephyr', 'Orus', 'Leda'];

  // ---------- Storage ----------
  const KEY = 'passo.v1';
  const DEFAULTS = { lang: 'ar', target: 'it', rate: 1, rateIt: 0.95, speed: 1, mic: true, wait: 1, meanings: true, voice: {}, puck: { on: false, key: '', voice: 'Puck' } };
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || '{}');
      const settings = Object.assign({}, DEFAULTS, s.settings);
      settings.puck = Object.assign({}, DEFAULTS.puck, settings.puck);
      return { settings, progress: s.progress || {}, weak: s.weak || {}, gym: s.gym || {}, days: s.days || [], minutes: s.minutes || 0 };
    } catch (e) { return { settings: Object.assign({}, DEFAULTS), progress: {}, weak: {}, gym: {}, days: [], minutes: 0 }; }
  }
  const store = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* private mode */ } };

  const pack = () => PACKS[store.settings.target];
  const lessons = () => M.allLessons(pack());
  const t = () => UI[store.settings.lang];
  let statsCache = null;
  const stats = () => (statsCache = statsCache || M.courseStats(pack()));

  const today = () => new Date().toISOString().slice(0, 10);
  function markDay(minutes) {
    if (!store.days.includes(today())) store.days.push(today());
    store.days = store.days.slice(-400);
    store.minutes += minutes || 0;
    save();
  }
  function streak() {
    const set = new Set(store.days);
    let n = 0;
    const d = new Date();
    if (!set.has(d.toISOString().slice(0, 10))) d.setDate(d.getDate() - 1);
    while (set.has(d.toISOString().slice(0, 10))) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }

  function applyVoices() {
    Object.entries(store.settings.voice || {}).forEach(([l, uri]) => S.setVoice(l, uri));
    S.configureGemini(store.settings.puck);
  }
  function applyDir() {
    const lang = store.settings.lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  // ---------- Screens ----------
  const screens = { home: $('#home'), player: $('#player'), summary: $('#summary'), gym: $('#gym') };
  function show(name) {
    Object.entries(screens).forEach(([k, el]) => { el.hidden = k !== name; });
    root.scrollTo(0, 0);
  }

  const isDone = (id) => !!(store.progress[id] && store.progress[id].done);
  const nextLesson = () => lessons().find((l) => !isDone(l.id)) || lessons()[0];
  const stars = (n) => `<span class="stars">${[0, 1, 2].map((i) => `<i class="${i < n ? 'on' : ''}">${I('star')}</i>`).join('')}</span>`;

  function learnedWords() {
    const w = new Set();
    lessons().forEach((l) => { if (isDone(l.id)) stats().byLesson[l.id].words.forEach((x) => w.add(x)); });
    return w.size;
  }
  function accuracy() {
    const vals = Object.values(store.progress).filter((p) => p.done && p.best != null).map((p) => p.best);
    return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
  }

  // The hero illustration: the same sentence in three tenses, stacked in 3D
  function heroStack() {
    return `<div class="stack3d" aria-hidden="true" dir="ltr">
      <div class="card3d t-past"><span>⏪</span><b><i class="c-subj">Io</i> <i class="c-verb"><u>ho</u> mangiato</i> <i class="c-obj">una mela</i></b></div>
      <div class="card3d t-present"><span>⏺️</span><b><i class="c-subj">Io</i> <i class="c-verb">mangi<u>o</u></i> <i class="c-obj">una mela</i></b></div>
      <div class="card3d t-future"><span>⏩</span><b><i class="c-subj">Io</i> <i class="c-verb">manger<u>ò</u></i> <i class="c-obj">una mela</i></b></div>
    </div>`;
  }

  function renderHome() {
    applyDir();
    const T = t();
    const lang = store.settings.lang;
    const nx = nextLesson();
    const st = stats();
    const weakCount = Object.keys(store.weak).length;
    const course = pack().course;
    const doneCount = lessons().filter((l) => isDone(l.id)).length;
    const acc = accuracy();
    const nxInfo = st.byLesson[nx.id];

    const levels = [];
    course.units.forEach((u) => { let g = levels.find((x) => x.level === u.level); if (!g) levels.push((g = { level: u.level, units: [] })); g.units.push(u); });

    screens.home.innerHTML = `
      <header class="home-top">
        <div class="brand"><span class="logo">${I('layers')}</span><div><h1>Passo a Passo</h1><p>${esc(T.tagline)}</p></div></div>
        <div class="top-actions">
          <span class="streak ${streak() ? 'on' : ''}" title="${esc(T.stStreak)}">${I('flame')}<b>${streak()}</b></span>
          <button class="icon-btn" data-act="settings" aria-label="${esc(T.settings)}">${I('gear')}</button>
        </div>
      </header>

      <section class="pickers">
        <div class="picker"><label>${esc(T.learn)}</label><div class="chips">
          ${TARGETS.map((x) => `<button class="chip ${x.id === store.settings.target ? 'on' : ''}" ${x.ready ? `data-target="${x.id}"` : 'disabled'}>${x.flag} ${esc(x.name)}${x.ready ? '' : ` <small>${esc(T.soon)}</small>`}</button>`).join('')}
        </div></div>
        <div class="picker"><label>${esc(T.instructorLang)}</label><div class="seg">
          <button class="${lang === 'ar' ? 'on' : ''}" data-lang="ar">العربية</button><button class="${lang === 'en' ? 'on' : ''}" data-lang="en">English</button>
        </div></div>
      </section>

      <section class="hero-card">
        <div class="hero-text">
          <div class="hero-badge">${esc(nx.unit.level)} · ${esc(LEVELS[nx.unit.level][lang])}</div>
          <h2>${esc(nx.title[lang])}</h2>
          <p>${esc(nx.goal[lang])}</p>
          <div class="hero-meta">${esc(T.lessonInfo(nxInfo.sentences, nxInfo.fresh.length, nxInfo.minutes))}</div>
          <button class="btn primary big" data-lesson="${nx.id}">${I('play')} ${esc(store.progress[nx.id] ? T.continue : T.start)}</button>
          <p class="tip">${I('speak')} ${esc(T.tipStart)}</p>
        </div>
        ${heroStack()}
      </section>

      <section class="stats">
        <div class="stat"><span class="s-ic c1">${I('book')}</span><b>${learnedWords()}<small> / ${st.words}</small></b><span>${esc(T.wordsLearned)}</span><i class="meter"><i style="width:${Math.round((learnedWords() / st.words) * 100)}%"></i></i></div>
        <div class="stat"><span class="s-ic c2">${I('layers')}</span><b>${doneCount}<small> / ${st.lessons}</small></b><span>${esc(T.stLessons)}</span><i class="meter"><i style="width:${Math.round((doneCount / st.lessons) * 100)}%"></i></i></div>
        <div class="stat"><span class="s-ic c3">${I('target')}</span><b>${acc == null ? '—' : acc + '%'}</b><span>${esc(T.stAccuracy)}</span></div>
        <div class="stat"><span class="s-ic c4">${I('timer')}</span><b>${Math.round(store.minutes)}</b><span>${esc(T.stMinutes)}</span></div>
      </section>
      <p class="course-has">${esc(T.courseHas)}: <b>${st.words}</b> ${esc(T.stWords)} · <b>${st.sentences}</b> ${esc(T.stSentences)} · <b>${st.tenses}</b> ${esc(T.stTenses)} · <b>${st.lessons}</b> ${esc(T.stLessons)} · <b>${pack().scenes.length}</b> 🎭</p>

      ${weakCount ? `<button class="review-btn" data-act="review"><span class="s-ic c3">${I('replay')}</span><div><b>${esc(T.review)}</b><small>${esc(T.reviewSub)} (${weakCount})</small></div></button>` : ''}

      <section class="gym-sec">
        <div class="sec-head"><h2>${I('bolt')} ${esc(T.gymTitle)}</h2><p>${esc(T.gymSub)}</p></div>
        <div class="gym-grid">
          ${root.PassoGym.GAMES.map((g) => `<button class="game-card hue-${g.hue}" data-game="${g.id}">
            <span class="g-ic">${I(g.icon)}</span><b>${esc(g.title[lang])}</b><small>${esc(g.desc[lang])}</small>
            ${store.gym[g.id] ? `<span class="g-rec">${I('trophy')} ${store.gym[g.id]}</span>` : ''}</button>`).join('')}
        </div>
      </section>

      <section class="map">
        <div class="sec-head"><h2>${I('target')} ${esc(T.levelsTitle)}</h2></div>
        ${levels.map((g) => {
          const ids = st.byLevel[g.level].lessons;
          const done = ids.filter(isDone).length;
          const pct = Math.round((done / ids.length) * 100);
          return `<div class="level lvl-${g.level}">
            <div class="level-head">
              <span class="lvl-badge">${esc(g.level)}</span>
              <div class="lvl-name"><b>${esc(LEVELS[g.level][lang])}</b><small>${ids.length} ${esc(T.stLessons)} · ${st.byLevel[g.level].words.size} ${esc(T.stWords)} · ${st.byLevel[g.level].sentences} ${esc(T.stSentences)}</small></div>
              <span class="ring" style="--p:${pct}"><b>${pct}%</b></span>
            </div>
            ${g.units.map((u) => `<div class="unit">
              <div class="unit-head"><h3>${esc(u.title[lang])}</h3><p>${esc(u.desc[lang])}</p></div>
              <div class="lessons">
                ${u.lessons.map((l) => {
                  const p = store.progress[l.id];
                  const inf = st.byLesson[l.id];
                  const tenses = l.rows ? l.rows.map((k) => `<span class="tdot t-${pack().lex.TENSES[k].time}" title="${esc(pack().lex.TENSES[k].it)}"></span>`).join('') : '<span class="tdot t-past"></span><span class="tdot t-present"></span><span class="tdot t-future"></span>';
                  return `<button class="lesson ${p && p.done ? 'done' : ''} ${l.id === nx.id ? 'next' : ''}" data-lesson="${l.id}">
                    <span class="l-top"><span class="tdots">${tenses}</span>${p && p.done ? stars(p.stars || 1) : l.id === nx.id ? `<span class="l-next">${I('play')}</span>` : ''}</span>
                    <span class="l-title">${esc(l.title[lang])}</span>
                    <span class="l-meta">${l.sentences ? `${l.sentences.length} ${esc(T.stSentences)} · ${inf.fresh.length} ${esc(T.stWords)}` : esc(T.overviewTag)} · ~${inf.minutes}′</span>
                  </button>`;
                }).join('')}
              </div>
            </div>`).join('')}
          </div>`;
        }).join('')}
      </section>`;
    show('home');
  }

  screens.home.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lang) { store.settings.lang = b.dataset.lang; save(); renderHome(); }
    else if (b.dataset.target) { store.settings.target = b.dataset.target; statsCache = null; save(); renderHome(); }
    else if (b.dataset.lesson) startLesson(lessons().find((l) => l.id === b.dataset.lesson));
    else if (b.dataset.game) startGame(b.dataset.game);
    else if (b.dataset.act === 'settings') openSettings();
    else if (b.dataset.act === 'review') startReview();
  });

  // ---------- Lesson ----------
  let player = null;
  let sessionWeak = new Set();

  function startLesson(lesson) {
    S.unlock();
    sessionWeak = new Set();
    const lang = store.settings.lang;
    if (player) player.destroy();
    if (gym) gym.stop();
    player = root.PassoPlayer.createPlayer(screens.player, {
      lang, settings: store.settings, t: t(), N: N[lang], pack: pack(),
      onExit: () => { player.destroy(); renderHome(); },
      onSettings: () => openSettings(() => player.resume()),
      onWeak: (id) => { sessionWeak.add(id); store.weak[id] = (store.weak[id] || 0) + 1; save(); },
      onDone: (result) => finishLesson(lesson, result),
      onSpeed: save,
    });
    show('player');
    player.load(lesson, root.PassoBuilder.build(pack(), lesson, lang));
  }

  function startReview() {
    const ids = Object.entries(store.weak).sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 12);
    if (!ids.length) return;
    startLesson({ id: 'review', type: 'review', ids, title: { ar: UI.ar.reviewTitle, en: UI.en.reviewTitle } });
  }

  function finishLesson(lesson, result) {
    const T = t();
    const pct = result.total ? Math.round((result.correct / result.total) * 100) : 100;
    const nStars = pct >= 90 ? 3 : pct >= 70 ? 2 : 1;
    if (lesson.type === 'review') {
      lesson.ids.forEach((id) => { if (!sessionWeak.has(id)) delete store.weak[id]; });
      markDay(4);
    } else {
      const prev = store.progress[lesson.id] || {};
      store.progress[lesson.id] = { done: true, best: Math.max(prev.best || 0, pct), stars: Math.max(prev.stars || 0, nStars), at: Date.now() };
      markDay(stats().byLesson[lesson.id].minutes);
    }
    save();
    const all = lessons();
    const idx = all.findIndex((l) => l.id === lesson.id);
    const nx = lesson.type === 'review' ? nextLesson() : all[idx + 1];
    const fresh = lesson.type === 'review' ? [] : stats().byLesson[lesson.id].fresh;
    screens.summary.innerHTML = `
      <div class="summary">
        <div class="sum-medal">${I('trophy')}</div>
        <h2>${esc(T.summaryTitle)}</h2>
        <div class="big-stars">${stars(nStars)}</div>
        ${result.total ? `<p class="score">${esc(T.score)}: <b>${result.correct} / ${result.total}</b> (${pct}%)</p>` : ''}
        ${fresh.length ? `<div class="vocab sum-vocab" dir="ltr">${fresh.map((v) => `<span class="vchip r-${v.role}"><i>${esc(v.ic || '•')}</i><b>${esc(v.it)}</b><small dir="auto">${esc(v.m ? v.m[store.settings.lang] : '')}</small></span>`).join('')}</div>` : ''}
        <div class="sum-actions">
          ${nx ? `<button class="btn primary big" data-lesson="${nx.id}">${esc(T.nextLesson)} ${I('next', 'flip')}</button>` : ''}
          <button class="btn" data-game="sprint">${I('bolt')} ${esc(root.PassoGym.GAMES[0].title[store.settings.lang])}</button>
          ${lesson.type === 'review' ? '' : `<button class="btn ghost" data-lesson="${lesson.id}">${I('replay')} ${esc(T.again)}</button>`}
          <button class="btn ghost" data-act="home">${esc(T.backHome)}</button>
        </div>
      </div>`;
    if (player) player.destroy();
    show('summary');
    root.PassoPlayer.sfx('good');
  }

  screens.summary.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lesson) startLesson(lessons().find((l) => l.id === b.dataset.lesson));
    else if (b.dataset.game) startGame(b.dataset.game);
    else renderHome();
  });

  // ---------- Gym ----------
  let gym = null;
  // Practice material: sentences of finished lessons, plus the first lessons so there is always enough
  function gymItems() {
    const ls = lessons().filter((l) => l.sentences);
    let chosen = ls.filter((l) => isDone(l.id));
    if (chosen.length < 2) chosen = chosen.concat(ls.slice(0, 3).filter((l) => !chosen.includes(l)));
    return chosen.flatMap((l) => Q.itemsOf(M.buildLesson(pack(), l)));
  }
  function startGame(id) {
    if (player) player.destroy();
    if (gym) gym.stop();
    applyDir();
    gym = root.PassoGym.createGym(screens.gym, {
      lang: store.settings.lang, t: t(), pack: pack(), settings: store.settings, scenes: pack().scenes,
      items: gymItems, sfx: root.PassoPlayer.sfx,
      record: (key) => store.gym[key] || 0,
      onRecord: (key, score) => {
        const best = store.gym[key] || 0;
        const isRecord = score > best && score > 0;
        if (isRecord) store.gym[key] = score;
        if (key.startsWith('scenes:') && score > (store.gym.scenes || 0)) store.gym.scenes = score;
        markDay(2);
        save();
        return { isRecord, best: Math.max(best, score) };
      },
      onExit: () => { gym.stop(); renderHome(); },
    });
    show('gym');
    gym.start(id);
  }

  // ---------- Settings ----------
  const dlg = $('#settings');
  let onSettingsClose = null;

  function voiceOptions(lang, selected) {
    return `<option value="">${esc(t().sAuto)}</option>` + S.voicesFor(lang)
      .map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === selected ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
  }

  function renderSettings() {
    const T = t();
    const s = store.settings;
    const nat = s.lang;
    const warn = [];
    if (!s.puck.on && !S.hasVoice(nat)) warn.push(T.noVoice + ` (${nat})`);
    if (!s.puck.on && !S.hasVoice('it')) warn.push(T.noVoice + ' (it)');
    if (!S.canListen) warn.push(T.noMic);
    dlg.innerHTML = `
      <form method="dialog" class="settings">
        <h2>${I('gear')} ${esc(T.settings)}</h2>
        ${warn.map((w) => `<p class="warn">${esc(w)}</p>`).join('')}
        <label for="s-speed">${esc(T.speed)} <output>${s.speed}×</output><input id="s-speed" type="range" name="speed" min="0.75" max="2" step="0.25" value="${s.speed}"></label>
        <fieldset class="puck">
          <legend>${I('speak')} ${esc(T.puckTitle)}</legend>
          <label class="check"><input id="s-puck" type="checkbox" name="puckOn" ${s.puck.on ? 'checked' : ''}> ${esc(T.puckOn)}</label>
          <label for="s-key">${esc(T.puckKey)}<input id="s-key" type="password" name="puckKey" autocomplete="off" value="${esc(s.puck.key)}" placeholder="AIza…"></label>
          <div class="row"><select id="s-pvoice" name="puckVoice">${GEMINI_VOICES.map((v) => `<option ${v === s.puck.voice ? 'selected' : ''}>${v}</option>`).join('')}</select><button type="button" class="btn small" data-test="puck">${I('speak')} ${esc(T.puckTest)}</button></div>
          <p class="help" id="puck-status">${esc(T.puckHelp)}</p>
        </fieldset>
        <label for="s-vn">${esc(T.sVoiceNative)}<div class="row"><select id="s-vn" name="vNative">${voiceOptions(nat, s.voice[nat])}</select><button type="button" class="btn small" data-test="native" aria-label="test">${I('speak')}</button></div></label>
        <label for="s-vi">${esc(T.sVoiceIt)}<div class="row"><select id="s-vi" name="vIt">${voiceOptions('it', s.voice.it)}</select><button type="button" class="btn small" data-test="it" aria-label="test">${I('speak')}</button></div></label>
        <label for="s-rate">${esc(T.sRate)} <output>${s.rate.toFixed(2)}×</output><input id="s-rate" type="range" name="rate" min="0.7" max="1.4" step="0.05" value="${s.rate}"></label>
        <label for="s-rateit">${esc(T.sRateIt)} <output>${s.rateIt.toFixed(2)}×</output><input id="s-rateit" type="range" name="rateIt" min="0.6" max="1.3" step="0.05" value="${s.rateIt}"></label>
        <label>${esc(T.sWait)}<div class="seg">
          ${[[0.7, T.short], [1, T.normal], [1.5, T.long]].map(([v, l]) => `<button type="button" data-wait="${v}" class="${s.wait === v ? 'on' : ''}">${esc(l)}</button>`).join('')}
        </div></label>
        <label class="check"><input id="s-mic" type="checkbox" name="mic" ${s.mic ? 'checked' : ''} ${S.canListen ? '' : 'disabled'}> ${esc(T.sMic)}</label>
        <label class="check"><input id="s-mean" type="checkbox" name="meanings" ${s.meanings ? 'checked' : ''}> ${esc(T.sMeaning)}</label>
        <button class="btn primary" value="close">${esc(T.close)}</button>
      </form>`;
  }

  function openSettings(onClose) {
    onSettingsClose = onClose || null;
    renderSettings();
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  }

  dlg.addEventListener('input', (e) => {
    const s = store.settings;
    const el = e.target;
    if (el.name === 'rate' || el.name === 'rateIt' || el.name === 'speed') {
      s[el.name] = +el.value;
      el.previousElementSibling.textContent = el.name === 'speed' ? `${+el.value}×` : `${(+el.value).toFixed(2)}×`;
    }
    if (el.name === 'mic') s.mic = el.checked;
    if (el.name === 'meanings') s.meanings = el.checked;
    if (el.name === 'vNative' || el.name === 'vIt') {
      const l = el.name === 'vIt' ? 'it' : s.lang;
      s.voice[l] = el.value || undefined;
      S.setVoice(l, el.value);
    }
    if (el.name === 'puckOn') s.puck.on = el.checked;
    if (el.name === 'puckKey') s.puck.key = el.value.trim();
    if (el.name === 'puckVoice') s.puck.voice = el.value;
    if (/^puck/.test(el.name)) S.configureGemini(s.puck);
    save();
  });
  dlg.addEventListener('click', async (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    const s = store.settings;
    if (b.dataset.wait) {
      s.wait = +b.dataset.wait; save();
      b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    }
    if (b.dataset.test === 'native') S.speakLine(s.lang === 'ar' ? 'هلا والله! أنا لوكا، مدرّبك.' : "Hi! I'm Luca, your coach.", { native: s.lang, target: 'it', rateNative: s.rate, rateTarget: s.rateIt });
    if (b.dataset.test === 'it') S.speak('Ciao! Io mangio una mela.', 'it', { rate: s.rateIt });
    if (b.dataset.test === 'puck') {
      const st = $('#puck-status', dlg);
      st.textContent = '…';
      S.configureGemini(Object.assign({}, s.puck, { on: true }));
      const r = await S.testGemini();
      st.textContent = r.ok ? t().puckOk : t().puckFail + r.error;
      if (r.ok) S.speakLine(s.lang === 'ar' ? 'هلا والله! أنا مدرّبك، [[Andiamo!]]' : "Hi! I'm your coach. [[Andiamo!]]", { native: s.lang, target: 'it', rateNative: s.rate, rateTarget: s.rateIt });
      S.configureGemini(s.puck);
    }
  });
  dlg.addEventListener('close', () => {
    if (screens.home.hidden === false) renderHome();
    if (onSettingsClose) { const f = onSettingsClose; onSettingsClose = null; f(); }
  });

  S.onVoices(() => { if (dlg.open) renderSettings(); });
  applyVoices();
  renderHome();

  root.PassoApp = { store, startLesson, startGame };
})(typeof self !== 'undefined' ? self : this);
