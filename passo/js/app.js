/* Passo a Passo — screens, settings and progress. */
(function (root) {
  'use strict';
  const { UI, N } = root.PassoI18n;
  const S = root.PassoSpeech;
  const M = root.PassoModel;
  const { esc } = root.PassoStage;
  const $ = (sel, el) => (el || document).querySelector(sel);

  const PACKS = { it: { conj: root.ItConj, lex: root.ItLex, course: root.ItCourse } };
  const TARGETS = [
    { id: 'it', flag: '🇮🇹', name: 'Italiano', ready: true },
    { id: 'es', flag: '🇪🇸', name: 'Español' },
    { id: 'fr', flag: '🇫🇷', name: 'Français' },
    { id: 'de', flag: '🇩🇪', name: 'Deutsch' },
  ];

  // ---------- Storage ----------
  const KEY = 'passo.v1';
  const DEFAULTS = { lang: 'ar', target: 'it', rate: 1, rateIt: 0.95, mic: true, wait: 1, meanings: true, voice: {} };
  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY) || '{}');
      return { settings: Object.assign({}, DEFAULTS, s.settings), progress: s.progress || {}, weak: s.weak || {} };
    } catch (e) { return { settings: Object.assign({}, DEFAULTS), progress: {}, weak: {} }; }
  }
  const store = load();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* private mode */ } };

  const pack = () => PACKS[store.settings.target];
  const lessons = () => M.allLessons(pack());
  const t = () => UI[store.settings.lang];

  function applyVoices() {
    Object.entries(store.settings.voice || {}).forEach(([l, uri]) => S.setVoice(l, uri));
  }

  function applyDir() {
    const lang = store.settings.lang;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.title = `Passo a Passo — ${t().tagline}`;
  }

  // ---------- Screens ----------
  const screens = { home: $('#home'), player: $('#player'), summary: $('#summary') };
  function show(name) {
    Object.entries(screens).forEach(([k, el]) => { el.hidden = k !== name; });
    root.scrollTo(0, 0);
  }

  function nextLesson() {
    return lessons().find((l) => !(store.progress[l.id] && store.progress[l.id].done)) || lessons()[0];
  }

  const stars = (n) => '★'.repeat(n) + '<span class="off">' + '★'.repeat(3 - n) + '</span>';

  function renderHome() {
    applyDir();
    const T = t();
    const lang = store.settings.lang;
    const nx = nextLesson();
    const weakCount = Object.keys(store.weak).length;
    const course = pack().course;

    screens.home.innerHTML = `
      <header class="home-top">
        <div class="brand"><span class="logo">🇮🇹</span><div><h1>Passo a Passo</h1><p>${esc(T.tagline)}</p></div></div>
        <button class="icon-btn" data-act="settings" aria-label="${esc(T.settings)}">⚙️</button>
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
        <div class="hero-badge">${esc(nx.unit.level)} · ${esc(nx.unit.title[lang])}</div>
        <h2>${esc(nx.title[lang])}</h2>
        <p>${esc(nx.goal[lang])}</p>
        <button class="btn primary big" data-lesson="${nx.id}">▶ ${esc(store.progress[nx.id] ? T.continue : T.start)}</button>
        <p class="tip">${esc(T.tipStart)}</p>
      </section>

      ${weakCount ? `<button class="review-btn" data-act="review"><span>🔁</span><div><b>${esc(T.review)}</b><small>${esc(T.reviewSub)} (${weakCount})</small></div></button>` : ''}

      <section class="map">
        ${course.units.map((u) => `
          <div class="unit">
            <div class="unit-head"><span class="lvl lvl-${u.level}">${esc(u.level)}</span><div><h3>${esc(u.title[lang])}</h3><p>${esc(u.desc[lang])}</p></div></div>
            <div class="lessons">
              ${u.lessons.map((l) => {
                const p = store.progress[l.id];
                return `<button class="lesson ${p && p.done ? 'done' : ''} ${l.id === nx.id ? 'next' : ''}" data-lesson="${l.id}">
                  <span class="l-title">${esc(l.title[lang])}</span>
                  <span class="l-meta">${p && p.done ? `<span class="stars">${stars(p.stars || 1)}</span>` : l.rows ? l.rows.map((k) => pack().lex.TENSES[k].icon).join(' ') : '🗺️'}</span>
                </button>`;
              }).join('')}
            </div>
          </div>`).join('')}
      </section>`;
    show('home');
  }

  screens.home.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.lang) { store.settings.lang = b.dataset.lang; save(); renderHome(); }
    else if (b.dataset.target) { store.settings.target = b.dataset.target; save(); renderHome(); }
    else if (b.dataset.lesson) startLesson(lessons().find((l) => l.id === b.dataset.lesson));
    else if (b.dataset.act === 'settings') openSettings();
    else if (b.dataset.act === 'review') startReview();
  });

  // ---------- Lesson ----------
  let player = null;
  let current = null;
  let sessionWeak = new Set();

  function startLesson(lesson) {
    S.unlock();
    current = lesson;
    sessionWeak = new Set();
    const lang = store.settings.lang;
    if (player) player.destroy();
    player = root.PassoPlayer.createPlayer(screens.player, {
      lang, settings: store.settings, t: t(), N: N[lang], pack: pack(),
      onExit: () => { player.destroy(); renderHome(); },
      onSettings: () => openSettings(() => player.resume()),
      onWeak: (id) => { sessionWeak.add(id); store.weak[id] = (store.weak[id] || 0) + 1; save(); },
      onDone: (result) => finishLesson(lesson, result),
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
    } else {
      const prev = store.progress[lesson.id] || {};
      store.progress[lesson.id] = { done: true, best: Math.max(prev.best || 0, pct), stars: Math.max(prev.stars || 0, nStars), at: Date.now() };
    }
    save();
    const all = lessons();
    const idx = all.findIndex((l) => l.id === lesson.id);
    const nx = lesson.type === 'review' ? nextLesson() : all[idx + 1];
    screens.summary.innerHTML = `
      <div class="summary">
        <div class="confetti" aria-hidden="true">${'🎉✨🇮🇹⭐'.repeat(3)}</div>
        <h2>${esc(T.summaryTitle)}</h2>
        <div class="big-stars">${stars(nStars)}</div>
        ${result.total ? `<p class="score">${esc(T.score)}: <b>${result.correct} / ${result.total}</b> (${pct}%)</p>` : ''}
        <div class="sum-actions">
          ${nx ? `<button class="btn primary big" data-lesson="${nx.id}">${esc(T.nextLesson)} ▶</button>` : ''}
          ${lesson.type === 'review' ? '' : `<button class="btn" data-lesson="${lesson.id}">↺ ${esc(T.again)}</button>`}
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
    else renderHome();
  });

  // ---------- Settings ----------
  const dlg = $('#settings');
  let onSettingsClose = null;

  function voiceOptions(lang, selected) {
    const T = t();
    return `<option value="">${esc(T.sAuto)}</option>` + S.voicesFor(lang)
      .map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === selected ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('');
  }

  function renderSettings() {
    const T = t();
    const s = store.settings;
    const nat = s.lang;
    const warn = [];
    if (!S.hasVoice(nat)) warn.push(T.noVoice + ` (${nat})`);
    if (!S.hasVoice('it')) warn.push(T.noVoice + ' (it)');
    if (!S.canListen) warn.push(T.noMic);
    dlg.innerHTML = `
      <form method="dialog" class="settings">
        <h2>⚙️ ${esc(T.settings)}</h2>
        ${warn.map((w) => `<p class="warn">⚠️ ${esc(w)}</p>`).join('')}
        <label>${esc(T.sVoiceNative)}<div class="row"><select name="vNative">${voiceOptions(nat, s.voice[nat])}</select><button type="button" class="btn small" data-test="native">🔊</button></div></label>
        <label>${esc(T.sVoiceIt)}<div class="row"><select name="vIt">${voiceOptions('it', s.voice.it)}</select><button type="button" class="btn small" data-test="it">🔊</button></div></label>
        <label>${esc(T.sRate)} <output>${s.rate.toFixed(2)}×</output><input type="range" name="rate" min="0.7" max="1.4" step="0.05" value="${s.rate}"></label>
        <label>${esc(T.sRateIt)} <output>${s.rateIt.toFixed(2)}×</output><input type="range" name="rateIt" min="0.6" max="1.3" step="0.05" value="${s.rateIt}"></label>
        <label>${esc(T.sWait)}<div class="seg">
          ${[[0.7, T.short], [1, T.normal], [1.5, T.long]].map(([v, l]) => `<button type="button" data-wait="${v}" class="${s.wait === v ? 'on' : ''}">${esc(l)}</button>`).join('')}
        </div></label>
        <label class="check"><input type="checkbox" name="mic" ${s.mic ? 'checked' : ''} ${S.canListen ? '' : 'disabled'}> ${esc(T.sMic)}</label>
        <label class="check"><input type="checkbox" name="meanings" ${s.meanings ? 'checked' : ''}> ${esc(T.sMeaning)}</label>
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
    if (el.name === 'rate' || el.name === 'rateIt') { s[el.name] = +el.value; el.previousElementSibling.textContent = `${(+el.value).toFixed(2)}×`; }
    if (el.name === 'mic') s.mic = el.checked;
    if (el.name === 'meanings') s.meanings = el.checked;
    if (el.name === 'vNative' || el.name === 'vIt') {
      const l = el.name === 'vIt' ? 'it' : s.lang;
      s.voice[l] = el.value || undefined;
      S.setVoice(l, el.value);
    }
    save();
  });
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.wait) {
      store.settings.wait = +b.dataset.wait; save();
      b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    }
    if (b.dataset.test === 'native') S.speakLine(store.settings.lang === 'ar' ? 'أهلًا! أنا لوكا، معلّمك.' : "Hi! I'm Luca, your instructor.", { native: store.settings.lang, target: 'it', rateNative: store.settings.rate, rateTarget: store.settings.rateIt });
    if (b.dataset.test === 'it') S.speak('Ciao! Io mangio una mela.', 'it', { rate: store.settings.rateIt });
  });
  dlg.addEventListener('close', () => {
    if (screens.home.hidden === false) renderHome();
    if (onSettingsClose) { const f = onSettingsClose; onSettingsClose = null; f(); }
  });

  S.onVoices(() => { if (dlg.open) renderSettings(); });
  applyVoices();
  renderHome();

  root.PassoApp = { store, startLesson };
})(typeof self !== 'undefined' ? self : this);
