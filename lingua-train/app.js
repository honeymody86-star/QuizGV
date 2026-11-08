/* قطار اللغات — الواجهة والتشغيل */
(function () {
  const LT = window.LT, G = LT.G;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const app = $('#app');
  const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));
  const shuffle = (a) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const rand = (a) => a[Math.floor(Math.random() * a.length)];
  const AR_NUM = (n) => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);

  /* ---------- التخزين ---------- */
  const store = {
    get(k, d) { try { const v = localStorage.getItem('lt.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('lt.' + k, JSON.stringify(v)); } catch (e) { /* التخزين غير متاح */ } },
  };
  const SET = Object.assign({ speed: 'tr:mid', passes: 3, auto: true, sound: true, wordFirst: true, voices: {}, theme: 'auto' }, store.get('settings', {}));
  const PROG = Object.assign({ xp: 0, streak: { d: '', n: 0 }, langs: {} }, store.get('progress', {}));
  const saveSet = () => store.set('settings', SET);
  const saveProg = () => store.set('progress', PROG);

  const SPEEDS = {
    tr: { calm: { ar: '🐢 تسارع هادئ', a: 0.5, b: 1.0 }, mid: { ar: '🚆 تسارع متوسط', a: 0.6, b: 1.3 }, fast: { ar: '🚄 تسارع سريع', a: 0.8, b: 1.6 } },
    fx: { '0.5': '🐌 بطيء جداً ٠٫٥×', '0.75': '🐢 بطيء ٠٫٧٥×', '1': '🚃 عادي ١×', '1.25': '🚆 سريع ١٫٢٥×', '1.5': '🚄 سريع جداً ١٫٥×' },
  };
  function ladder(passes) {
    const [kind, id] = SET.speed.split(':');
    if (kind === 'fx') return Array(passes).fill(parseFloat(id));
    const s = SPEEDS.tr[id] || SPEEDS.tr.mid;
    if (passes === 1) return [s.a];
    return Array.from({ length: passes }, (_, k) => +(s.a + (s.b - s.a) * k / (passes - 1)).toFixed(2));
  }
  const stageOf = (r) => r < 0.7 ? '🐢 انطلاق' : r < 0.95 ? '🚃 تسارع' : r < 1.25 ? '🚆 سرعة' : '🚄 إكسبريس';

  function applyTheme() {
    if (SET.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', SET.theme);
  }
  applyTheme();

  /* ---------- التقدّم ---------- */
  const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
  function touchStreak() {
    const t = today();
    if (PROG.streak.d === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const yd = `${y.getFullYear()}-${y.getMonth() + 1}-${y.getDate()}`;
    PROG.streak = { d: t, n: PROG.streak.d === yd ? PROG.streak.n + 1 : 1 };
  }
  function addXP(n) { PROG.xp += n; touchStreak(); saveProg(); renderStats(); }
  const lp = (L) => (PROG.langs[L] = PROG.langs[L] || {});
  const key = (u, r, i) => `${u}-${r}-${i}`;
  const TOTAL = LT.UNITS.length * LT.ROUNDS.length * 10;
  function nextLesson(L) {
    const p = lp(L);
    for (let u = 0; u < LT.UNITS.length; u++) for (let r = 0; r < LT.ROUNDS.length; r++) for (let i = 0; i < LT.UNITS[u].s.length; i++) {
      if (!p[key(u, r, i)]) return { u, r, i };
    }
    return { u: 0, r: 0, i: 0 };
  }
  const doneCount = (L) => Object.keys(lp(L)).length;
  function renderStats() { $('#xp').textContent = AR_NUM(PROG.xp); $('#streak').textContent = AR_NUM(PROG.streak.n || 0); }

  /* ---------- النطق ---------- */
  const TTS = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let VOICES = [];
  function loadVoices() { if (TTS) VOICES = TTS.getVoices(); }
  if (TTS) { loadVoices(); TTS.onvoiceschanged = loadVoices; }
  const langOf = (L) => LT.LANGS.find(x => x.id === L);
  function voicesFor(L) {
    const norm = (v) => v.lang.replace('_', '-').toLowerCase();
    return VOICES.filter(v => norm(v).startsWith(L));
  }
  function voiceFor(L) {
    const list = voicesFor(L);
    if (!list.length) return null;
    const saved = SET.voices[L] && list.find(v => v.voiceURI === SET.voices[L]);
    if (saved) return saved;
    const codes = langOf(L).tts.map(c => c.toLowerCase());
    const score = (v) => {
      const lang = v.lang.replace('_', '-').toLowerCase();
      let s = 0;
      const ci = codes.indexOf(lang); if (ci >= 0) s += 20 - ci * 3;
      if (/natural|neural|premium|enhanced|google/i.test(v.name)) s += 6;
      if (v.localService) s += 1;
      return s;
    };
    return list.slice().sort((a, b) => score(b) - score(a))[0];
  }
  const estimate = (text, rate) => (text.length * 68 + 320) / rate;
  let warnedNoVoice = false;
  function speak(text, rate, L, onBoundary) {
    return new Promise(res => {
      const v = TTS && SET.sound ? voiceFor(L) : null;
      if (!TTS || !SET.sound) { setTimeout(res, estimate(text, rate)); return; }
      if (!v && VOICES.length) {
        // الجهاز فيه أصوات لكن ليس لهذه اللغة: نكمل العرض بالتوقيت فقط
        if (!warnedNoVoice) { warnedNoVoice = true; toast('لا يوجد صوت لهذه اللغة في جهازك — ثبّت صوتها من إعدادات الجهاز', 4000); }
        setTimeout(res, estimate(text, rate)); return;
      }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = v ? v.lang : langOf(L).tts[0];
      if (v) u.voice = v;
      u.rate = Math.max(0.1, Math.min(2, rate));
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(to); res(); } };
      const to = setTimeout(fin, estimate(text, rate) * 2.5 + 2500);
      u.onend = fin; u.onerror = fin;
      if (onBoundary) u.onboundary = onBoundary;
      TTS.speak(u);
    });
  }
  function hush() { if (TTS) TTS.cancel(); }

  /* ---------- أدوات العرض ---------- */
  function lineHTML(line, k, o = {}) {
    const us = G.units(line);
    return `<div class="sent${k ? ' ans' : ''}${o.plain ? ' plain' : ''}">` + us.map((u, j) =>
      `<span class="u${o.off ? ' off' : ''}" data-j="${j}">${u.map(t => `<span class="t r-${t.r}">${esc(t.w)}</span>`).join('')}</span>`).join(' ') + '</div>';
  }
  const stripP = (u) => u.filter(t => t.r !== 'p').map(t => t.w).join('');
  function toast(msg, ms = 2600) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(() => { t.hidden = true; }, ms);
  }
  function modal(html) { $('#sheet').innerHTML = html; $('#modal').hidden = false; }
  function closeModal() { $('#modal').hidden = true; }
  $('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

  /* ---------- التنقّل ---------- */
  const NAV = { view: 'home', L: null };
  function go(view, params = {}) {
    stopPlayback();
    Object.assign(NAV, params, { view });
    $('#dock').hidden = view !== 'lesson';
    $('#back').hidden = view === 'home';
    window.scrollTo({ top: 0 });
    ({ home: renderHome, route: renderRoute, lesson: renderLesson, practice: renderPractice, words: renderWords })[view]();
  }
  $('#brand').onclick = () => go('home');
  $('#back').onclick = () => {
    if (NAV.view === 'route') go('home');
    else if (NAV.view === 'practice') go('lesson');
    else go('route');
  };

  /* ---------- الرئيسية ---------- */
  function renderHome() {
    const totalDone = LT.LANGS.reduce((s, l) => s + doneCount(l.id), 0);
    app.innerHTML = `
    <section class="view">
      <div class="hero">
        <div class="eyebrow" style="color:rgba(255,255,255,.7)">${AR_NUM(LT.LANGS.length)} لغات · ${AR_NUM(LT.UNITS.length * 10)} جملة · ${AR_NUM(LT.ROUNDS.length)} ضمائر · ٣٠ صيغة لكل جملة</div>
        <h1>قطار اللغات</h1>
        <p>اركب القطار: كل جملة تُبنى أمامك كلمة كلمة، في الماضي والحاضر والمستقبل، مثبتةً ومنفيةً وسؤالاً. يبدأ القطار بطيئاً ثم يتسارع مع كل تكرار حتى تنطق الصيغ بسرعة دون تفكير.</p>
        <div class="statsrow">
          <span class="stat">🚉 ${AR_NUM(totalDone)} محطة مكتملة</span>
          <span class="stat">⭐ ${AR_NUM(PROG.xp)} نقطة</span>
          <span class="stat">🔥 ${AR_NUM(PROG.streak.n || 0)} يوم متتالٍ</span>
        </div>
        <div class="track" aria-hidden="true"><span class="train">🚂🚃🚃🚃</span></div>
      </div>
      <h2>اختر خطّ اللغة</h2>
      <div class="langs">
        ${LT.LANGS.map(l => {
      const d = doneCount(l.id), pct = Math.round(d / TOTAL * 100);
      return `<button class="langcard" data-l="${l.id}">
            <div class="top"><span class="flag">${l.flag}</span><div><div class="nm" lang="${l.id}">${l.name}</div><div class="ar">${l.ar}</div></div></div>
            <div class="bar"><i style="width:${pct}%"></i></div>
            <div class="muted" style="font-size:13px">${AR_NUM(d)} / ${AR_NUM(TOTAL)} محطة</div>
          </button>`;
    }).join('')}
        <div class="langcard soon"><div class="top"><span class="flag">🌍</span><div><div class="nm">+</div><div class="ar">لغات أخرى قريباً</div></div></div></div>
      </div>
      <h2>كيف تعمل الرحلة؟</h2>
      <div class="how">
        <div><span class="ic">🧱</span><b>جملة واحدة، ٣٠ صيغة</b>نفس الجملة تتحول إلى منفي، وسؤال نعم/لا، وأسئلة مَن وماذا ومتى وأين ولماذا وكيف ولِمَن، في كل زمن.</div>
        <div><span class="ic">🚆</span><b>تسارع القطار</b>كل صيغة تُعرض كلمة كلمة ببطء، ثم تتكرر بسرعة أعلى في كل مرة. والصيغ تبقى ثابتة أمامك، كل واحدة تحت التي قبلها.</div>
        <div><span class="ic">🎨</span><b>ألوان الجملة</b>الفاعل بالأسود، والفعل المساعد بالأخضر، والفعل الرئيسي بالأحمر، والمفعول به بالأزرق، والزمان بالبنفسجي، والمكان بالبرتقالي.</div>
        <div><span class="ic">👥</span><b>الضمائر بالتدريج</b>أول ١٠ جمل بضمير «أنا» فقط، ثم نعود للجملة الأولى بضمير «أنتَ»، ثم «هو/هي»، ثم «نحن»، ثم «هم».</div>
        <div><span class="ic">🎯</span><b>تمارين الإتقان</b>ترتيب الكلمات، واختيار الصيغة، والاستماع، وصيد الأدوار، والعرض الخاطف، وإكمال الفراغ.</div>
      </div>
    </section>`;
    $$('.langcard[data-l]').forEach(b => b.onclick = () => go('route', { L: b.dataset.l }));
  }

  /* ---------- خريطة الخطوط ---------- */
  function renderRoute() {
    const L = NAV.L, lang = langOf(L), p = lp(L), nx = nextLesson(L);
    app.innerHTML = `
    <section class="view">
      <div class="routehead">
        <div style="display:flex;gap:12px;align-items:center">
          <span class="flag">${lang.flag}</span>
          <div><h2 lang="${L}">${lang.name}</h2><div class="muted">${lang.ar} · ${AR_NUM(doneCount(L))} من ${AR_NUM(TOTAL)} محطة</div></div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-main" id="cont">▶ أكمل الرحلة</button>
          <button class="btn btn-ghost" id="words">📚 بنك الكلمات</button>
        </div>
      </div>
      ${LT.UNITS.map((U, u) => `
        <div class="unit" style="--lc:${U.color}">
          <div class="uh"><span class="linebadge" style="background:${U.color}">${U.icon} الخط ${AR_NUM(u + 1)}</span><h3>${U.ar}</h3></div>
          ${LT.ROUNDS.map((R, r) => `
            <div class="round">
              <div class="rl">${R.pr.map(k => LT.PRON_EMOJI[k]).join('')} ${R.ar} <span class="muted" lang="${L}" style="font-family:var(--f-sent);font-weight:500">(${R.pr.map(k => LT.PRON[L][k][0]).join('/')})</span></div>
              <div class="stations">
                ${U.s.map((s, i) => {
      const st = p[key(u, r, i)];
      const isNext = nx.u === u && nx.r === r && nx.i === i;
      return `<button class="st${st ? ' done' : ''}${isNext ? ' next' : ''}" data-k="${u},${r},${i}" title="${esc(s[2])}" aria-label="${esc(s[2])}">${s[1]}${st && st.stars ? `<span class="stars">${'⭐'.repeat(st.stars)}</span>` : ''}</button>`;
    }).join('')}
              </div>
            </div>`).join('')}
        </div>`).join('')}
    </section>`;
    $('#cont').onclick = () => go('lesson', nx);
    $('#words').onclick = () => go('words');
    $$('.st').forEach(b => b.onclick = () => { const [u, r, i] = b.dataset.k.split(',').map(Number); go('lesson', { u, r, i }); });
    const nb = $('.st.next'); if (nb) nb.scrollIntoView({ block: 'center' });
  }

  /* ---------- الدرس (لوحة الصيغ) ---------- */
  const P = { cells: [], els: [], i: 0, playing: false, run: 0, revealed: [], express: false };

  function renderLesson() {
    const { L, u, r, i } = NAV;
    const pk = G.pronounFor(r, i);
    NAV.pk = pk;
    const { S, cells } = G.lesson(L, u, i, pk);
    NAV.S = S;
    P.cells = cells; P.i = 0; P.revealed = cells.map(() => false); P.playing = false;
    const U = LT.UNITS[u], lang = langOf(L), V = LT.VERBS[S.verb];
    const prWord = LT.PRON[L][pk][0];
    const roles = ['subj', 'aux', 'verb', 'obj', 'neg', 'qw', 'time', 'place', 'reason', 'manner', 'poss'];

    app.innerHTML = `
    <section class="view">
      <div class="lessonhead">
        <div class="window">${S.emoji}</div>
        <div style="min-width:0">
          <div class="eyebrow">الخط ${AR_NUM(u + 1)} · ${U.ar} · المحطة ${AR_NUM(i + 1)}</div>
          <h2>${esc(S.ar)}</h2>
          <div class="meta">
            <span class="chip">${lang.flag} ${lang.ar}</span>
            <span class="chip" style="background:${U.color};color:#fff;border-color:${U.color}">${LT.PRON_EMOJI[pk]} الضمير: <b lang="${L}" style="font-family:var(--f-sent)">${esc(prWord)}</b> = ${LT.PRON_AR[pk]}</span>
            <span class="chip">${V.e} <b lang="${L}" style="font-family:var(--f-sent)">${esc(V[L][0])}</b> = ${V.ar}</span>
          </div>
        </div>
        <div class="gauge" aria-live="polite">
          <svg viewBox="0 0 132 76" aria-hidden="true">
            <path d="M10 70 A56 56 0 0 1 122 70" fill="none" stroke="var(--line)" stroke-width="10" stroke-linecap="round"/>
            <path id="gArc" d="M10 70 A56 56 0 0 1 122 70" fill="none" stroke="var(--signal)" stroke-width="10" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/>
            <g id="gNeedle" style="transform-origin:66px 70px;transition:transform .5s cubic-bezier(.3,1.4,.5,1)"><line x1="66" y1="70" x2="66" y2="24" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/></g>
            <circle cx="66" cy="70" r="6" fill="var(--ink)"/>
          </svg>
          <div class="kmh"><span id="kmh">0</span> <small style="font-size:11px">كم/س</small></div>
          <div><div class="stage" id="stage">🚉 في المحطة</div><div class="cars" id="cars"></div></div>
        </div>
      </div>

      <div class="legend">${roles.map(k => `<span><i style="background:var(--r-${k})"></i>${LT.ROLES[k]}</span>`).join('')}</div>

      <div class="tabs" id="tabs">${LT.TENSES.map((t, k) => `<button data-t="${k}" class="${k === 0 ? 'on' : ''}">${t.icon} ${t.ar}</button>`).join('')}</div>

      <div class="board" id="board" data-tense="0">
        <div class="corner"></div>
        ${LT.TENSES.map(t => `<div class="th">${t.icon} ${t.ar}</div>`).join('')}
        ${LT.ROWS.map((row, rI) => `
          <div class="rowlab"><span class="ic">${row.icon}</span><span>${row.ar}</span></div>
          ${[0, 1, 2].map(t => {
      const idx = rI * 3 + t, c = cells[idx];
      return `<div class="cell idle" data-idx="${idx}" data-t="${t}" tabindex="0" role="button" aria-label="${row.ar} — ${LT.TENSES[t].ar}">
              <div class="clab">${row.icon} ${row.ar} · ${LT.TENSES[t].ar}</div>
              ${c.lines.map((ln, k) => lineHTML(ln, k, { off: true })).join('')}
              <div class="rail"><span class="loco">🚆</span></div>
            </div>`;
    }).join('')}`).join('')}
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-main" id="toPractice">🎯 تمارين الإتقان</button>
        <button class="btn btn-ghost" id="toNext">المحطة التالية ⬅</button>
      </div>
    </section>`;

    P.els = $$('.cell', app);
    P.els.forEach((el, k) => {
      el.onclick = () => jumpTo(k);
      el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpTo(k); } };
    });
    $$('#tabs button').forEach(b => b.onclick = () => setTab(+b.dataset.t));
    $('#toPractice').onclick = () => go('practice');
    $('#toNext').onclick = () => goNextLesson();
    setGauge(0, -1);
    syncDock();
  }

  function goNextLesson() {
    const { L, u, r, i } = NAV;
    let nu = u, nr = r, ni = i + 1;
    if (ni >= LT.UNITS[u].s.length) { ni = 0; nr++; }
    if (nr >= LT.ROUNDS.length) { nr = 0; nu++; }
    if (nu >= LT.UNITS.length) { go('route'); return; }
    go('lesson', { L, u: nu, r: nr, i: ni });
  }

  function setTab(t) {
    const b = $('#board'); if (!b) return;
    b.dataset.tense = t;
    $$('#tabs button').forEach(x => x.classList.toggle('on', +x.dataset.t === t));
  }

  function setGauge(rate, pass) {
    const pct = Math.max(0, Math.min(1, (rate - 0.3) / 1.4));
    const n = $('#gNeedle'), a = $('#gArc');
    if (!n) return;
    n.style.transform = `rotate(${-90 + pct * 180}deg)`;
    a.setAttribute('stroke-dasharray', `${pct * 100} 100`);
    $('#kmh').textContent = AR_NUM(Math.round(rate * 120));
    $('#stage').textContent = rate ? stageOf(rate) : '🚉 في المحطة';
    const passes = P.express ? 1 : SET.passes;
    $('#cars').innerHTML = Array.from({ length: passes }, (_, k) => `<span class="${k <= pass ? 'on' : ''}"></span>`).join('');
  }

  function revealCellStatic(k) {
    const el = P.els[k]; if (!el) return;
    el.classList.remove('idle'); el.classList.add('done');
    $$('.u', el).forEach(u => u.classList.remove('off'));
    P.revealed[k] = true;
  }

  function setActive(k) {
    P.els.forEach((el, j) => el.classList.toggle('active', j === k));
    const el = P.els[k]; if (!el) return;
    el.classList.remove('idle');
    setTab(P.cells[k].t);
    const rect = el.getBoundingClientRect();
    const dockH = $('#dock').offsetHeight || 0;
    if (rect.top < 70 || rect.bottom > window.innerHeight - dockH - 10) {
      el.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
    }
  }

  function moveLoco(el, uEl, frac) {
    const loco = $('.loco', el); if (!loco) return;
    if (uEl) loco.style.left = Math.max(0, uEl.offsetLeft + uEl.offsetWidth / 2 - 12) + 'px';
    else if (frac != null) loco.style.left = (frac * 100) + '%';
  }

  async function revealLine(k, li, rate, id) {
    const el = P.els[k], lineEl = $$('.sent', el)[li];
    const us = $$('.u', lineEl), groups = G.units(P.cells[k].lines[li]);
    us.forEach(u => u.classList.add('off'));
    for (let j = 0; j < us.length; j++) {
      if (id !== P.run) return;
      us.forEach(u => u.classList.remove('hot'));
      us[j].classList.remove('off'); us[j].classList.add('hot');
      moveLoco(el, us[j]);
      const txt = stripP(groups[j]);
      if (SET.wordFirst && SET.sound && txt) await speak(txt, Math.max(0.5, rate * 0.95), NAV.L);
      else await sleep(Math.max(220, 650 / rate));
      if (SET.wordFirst) await sleep(Math.max(60, 180 / rate));
    }
    us.forEach(u => u.classList.remove('hot'));
  }

  async function sweepLine(k, li, rate, id) {
    const el = P.els[k], lineEl = $$('.sent', el)[li];
    const us = $$('.u', lineEl), groups = G.units(P.cells[k].lines[li]);
    us.forEach(u => u.classList.remove('off'));
    const texts = groups.map(G.unitText);
    const text = texts.join(' ');
    const starts = []; let pos = 0;
    texts.forEach(t => { starts.push(pos); pos += t.length + 1; });
    const total = estimate(text, rate);
    let gotB = false, cur = -1, t0 = performance.now();
    const hot = (j) => {
      if (j === cur || j < 0 || j >= us.length) return;
      cur = j; us.forEach(u => u.classList.remove('hot')); us[j].classList.add('hot'); moveLoco(el, us[j]);
    };
    hot(0);
    const timer = setInterval(() => {
      if (gotB || id !== P.run) return;
      const ch = (performance.now() - t0) / total * text.length;
      let j = 0; while (j + 1 < starts.length && starts[j + 1] <= ch) j++;
      hot(j);
    }, 60);
    await speak(text, rate, NAV.L, (e) => {
      if (e.name && e.name !== 'word') return;
      gotB = true;
      let j = 0; while (j + 1 < starts.length && starts[j + 1] <= e.charIndex) j++;
      hot(j);
    });
    clearInterval(timer);
    if (!SET.sound || !TTS) await sleep(150);
    us.forEach(u => u.classList.remove('hot'));
  }

  async function playCell(k, id) {
    const c = P.cells[k];
    setActive(k);
    const rates = P.express ? [Math.max(1.3, ladder(2)[1])] : ladder(SET.passes);
    for (let p = 0; p < rates.length; p++) {
      setGauge(rates[p], p);
      for (let li = 0; li < c.lines.length; li++) {
        if (id !== P.run) return false;
        if (p === 0 && !P.revealed[k] && !P.express) {
          await revealLine(k, li, rates[p], id);
          if (rates.length === 1 && id === P.run) await sweepLine(k, li, rates[p], id);
        } else await sweepLine(k, li, rates[p], id);
        if (id !== P.run) return false;
        await sleep(c.lines.length > 1 && li === 0 ? 260 : 120);
      }
      if (p < rates.length - 1) await sleep(320);
    }
    P.revealed[k] = true;
    P.els[k].classList.add('done');
    return true;
  }

  async function playFrom(k) {
    hush();
    const id = ++P.run;
    P.playing = true; syncDock();
    touchStreak(); saveProg(); renderStats();
    for (let j = k; j < P.cells.length; j++) {
      P.i = j;
      const ok = await playCell(j, id);
      if (!ok || id !== P.run) return;
      if (!SET.auto && !P.express) { P.i = j + 1; P.playing = false; syncDock(); setGauge(0, -1); return; }
      await sleep(P.express ? 200 : 420);
    }
    if (id !== P.run) return;
    P.playing = false; P.i = 0; syncDock(); setGauge(0, -1);
    P.els.forEach(el => el.classList.remove('active'));
    const wasExpress = P.express; P.express = false;
    finishBoard(wasExpress);
  }

  function stopPlayback() { P.run++; hush(); P.playing = false; syncDock(); }
  function jumpTo(k) { stopPlayback(); P.express = false; P.i = k; playFrom(k); }

  function finishBoard(wasExpress) {
    const { L, u, r, i } = NAV, k = key(u, r, i), p = lp(L);
    const first = !p[k];
    p[k] = p[k] || { stars: 0 };
    saveProg();
    if (first) addXP(20);
    modal(`
      <div class="big">${wasExpress ? '⚡' : '🏁'}</div>
      <h2>${wasExpress ? 'جولة إكسبريس مكتملة!' : 'وصلت المحطة!'}</h2>
      <p class="muted">شاهدت ${AR_NUM(30)} صيغة للجملة «${esc(NAV.S.ar)}»${first ? ' · +٢٠ نقطة' : ''}</p>
      <div class="acts">
        <button class="btn btn-main" data-a="practice">🎯 تمارين الإتقان</button>
        <button class="btn btn-rail" data-a="express">⚡ جولة إكسبريس (كل الصيغ بسرعة)</button>
        <button class="btn btn-ghost" data-a="next">المحطة التالية ⬅</button>
        <button class="btn btn-ghost" data-a="route">🗺️ خريطة الخطوط</button>
      </div>`);
    $$('#sheet [data-a]').forEach(b => b.onclick = () => {
      closeModal();
      const a = b.dataset.a;
      if (a === 'practice') go('practice');
      else if (a === 'express') { P.express = true; P.cells.forEach((_, j) => revealCellStatic(j)); playFrom(0); }
      else if (a === 'next') goNextLesson();
      else go('route');
    });
  }

  /* شريط التحكم */
  function fillSpeedSel() {
    const s = $('#speedSel');
    s.innerHTML = `<optgroup label="تسارع القطار">${Object.entries(SPEEDS.tr).map(([k, v]) => `<option value="tr:${k}">${v.ar}</option>`).join('')}</optgroup>
      <optgroup label="سرعة ثابتة">${Object.entries(SPEEDS.fx).map(([k, v]) => `<option value="fx:${k}">${v}</option>`).join('')}</optgroup>`;
  }
  fillSpeedSel();
  function syncDock() {
    $('#playBtn').textContent = P.playing ? '⏸' : '▶';
    $('#playBtn').setAttribute('aria-label', P.playing ? 'إيقاف مؤقت' : 'تشغيل');
    $('#speedSel').value = SET.speed;
    $('#passSel').value = String(SET.passes);
    $('#autoBtn').classList.toggle('on', SET.auto);
    $('#soundBtn').classList.toggle('on', SET.sound);
  }
  $('#playBtn').onclick = () => {
    if (P.playing) { stopPlayback(); setGauge(0, -1); }
    else { P.express = false; playFrom(Math.min(P.i, P.cells.length - 1)); }
  };
  $('#prevCell').onclick = () => jumpTo(Math.max(0, P.i - 1));
  $('#nextCell').onclick = () => jumpTo(Math.min(P.cells.length - 1, P.i + (P.playing ? 1 : 0)));
  $('#speedSel').onchange = (e) => { SET.speed = e.target.value; saveSet(); };
  $('#passSel').onchange = (e) => { SET.passes = +e.target.value; saveSet(); };
  $('#autoBtn').onclick = () => { SET.auto = !SET.auto; saveSet(); syncDock(); toast(SET.auto ? '🔁 العرض التلقائي: ينتقل القطار للصيغة التالية وحده' : '✋ العرض اليدوي: اضغط ▶ لكل صيغة'); };
  $('#soundBtn').onclick = () => { SET.sound = !SET.sound; saveSet(); syncDock(); if (!SET.sound) hush(); };
  $('#revealBtn').onclick = () => { P.cells.forEach((_, j) => revealCellStatic(j)); };

  /* ---------- التمارين ---------- */
  const X = { list: [], k: 0, score: 0, results: [] };
  const TYPES_AR = { build: '🧩 رتّب الكلمات', choose: '🎯 اختر الصيغة', listen: '🎧 استمع واختر', hunt: '🔦 صيد الأدوار', flash: '⚡ العرض الخاطف', gap: '✏️ أكمل الفراغ' };

  function renderPractice() {
    if (!P.cells.length || !NAV.S) { go('route'); return; }
    X.list = shuffle(['build', 'choose', 'listen', 'hunt', 'flash', 'gap', 'build', 'choose', 'listen', 'gap']);
    X.k = 0; X.score = 0; X.results = [];
    nextEx();
  }
  const mainLine = (c) => c.lines[0];
  const lineStr = (c) => G.lineText(mainLine(c));
  function distractorsFor(c, n = 3) {
    const same = P.cells.filter(x => x.r === c.r && x.t !== c.t);
    const other = shuffle(P.cells.filter(x => x.t === c.t && x.r !== c.r));
    const pool = [...same, ...other];
    const seen = new Set([lineStr(c)]), out = [];
    for (const x of pool) { const s = lineStr(x); if (!seen.has(s)) { seen.add(s); out.push(x); } if (out.length >= n) break; }
    return out;
  }
  function exShell(type) {
    const dots = X.list.map((_, j) => `<i class="${j < X.results.length ? (X.results[j] ? 'ok' : 'no') : j === X.k ? 'cur' : ''}"></i>`).join('');
    app.innerHTML = `<section class="view"><div class="ex">
      <div class="exhead"><span class="chip">${TYPES_AR[type]}</span><div class="dots">${dots}</div><span class="chip">${NAV.S.emoji} ${esc(NAV.S.ar)}</span></div>
      <div id="exBody" style="display:grid;gap:14px"></div>
      <div id="exFoot"></div>
    </div></section>`;
    return $('#exBody');
  }
  function labelOf(c) { return `${c.row.icon} ${c.row.ar} · ${c.tense.icon} ${c.tense.ar}`; }
  function answer(ok, c) {
    X.results.push(ok); if (ok) X.score++;
    addXP(ok ? 10 : 2);
    const right = c ? `<div class="paper" style="margin-top:8px;width:100%">${c.lines.map((l, k) => lineHTML(l, k)).join('')}</div>` : '';
    $('#exFoot').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}"><span>${ok ? '✅ أحسنت! القطار يتقدّم' : '❌ ليست صحيحة، هذه هي الإجابة:'}</span>
      <button class="btn btn-main" id="exNext">متابعة ⬅</button>${right}</div>`;
    if (c) speak(lineStr(c), 1, NAV.L);
    $('#exNext').onclick = () => { hush(); X.k++; nextEx(); };
    $('#exNext').focus();
  }
  function nextEx() {
    if (X.k >= X.list.length) return exResults();
    const t = X.list[X.k];
    ({ build: exBuild, choose: exChoose, listen: exListen, hunt: exHunt, flash: exFlash, gap: exGap })[t]();
  }

  function exBuild() {
    const body = exShell('build');
    const pool = P.cells.filter(c => { const n = G.units(mainLine(c)).length; return n >= 3 && n <= 11; });
    const c = rand(pool);
    const groups = G.units(mainLine(c));
    const target = groups.map(stripP).filter(Boolean);
    let order = shuffle(target.map((w, j) => j));
    if (order.every((v, j) => v === j) && order.length > 1) order = order.reverse();
    const picked = [];
    body.innerHTML = `<div class="prompt">رتّب: ${labelOf(c)}</div>
      <div class="paper"><div class="slots" id="slots"></div></div>
      <div class="tiles" id="tiles">${order.map(j => {
      const role = groups.filter(g => stripP(g))[j].find(t => t.r !== 'p').r;
      return `<button class="tile t r-${role}" data-j="${j}">${esc(target[j])}</button>`;
    }).join('')}</div>
      <div style="display:flex;gap:8px;justify-content:center"><button class="btn btn-ghost" id="say">🔊 استمع</button><button class="btn btn-main" id="check" disabled>تحقّق</button></div>`;
    const drawSlots = () => {
      $('#slots').innerHTML = picked.map((j, p) => `<button class="tile" data-p="${p}">${esc(target[j])}</button>`).join('') || '<span class="muted" style="font-family:var(--f-body)">اضغط الكلمات بالترتيب…</span>';
      $$('#slots .tile').forEach(b => b.onclick = () => { const j = picked.splice(+b.dataset.p, 1)[0]; $(`#tiles [data-j="${j}"]`).classList.remove('used'); drawSlots(); });
      $('#check').disabled = picked.length !== target.length;
    };
    $$('#tiles .tile').forEach(b => b.onclick = () => { if (b.classList.contains('used')) return; b.classList.add('used'); picked.push(+b.dataset.j); drawSlots(); });
    $('#say').onclick = () => speak(lineStr(c), 0.9, NAV.L);
    $('#check').onclick = () => {
      const ok = picked.map(j => target[j]).join(' ') === target.join(' ');
      $('#check').disabled = true; $$('#tiles .tile, #slots .tile').forEach(b => b.disabled = true);
      answer(ok, c);
    };
    drawSlots();
  }

  function optionRound(c, prompt, opts, onShown) {
    const body = exShell(X.list[X.k]);
    const all = shuffle([c, ...distractorsFor(c)]);
    body.innerHTML = `<div class="prompt">${prompt}</div>${opts || ''}
      <div class="opts">${all.map((x, j) => `<button class="opt" data-j="${j}">${lineHTML(mainLine(x), 0)}</button>`).join('')}</div>`;
    $$('.opt', body).forEach(b => b.onclick = () => {
      const x = all[+b.dataset.j], ok = x === c;
      $$('.opt', body).forEach(o => { o.disabled = true; if (all[+o.dataset.j] === c) o.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      answer(ok, c);
    });
    if (onShown) onShown(body);
  }
  function exChoose() {
    const c = rand(P.cells);
    optionRound(c, `أي جملة هي: ${labelOf(c)}؟`);
  }
  function exListen() {
    const c = rand(P.cells);
    optionRound(c, '🎧 استمع ثم اختر الجملة التي سمعتها',
      `<div style="display:flex;gap:8px"><button class="btn btn-rail" id="hear">🔊 استمع</button><button class="btn btn-ghost" id="hearSlow">🐢 ببطء</button></div>`,
      (body) => {
        $$('.opt', body).forEach(o => o.querySelector('.sent').classList.add('plain'));
        $('#hear').onclick = () => speak(lineStr(c), 1, NAV.L);
        $('#hearSlow').onclick = () => speak(lineStr(c), 0.6, NAV.L);
        setTimeout(() => speak(lineStr(c), 0.95, NAV.L), 300);
      });
  }
  function exHunt() {
    const body = exShell('hunt');
    const c = rand(P.cells);
    const groups = G.units(mainLine(c));
    const roles = [...new Set(groups.flat().map(t => t.r).filter(r => !['p', 'x', 'ans'].includes(r)))];
    const role = rand(roles);
    body.innerHTML = `<div class="prompt">اضغط على: <span class="chip" style="font-size:16px"><i style="width:12px;height:12px;border-radius:4px;background:var(--r-${role});display:inline-block"></i> ${LT.ROLES[role]}</span></div>
      <div class="muted">${labelOf(c)}</div>
      <div class="paper huntline">${lineHTML(mainLine(c), 0, { plain: true })}</div>`;
    $$('.huntline .u', body).forEach(u => u.onclick = () => {
      const ok = groups[+u.dataset.j].some(t => t.r === role);
      $('.huntline .sent', body).classList.remove('plain');
      $$('.huntline .u', body).forEach(x => { x.onclick = null; if (groups[+x.dataset.j].some(t => t.r === role)) x.classList.add('hot'); });
      answer(ok, ok ? null : c);
    });
  }
  function exFlash() {
    const body = exShell('flash');
    const c = rand(P.cells.filter(x => x.r <= 3));
    const tenses = LT.TENSES;
    body.innerHTML = `<div class="prompt">⚡ انتبه! ستظهر جملة بسرعة… في أي زمن هي؟</div>
      <div class="paper flashbox" id="flash"></div>
      <button class="btn btn-ghost" id="again" disabled>🔁 أعد العرض</button>
      <div class="opts" style="grid-template-columns:repeat(3,1fr)">${tenses.map((t, k) => `<button class="opt ar" data-k="${k}" disabled>${t.icon} ${t.ar}</button>`).join('')}</div>`;
    const show = async () => {
      const box = $('#flash'); $('#again').disabled = true;
      box.innerHTML = lineHTML(mainLine(c), 0, { off: true });
      const us = $$('.u', box);
      speak(lineStr(c), 1.3, NAV.L);
      for (const u of us) { u.classList.remove('off'); await sleep(230); }
      await sleep(900);
      if (!$('#flash')) return;
      box.innerHTML = '<div style="font-size:40px">❓</div>';
      $('#again').disabled = false;
      $$('.opt', body).forEach(o => o.disabled = false);
    };
    $('#again').onclick = show;
    $$('.opt', body).forEach(b => b.onclick = () => {
      const ok = +b.dataset.k === c.t;
      $$('.opt', body).forEach(o => { o.disabled = true; if (+o.dataset.k === c.t) o.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      $('#again').disabled = true;
      answer(ok, c);
    });
    setTimeout(show, 500);
  }
  function exGap() {
    const body = exShell('gap');
    const KEY = ['aux', 'neg', 'qw', 'verb'];
    const pool = P.cells.filter(c => G.units(mainLine(c)).some(g => g.some(t => KEY.includes(t.r))));
    const c = rand(pool);
    const groups = G.units(mainLine(c));
    const cand = groups.map((g, j) => j).filter(j => groups[j].some(t => KEY.includes(t.r)));
    const j = rand(cand);
    const role = groups[j].find(t => KEY.includes(t.r)).r;
    const right = stripP(groups[j]);
    const others = new Set();
    shuffle(P.cells).forEach(x => G.units(mainLine(x)).forEach(g => { const w = stripP(g); if (w && w.toLowerCase() !== right.toLowerCase() && g.some(t => t.r === role)) others.add(w); }));
    const choices = shuffle([right, ...shuffle([...others]).slice(0, 3)]);
    const html = groups.map((g, k) => k === j
      ? `<span class="u"><span class="t" style="border-bottom:3px solid var(--signal);padding:0 18px;color:transparent">${'_'.repeat(Math.max(3, right.length))}</span>${esc(g.filter(t => t.r === 'p' && t.jl).map(t => t.w).join(''))}</span>`
      : `<span class="u">${g.map(t => `<span class="t r-${t.r}">${esc(t.w)}</span>`).join('')}</span>`).join(' ');
    body.innerHTML = `<div class="prompt">أكمل الفراغ: ${labelOf(c)}</div>
      <div class="paper"><div class="sent">${html}</div></div>
      <div class="opts" style="grid-template-columns:repeat(2,1fr)">${choices.map(w => `<button class="opt" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
    $$('.opt', body).forEach(b => b.onclick = () => {
      const ok = b.dataset.w === right;
      $$('.opt', body).forEach(o => { o.disabled = true; if (o.dataset.w === right) o.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      answer(ok, c);
    });
  }
  function exResults() {
    const n = X.list.length, s = X.score;
    const stars = s >= n - 1 ? 3 : s >= Math.ceil(n * 0.7) ? 2 : 1;
    const { L, u, r, i } = NAV, k = key(u, r, i), p = lp(L);
    p[k] = p[k] || { stars: 0 };
    p[k].stars = Math.max(p[k].stars || 0, stars);
    saveProg();
    app.innerHTML = `<section class="view"><div class="ex" style="text-align:center;justify-items:center">
      <div style="font-size:64px;line-height:1">${stars === 3 ? '🏆' : stars === 2 ? '🎉' : '💪'}</div>
      <h2>${AR_NUM(s)} من ${AR_NUM(n)}</h2>
      <div style="font-size:34px">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <p class="muted">${stars === 3 ? 'إتقان كامل! أنت جاهز للمحطة التالية.' : stars === 2 ? 'ممتاز! جولة إكسبريس أخرى وتصل للإتقان.' : 'أعد مشاهدة الصيغ ببطء ثم جرّب مرة أخرى.'}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-main" id="rNext">المحطة التالية ⬅</button>
        <button class="btn btn-ghost" id="rAgain">🔁 تمارين جديدة</button>
        <button class="btn btn-ghost" id="rBoard">🚆 لوحة الصيغ</button>
      </div></div></section>`;
    $('#rNext').onclick = () => goNextLesson();
    $('#rAgain').onclick = () => renderPractice();
    $('#rBoard').onclick = () => go('lesson');
  }

  /* ---------- بنك الكلمات ---------- */
  function renderWords() {
    const L = NAV.L, I = G.POOL_IDX[L], lang = langOf(L);
    const usedVerbs = [...new Set(LT.UNITS.flatMap(U => U.s.map(s => s[0])))];
    const nouns = [], seenN = new Set();
    LT.UNITS.forEach((U, u) => U.s.forEach((s, i) => {
      const S = G.sentenceInfo(u, i), O = G.objectOf(L, S);
      const w = L === 'de' ? `${({ m: 'der', f: 'die', n: 'das', p: 'die' })[O.g]} ${O.n}` : O.np;
      if (seenN.has(w)) return; seenN.add(w);
      nouns.push({ e: s[1], w, a: s[2].split(' ').slice(1).join(' ').replace(/^(إلى|عن) /, '') });
    }));
    const pool = (arr) => arr.map(x => ({ e: x[7], w: x[I], a: x[6] }));
    const times = [0, 1, 2].flatMap(t => LT.TIME[L][t].map((w, k) => ({ e: LT.TIME_EMOJI[t][k], w, a: LT.TIME.ar[t][k] })));
    const prons = Object.keys(LT.PRON[L]).map(k => ({ e: LT.PRON_EMOJI[k], w: LT.PRON[L][k][0], a: LT.PRON_AR[k] }));
    const sections = [
      ['👥 الضمائر', prons],
      ['🏃 الأفعال', usedVerbs.map(v => ({ e: LT.VERBS[v].e, w: LT.VERBS[v][L][0], a: LT.VERBS[v].ar }))],
      ['📦 الأسماء', nouns],
      ['⏰ الزمان', times],
      ['📍 الأماكن', pool(LT.PLACES)],
      ['💡 الأسباب', pool(LT.REASONS)],
      ['🛠️ الكيفية', pool(LT.MANNERS)],
      ['🔑 المالك', pool(LT.POSS)],
    ];
    // عدد الكلمات المختلفة فعلياً في كل صيغ الدورة بكل الضمائر
    const uniq = new Set();
    const pks = ['i', 'you', 'he', 'she', 'we', 'they'];
    LT.UNITS.forEach((U, u) => U.s.forEach((s, i) => pks.forEach(pk => {
      const S = G.sentenceInfo(u, i);
      [0, 1, 2].forEach(t => G.build(L, S, pk, t).forEach(rows => rows.forEach(line => line.forEach(tok => {
        if (tok.r !== 'p') tok.w.split(/[' -]/).forEach(w => w && uniq.add(w.toLocaleLowerCase()));
      }))));
    })));
    app.innerHTML = `<section class="view">
      <div class="routehead"><div style="display:flex;gap:12px;align-items:center"><span class="flag" style="font-size:40px">${lang.flag}</span>
        <div><h2>بنك الكلمات</h2><div class="muted">${AR_NUM(uniq.size)} كلمة وصيغة فعل مختلفة تتدرّب عليها في هذه الدورة · اضغط أي كلمة لتسمعها</div></div></div></div>
      ${sections.map(([t, items]) => `<div class="section"><h3>${t}</h3><div class="wgrid">${items.map(x => `<button class="word" data-w="${esc(x.w)}"><span class="e">${x.e}</span><div><div class="w" lang="${L}">${esc(x.w)}</div><div class="a">${esc(x.a)}</div></div><span>🔊</span></button>`).join('')}</div></div>`).join('')}
    </section>`;
    $$('.word').forEach(b => b.onclick = () => speak(b.dataset.w, 0.85, L));
  }

  /* ---------- الإعدادات ---------- */
  $('#openSettings').onclick = () => {
    const L = NAV.L || 'en';
    const vs = voicesFor(L), cur = voiceFor(L);
    modal(`<div class="sheet settings" style="padding:0;box-shadow:none">
      <h2>⚙️ الإعدادات</h2>
      <div class="field"><label for="setTheme">المظهر</label>
        <select id="setTheme"><option value="auto">حسب الجهاز</option><option value="light">فاتح</option><option value="dark">داكن</option></select></div>
      <div class="field"><label for="setVoice">صوت ${langOf(L).ar}</label>
        <select id="setVoice">${vs.length ? vs.map(v => `<option value="${esc(v.voiceURI)}"${cur && cur.voiceURI === v.voiceURI ? ' selected' : ''}>${esc(v.name)} (${esc(v.lang)})</option>`).join('') : '<option value="">لا يوجد صوت مثبّت لهذه اللغة</option>'}</select>
        <button class="btn btn-ghost" id="testVoice">🔊 جرّب الصوت</button></div>
      <div class="field"><label><input type="checkbox" id="setWord"${SET.wordFirst ? ' checked' : ''}> نطق كل كلمة وحدها في الجولة الأولى (الأبطأ)</label></div>
      <div class="field"><label for="setSpeed">السرعة</label><select id="setSpeed">${$('#speedSel').innerHTML}</select></div>
      <div class="field"><label for="setPasses">عدد مرات تكرار كل صيغة (عربات القطار)</label><select id="setPasses">${$('#passSel').innerHTML}</select></div>
      <div class="field"><button class="btn btn-ghost" id="reset">🗑️ مسح التقدّم</button></div>
      <button class="btn btn-main" id="closeSet">تم</button>
    </div>`);
    $('#setTheme').value = SET.theme; $('#setSpeed').value = SET.speed; $('#setPasses').value = String(SET.passes);
    $('#setTheme').onchange = (e) => { SET.theme = e.target.value; saveSet(); applyTheme(); };
    $('#setVoice').onchange = (e) => { SET.voices[L] = e.target.value; saveSet(); };
    $('#testVoice').onclick = () => speak(G.lineText(G.lesson(L, 0, 0, 'i').cells[0].lines[0]), 1, L);
    $('#setWord').onchange = (e) => { SET.wordFirst = e.target.checked; saveSet(); };
    $('#setSpeed').onchange = (e) => { SET.speed = e.target.value; saveSet(); syncDock(); };
    $('#setPasses').onchange = (e) => { SET.passes = +e.target.value; saveSet(); syncDock(); };
    $('#reset').onclick = (e) => {
      if (e.target.dataset.sure) { PROG.xp = 0; PROG.langs = {}; PROG.streak = { d: '', n: 0 }; saveProg(); renderStats(); closeModal(); go('home'); toast('تم مسح التقدّم'); }
      else { e.target.dataset.sure = '1'; e.target.textContent = '⚠️ اضغط مرة أخرى للتأكيد'; }
    };
    $('#closeSet').onclick = closeModal;
  };

  document.addEventListener('keydown', (e) => {
    if (NAV.view !== 'lesson' || !$('#modal').hidden) return;
    if (e.target.matches('select, input, button')) return;
    if (e.code === 'Space') { e.preventDefault(); $('#playBtn').click(); }
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && P.playing) { stopPlayback(); setGauge(0, -1); } });

  renderStats();
  go('home');
})();
