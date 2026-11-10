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
  const SET = Object.assign({ speed: 'tr:mid', passes: 3, auto: true, sound: true, wordFirst: true, voices: {}, theme: 'auto', layout: 'grid', trans: 'ar', sayTrans: false, compare: [], pics: true }, store.get('settings', {}));
  const PROG = Object.assign({ xp: 0, streak: { d: '', n: 0 }, langs: {}, finals: {} }, store.get('progress', {}));
  PROG.finals = PROG.finals || {};
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
  function loadVoices() { if (TTS) VOICES = TTS.getVoices(); setTimeout(() => { if (NAV.view === 'lesson') voiceHint(); }); }
  if (TTS) { loadVoices(); TTS.onvoiceschanged = loadVoices; }
  const langOf = (L) => LT.LANGS.find(x => x.id === L) || (L === 'ar' ? LT.AR_LANG : null);
  function voicesFor(L) {
    const norm = (v) => v.lang.replace('_', '-').toLowerCase();
    return VOICES.filter(v => norm(v).startsWith(L));
  }
  /* جودة الصوت: سفاري يضع أصواتاً «ترفيهية» وآلية (Albert، Zarvox، Fred…) بجانب الأصوات الجيدة،
     فنستبعدها ونقدّم أصوات Premium ثم Enhanced ثم Siri والأصوات العصبية (Natural / Neural). */
  const NOVELTY = /^(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Pipe Organ|Superstar|Trinoids|Whisper|Wobble|Zarvox|Fred|Junior|Kathy|Ralph|Grandma|Grandpa|Eddy|Flo|Reed|Rocko|Sandy|Shelley|Deranged|Hysterical)\b/i;
  function voiceQuality(v) {
    const id = (v.voiceURI || '') + ' ' + v.name;
    if (NOVELTY.test(v.name) || /eloquence|speech\.synthesis\.voice/i.test(v.voiceURI || '')) return -100;
    let q = 0;
    if (/premium/i.test(id)) q += 40; else if (/enhanced|verbessert|mejorada|améliorée|migliorata|aprimorada/i.test(id)) q += 30;
    if (/siri/i.test(id)) q += 25;
    if (/neural|natural|online/i.test(id)) q += 32;
    if (/google/i.test(id)) q += 15;
    if (/compact/i.test(id)) q -= 5;
    return q;
  }
  function voiceScore(v, L) {
    const codes = langOf(L).tts.map(c => c.toLowerCase());
    const ci = codes.indexOf(v.lang.replace('_', '-').toLowerCase());
    return voiceQuality(v) + (ci >= 0 ? 12 - ci * 3 : 0) + (v.default ? 1 : 0);
  }
  const ranked = (L) => voicesFor(L).slice().sort((a, b) => voiceScore(b, L) - voiceScore(a, L));
  const stars = (v) => { const q = voiceQuality(v); return q >= 30 ? '⭐⭐⭐' : q >= 15 ? '⭐⭐' : q >= 0 ? '⭐' : '🤖'; };
  function voiceFor(L) {
    const list = ranked(L);
    if (!list.length) return null;
    const saved = SET.voices[L] && list.find(v => v.voiceURI === SET.voices[L]);
    return saved || list[0];
  }
  const IS_APPLE = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  const IS_IOS = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));
  const needsBetterVoice = (L) => { const v = voiceFor(L); return !!(TTS && VOICES.length && (!v || voiceQuality(v) < 15)); };
  function voiceTip(L) {
    const ar = langOf(L).ar;
    if (IS_IOS) return `لصوت طبيعي وواضح على iPhone/iPad: <b>الإعدادات ← تسهيلات الاستخدام ← المحتوى المنطوق ← الأصوات ← ${ar}</b> ثم نزّل صوتاً مكتوباً بجانبه <b>(محسّن)</b> أو <b>(Premium)</b>، وبعدها أعد فتح الصفحة واختره من ⚙️.`;
    if (IS_APPLE) return `لصوت طبيعي على الماك: <b>إعدادات النظام ← تسهيلات الاستخدام ← المحتوى المنطوق ← صوت النظام ← إدارة الأصوات</b> ثم نزّل صوت ${ar} من نوع <b>Premium</b> أو <b>Enhanced</b>، وأعد فتح الصفحة.`;
    return `لصوت أوضح جرّب متصفح Chrome أو Edge (فيهما أصوات Google و Natural عالية الجودة)، أو ثبّت صوت ${ar} من إعدادات الجهاز.`;
  }
  function voiceHint() {
    const box = $('#voiceHint'); if (!box) return;
    const L = NAV.L, show = SET.sound && needsBetterVoice(L) && !SET['hideTip_' + L];
    box.hidden = !show;
    if (show) {
      box.innerHTML = `<span style="font-size:22px">🔈</span><div style="flex:1;min-width:0">الصوت الحالي في جهازك منخفض الجودة. ${voiceTip(L)}</div><button class="iconbtn" id="tipX" aria-label="إخفاء">✕</button>`;
      $('#tipX').onclick = () => { SET['hideTip_' + L] = 1; saveSet(); box.hidden = true; };
    }
  }
  const estimate = (text, rate) => (text.length * 68 + 320) / rate;
  let warnedNoVoice = false;
  const LIVE = new Set();
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
      LIVE.add(u);   // نحتفظ بمرجع للنطق حتى لا يضيع حدث النهاية في سفاري
      u.lang = v ? v.lang : langOf(L).tts[0];
      if (v) u.voice = v;
      u.rate = Math.max(0.1, Math.min(2, rate));
      let done = false;
      const fin = () => { if (!done) { done = true; clearTimeout(to); LIVE.delete(u); res(); } };
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
    const say = o.say ? `<button class="say" data-say="${esc(G.lineText(line))}" data-l="${o.say}" aria-label="استمع لهذه الجملة" title="استمع">🔊</button>` : '';
    return `<div class="sent${k ? ' ans' : ''}${o.plain ? ' plain' : ''}">${say}` + us.map((u, j) =>
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
  /* زر 🔊 أمام أي جملة: ينطقها وحدها دون تشغيل اللوحة */
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.say');
    if (!b) return;
    e.stopPropagation(); e.preventDefault();
    if (P.playing) stopPlayback();
    hush();
    const s = b.closest('.sent');
    if (s) s.classList.add('speaking');
    speak(b.dataset.say, 0.9, b.dataset.l).then(() => s && s.classList.remove('speaking'));
  }, true);

  /* ---------- التنقّل ---------- */
  const NAV = { view: 'home', L: null };
  function go(view, params = {}) {
    stopPlayback();
    Object.assign(NAV, params, { view });
    $('#dock').hidden = view !== 'lesson';
    $('#back').hidden = view === 'home';
    window.scrollTo({ top: 0 });
    ({ home: renderHome, route: renderRoute, lesson: renderLesson, practice: renderPractice, words: renderWords, final: renderFinal })[view]();
  }
  $('#brand').onclick = () => go('home');
  $('#back').onclick = () => {
    if (NAV.view === 'route') go('home');
    else if (NAV.view === 'practice') go(X.ctx === 'final' ? 'final' : 'lesson');
    else go('route');
  };

  /* ---------- الرئيسية ---------- */
  function renderHome() {
    const totalDone = LT.LANGS.reduce((s, l) => s + doneCount(l.id), 0);
    app.innerHTML = `
    <section class="view">
      <div class="hero">
        <div class="eyebrow" style="color:rgba(255,255,255,.7)">${AR_NUM(LT.LANGS.length)} لغات · ${AR_NUM(LT.UNITS.length * 10)} جملة · ${AR_NUM(LT.ROUNDS.length)} ضمائر · ${AR_NUM(LT.ROWS.length * 3)} صيغة لكل جملة</div>
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
        <div><span class="ic">🧱</span><b>جملة واحدة، ${AR_NUM(LT.ROWS.length * 3)} صيغة</b>نفس الجملة تتحول إلى منفي، وسؤال نعم/لا، وأسئلة مَن وماذا ومتى وأين ولماذا وكيف ولِمَن، والمبني للمجهول، في كل زمن.</div>
        <div><span class="ic">🚆</span><b>تسارع القطار</b>كل صيغة تُعرض كلمة كلمة ببطء، ثم تتكرر بسرعة أعلى في كل مرة. والصيغ تبقى ثابتة أمامك، كل واحدة تحت التي قبلها.</div>
        <div><span class="ic">🎨</span><b>ألوان الجملة</b>الفاعل بالأسود، والفعل المساعد بالأخضر، والفعل الرئيسي بالأحمر، والمفعول به بالأزرق، والزمان بالبنفسجي، والمكان بالبرتقالي.</div>
        <div><span class="ic">👥</span><b>الضمائر بالتدريج</b>أول ١٠ جمل بضمير «أنا» فقط، ثم نعود للجملة الأولى بضمير «أنتَ»، ثم «هو/هي»، ثم «نحن»، ثم «هم».</div>
        <div><span class="ic">🎯</span><b>تمارين الإتقان</b>ترتيب الكلمات، واختيار الصيغة، والاستماع، وصيد الأدوار، والعرض الخاطف، وإكمال الفراغ، والصور، والترجمة.</div>
        <div><span class="ic">🌐</span><b>الترجمة والمقارنة</b>ترجمة عربية (أو بأي لغة) تحت كل صيغة دون نطق إلا إذا طلبته، ومقارنة أكثر من لغة معاً بالنطق.</div>
        <div><span class="ic">🏁</span><b>التقييم النهائي لكل خط</b>قصة وحوار من جمل الخط، وكلمات الربط، والجمل البسيطة والمركّبة، والترجمة من العربية، والصور.</div>
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
          <div class="uh"><span class="linebadge" style="background:${U.color}">${U.icon} الخط ${AR_NUM(u + 1)}</span><h3>${U.ar}</h3>
            <button class="finalbtn" data-u="${u}">🏁 التقييم النهائي ${'⭐'.repeat((PROG.finals[L] || {})[u] || 0)}</button></div>
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
    $$('.finalbtn').forEach(b => b.onclick = () => go('final', { u: +b.dataset.u }));
    $$('.st').forEach(b => b.onclick = () => { const [u, r, i] = b.dataset.k.split(',').map(Number); go('lesson', { u, r, i }); });
    const nb = $('.st.next'); if (nb) nb.scrollIntoView({ block: 'center' });
  }

  /* ---------- الدرس (لوحة الصيغ) ---------- */
  const P = { cells: [], els: [], order: [], groups: [], i: 0, playing: false, run: 0, revealed: [], express: false, ar: [] };
  const isRTL = (L) => L === 'ar';
  const Q_OF = { i: 'you', you: 'you', he: 'he', she: 'she', we: 'youpl', they: 'they' };

  /* النموذج: لكل خلية لغة الدرس + لغات المقارنة + الترجمة */
  function buildModel() {
    const { L, u, i, pk } = NAV;
    const langs = [L, ...SET.compare.filter(x => x !== L && LT.LANGS.some(l => l.id === x))];
    const per = langs.map(x => G.lesson(x, u, i, pk).cells);
    const trL = SET.trans && SET.trans !== 'none' && !langs.includes(SET.trans) ? SET.trans : null;
    const tr = trL ? G.lesson(trL, u, i, pk).cells : null;
    P.ar = G.lesson('ar', u, i, pk).cells;
    P.cells = per[0].map((c, k) => ({
      k, r: c.r, t: c.t, row: c.row, tense: c.tense,
      blocks: per.map((cs, b) => ({ L: langs[b], lines: cs[k].lines })),
      tr: tr ? { L: trL, lines: tr[k].lines } : null,
    }));
    P.revealed = P.cells.map(c => c.blocks.map(() => false));
  }

  function renderLesson() {
    const { L, u, r, i } = NAV;
    const pk = G.pronounFor(r, i);
    NAV.pk = pk;
    NAV.S = G.sentenceInfo(u, i);
    const S = NAV.S;
    buildModel();
    P.i = 0; P.playing = false;
    const U = LT.UNITS[u], lang = langOf(L), V = LT.VERBS[S.verb];
    const prWord = LT.PRON[L][pk][0];
    const roles = ['subj', 'aux', 'verb', 'obj', 'neg', 'qw', 'time', 'place', 'reason', 'manner', 'poss'];
    const others = LT.LANGS.filter(l => l.id !== L);

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

      <div class="voicehint" id="voiceHint" hidden></div>

      <div class="layoutbar">
        <div class="seg" id="layoutSeg" role="group" aria-label="طريقة العرض">
          ${LAYOUTS.map(l => `<button data-l="${l.id}" class="${SET.layout === l.id ? 'on' : ''}">${l.ar}</button>`).join('')}
        </div>
        <div class="muted layoutdesc">${(LAYOUTS.find(l => l.id === SET.layout) || LAYOUTS[0]).desc}</div>
      </div>

      <div class="optbar">
        <label class="ctl"><span>🌐 الترجمة</span>
          <select id="trSel"><option value="none">بدون</option><option value="ar">🇸🇦 العربية</option>${others.map(l => `<option value="${l.id}">${l.flag} ${l.ar}</option>`).join('')}</select>
        </label>
        <button class="toggle${SET.sayTrans ? ' on' : ''}" id="sayTrBtn" title="تُنطق الترجمة فقط إذا فعّلت هذا الزر">🔊 نطق الترجمة</button>
        <button class="toggle${SET.pics ? ' on' : ''}" id="picBtn">🖼️ صور الصيغ</button>
        <div class="cmpchips"><span class="muted">⚖️ قارن مع:</span>${others.map(l => `<button class="cmpc${SET.compare.includes(l.id) ? ' on' : ''}" data-l="${l.id}" aria-pressed="${SET.compare.includes(l.id)}">${l.flag} ${l.ar}</button>`).join('')}</div>
      </div>

      <div class="legend">${roles.map(k => `<span><i style="background:var(--r-${k})"></i>${LT.ROLES[k]}</span>`).join('')}</div>

      <div class="tabs" id="tabs"${SET.layout === 'grid' ? '' : ' hidden'}>${LT.TENSES.map((t, k) => `<button data-t="${k}" class="${k === 0 ? 'on' : ''}">${t.icon} ${t.ar}</button>`).join('')}</div>

      ${boardHTML(P.cells)}

      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        <button class="btn btn-main" id="toPractice">🎯 تمارين الإتقان</button>
        <button class="btn btn-ghost" id="toNext">المحطة التالية ⬅</button>
      </div>
    </section>`;

    P.els = P.cells.map((_, k) => $(`.cell[data-idx="${k}"]`, app));
    setOrder();
    P.els.forEach((el, k) => {
      el.onclick = () => jumpTo(k);
      el.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); jumpTo(k); } };
    });
    $$('#layoutSeg button').forEach(b => b.onclick = () => {
      if (SET.layout === b.dataset.l) return;
      SET.layout = b.dataset.l; saveSet(); rerender();
      toast((LAYOUTS.find(l => l.id === SET.layout)).ar);
    });
    $('#trSel').value = SET.trans || 'none';
    $('#trSel').onchange = (e) => { SET.trans = e.target.value; saveSet(); rerender(); };
    $('#sayTrBtn').onclick = (e) => { SET.sayTrans = !SET.sayTrans; saveSet(); e.currentTarget.classList.toggle('on', SET.sayTrans); toast(SET.sayTrans ? '🔊 ستُنطق الترجمة بعد كل صيغة' : '🔇 الترجمة تظهر فقط دون نطق'); };
    $('#picBtn').onclick = () => { SET.pics = !SET.pics; saveSet(); rerender(); };
    $$('.cmpc').forEach(b => b.onclick = () => {
      const id = b.dataset.l;
      SET.compare = SET.compare.includes(id) ? SET.compare.filter(x => x !== id) : [...SET.compare, id];
      saveSet(); rerender();
    });
    $$('#tabs button').forEach(b => b.onclick = () => setTab(+b.dataset.t));
    $('#toPractice').onclick = () => go('practice');
    $('#toNext').onclick = () => goNextLesson();
    setGauge(0, -1);
    syncDock();
    voiceHint();
  }
  function rerender() { stopPlayback(); const y = window.scrollY; renderLesson(); window.scrollTo({ top: y }); }

  /* طرق العرض الثلاث */
  const LAYOUTS = [
    { id: 'grid', ar: '🧱 كل الصيغ', desc: 'لوحة كاملة: الأزمنة أعمدة والصيغ صفوف، وتُعرض صفاً بعد صف.' },
    { id: 'form', ar: '📑 حسب الصيغة', desc: 'كل صيغة في الأزمنة الثلاثة تحت بعضها مباشرة، ثم تُنطق الجمل الثلاث معاً.' },
    { id: 'tense', ar: '⏳ حسب الزمن', desc: 'كل زمن بصيغه تحت بعضها، ثم تُنطق صيغ الزمن كلها معاً.' },
  ];
  function cellHTML(c, idx, lab, flat) {
    const multi = c.blocks.length > 1;
    const pic = SET.pics ? `<div class="pic" aria-hidden="true">${scene(NAV.S, c.r, c.t, NAV.pk)}</div>` : '';
    const blocks = c.blocks.map((b, bi) => `<div class="blk${bi ? ' cmp' : ''}${multi ? ' multi' : ''}" data-b="${bi}" lang="${b.L}" dir="${isRTL(b.L) ? 'rtl' : 'ltr'}">${multi ? `<span class="flagtag">${langOf(b.L).flag}</span>` : ''}${b.lines.map((ln, k) => lineHTML(ln, k, { off: true, say: b.L })).join('')}</div>`).join('');
    const tr = c.tr ? `<div class="blk tr" data-b="tr" lang="${c.tr.L}" dir="${isRTL(c.tr.L) ? 'rtl' : 'ltr'}">${c.tr.lines.map((ln, k) => lineHTML(ln, k, { say: c.tr.L })).join('')}</div>` : '';
    return `<div class="cell idle${flat ? ' flat' : ''}" data-idx="${idx}" data-t="${c.t}" tabindex="0" role="button" aria-label="${c.row.ar} — ${c.tense.ar}">
      ${lab}<div class="cbody">${pic}<div class="ctext">${blocks}${tr}</div></div>
      <div class="rail"><span class="loco">🚆</span></div>
    </div>`;
  }
  function boardHTML(cells) {
    const R = LT.ROWS.length;
    if (SET.layout === 'form') {
      return `<div class="stacks">${LT.ROWS.map((row, r) => `
        <div class="sblock"><div class="sbh"><span class="ic">${row.icon}</span>${row.ar}<span class="muted sbn">الماضي ← الحاضر ← المستقبل</span></div>
          <div class="stack" data-g="${r}">${[0, 1, 2].map(t => cellHTML(cells[r * 3 + t], r * 3 + t, `<span class="tag tg${t}">${LT.TENSES[t].icon} ${LT.TENSES[t].ar}</span>`, true)).join('')}</div>
        </div>`).join('')}</div>`;
    }
    if (SET.layout === 'tense') {
      return `<div class="stacks">${LT.TENSES.map((te, t) => `
        <div class="sblock"><div class="sbh tense"><span class="ic">${te.icon}</span>${te.ar}<span class="sbn">${AR_NUM(R)} صيغة</span></div>
          <div class="stack" data-g="${t}">${LT.ROWS.map((row, r) => cellHTML(cells[r * 3 + t], r * 3 + t, `<span class="tag">${row.icon} ${row.ar}</span>`, true)).join('')}</div>
        </div>`).join('')}</div>`;
    }
    return `<div class="board" id="board" data-tense="0">
        <div class="corner"></div>
        ${LT.TENSES.map(t => `<div class="th">${t.icon} ${t.ar}</div>`).join('')}
        ${LT.ROWS.map((row, r) => `
          <div class="rowlab"><span class="ic">${row.icon}</span><span>${row.ar}</span></div>
          ${[0, 1, 2].map(t => cellHTML(cells[r * 3 + t], r * 3 + t, `<div class="clab">${row.icon} ${row.ar} · ${LT.TENSES[t].ar}</div>`, false)).join('')}`).join('')}
      </div>`;
  }
  /* ترتيب التشغيل والمجموعات التي تُعاد معاً بعد اكتمالها */
  function setOrder() {
    const R = LT.ROWS.length;
    if (SET.layout === 'tense') P.groups = [0, 1, 2].map(t => Array.from({ length: R }, (_, r) => r * 3 + t));
    else P.groups = SET.layout === 'form' ? Array.from({ length: R }, (_, r) => [r * 3, r * 3 + 1, r * 3 + 2]) : [];
    P.order = SET.layout === 'tense' ? P.groups.flat() : P.cells.map((_, k) => k);
  }

  function goNextLesson() {
    const { L, u, r, i } = NAV;
    let nu = u, nr = r, ni = i + 1;
    if (ni >= LT.UNITS[u].s.length) {
      ni = 0; nr++;
      if (nr >= LT.ROUNDS.length) { go('final', { L, u }); return; }   // نهاية الخط ← التقييم النهائي
    }
    go('lesson', { L, u: nu, r: nr, i: ni });
  }

  function setTab(t) {
    const b = $('#board'); if (!b) return;   // الأعمدة/التبويبات في وضع «كل الصيغ» فقط
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
    P.revealed[k] = P.revealed[k].map(() => true);
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

  function moveLoco(el, uEl) {
    const loco = $('.loco', el); if (!loco || !uEl) return;
    const rail = loco.parentElement.getBoundingClientRect(), r = uEl.getBoundingClientRect();
    loco.style.left = Math.max(0, r.left + r.width / 2 - rail.left) + 'px';
  }

  /* مرجع سطر: الخلية k، الكتلة b (رقم لغة أو 'tr' للترجمة)، السطر li */
  function lineRef(k, b, li) {
    const c = P.cells[k], m = b === 'tr' ? c.tr : c.blocks[b];
    const blk = $(`.blk[data-b="${b}"]`, P.els[k]);
    return { el: P.els[k], lineEl: $$('.sent', blk)[li], line: m.lines[li], L: m.L };
  }

  async function revealLine(k, b, li, rate, id) {
    const R = lineRef(k, b, li);
    const us = $$('.u', R.lineEl), groups = G.units(R.line);
    us.forEach(u => u.classList.add('off'));
    for (let j = 0; j < us.length; j++) {
      if (id !== P.run) return;
      us.forEach(u => u.classList.remove('hot'));
      us[j].classList.remove('off'); us[j].classList.add('hot');
      moveLoco(R.el, us[j]);
      const txt = stripP(groups[j]);
      if (SET.wordFirst && SET.sound && txt) await speak(txt, Math.max(0.5, rate * 0.95), R.L);
      else await sleep(Math.max(220, 650 / rate));
      if (SET.wordFirst) await sleep(Math.max(60, 180 / rate));
    }
    us.forEach(u => u.classList.remove('hot'));
  }

  async function sweepLine(k, b, li, rate, id, reveal) {
    const R = lineRef(k, b, li);
    const us = $$('.u', R.lineEl), groups = G.units(R.line);
    if (!reveal) us.forEach(u => u.classList.remove('off'));
    const texts = groups.map(G.unitText);
    const text = texts.join(' ');
    const starts = []; let pos = 0;
    texts.forEach(t => { starts.push(pos); pos += t.length + 1; });
    const total = estimate(text, rate);
    let gotB = false, cur = -1;
    const t0 = performance.now();
    const hot = (j) => {
      if (j === cur || j < 0 || j >= us.length) return;
      cur = j; us.forEach((u, x) => { u.classList.remove('hot'); if (x <= j) u.classList.remove('off'); }); us[j].classList.add('hot'); moveLoco(R.el, us[j]);
    };
    hot(0);
    const timer = setInterval(() => {
      if (gotB || id !== P.run) return;
      const ch = (performance.now() - t0) / total * text.length;
      let j = 0; while (j + 1 < starts.length && starts[j + 1] <= ch) j++;
      hot(j);
    }, 60);
    await speak(text, rate, R.L, (e) => {
      if (e.name && e.name !== 'word') return;
      gotB = true;
      let j = 0; while (j + 1 < starts.length && starts[j + 1] <= e.charIndex) j++;
      hot(j);
    });
    clearInterval(timer);
    if (!SET.sound || !TTS) await sleep(150);
    us.forEach(u => u.classList.remove('hot', 'off'));
  }

  async function playCell(k, id) {
    const c = P.cells[k];
    setActive(k);
    const rates = P.express ? [Math.max(1.3, ladder(2)[1])] : ladder(SET.passes);
    for (let b = 0; b < c.blocks.length; b++) {
      for (let p = 0; p < rates.length; p++) {
        setGauge(rates[p], p);
        if (c.blocks.length > 1) $('#stage').textContent += ' ' + langOf(c.blocks[b].L).flag;
        for (let li = 0; li < c.blocks[b].lines.length; li++) {
          if (id !== P.run) return false;
          if (p === 0 && !P.revealed[k][b] && !P.express) {
            if (SET.wordFirst) {
              await revealLine(k, b, li, rates[p], id);
              if (rates.length === 1 && id === P.run) await sweepLine(k, b, li, rates[p], id);
            } else await sweepLine(k, b, li, rates[p], id, true);   // تظهر الكلمات مع نطق الجملة البطيء
          } else await sweepLine(k, b, li, rates[p], id);
          if (id !== P.run) return false;
          await sleep(c.blocks[b].lines.length > 1 && li === 0 ? 260 : 120);
        }
        if (p < rates.length - 1) await sleep(320);
      }
      P.revealed[k][b] = true;
      if (b < c.blocks.length - 1) await sleep(250);
    }
    if (c.tr && SET.sayTrans && !P.express) {   // الترجمة لا تُنطق إلا إذا اختار المتعلم ذلك
      for (let li = 0; li < c.tr.lines.length; li++) {
        if (id !== P.run) return false;
        await sweepLine(k, 'tr', li, 1, id);
        await sleep(120);
      }
    }
    P.els[k].classList.add('done');
    return id === P.run;
  }

  /* إعادة نطق مجموعة كاملة معاً (الأزمنة الثلاثة للصيغة، أو صيغ الزمن كلها) */
  async function chorus(group, id) {
    const rate = ladder(SET.passes).slice(-1)[0];
    const blk = P.els[group[0]].closest('.stack');
    if (blk) blk.classList.add('chorus');
    await sleep(350);
    for (const k of group) {
      if (id !== P.run) break;
      setActive(k);
      setGauge(rate, SET.passes - 1);
      $('#stage').textContent = '🔗 الصيغ معاً';
      const c = P.cells[k];
      for (let b = 0; b < c.blocks.length; b++) {
        for (let li = 0; li < c.blocks[b].lines.length; li++) {
          if (id !== P.run) break;
          await sweepLine(k, b, li, rate, id);
          await sleep(90);
        }
      }
    }
    if (blk) blk.classList.remove('chorus');
    return id === P.run;
  }

  async function playFrom(pos) {
    hush();
    const id = ++P.run;
    P.playing = true; syncDock();
    touchStreak(); saveProg(); renderStats();
    for (let j = pos; j < P.order.length; j++) {
      if (id !== P.run) return;   // أُوقف التشغيل أثناء الانتظار
      P.i = j;
      const k = P.order[j];
      const ok = await playCell(k, id);
      if (!ok || id !== P.run) return;
      const g = !P.express && P.groups.find(gr => gr[gr.length - 1] === k);
      if (g && !(await chorus(g, id))) return;
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
  function jumpPos(pos) { stopPlayback(); P.express = false; P.i = pos; playFrom(pos); }
  function jumpTo(k) { jumpPos(Math.max(0, P.order.indexOf(k))); }

  function finishBoard(wasExpress) {
    const { L, u, r, i } = NAV, k = key(u, r, i), p = lp(L);
    const first = !p[k];
    p[k] = p[k] || { stars: 0 };
    saveProg();
    if (first) addXP(20);
    modal(`
      <div class="big">${wasExpress ? '⚡' : '🏁'}</div>
      <h2>${wasExpress ? 'جولة إكسبريس مكتملة!' : 'وصلت المحطة!'}</h2>
      <p class="muted">شاهدت ${AR_NUM(P.cells.length)} صيغة للجملة «${esc(NAV.S.ar)}»${first ? ' · +٢٠ نقطة' : ''}</p>
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

  /* ---------- صورة رمزية لكل صيغة ----------
     كل صيغة لها صورة مختلفة: لون الخلفية = الزمن، والرموز داخل الصورة تشير للأشياء المجردة
     (النفي، السؤال، الزمان، المكان، السبب، الكيفية، المالك، المبني للمجهول). */
  const TENSE_BG = ['#f1e3c8', '#d8f0de', '#d9e6fb'];
  function scene(S, r, t, pk) {
    const id = LT.ROWS[r].id;
    const asks = ['yn', 'what', 'when', 'where', 'why', 'how', 'whose'].includes(id);
    const person = LT.PRON_EMOJI[asks ? Q_OF[pk] : pk];
    const E = (x, y, s, e, extra = '') => `<text x="${x}" y="${y}" font-size="${s}" text-anchor="middle" dominant-baseline="central"${extra}>${e}</text>`;
    const Q = (x, y) => `<circle cx="${x}" cy="${y}" r="9" fill="#c0267a"/>${E(x, y + 1, 13, '?', ' fill="#fff" font-weight="700" font-family="Lexend, sans-serif"')}`;
    const fade = ' opacity=".3"';
    const pl = LT.PLACES[S.place][7], rs = LT.REASONS[S.reason][7], mn = LT.MANNERS[S.manner][7], ps = LT.POSS[S.poss][7];
    const tm = LT.TIME_EMOJI[S.timeVar][t];
    let body;
    switch (id) {
      case 'aff': body = E(24, 56, 24, person) + E(68, 52, 34, S.emoji) + E(106, 76, 14, '✅'); break;
      case 'neg': body = E(24, 56, 24, person) + E(68, 52, 34, S.emoji) + `<circle cx="68" cy="52" r="21" fill="none" stroke="#dc2626" stroke-width="5"/><line x1="53" y1="67" x2="83" y2="37" stroke="#dc2626" stroke-width="5" stroke-linecap="round"/>`; break;
      case 'yn': body = E(24, 58, 24, person) + E(68, 54, 30, S.emoji) + `<path d="M8 22 h30 a6 6 0 0 1 6 6 v10 a6 6 0 0 1 -6 6 h-18 l-6 6 v-6 h-6 a6 6 0 0 1 -6 -6 v-10 a6 6 0 0 1 6 -6z" fill="#fff" stroke="#c0267a" stroke-width="2"/>` + E(26, 33, 11, '👍👎'); break;
      case 'who': body = E(24, 56, 24, person, fade) + Q(24, 54) + E(70, 52, 34, S.emoji); break;
      case 'what': body = E(24, 56, 24, person) + `<rect x="46" y="30" width="46" height="44" rx="10" fill="none" stroke="#1d4ed8" stroke-width="2.5" stroke-dasharray="5 4"/>` + E(69, 52, 30, S.emoji, fade) + Q(92, 30); break;
      case 'when': body = E(42, 56, 26, S.emoji) + E(90, 50, 30, tm) + Q(106, 30); break;
      case 'where': body = E(42, 56, 26, S.emoji) + E(90, 50, 30, pl) + Q(106, 30); break;
      case 'why': body = E(42, 56, 26, S.emoji) + E(90, 52, 28, rs) + E(80, 26, 15, '💡') + Q(106, 30); break;
      case 'how': body = E(42, 56, 26, S.emoji) + E(90, 52, 28, mn) + E(78, 26, 15, '🛠️') + Q(106, 30); break;
      case 'whose': body = E(42, 56, 26, S.emoji) + E(90, 52, 28, ps) + E(76, 74, 15, '🔑') + Q(106, 30); break;
      default: body = E(36, 50, 34, S.emoji) + E(70, 50, 18, '🔄') + E(100, 58, 20, person, fade) + E(100, 80, 9, '؟', ' fill="#6b7280" font-weight="700"');   // الفاعل غير معروف
    }
    return `<svg viewBox="0 0 120 90" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${LT.ROWS[r].ar} — ${LT.TENSES[t].ar}">
      <rect x="1" y="1" width="118" height="88" rx="14" fill="${TENSE_BG[t]}" stroke="rgba(0,0,0,.08)"/>
      <rect x="6" y="5" width="${id === 'when' ? 22 : 40}" height="18" rx="9" fill="rgba(255,255,255,.75)"/>
      ${E(16, 14, 11, LT.TENSES[t].icon)}${id === 'when' ? '' : E(34, 14, 11, tm)}
      ${body}
    </svg>`;
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
    else { P.express = false; playFrom(P.i >= P.order.length ? 0 : P.i); }
  };
  $('#prevCell').onclick = () => jumpPos(Math.max(0, P.i - 1));
  $('#nextCell').onclick = () => jumpPos(Math.min(P.order.length - 1, P.i + (P.playing ? 1 : 0)));
  $('#speedSel').onchange = (e) => { SET.speed = e.target.value; saveSet(); };
  $('#passSel').onchange = (e) => { SET.passes = +e.target.value; saveSet(); };
  $('#autoBtn').onclick = () => { SET.auto = !SET.auto; saveSet(); syncDock(); toast(SET.auto ? '🔁 العرض التلقائي: ينتقل القطار للصيغة التالية وحده' : '✋ العرض اليدوي: اضغط ▶ لكل صيغة'); };
  $('#soundBtn').onclick = () => { SET.sound = !SET.sound; saveSet(); syncDock(); if (!SET.sound) hush(); };
  $('#revealBtn').onclick = () => { P.cells.forEach((_, j) => revealCellStatic(j)); };

  /* ---------- التمارين ----------
     كل تمرين يعمل على «عنصر» = صيغة واحدة: {S, r, t, pk, lines (لغة الدرس), ar (الترجمة العربية)}
     ومجموعة عناصر للمشتّتات. تُستخدم في تمارين المحطة وفي التقييم النهائي للخط. */
  const X = { list: [], k: 0, score: 0, results: [], ctx: 'lesson' };
  const TYPES_AR = {
    build: '🧩 رتّب الكلمات', choose: '🎯 اختر الصيغة', listen: '🎧 استمع واختر', hunt: '🔦 صيد الأدوار', flash: '⚡ العرض الخاطف',
    gap: '✏️ أكمل الفراغ', pic: '🖼️ الصورة المناسبة', picsent: '🖼️ ماذا تقول الصورة؟', trans: '🇸🇦 ترجم إلى اللغة المستهدفة',
    order: '📖 رتّب القصة', conn: '🔗 كلمة الربط', kind: '📏 بسيطة أم مركّبة؟', reply: '💬 أكمل الحوار',
  };
  const PKS = ['i', 'you', 'he', 'she', 'we', 'they'];
  function itemsFor(L, u, i, pk) {
    const S = G.sentenceInfo(u, i);
    const out = [];
    [0, 1, 2].forEach(t => {
      const rows = G.build(L, S, pk, t), ar = G.build('ar', S, pk, t);
      rows.forEach((lines, r) => out.push({ S, r, t, pk, lines, ar: ar[r], row: LT.ROWS[r], tense: LT.TENSES[t] }));
    });
    return out;
  }
  /* عنصر عشوائي: من الدرس الحالي، أو من أي جملة في الخط عند التقييم النهائي */
  function pickItem(filter) {
    if (X.ctx === 'lesson') {
      X.pool = itemsFor(NAV.L, NAV.u, NAV.i, NAV.pk);
    } else {
      X.pool = itemsFor(NAV.L, NAV.u, Math.floor(Math.random() * LT.UNITS[NAV.u].s.length), rand(PKS));
    }
    return rand(filter ? X.pool.filter(filter) : X.pool);
  }
  const mainLine = (it) => it.lines[0];
  const lineStr = (it) => G.lineText(mainLine(it));
  function distractorsFor(it, n = 3) {
    const same = shuffle(X.pool.filter(x => x.r === it.r && x.t !== it.t));
    const other = shuffle(X.pool.filter(x => x.t === it.t && x.r !== it.r));
    const seen = new Set([lineStr(it)]), out = [];
    for (const x of [...same, ...other]) { const s = lineStr(x); if (!seen.has(s)) { seen.add(s); out.push(x); } if (out.length >= n) break; }
    return out;
  }
  function renderPractice() {
    if (!NAV.S) { go('route'); return; }
    X.ctx = 'lesson';
    X.list = shuffle(['build', 'choose', 'listen', 'hunt', 'flash', 'gap', 'pic', 'trans', 'build', 'choose']);
    X.k = 0; X.score = 0; X.results = [];
    nextEx();
  }
  function startFinal() {
    X.ctx = 'final';
    X.list = shuffle(['order', 'conn', 'conn', 'kind', 'kind', 'reply', 'reply', 'trans', 'trans', 'trans', 'picsent', 'pic', 'picsent', 'pic']);
    X.k = 0; X.score = 0; X.results = [];
    NAV.view = 'practice'; $('#back').hidden = false; $('#dock').hidden = true;
    nextEx();
  }
  function exShell(type) {
    const dots = X.list.map((_, j) => `<i class="${j < X.results.length ? (X.results[j] ? 'ok' : 'no') : j === X.k ? 'cur' : ''}"></i>`).join('');
    const tag = X.ctx === 'lesson' ? `${NAV.S.emoji} ${esc(NAV.S.ar)}` : `🏁 تقييم الخط ${AR_NUM(NAV.u + 1)}`;
    app.innerHTML = `<section class="view"><div class="ex">
      <div class="exhead"><span class="chip">${TYPES_AR[type]}</span><div class="dots">${dots}</div><span class="chip">${tag}</span></div>
      <div id="exBody" style="display:grid;gap:14px"></div>
      <div id="exFoot"></div>
    </div></section>`;
    window.scrollTo({ top: 0 });
    return $('#exBody');
  }
  const labelOf = (it) => `${it.row.icon} ${it.row.ar} · ${it.tense.icon} ${it.tense.ar}`;
  const paperLines = (lines, L) => `<div class="paper" dir="${isRTL(L) ? 'rtl' : 'ltr'}" lang="${L}">${lines.map((l, k) => lineHTML(l, k, { say: L })).join('')}</div>`;
  /* show = {lines, L} يُعرض بعد الإجابة ويُنطق */
  function answer(ok, show) {
    X.results.push(ok); if (ok) X.score++;
    addXP(ok ? 10 : 2);
    const right = show ? `<div style="margin-top:8px;width:100%">${paperLines(show.lines, show.L)}</div>` : '';
    $('#exFoot').innerHTML = `<div class="feedback ${ok ? 'ok' : 'no'}"><span>${ok ? '✅ أحسنت! القطار يتقدّم' : '❌ ليست صحيحة، هذه هي الإجابة:'}</span>
      <button class="btn btn-main" id="exNext">متابعة ⬅</button>${right}</div>`;
    if (show) speak(G.lineText(show.lines[0]), 1, show.L);
    $('#exNext').onclick = () => { hush(); X.k++; nextEx(); };
    $('#exNext').focus();
  }
  const showIt = (it) => ({ lines: it.lines, L: NAV.L });
  function nextEx() {
    if (X.k >= X.list.length) return exResults();
    const t = X.list[X.k];
    ({ build: exBuild, choose: exChoose, listen: exListen, hunt: exHunt, flash: exFlash, gap: exGap, pic: exPic, picsent: exPicSent, trans: exTrans, order: exOrder, conn: exConn, kind: exKind, reply: exReply })[t]();
  }
  /* إجابة بالضغط على خيار: يلوّن الصحيح والخطأ */
  function bindOpts(body, isRight, onDone) {
    $$('.opt', body).forEach(b => b.onclick = () => {
      const ok = isRight(b);
      $$('.opt', body).forEach(o => { o.disabled = true; if (isRight(o)) o.classList.add('right'); });
      if (!ok) b.classList.add('wrong');
      onDone(ok);
    });
  }

  /* ترتيب كلمات سطر (يُستخدم في «رتّب» وفي الترجمة) */
  function tileBuilder(body, line, L, promptHTML, onDone) {
    const groups = G.units(line).filter(g => stripP(g));
    const target = groups.map(stripP);
    let order = shuffle(target.map((w, j) => j));
    if (order.every((v, j) => v === j) && order.length > 1) order = order.reverse();
    const picked = [];
    body.innerHTML = `${promptHTML}
      <div class="paper"><div class="slots" id="slots" dir="${isRTL(L) ? 'rtl' : 'ltr'}"></div></div>
      <div class="tiles" id="tiles" dir="${isRTL(L) ? 'rtl' : 'ltr'}">${order.map(j => `<button class="tile t r-${groups[j].find(t => t.r !== 'p').r}" data-j="${j}">${esc(target[j])}</button>`).join('')}</div>
      <div style="display:flex;gap:8px;justify-content:center"><button class="btn btn-ghost" id="say">🔊 استمع</button><button class="btn btn-main" id="check" disabled>تحقّق</button></div>`;
    const drawSlots = () => {
      $('#slots').innerHTML = picked.map((j, p) => `<button class="tile" data-p="${p}">${esc(target[j])}</button>`).join('') || '<span class="muted" style="font-family:var(--f-body)">اضغط الكلمات بالترتيب…</span>';
      $$('#slots .tile').forEach(b => b.onclick = () => { const j = picked.splice(+b.dataset.p, 1)[0]; $(`#tiles [data-j="${j}"]`).classList.remove('used'); drawSlots(); });
      $('#check').disabled = picked.length !== target.length;
    };
    $$('#tiles .tile').forEach(b => b.onclick = () => { if (b.classList.contains('used')) return; b.classList.add('used'); picked.push(+b.dataset.j); drawSlots(); });
    $('#say').onclick = () => speak(G.lineText(line), 0.9, L);
    $('#check').onclick = () => {
      const ok = picked.map(j => target[j]).join(' ') === target.join(' ');
      $('#check').disabled = true; $$('#tiles .tile, #slots .tile').forEach(b => b.disabled = true);
      onDone(ok);
    };
    drawSlots();
  }

  function exBuild() {
    const body = exShell('build');
    const it = pickItem(x => { const n = G.units(x.lines[0]).length; return n >= 3 && n <= 11; });
    tileBuilder(body, mainLine(it), NAV.L, `<div class="prompt">رتّب: ${labelOf(it)}</div>${trHint(it)}`, ok => answer(ok, showIt(it)));
  }
  /* تلميح الترجمة المختارة تحت السؤال (بدون نطق) */
  function trHint(it) {
    if (!SET.trans || SET.trans === 'none' || SET.trans === NAV.L) return '';
    const L2 = SET.trans, line = L2 === 'ar' ? it.ar[0] : G.build(L2, it.S, it.pk, it.t)[it.r][0];
    return `<div class="trhint" dir="${isRTL(L2) ? 'rtl' : 'ltr'}">${langOf(L2).flag} ${esc(G.lineText(line))}</div>`;
  }
  function exTrans() {
    const body = exShell('trans');
    const it = pickItem(x => { const n = G.units(x.lines[0]).length; return n >= 3 && n <= 11; });
    tileBuilder(body, mainLine(it), NAV.L, `<div class="prompt">ترجم هذه الجملة إلى ${langOf(NAV.L).ar}:</div>
      <div class="paper" dir="rtl">${lineHTML(it.ar[0], 0, { say: 'ar' })}</div><div class="muted">${labelOf(it)}</div>`, ok => answer(ok, showIt(it)));
  }
  function optionRound(it, prompt, opts, onShown) {
    const body = exShell(X.list[X.k]);
    const all = shuffle([it, ...distractorsFor(it)]);
    body.innerHTML = `<div class="prompt">${prompt}</div>${opts || ''}
      <div class="opts">${all.map((x, j) => `<button class="opt" data-j="${j}">${lineHTML(mainLine(x), 0)}</button>`).join('')}</div>`;
    bindOpts(body, o => all[+o.dataset.j] === it, ok => answer(ok, showIt(it)));
    if (onShown) onShown(body);
  }
  function exChoose() { const it = pickItem(); optionRound(it, `أي جملة هي: ${labelOf(it)}؟`, trHint(it)); }
  function exListen() {
    const it = pickItem();
    optionRound(it, '🎧 استمع ثم اختر الجملة التي سمعتها',
      `<div style="display:flex;gap:8px"><button class="btn btn-rail" id="hear">🔊 استمع</button><button class="btn btn-ghost" id="hearSlow">🐢 ببطء</button></div>`,
      (body) => {
        $$('.opt', body).forEach(o => o.querySelector('.sent').classList.add('plain'));
        $('#hear').onclick = () => speak(lineStr(it), 1, NAV.L);
        $('#hearSlow').onclick = () => speak(lineStr(it), 0.6, NAV.L);
        setTimeout(() => speak(lineStr(it), 0.95, NAV.L), 300);
      });
  }
  function exHunt() {
    const body = exShell('hunt');
    const it = pickItem();
    const groups = G.units(mainLine(it));
    const roles = [...new Set(groups.flat().map(t => t.r).filter(r => !['p', 'x', 'ans'].includes(r)))];
    const role = rand(roles);
    body.innerHTML = `<div class="prompt">اضغط على: <span class="chip" style="font-size:16px"><i style="width:12px;height:12px;border-radius:4px;background:var(--r-${role});display:inline-block"></i> ${LT.ROLES[role]}</span></div>
      <div class="muted">${labelOf(it)}</div>
      <div class="paper huntline">${lineHTML(mainLine(it), 0, { plain: true })}</div>`;
    $$('.huntline .u', body).forEach(u => u.onclick = () => {
      const ok = groups[+u.dataset.j].some(t => t.r === role);
      $('.huntline .sent', body).classList.remove('plain');
      $$('.huntline .u', body).forEach(x => { x.onclick = null; if (groups[+x.dataset.j].some(t => t.r === role)) x.classList.add('hot'); });
      answer(ok, ok ? null : showIt(it));
    });
  }
  function exFlash() {
    const body = exShell('flash');
    const it = pickItem(x => x.r <= 3 || x.row.id === 'pass');
    body.innerHTML = `<div class="prompt">⚡ انتبه! ستظهر جملة بسرعة… في أي زمن هي؟</div>
      <div class="paper flashbox" id="flash"></div>
      <button class="btn btn-ghost" id="again" disabled>🔁 أعد العرض</button>
      <div class="opts" style="grid-template-columns:repeat(3,1fr)">${LT.TENSES.map((t, k) => `<button class="opt ar" data-k="${k}" disabled>${t.icon} ${t.ar}</button>`).join('')}</div>`;
    const show = async () => {
      const box = $('#flash'); if (!box) return;
      $('#again').disabled = true;
      box.innerHTML = lineHTML(mainLine(it), 0, { off: true });
      speak(lineStr(it), 1.3, NAV.L);
      for (const u of $$('.u', box)) { u.classList.remove('off'); await sleep(230); }
      await sleep(900);
      if (!$('#flash')) return;
      box.innerHTML = '<div style="font-size:40px">❓</div>';
      $('#again').disabled = false;
      $$('.opt', body).forEach(o => o.disabled = false);
    };
    $('#again').onclick = show;
    bindOpts(body, o => +o.dataset.k === it.t, ok => { $('#again').disabled = true; answer(ok, showIt(it)); });
    setTimeout(show, 500);
  }
  function blankLine(line, isBlank) {
    return G.units(line).map(g => isBlank(g)
      ? `<span class="u"><span class="t blank">${'_'.repeat(Math.max(3, stripP(g).length))}</span>${esc(g.filter(t => t.r === 'p' && t.jl).map(t => t.w).join(''))}</span>`
      : `<span class="u">${g.map(t => `<span class="t r-${t.r}">${esc(t.w)}</span>`).join('')}</span>`).join(' ');
  }
  function exGap() {
    const body = exShell('gap');
    const KEY = ['aux', 'neg', 'qw', 'verb'];
    const it = pickItem(x => G.units(x.lines[0]).some(g => g.some(t => KEY.includes(t.r))));
    const groups = G.units(mainLine(it));
    const j = rand(groups.map((g, k) => k).filter(k => groups[k].some(t => KEY.includes(t.r))));
    const role = groups[j].find(t => KEY.includes(t.r)).r;
    const right = stripP(groups[j]);
    const others = new Set();
    shuffle(X.pool).forEach(x => G.units(mainLine(x)).forEach(g => { const w = stripP(g); if (w && w.toLowerCase() !== right.toLowerCase() && g.some(t => t.r === role)) others.add(w); }));
    const choices = shuffle([right, ...shuffle([...others]).slice(0, 3)]);
    body.innerHTML = `<div class="prompt">أكمل الفراغ: ${labelOf(it)}</div>${trHint(it)}
      <div class="paper"><div class="sent">${blankLine(mainLine(it), g => g === groups[j])}</div></div>
      <div class="opts" style="grid-template-columns:repeat(2,1fr)">${choices.map(w => `<button class="opt" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
    bindOpts(body, o => o.dataset.w === right, ok => answer(ok, showIt(it)));
  }
  /* الصورة ← اختر الجملة */
  function exPicSent() {
    const it = pickItem();
    optionRound(it, '🖼️ أي جملة تصف هذه الصورة؟', `<div class="bigpic">${scene(it.S, it.r, it.t, it.pk)}</div>`);
  }
  /* الجملة ← اختر الصورة */
  function exPic() {
    const body = exShell('pic');
    const it = pickItem();
    const all = shuffle([it, ...distractorsFor(it)]);
    body.innerHTML = `<div class="prompt">🖼️ اختر الصورة التي تمثّل الجملة:</div>
      <div class="paper">${lineHTML(mainLine(it), 0, { say: NAV.L })}</div>
      <div class="picopts">${all.map((x, j) => `<button class="opt picopt" data-j="${j}" aria-label="صورة ${AR_NUM(j + 1)}">${scene(x.S, x.r, x.t, x.pk)}</button>`).join('')}</div>
      <div class="muted" style="font-size:13px">🎨 لون الخلفية يدل على الزمن: بيج = الماضي، أخضر = الحاضر، أزرق = المستقبل. والرموز تدل على الصيغة: 🚫 نفي، ❓ سؤال، 🔄 مبني للمجهول.</div>`;
    bindOpts(body, o => all[+o.dataset.j] === it, ok => answer(ok, showIt(it)));
  }

  /* ---------- تمارين التقييم النهائي: القصة والحوار وكلمات الربط ---------- */
  const unitN = () => LT.UNITS[NAV.u].s.length;
  const twoIdx = () => { const n = unitN(), a = Math.floor(Math.random() * n); let b = Math.floor(Math.random() * (n - 1)); if (b >= a) b++; return [a, b]; };
  function exOrder() {
    const body = exShell('order');
    const st = G.story(NAV.L, NAV.u, rand(['he', 'she']));
    const parts = [0, 1, 2, 5].map(k => st[k]);
    const all = shuffle(parts.map((p, k) => ({ p, k })));
    const chosen = [];
    body.innerHTML = `<div class="prompt">📖 رتّب أحداث القصة (استعن بكلمات الربط: أولًا، ثم، بعد ذلك، وأخيرًا)</div>
      <div class="opts" id="ord">${all.map((x, j) => `<button class="opt ordopt" data-j="${j}"><span class="num"></span>${lineHTML(x.p.line, 0)}</button>`).join('')}</div>
      <button class="btn btn-main" id="check" disabled>تحقّق</button>`;
    $$('.ordopt', body).forEach(b => b.onclick = () => {
      const j = +b.dataset.j, at = chosen.indexOf(j);
      if (at >= 0) chosen.splice(at, 1); else chosen.push(j);
      $$('.ordopt', body).forEach(o => { const p = chosen.indexOf(+o.dataset.j); $('.num', o).textContent = p >= 0 ? AR_NUM(p + 1) : ''; o.classList.toggle('picked', p >= 0); });
      $('#check').disabled = chosen.length !== all.length;
    });
    $('#check').onclick = () => {
      const ok = chosen.every((j, pos) => all[j].k === pos);
      $('#check').disabled = true; $$('.ordopt', body).forEach(o => o.disabled = true);
      answer(ok, { lines: parts.map(p => p.line), L: NAV.L });
    };
  }
  const connWord = (id) => { const c = LT.CONNECTORS.find(x => x.id === id); return c[NAV.L].replace(/,$/, ''); };
  function exConn() {
    const body = exShell('conn');
    const kind = rand(['and', 'but', 'or']);
    const [i, j] = twoIdx();
    const line = G.compound(NAV.L, NAV.u, i, j, rand(PKS), Math.floor(Math.random() * 3), kind);
    const right = connWord(kind);
    const choices = shuffle(['and', 'but', 'or', 'then'].map(connWord));
    body.innerHTML = `<div class="prompt">🔗 اختر كلمة الربط المناسبة لتصبح جملة مركّبة صحيحة:</div>
      <div class="paper"><div class="sent">${blankLine(line, g => g.some(t => t.r === 'conn'))}</div></div>
      <div class="muted" style="font-size:13px">«و» تجمع بين متشابهين، «لكن» تقابل مثبتاً بمنفي، «أو» للاختيار في السؤال، «ثم» لترتيب الأحداث.</div>
      <div class="opts" style="grid-template-columns:repeat(2,1fr)">${choices.map(w => `<button class="opt" data-w="${esc(w)}">${esc(w)}</button>`).join('')}</div>`;
    bindOpts(body, o => o.dataset.w === right, ok => answer(ok, { lines: [line], L: NAV.L }));
  }
  function exKind() {
    const body = exShell('kind');
    const [i, j] = twoIdx(), pk = rand(PKS), t = Math.floor(Math.random() * 3);
    const comp = Math.random() < 0.5;
    const line = comp ? G.compound(NAV.L, NAV.u, i, j, pk, t, rand(['and', 'but', 'or'])) : G.simple(NAV.L, NAV.u, i, pk, t);
    body.innerHTML = `<div class="prompt">📏 هل هذه جملة بسيطة أم مركّبة؟</div>
      <div class="paper">${lineHTML(line, 0, { say: NAV.L })}</div>
      <div class="muted" style="font-size:13px">البسيطة فيها فعل واحد وفكرة واحدة. المركّبة جملتان مربوطتان بكلمة ربط.</div>
      <div class="opts" style="grid-template-columns:1fr 1fr"><button class="opt ar" data-c="0">📏 بسيطة</button><button class="opt ar" data-c="1">🔗 مركّبة</button></div>`;
    bindOpts(body, o => (o.dataset.c === '1') === comp, ok => answer(ok, { lines: [line], L: NAV.L }));
  }
  function exReply() {
    const body = exShell('reply');
    const [i, j] = twoIdx();
    const dlg = G.dialogue(NAV.L, NAV.u, i, j);
    const ANS = [3, 5, 7, 10, 12, 14];
    const k = rand(ANS);
    const right = G.lineText(dlg[k].line);
    const others = shuffle(ANS.filter(x => x !== k).map(x => G.lineText(dlg[x].line)).filter(s => s !== right)).slice(0, 3);
    const choices = shuffle([right, ...others]);
    const bubble = (m) => `<div class="bubble ${m.who}"><span class="av">${m.who === 'a' ? '👩' : '👨'}</span><div>${lineHTML(m.line, 0, { say: NAV.L })}</div></div>`;
    body.innerHTML = `<div class="prompt">💬 ما الردّ المناسب في الحوار؟</div>
      <div class="chat">${bubble(dlg[k - 1])}<div class="bubble ${dlg[k].who}"><span class="av">${dlg[k].who === 'a' ? '👩' : '👨'}</span><div class="muted">…؟</div></div></div>
      <div class="opts">${choices.map(s => `<button class="opt" data-s="${esc(s)}">${esc(s)}</button>`).join('')}</div>`;
    bindOpts(body, o => o.dataset.s === right, ok => answer(ok, { lines: [dlg[k - 1].line, dlg[k].line], L: NAV.L }));
  }

  function exResults() {
    const n = X.list.length, s = X.score;
    const stars = s >= n - 1 ? 3 : s >= Math.ceil(n * 0.7) ? 2 : 1;
    const { L, u, r, i } = NAV;
    if (X.ctx === 'lesson') {
      const k = key(u, r, i), p = lp(L);
      p[k] = p[k] || { stars: 0 };
      p[k].stars = Math.max(p[k].stars || 0, stars);
    } else {
      const f = (PROG.finals[L] = PROG.finals[L] || {});
      f[u] = Math.max(f[u] || 0, stars);
    }
    saveProg();
    const fin = X.ctx === 'final';
    app.innerHTML = `<section class="view"><div class="ex" style="text-align:center;justify-items:center">
      <div style="font-size:64px;line-height:1">${stars === 3 ? '🏆' : stars === 2 ? '🎉' : '💪'}</div>
      <h2>${AR_NUM(s)} من ${AR_NUM(n)}</h2>
      <div style="font-size:34px">${'⭐'.repeat(stars)}${'☆'.repeat(3 - stars)}</div>
      <p class="muted">${stars === 3 ? (fin ? 'أتقنت الخط كاملاً! انتقل للخط التالي.' : 'إتقان كامل! أنت جاهز للمحطة التالية.') : stars === 2 ? 'ممتاز! راجع ما أخطأت فيه وجرّب مرة أخرى.' : 'أعد مشاهدة الصيغ ببطء ثم جرّب مرة أخرى.'}</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
        ${fin ? `<button class="btn btn-main" id="rNext">🚆 الخط التالي</button><button class="btn btn-ghost" id="rAgain">🔁 تقييم جديد</button><button class="btn btn-ghost" id="rBoard">📖 القصة والحوار</button>`
        : `<button class="btn btn-main" id="rNext">المحطة التالية ⬅</button><button class="btn btn-ghost" id="rAgain">🔁 تمارين جديدة</button><button class="btn btn-ghost" id="rBoard">🚆 لوحة الصيغ</button>`}
      </div></div></section>`;
    if (fin) {
      $('#rNext').onclick = () => (u + 1 < LT.UNITS.length ? go('lesson', { L, u: u + 1, r: 0, i: 0 }) : go('route'));
      $('#rAgain').onclick = () => startFinal();
      $('#rBoard').onclick = () => go('final', { L, u });
    } else {
      $('#rNext').onclick = () => goNextLesson();
      $('#rAgain').onclick = () => renderPractice();
      $('#rBoard').onclick = () => go('lesson');
    }
  }

  /* ---------- التقييم النهائي للخط: كلمات الربط، أنواع الجمل، القصة، الحوار ---------- */
  function renderFinal() {
    const { L, u } = NAV, U = LT.UNITS[u];
    const n = U.s.length;
    const trL = SET.trans && SET.trans !== 'none' && SET.trans !== L ? SET.trans : null;
    const tl = (fn) => trL ? fn(trL) : null;
    const st = G.story(L, u), stT = tl(x => G.story(x, u));
    const di = 2 % n, dj = 7 % n;
    const dlg = G.dialogue(L, u, di, dj), dlgT = tl(x => G.dialogue(x, u, di, dj));
    const ex = (x) => [
      { k: '📏 بسيطة', line: G.simple(x, u, 0, 'i', 0) },
      { k: '🔗 مركّبة بـ«و»', line: G.compound(x, u, 1, 2, 'i', 0, 'and') },
      { k: '🔗 مركّبة بـ«لكن»', line: G.compound(x, u, 3, 4, 'i', 0, 'but') },
      { k: '🔗 مركّبة بـ«أو»', line: G.compound(x, u, 0, 1, 'i', 0, 'or') },
    ];
    const exL = ex(L), exT = tl(ex);
    const dirOf = (x) => isRTL(x) ? 'rtl' : 'ltr';
    const pair = (line, tline) => `<div class="pair"><div dir="${dirOf(L)}" lang="${L}">${lineHTML(line, 0, { say: L })}</div>${tline ? `<div class="blk tr" dir="${dirOf(trL)}" lang="${trL}">${lineHTML(tline, 0, { say: trL })}</div>` : ''}</div>`;
    const fin = (PROG.finals[L] || {})[u] || 0;
    app.innerHTML = `<section class="view">
      <div class="lessonhead" style="grid-template-columns:auto 1fr">
        <div class="window" style="border-color:${U.color}">🏁</div>
        <div><div class="eyebrow">${U.icon} الخط ${AR_NUM(u + 1)} · ${U.ar}</div><h2>التقييم النهائي للخط</h2>
          <div class="muted">تعلّم كلمات الربط وأنواع الجمل، واقرأ القصة واستمع للحوار، ثم ابدأ التقييم. ${fin ? '⭐'.repeat(fin) : ''}</div></div>
      </div>

      <div class="optbar">
        <label class="ctl"><span>🌐 الترجمة</span>
          <select id="trSel"><option value="none">بدون</option><option value="ar">🇸🇦 العربية</option>${LT.LANGS.filter(l => l.id !== L).map(l => `<option value="${l.id}">${l.flag} ${l.ar}</option>`).join('')}</select></label>
        <button class="btn btn-main" id="startFinal">🎯 ابدأ التقييم (${AR_NUM(14)} سؤالاً)</button>
      </div>

      <div class="fcard"><h3>🔗 كلمات الربط</h3>
        <div class="conngrid">${LT.CONNECTORS.map(c => `<div class="connrow"><b class="r-conn">${esc(c[L])}</b><span>${c.ar}</span><span class="muted">${c.use}</span><button class="say" data-say="${esc(c[L].replace(/,$/, ''))}" data-l="${L}" aria-label="استمع">🔊</button></div>`).join('')}</div>
        <p class="muted" style="font-size:13.5px;margin:0">${L === 'de' ? 'في الألمانية: بعد Zuerst / Dann / Danach / Schließlich يأتي الفعل قبل الفاعل (Dann <b>hat sie</b>…). أما und / aber / oder فلا تغيّر الترتيب.' : 'كلمات البداية (أولًا، ثم، بعد ذلك، وأخيرًا) ترتّب الأحداث، وكلمات الربط (و، لكن، أو) تجمع جملتين في جملة مركّبة.'}</p>
      </div>

      <div class="fcard"><h3>📏 الجملة البسيطة والمركّبة</h3>
        ${exL.map((e, k) => `<div class="kindrow"><span class="chip">${e.k}</span>${pair(e.line, exT && exT[k].line)}</div>`).join('')}
      </div>

      <div class="fcard"><h3>📖 القصة <button class="btn btn-ghost" id="playStory" style="padding:6px 12px;font-size:14px">🔊 استمع للقصة</button></h3>
        <div class="story" id="story">${st.map((p, k) => `<div class="storyrow"><span class="chip">${p.kind === 'simple' ? '📏' : '🔗'}</span>${pair(p.line, stT && stT[k].line)}</div>`).join('')}</div>
      </div>

      <div class="fcard"><h3>💬 الحوار <button class="btn btn-ghost" id="playChat" style="padding:6px 12px;font-size:14px">🔊 استمع للحوار</button></h3>
        <div class="chat" id="chat">${dlg.map((m, k) => `<div class="bubble ${m.who}"><span class="av">${m.who === 'a' ? '👩' : '👨'}</span>${pair(m.line, dlgT && dlgT[k].line)}</div>`).join('')}</div>
        <p class="muted" style="font-size:13px;margin:0">👩 سارة و👨 عمر يستخدمان أسئلة نعم/لا وأسئلة أين ولماذا وماذا ومتى وكيف التي تعلّمتها.</p>
      </div>
    </section>`;
    $('#trSel').value = SET.trans || 'none';
    $('#trSel').onchange = (e) => { SET.trans = e.target.value; saveSet(); renderFinal(); };
    $('#startFinal').onclick = () => startFinal();
    const playAll = async (root) => {
      const id = ++P.run;
      for (const s of $$(`.sent`, root)) {
        const b = $('.say', s);
        if (!b || id !== P.run) continue;
        if (b.dataset.l !== L && !SET.sayTrans) continue;   // الترجمة لا تُنطق إلا عند الطلب
        s.classList.add('speaking');
        await speak(b.dataset.say, 0.95, b.dataset.l);
        s.classList.remove('speaking');
        await sleep(250);
      }
    };
    $('#playStory').onclick = () => { hush(); playAll($('#story')); };
    $('#playChat').onclick = () => { hush(); playAll($('#chat')); };
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
    const times = LT.TIME[L].flatMap((g, v) => g.map((w, t) => ({ e: LT.TIME_EMOJI[v][t], w, a: LT.TIME.ar[v][t] })));
    const conns = LT.CONNECTORS.map(c => ({ e: '🔗', w: c[L].replace(/,$/, ''), a: c.ar }));
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
      ['🔗 كلمات الربط', conns],
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
    const vs = ranked(L), cur = voiceFor(L);
    modal(`<div class="sheet settings" style="padding:0;box-shadow:none">
      <h2>⚙️ الإعدادات</h2>
      <div class="field"><label for="setTheme">المظهر</label>
        <select id="setTheme"><option value="auto">حسب الجهاز</option><option value="light">فاتح</option><option value="dark">داكن</option></select></div>
      <div class="field"><label for="setVoice">صوت ${langOf(L).ar}</label>
        <select id="setVoice">${vs.length ? vs.map(v => `<option value="${esc(v.voiceURI)}"${cur && cur.voiceURI === v.voiceURI ? ' selected' : ''}>${stars(v)} ${esc(v.name)} (${esc(v.lang)})</option>`).join('') : '<option value="">لا يوجد صوت مثبّت لهذه اللغة</option>'}</select>
        <button class="btn btn-ghost" id="testVoice">🔊 جرّب الصوت</button>
        <div class="muted" style="font-size:13px;line-height:1.7">⭐⭐⭐ صوت طبيعي · ⭐ صوت عادي · 🤖 صوت آلي. ${voiceTip(L)}</div></div>
      <div class="field"><label><input type="checkbox" id="setWord"${SET.wordFirst ? ' checked' : ''}> نطق كل كلمة وحدها في الجولة الأولى (الأبطأ)</label></div>
      <div class="field"><label for="setSpeed">السرعة</label><select id="setSpeed">${$('#speedSel').innerHTML}</select></div>
      <div class="field"><label for="setPasses">عدد مرات تكرار كل صيغة (عربات القطار)</label><select id="setPasses">${$('#passSel').innerHTML}</select></div>
      <div class="field"><button class="btn btn-ghost" id="reset">🗑️ مسح التقدّم</button></div>
      <button class="btn btn-main" id="closeSet">تم</button>
    </div>`);
    $('#setTheme').value = SET.theme; $('#setSpeed').value = SET.speed; $('#setPasses').value = String(SET.passes);
    $('#setTheme').onchange = (e) => { SET.theme = e.target.value; saveSet(); applyTheme(); };
    $('#setVoice').onchange = (e) => { SET.voices[L] = e.target.value; saveSet(); voiceHint(); speak(G.lineText(G.lesson(L, 0, 0, 'i').cells[0].lines[0]), 1, L); };
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
