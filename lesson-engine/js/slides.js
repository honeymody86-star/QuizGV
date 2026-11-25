/* العرض التقديمي: تصميم الشرائح (رسومات وألوان وأشكال وحركة) + التوقيت التلقائي بالثانية */
(function () {
  const esc = window.esc;
  const li = (arr, cls) => (arr || []).filter(Boolean).map(x => '<li class="a ' + (cls || '') + '">' + esc(x) + '</li>').join('');
  const mmss = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(Math.round(s) % 60).padStart(2, '0');
  window.mmss = mmss;

  /* ---------- رسومات SVG متحركة حسب المادة ---------- */
  const ICONS = {
    english: ['💬', '📘', '✏️', 'Aa', '🗣️', '⭐'], math: ['➗', '📐', 'π', '∑', '📊', '✖️'], science: ['⚛️', '🧪', '🔬', '🌍', '⚡', '🧬'],
    arabic: ['📖', '✒️', 'ض', '📝', '💡', '⭐'], islamic: ['🕌', '📖', '🌙', '🤲', '⭐', '💡'], social: ['🌍', '🏛️', '🗺️', '🧭', '🇸🇦', '📜'],
    tech: ['💻', '🤖', '🔐', '📱', '⚙️', '💡'], general: ['💡', '📚', '✏️', '⭐', '🎯', '🧠']
  };
  function subjKey(L) {
    const s = (L.meta.subject || '') + ' ' + (L.meta.title || '') + ' ' + (L.meta.lessonType || '');
    if (/english|إنجليزي|انجليزي|grammar|vocabulary|reading|conversation/i.test(s)) return 'english';
    if (/رياضيات|math|جبر|هندسة/i.test(s)) return 'math';
    if (/علوم|فيزياء|كيمياء|أحياء|science/i.test(s)) return 'science';
    if (/عربي|لغتي|نحو|بلاغة/i.test(s)) return 'arabic';
    if (/إسلامية|فقه|توحيد|حديث|تفسير|قرآن/i.test(s)) return 'islamic';
    if (/اجتماعي|تاريخ|جغرافيا|وطنية/i.test(s)) return 'social';
    if (/حاسب|رقمية|تقنية|برمجة/i.test(s)) return 'tech';
    return 'general';
  }
  function illus(L, variant) {
    const ic = ICONS[subjKey(L)];
    const pos = [[70, 60, 1], [300, 50, .8], [330, 230, 1.1], [50, 250, .9], [190, 20, .7], [200, 300, .8]];
    return '<svg class="ill a" viewBox="0 0 400 360" aria-hidden="true">' +
      '<defs><linearGradient id="gA' + variant + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffcf5a"/><stop offset="1" stop-color="#ff6b9a"/></linearGradient>' +
      '<linearGradient id="gB' + variant + '" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#2cc4ac"/><stop offset="1" stop-color="#7b6cff"/></linearGradient></defs>' +
      '<circle class="spin-slow" cx="200" cy="180" r="150" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2" stroke-dasharray="6 10"/>' +
      '<circle class="pulse" cx="200" cy="180" r="112" fill="url(#gB' + variant + ')" opacity=".95"/>' +
      '<rect class="float2" x="150" y="128" width="100" height="104" rx="26" fill="url(#gA' + variant + ')"/>' +
      '<text x="200" y="198" text-anchor="middle" font-size="58" class="float2">' + ic[0] + '</text>' +
      pos.map((p, i) => '<g class="orb o' + (i % 3) + '" style="animation-delay:' + (i * 0.4) + 's"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (28 * p[2]) + '" fill="#fff" opacity=".95"/><text x="' + p[0] + '" y="' + (p[1] + 10 * p[2]) + '" text-anchor="middle" font-size="' + (28 * p[2]) + '" font-weight="800" fill="#2b2d6e">' + ic[(i + 1) % ic.length] + '</text></g>').join('') +
      '</svg>';
  }
  /* أشكال زخرفية متحركة في خلفية كل شريحة */
  function deco(seed) {
    const cols = ['#ff6b9a', '#ffcf5a', '#2cc4ac', '#7b6cff', '#4aa3ff'];
    let r = seed * 97 + 13; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    let h = '';
    for (let i = 0; i < 7; i++) {
      const c = cols[Math.floor(rnd() * cols.length)], x = Math.round(rnd() * 100), y = Math.round(rnd() * 100), s = 20 + Math.round(rnd() * 70), t = Math.floor(rnd() * 4);
      const shape = t === 0 ? '<circle cx="50" cy="50" r="48" fill="' + c + '"/>' : t === 1 ? '<rect x="4" y="4" width="92" height="92" rx="24" fill="' + c + '"/>' : t === 2 ? '<polygon points="50,4 96,92 4,92" fill="' + c + '"/>' : '<circle cx="50" cy="50" r="40" fill="none" stroke="' + c + '" stroke-width="10"/>';
      h += '<svg class="shp s' + (i % 4) + '" viewBox="0 0 100 100" style="left:' + x + '%;top:' + y + '%;width:' + s + 'px;height:' + s + 'px;animation-delay:-' + (i * 1.7) + 's">' + shape + '</svg>';
    }
    return '<div class="deco">' + h + '<div class="dots"></div></div>';
  }
  const tag = (en, ar, s) => '<div class="tagrow a"><span class="chipTag" style="background:' + (s.color || '#ff6b9a') + '">' + esc(en) + ' · ' + mmss(s.from) + '–' + mmss(s.from + s.sec) + '</span><span class="tagAr">' + esc(ar) + '</span></div>';
  const ICON = { why: '❓', whatIf: '🔄', opinion: '⚖️' };

  /* ---------- قائمة الشرائح ---------- */
  window.buildSlides = function (L) {
    const S = [];
    const add = (k, title, theme, sk, color, render) => S.push({ k, title, theme, sk, color, render });
    const P = L.pattern && L.pattern.parts && L.pattern.parts.length ? L.pattern : null;
    const H = L.hot || {}, W = L.worksheet || {};

    add('cover', L.meta.title, 'dark', 'welcome', '#ffcf5a', s =>
      '<div class="split rev"><div>' +
      '<div class="tagrow a">' + [L.meta.unit, L.meta.lessonType, L.meta.page ? 'p. ' + L.meta.page : ''].filter(Boolean).map(x => '<span class="chipTag" style="background:#ffcf5a;color:#2b2140">' + esc(x) + '</span>').join(' ') + '</div>' +
      '<h1 class="a big">' + esc(L.meta.title) + '</h1>' +
      (L.focus ? '<p class="a sub">' + esc(L.focus) + '</p>' : '') +
      '<p class="a meta">' + esc([L.meta.subject, L.meta.grade || L.meta.stage].filter(Boolean).join(' · ')) + '</p>' +
      '<div class="pill a">🌟 قيمة الأسبوع: <b>' + esc(L.value.weekValue) + '</b></div>' +
      '<p class="a credit2">' + esc(window.CREDIT.line) + '</p></div><div>' + illus(L, 1) + '</div></div>');

    add('plan', 'خطة الدرس بالزمن', 'light', 'welcome', '#ff6b9a', (s, all) => {
      const groups = [['open', 'مقدمة الدرس', '#e8457c'], ['diag', 'التهيئة والتشخيص', '#ff8a3d'], ['explain', 'الشرح', '#7b6cff'], ['tps', 'تطبيق تعاوني', '#2cc4ac'], ['ws', 'ورقة العمل', '#1fa463'], ['quiz', 'الكويز التفاعلي', '#4aa3ff'], ['hot', 'التفكير العميق', '#9b5de5'], ['peer', 'تقويم الأقران', '#0f9d8a'], ['exit', 'الختام والخروج', '#e3a008']];
      const rows = groups.map(g => { const ss = all.filter(x => x.g === g[0]); if (!ss.length) return ''; const a = ss[0].from, b = ss[ss.length - 1].from + ss[ss.length - 1].sec; return '<div class="trow a"><span class="tpill" style="background:' + g[2] + '">' + mmss(a) + '–' + mmss(b) + '</span><b>' + g[1] + '</b><span class="tbar"><i style="width:' + Math.max(4, (b - a) / L.meta.duration / 60 * 100) + '%;background:' + g[2] + '"></i></span></div>'; }).join('');
      return tag('Lesson Plan · ' + L.meta.duration + ' min', 'خطة الدرس بالزمن', s) + '<h2 class="a">⏱️ خطة الدرس بالزمن</h2><div class="timeline">' + rows + '</div>' +
        '<div class="strip a">🤝 اتفاقنا: ' + esc((L.charter || []).slice(0, 3).join(' · ')) + '</div>';
    });

    add('outcomes', 'أهداف الدرس', 'light', 'outcomes', '#7b6cff', s =>
      tag('Lesson Goals', 'أهداف الدرس', s) + '<div class="hero a"><span class="heroIc">🎯</span><div><div class="kick">اليوم بنهاية الحصة سنكون قادرين على…</div><b>' + esc(L.focus || L.outcomes[0]) + '</b></div></div>' +
      '<div class="cards3">' + (L.outcomes || []).slice(0, 3).map((o, i) => '<div class="cardx a" style="--c:' + ['#ff6b9a', '#2cc4ac', '#7b6cff'][i] + '"><span class="num">' + (i + 1) + '</span><p>' + esc(o.replace(/^أن\s+/, '')) + '</p></div>').join('') + '</div>' +
      '<div class="strip a">🎲 يُختار طالب عشوائيًا ليقرأ الأهداف بصوت مسموع</div>');

    add('diag', 'التهيئة والتقويم القبلي', 'light', 'diag', '#ff8a3d', s =>
      tag('Warm-up', 'التهيئة والتقويم القبلي', s) + '<h2 class="a">⚡ تحدي الدقيقتين</h2>' +
      '<div class="qcard a"><p>' + esc(L.diagnostic.question) + '</p></div>' +
      '<div class="thinkrow a"><span class="thinkdot">🤫</span><span>فكّر بصمت 5 ثوانٍ… لا ترفع يدك</span></div>' +
      '<button class="reveal a" onclick="this.classList.add(\'on\')"><span>👁️ اضغط لإظهار الإجابة</span><em>' + esc(L.diagnostic.answer) + '</em></button>');

    if (P) add('pattern', P.title || 'القاعدة', 'violet', 'explain', '#ffcf5a', s =>
      tag('Rule', 'القاعدة', s) + '<h2 class="a">' + esc(P.title || 'القاعدة') + '</h2>' +
      '<div class="formula" dir="' + (/[a-z]/i.test(P.parts.join('')) ? 'ltr' : 'rtl') + '">' + P.parts.map((p, i) => /^[+=→\-–]$/.test(String(p).trim()) ? '<span class="op a">' + esc(p) + '</span>' : '<span class="fchip a c' + (i % 4) + '">' + esc(p) + '</span>').join('') + '</div>' +
      (P.noteAr ? '<p class="a noteAr">💡 ' + esc(P.noteAr) + '</p>' : '') +
      '<div class="exlist">' + (P.examples || []).slice(0, 3).map(e => '<div class="ex a"><b dir="auto">' + esc(e.text || e) + '</b>' + (e.ar ? '<span>' + esc(e.ar) + '</span>' : '') + '</div>').join('') + '</div>');

    (L.explanation || []).slice(0, 4).forEach((e, i) => add('exp', e.title, 'light', 'explain', ['#7b6cff', '#2cc4ac', '#ff6b9a', '#4aa3ff'][i % 4], s =>
      tag('Idea ' + (i + 1), 'الفكرة ' + (i + 1), s) + '<div class="split"><div><h2 class="a" dir="auto">' + esc(e.title) + '</h2><ul class="pts">' + li(e.points) + '</ul>' +
      (e.example ? '<div class="excard a" dir="auto">💡 ' + esc(e.example) + '</div>' : '') + '</div>' +
      '<div class="imgwrap a" data-prompt="' + esc(e.imagePrompt || '') + '">' + illus(L, 10 + i) + '</div></div>'));

    add('tps', 'فكر – زاوج – شارك', 'teal', 'tps', '#2cc4ac', s =>
      tag('Think · Pair · Share', 'فكر – زاوج – شارك', s) + '<h2 class="a">🌍 سؤال الحياة</h2><div class="qcard a"><p>' + esc(L.life.question) + '</p></div>' +
      '<div class="steps3">' + [['🧠', 'فكّر', 'دقيقة وحدك'], ['👥', 'زاوج', 'دقيقتان مع زميلك'], ['📣', 'شارك', 'دقيقتان مع الصف']].map((x, i) => '<div class="step a"><span class="sic">' + x[0] + '</span><b>' + (i + 1) + '. ' + x[1] + '</b><small>' + x[2] + '</small></div>').join('<span class="arrow a">←</span>') + '</div>' +
      '<p class="a small2">' + esc(L.life.scenario) + '</p>');

    add('ws', 'ورقة العمل المتمايزة', 'light', 'ws', '#1fa463', s =>
      tag('Worksheet', 'ورقة العمل المتمايزة', s) + '<h2 class="a">📝 ورقة العمل — اختر مستواك ثم تحدَّ نفسك</h2>' +
      '<div class="cards3">' + [['🟢 انطلق', '#1fa463', W.struggling], ['🟡 حلّق', '#e3a008', W.average], ['🟣 أبدع', '#7b6cff', W.advanced]].map(x => '<div class="cardx a" style="--c:' + x[1] + '"><b>' + x[0] + '</b><p dir="auto">' + esc(((x[2] || [])[0] || {}).q) + '</p></div>').join('') + '</div>' +
      '<div class="roles a">' + [['👑', 'قائد'], ['✍️', 'كاتب'], ['⏱️', 'ميقاتي'], ['📣', 'متحدث']].map(r => '<span>' + r[0] + ' ' + r[1] + '</span>').join('') + '</div>' +
      '<div class="strip a">🔢 ' + esc(L.numeracy.task) + '</div>');

    add('quiz', 'الكويز التفاعلي', 'dark', 'quiz', '#4aa3ff', s =>
      tag('Live Quiz', 'تقويم تكويني تفاعلي', s) + '<div class="split"><div><h2 class="a">📱 امسح وأجب من جوالك</h2>' +
      '<p class="a sub">أو ارفع أصابعك مع الجميع في نفس اللحظة</p><div class="toks a">' + ['A', 'B', 'C', 'D'].map((t, i) => '<span class="tok k' + i + '">' + t + '</span>').join('') + '</div>' +
      '<div id="liveBox" class="livebars a"><p class="small2">النتائج المباشرة تظهر هنا</p></div></div><div class="qrbox a"><div class="qr" id="slideQR"></div><span>📶 كويز ' + (L.quiz || []).length + ' أسئلة</span></div></div>');

    add('hot', 'فكّر بعمق', 'violet', 'hot', '#ffcf5a', s =>
      tag('Critical Thinking', 'أسئلة التفكير العليا', s) + '<h2 class="a">🧠 فكّر بعمق</h2>' +
      [['why', 'لماذا؟'], ['whatIf', 'ماذا لو؟'], ['opinion', 'ما رأيك؟ وما دليلك؟']].filter(x => H[x[0]]).map(x => '<div class="hq a"><span>' + ICON[x[0]] + '</span><div><b>' + x[1] + '</b><p dir="auto">' + esc(H[x[0]].q) + '</p></div></div>').join('') +
      '<div class="thinkrow a"><span class="thinkdot">⏳</span><span>5 ثوانٍ تفكير صامت قبل اختيار المجيب</span></div>');

    add('creative', 'تحدي الإبداع', 'light', 'hot', '#ff6b9a', s =>
      tag('Challenge', 'تحدي الإبداع وحل المشكلات', s) + '<div class="cards2">' +
      '<div class="cardx a" style="--c:#ff6b9a"><b>💡 تحدي الإبداع</b><p dir="auto">' + esc((H.creative || {}).q) + '</p></div>' +
      '<div class="cardx a" style="--c:#4aa3ff"><b>🧩 حل مشكلة</b><p dir="auto">' + esc((H.problem || {}).q) + '</p></div></div>' +
      '<div class="strip a">🌐 ' + esc(L.diversity) + '</div><div class="strip a gold">🇸🇦 ' + esc(L.value.vision2030) + '</div>');

    add('peer', 'تقويم الأقران', 'teal', 'peer', '#2cc4ac', s =>
      tag('Peer Check', 'الدقيقة الذكية', s) + '<h2 class="a">👥 بدّل دفترك مع زميلك وصحّح وفق المعيار</h2>' +
      '<div class="checks">' + (L.peer.criteria || []).map(c => '<div class="chk a"><span>☑️</span>' + esc(c) + '</div>').join('') + '</div>' +
      '<div class="strip a">✍️ اكتب لزميلك ملاحظة تطويرية: «بدايتك صحيحة، لكن راجع…»</div><div class="strip a gold">❓ دقيقة لاستفساراتكم</div>');

    add('exit', 'بطاقة الخروج', 'light', 'exit', '#e3a008', s =>
      tag('Exit Ticket', 'بطاقة الخروج والواجب', s) + '<h2 class="a">🎫 بطاقة الخروج</h2><div class="qcard a"><p dir="auto">' + esc(L.exitTicket.question) + '</p></div>' +
      '<div class="traffic">' + [['#1fa463', 'أستطيع', 'وحدي بثقة'], ['#ffcf5a', 'تقريبًا', 'أحتاج تدريبًا'], ['#ff5d5d', 'أحتاج مساعدة', 'سأراجع مع المعلم']].map(t => '<div class="tl a"><i style="background:' + t[0] + '"></i><b>' + t[1] + '</b><small>' + t[2] + '</small></div>').join('') + '</div>' +
      '<div class="strip a">🏠 واجبكم التفاعلي والإثراء متاح الليلة عبر منصة مدرستي: ' + esc(L.homework.madrasati) + '</div>');

    add('end', 'نجوم الحصة', 'grad', 'end', '#ffcf5a', s =>
      '<div class="center"><div class="confetti">' + Array.from({ length: 18 }, (_, i) => '<i style="left:' + (i * 5.5) + '%;animation-delay:' + (i % 6) * 0.35 + 's;background:' + ['#ffcf5a', '#ff6b9a', '#2cc4ac', '#7b6cff', '#fff'][i % 5] + '"></i>').join('') + '</div>' +
      '<h1 class="a big">🏆 أحسنتم يا أبطال!</h1><div id="starsBox" class="pill a">⭐ نجوم الحصة</div>' +
      '<p class="a sub">🇸🇦 ' + esc(L.value.nationalFact) + '</p><p class="a credit2">' + esc(window.CREDIT.line) + '</p></div>');

    assignTimes(S, L);
    let t = 0; S.forEach((s, i) => { s.from = t; t += s.sec; s.n = i + 1; });
    S.forEach(s => {
      s.html = '<section class="sl t-' + s.theme + '">' + deco(s.n) + '<div class="slin">' + s.render(s, S) + '</div></section>';
      s.script = (L.script || {})[s.sk] || null;
    });
    return S;
  };

  /* ---------- توقيت كل شريحة بالثانية (المجموع = زمن الحصة) ---------- */
  function assignTimes(S, L) {
    const total = (+L.meta.duration || 45) * 60;
    const G = { open: ['cover', 'plan', 'outcomes'], diag: ['diag'], explain: ['pattern', 'exp'], tps: ['tps'], ws: ['ws'], quiz: ['quiz'], hot: ['hot', 'creative'], peer: ['peer'], exit: ['exit', 'end'] };
    const DEF = { open: 150, diag: 180, explain: 540, tps: 300, ws: 450, quiz: 330, hot: 240, peer: 180, exit: 330 };
    const MAPT = { cards: 'diag', video: 'explain', discussion: 'explain', worksheet: 'ws', quiz: 'quiz', picker: 'hot', peer: 'peer', exit: 'exit' };
    const sec = {};
    (L.phases || []).forEach((p, i) => {
      const g = i === 0 ? 'open' : (MAPT[p.tool] || (p.tool === 'timer' && !sec.tps ? 'tps' : 'explain'));
      sec[g] = (sec[g] || 0) + (+p.minutes || 0) * 60;
    });
    Object.keys(DEF).forEach(g => { if (!sec[g]) sec[g] = DEF[g] * total / 2700; });
    const sum = Object.keys(DEF).reduce((a, g) => a + sec[g], 0);
    const W = { cover: 0.25, plan: 0.3, outcomes: 0.45, pattern: 1.3, hot: 0.62, creative: 0.38, exit: 0.8, end: 0.2 };
    Object.keys(G).forEach(g => {
      const sl = S.filter(s => G[g].indexOf(s.k) >= 0); if (!sl.length) return;
      sl.forEach(s => s.g = g);
      const w = sl.map(s => W[s.k] || 1), tw = w.reduce((a, b) => a + b, 0);
      sl.forEach((s, i) => { s.sec = Math.max(15, Math.round(sec[g] * total / sum * w[i] / tw / 5) * 5); });
    });
    S.forEach(s => { if (!s.sec) s.sec = 30; });
    const diff = total - S.reduce((a, s) => a + s.sec, 0);
    const big = S.reduce((m, s, i) => s.sec > S[m].sec ? i : m, 0); S[big].sec += diff;
    S.forEach(s => { s.minutes = Math.round(s.sec / 6) / 10; });
  }

  window.slideNumbers = function (L, kinds) {
    return window.buildSlides(L).filter(s => kinds.indexOf(s.k) >= 0).map(s => s.n);
  };

  window.timingTable = function (L) {
    return '<table><tr><th>#</th><th>الشريحة / الجزئية</th><th>المدة</th><th>من – إلى</th></tr>' + window.buildSlides(L).map(s => '<tr><td>' + s.n + '</td><td>' + esc(s.title) + '</td><td>' + mmss(s.sec) + '</td><td>' + mmss(s.from) + ' – ' + mmss(s.from + s.sec) + '</td></tr>').join('') + '<tr><th colspan="2">المجموع</th><th colspan="2">' + mmss((+L.meta.duration || 45) * 60) + '</th></tr></table>';
  };

  window.renderSlidesTab = function (L) {
    const S = window.buildSlides(L);
    return '<div class="row" style="justify-content:space-between"><h2 style="margin:0">🖥️ العرض التقديمي (' + S.length + ' شريحة · ' + L.meta.duration + ' دقيقة)</h2><div class="row"><button class="primary" data-act="present">▶️ ابدأ الحصة</button><button data-act="pptx">⬇️ PowerPoint</button></div></div>' +
      '<p class="small"><b>▶️ العرض يمشي تلقائيًا بالثواني</b> وينتقل لكل جزئية عند انتهاء وقتها · <b>مسافة</b> = إيقاف/متابعة · المعلم لا يحتاج السبورة: كل شيء على الشاشة.</p>' +
      '<div class="thumbgrid">' + S.map(s => '<div class="thumb" data-goto="' + (s.n - 1) + '"><div class="tscale">' + s.html + '</div><span>' + s.n + '. ' + esc(s.title) + ' · ' + mmss(s.sec) + '</span></div>').join('') + '</div>';
  };
})();
