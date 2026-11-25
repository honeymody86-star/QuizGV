/* عرض مخرجات الدرس: الخطة، ورقة العمل، البطاقات، الشرائح، التقرير، دليل المعلم */
(function () {
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  window.esc = esc;
  const li = arr => (arr || []).map(x => '<li>' + esc(x) + '</li>').join('');
  const AR = ['أ', 'ب', 'ج', 'د'];
  const LBL = ['A', 'B', 'C', 'D'];
  window.CREDIT_HTML = () => '<div class="credit">' + esc(window.CREDIT.line) + '</div>';

  window.appBase = function () {
    if (/^https?:/.test(location.protocol)) return location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
    let h = ''; try { h = localStorage.getItem('le_host') || ''; } catch (e) {}
    return h || 'https://honeymody86-star.github.io/QuizGV/lesson-engine/';
  };

  window.quizURL = function (L, host) {
    const compact = { t: L.meta.title, s: L.meta.subject, q: (L.quiz || []).map(q => [q.q, q.options, q.correct, q.explain || '']), x: L.self || [] };
    let url;
    for (let cut = 0; cut < 4; cut++) {
      const c = JSON.parse(JSON.stringify(compact));
      if (cut >= 1) c.q.forEach(q => q[3] = '');
      if (cut >= 2) c.x = [];
      if (cut >= 3) c.q = c.q.slice(0, 4);
      url = window.appBase() + 'student.html#d=' + LZString.compressToEncodedURIComponent(JSON.stringify(c)) + (host ? '&h=' + host : '');
      if (url.length < 2300) break;
    }
    return url;
  };

  window.makeQR = function (el, text, size) {
    el.innerHTML = '';
    try {
      const q = window.qrcode(0, 'L'); q.addData(text); q.make();
      const n = q.getModuleCount(); size = size || 180;
      const img = new Image(); img.alt = 'QR';
      img.src = q.createDataURL(Math.max(2, Math.ceil(size / (n + 8))), 4);
      img.style.width = img.style.height = size + 'px'; img.style.imageRendering = 'pixelated';
      el.appendChild(img);
      return img.src;
    } catch (e) {
      el.innerHTML = '<div class="small" style="color:#c0392b;max-width:180px">تعذر توليد QR (الرابط طويل). استخدم رابط الكويز من تبويب الأدوات.</div>';
    }
  };

  function header(L, kind) {
    return '<h2>' + esc(kind) + ': ' + esc(L.meta.title) + '</h2>' +
      '<div class="headbox"><div><b>المادة:</b> ' + esc(L.meta.subject) + '</div><div><b>الصف:</b> ' + esc(L.meta.grade) + '</div><div><b>الوحدة:</b> ' + esc(L.meta.unit) + '</div>' +
      '<div><b>الزمن:</b> ' + esc(L.meta.duration) + ' دقيقة</div><div><b>المعلم:</b> ........................</div><div><b>التاريخ:</b> ...... / ...... / ......</div></div>';
  }

  /* ---------- خطة الدرس ---------- */
  window.renderPlan = function (L) {
    const res = (L.resources || []).map(r => {
      const q = r.search ? '<br><a target="_blank" rel="noopener" href="https://www.youtube.com/results?search_query=' + encodeURIComponent(r.search) + '">🔎 يوتيوب</a> · <a target="_blank" rel="noopener" href="https://ien.edu.sa/#/search?q=' + encodeURIComponent(r.search) + '">عين</a> · <a target="_blank" rel="noopener" href="https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(r.search) + '">صور</a>' : '';
      return '<tr><td>' + esc(r.type) + '</td><td>' + esc(r.title) + q + '</td><td>' + esc(r.use) + '</td><td>' + esc(r.forNeeds) + '</td></tr>';
    }).join('');
    let t = 0;
    const phases = (L.phases || []).map((p, i) => {
      const from = t; t += +p.minutes || 0;
      return '<tr><td>' + (i + 1) + '</td><td><b>' + esc(p.name) + '</b><br><span class="small">⏱️ ' + from + '–' + t + ' د (' + esc(p.minutes) + ' د)</span></td><td>' + esc(p.teacher) + '</td><td>' + esc(p.students) + '</td><td class="small">' + esc(p.evidence) + '</td></tr>';
    }).join('');
    const strat = (L.strategies || []).map(s => '<tr><td><b>' + esc(s.name) + '</b><br><span class="small">' + esc(s.phase) + '</span></td><td>' + esc(s.why) + '</td><td><ol style="margin:0;padding-inline-start:18px">' + li(s.steps) + '</ol></td></tr>').join('');
    const expl = (L.explanation || []).map(e => '<h4 style="margin:10px 0 2px">◆ ' + esc(e.title) + '</h4><ul style="margin:0">' + li(e.points) + '</ul>' + (e.example ? '<div class="small"><b>مثال:</b> ' + esc(e.example) + '</div>' : '')).join('');
    const H = L.hot || {};
    const hot = [['لماذا؟', H.why], ['ماذا لو؟', H.whatIf], ['ما رأيك؟ وما دليلك؟', H.opinion], ['تفكير إبداعي', H.creative], ['حل مشكلة', H.problem]]
      .filter(x => x[1]).map(x => '<tr><td><b>' + x[0] + '</b></td><td>' + esc(x[1].q) + '</td><td class="small">' + esc(x[1].a) + '</td></tr>').join('');
    const fb = (L.feedback || []).map(f => '<tr><td>' + esc(f.situation) + '</td><td>«' + esc(f.phrase) + '»</td></tr>').join('');
    const D = L.differentiation || {};
    return '<div class="doc" contenteditable="true">' + header(L, 'خطة الدرس') +
      '<h3>🎯 نواتج التعلم (تُكتب أعلى السبورة ويقرؤها طالب)</h3><ol>' + li(L.outcomes) + '</ol>' +
      '<h3>📖 ملخص المحتوى العلمي</h3><p>' + esc(L.summary) + '</p>' +
      (L.keyConcepts && L.keyConcepts.length ? '<table><tr><th>المفهوم</th><th>التعريف</th></tr>' + L.keyConcepts.map(k => '<tr><td><b>' + esc(k.term) + '</b></td><td>' + esc(k.definition) + '</td></tr>').join('') + '</table>' : '') +
      '<h3>🇸🇦 القيم والهوية الوطنية</h3><table><tr><th>قيمة الأسبوع</th><td>' + esc(L.value.weekValue) + ' — ' + esc(L.value.statement) + '</td></tr><tr><th>رؤية 2030</th><td>' + esc(L.value.vision2030) + '</td></tr><tr><th>منجز وطني</th><td>' + esc(L.value.nationalFact) + '</td></tr><tr><th>احترام التنوع</th><td>' + esc(L.diversity) + '</td></tr></table>' +
      '<h3>🤝 ميثاق التعامل الصفي</h3><ul>' + li(L.charter) + '</ul>' +
      '<h3>⏱️ سير الدرس والتوزيع الزمني</h3><table><tr><th>#</th><th>المرحلة / النشاط</th><th>دور المعلم</th><th>دور الطلاب</th><th>الشاهد للمقوّم</th></tr>' + phases + '</table>' +
      '<h3>⏱️ توقيت العرض التلقائي (ثانية بثانية)</h3>' + window.timingTable(L) +
      '<h3>🧩 إستراتيجيات التدريس</h3><table><tr><th>الإستراتيجية</th><th>سبب الاختيار</th><th>خطوات التنفيذ</th></tr>' + strat + '</table>' +
      '<h3>🧰 مصادر التعلم</h3><table><tr><th>النوع</th><th>المصدر</th><th>طريقة الاستخدام</th><th>يخدم</th></tr>' + res + '</table>' +
      '<h3>🔍 التقويم التشخيصي</h3><p><b>' + esc(L.diagnostic.question) + '</b><br><span class="small">' + esc(L.diagnostic.answer) + '</span></p>' +
      '<h3>📚 محتوى الشرح</h3>' + expl +
      '<h3>🌍 الربط بالحياة</h3><p><b>سؤال الحياة:</b> ' + esc(L.life.question) + '<br><b>موقف:</b> ' + esc(L.life.scenario) + '<br><b>مهمة تطبيقية:</b> ' + esc(L.life.task) + '</p>' +
      '<h3>✍️ القراءة والكتابة والحساب</h3><p><b>قراءة:</b> ' + esc(L.literacy.reading) + '<br><b>كتابة:</b> ' + esc(L.literacy.writing) + '<br><b>مفردات:</b> ' + (L.literacy.vocab || []).map(v => '<span class="pill">' + esc(v) + '</span>').join('') + '<br><b>حساب:</b> ' + esc(L.numeracy.task) + ' <span class="small">(الحل: ' + esc(L.numeracy.answer) + ')</span></p>' +
      '<h3>🧠 أسئلة التفكير العليا</h3><table><tr><th>النوع</th><th>السؤال</th><th>الإجابة النموذجية</th></tr>' + hot + '</table>' +
      '<h3>💻 البحث الرقمي والتقنية</h3><p>' + esc(L.research.task) + '<br><b>مصادر موثوقة:</b> ' + esc((L.research.sources || []).join('، ')) + '<br><b>الاستخدام الآمن:</b> ' + esc(L.research.safety) + '</p>' +
      '<h3>⚖️ مراعاة الفروق الفردية</h3><table><tr><th>المتعثرون</th><th>المتفوقون</th><th>ذوو الإعاقة</th></tr><tr><td><ul>' + li(D.struggling) + '</ul></td><td><ul>' + li(D.advanced) + '</ul></td><td><ul>' + li(D.special) + '</ul></td></tr></table>' +
      '<h3>✅ التقويم</h3><table><tr><th>تشخيصي</th><td>' + esc(L.diagnostic.question) + '</td></tr><tr><th>تكويني</th><td>كويز تفاعلي QR (' + (L.quiz || []).length + ' أسئلة) + ورقة العمل المتمايزة + أسئلة شفوية</td></tr><tr><th>ختامي</th><td>بطاقة الخروج: ' + esc(L.exitTicket.question) + '</td></tr><tr><th>تقويم الأقران</th><td>' + esc(L.peer.instructions) + '<br>المعايير: ' + esc((L.peer.criteria || []).join(' / ')) + '</td></tr><tr><th>تقويم ذاتي</th><td>' + esc((L.self || []).join(' / ')) + '</td></tr></table>' +
      '<h3>💬 بنك التغذية الراجعة الوصفية</h3><table><tr><th>الموقف</th><th>العبارة</th></tr>' + fb + '</table>' +
      '<h3>🏆 التحفيز</h3><ul>' + li(L.motivation) + '</ul>' +
      '<h3>🏠 الواجب والإثراء</h3><p><b>منصة مدرستي:</b> ' + esc(L.homework.madrasati) + '<br><b>إثراء:</b> ' + esc(L.homework.enrichment) + '</p>' +
      '<h3>🌿 ممارسات صحية</h3><p>' + esc(L.health) + '</p>' +
      window.CREDIT_HTML() + '</div>';
  };

  /* ---------- ورقة العمل ---------- */
  window.renderWorksheet = function (L) {
    const lv = (cls, name, icon, items) => '<div class="lvl ' + cls + '"><b>' + icon + ' ' + name + '</b><ol>' +
      (items || []).map(x => '<li>' + esc(x.q) + '<div class="lines"></div><div class="lines"></div><div class="ans printonly-hide">✔ ' + esc(x.a) + '</div></li>').join('') + '</ol></div>';
    const W = L.worksheet || {};
    return '<div class="row noprint" style="margin-bottom:8px"><label style="display:flex;gap:6px;align-items:center;margin:0;color:var(--text)"><input type="checkbox" id="wsLarge" style="width:auto"> نسخة بخط مكبر (لذوي الاحتياج)</label><label style="display:flex;gap:6px;align-items:center;margin:0;color:var(--text)"><input type="checkbox" id="wsAns" checked style="width:auto"> إظهار الإجابات (للمعلم)</label></div>' +
      '<div class="doc" id="wsDoc" contenteditable="true">' +
      '<div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start"><div style="flex:1">' + header(L, 'ورقة عمل') +
      '<div class="small">الاسم: ................................ المجموعة: ....... رقمي في المجموعة: ....</div></div>' +
      '<div style="text-align:center"><div class="qr" id="wsQR"></div><div class="small">امسح للكويز التفاعلي</div></div></div>' +
      '<p class="small"><b>تعليمات:</b> ابدأ بالمستوى الأول ثم انتقل للأعلى. لديك ⏱️ ' + esc((L.phases.find(p => p.tool === 'worksheet') || { minutes: 8 }).minutes) + ' دقائق.</p>' +
      lv('lv1', 'المستوى الأول: انطلق', '🟢', W.struggling) +
      lv('lv2', 'المستوى الثاني: حلّق', '🟡', W.average) +
      lv('lv3', 'المستوى الثالث: أبدع (تحدٍّ)', '🟣', W.advanced) +
      '<div class="lvl" style="border-color:#1f4e9c;background:#eef4ff"><b>🔢 مهمة حسابية:</b> ' + esc(L.numeracy.task) + '<div class="lines"></div></div>' +
      '<div class="lvl" style="border-color:#0f7b6c;background:#eefaf7"><b>🌍 سؤال الحياة:</b> ' + esc(L.life.question) + '<div class="lines"></div><div class="lines"></div></div>' +
      '<div class="lvl" style="border-color:#555"><b>✍️ لخّص الفكرة الرئيسة في سطرين:</b><div class="lines"></div><div class="lines"></div></div>' +
      '<table><tr><th colspan="2">👥 تقويم الأقران — اسم المصحح: ..................</th></tr>' + (L.peer.criteria || []).map(c => '<tr><td>' + esc(c) + '</td><td style="width:90px">☐ تحقق ☐ لا</td></tr>').join('') + '<tr><td colspan="2">ملاحظة تطويرية لزميلي: ......................................................</td></tr></table>' +
      '<table><tr><th colspan="4">🪞 تقويمي الذاتي</th></tr>' + (L.self || []).map(s => '<tr><td>' + esc(s) + '</td><td>😀</td><td>🙂</td><td>😐</td></tr>').join('') + '</table>' +
      window.CREDIT_HTML() + '</div>';
  };

  /* ---------- البطاقات ---------- */
  window.renderCards = function (L) {
    const t = '<div class="ticket"><b>🎫 بطاقة الخروج — ' + esc(L.meta.title) + '</b><div class="small">الاسم: ........................</div><p>' + esc(L.exitTicket.question) + '</p><div class="lines"></div><div class="lines"></div><div class="small">قيّم فهمك: 😀 فهمت تمامًا · 🙂 فهمت جزئيًا · 😐 أحتاج مساعدة</div><div class="small" style="margin-top:4px">سؤال ما زال في ذهني: ...........................</div></div>';
    const colors = ['#d62839', '#1f6feb', '#e3a008', '#1e8e3e'];
    const concepts = (L.keyConcepts || []).concat((L.literacy.vocab || []).filter(v => !(L.keyConcepts || []).some(k => k.term === v)).map(v => ({ term: v, definition: '..........' })));
    return '<div class="doc" contenteditable="true"><h2>🎫 بطاقات الخروج (6 لكل صفحة)</h2><p class="small printonly-hide">الإجابة النموذجية: ' + esc(L.exitTicket.answer) + '</p><div class="tickets">' + t.repeat(6) + '</div>' + window.CREDIT_HTML() + '</div>' +
      '<div class="doc pagebreak" style="margin-top:14px"><h2>🟥🟦🟨🟩 بطاقات الاستجابة المتزامنة (A/B/C/D)</h2><p class="small">اطبع نسخة لكل طالب أو مجموعة. يرفع الجميع البطاقة معًا بعد زمن التفكير.</p><div class="respcards">' +
      LBL.map((l, i) => '<div class="respcard" style="background:' + colors[i] + '">' + l + '</div>').join('') + '</div></div>' +
      '<div class="doc pagebreak" style="margin-top:14px" contenteditable="true"><h2>🃏 بطاقات المفاهيم (للمطابقة والتصنيف)</h2><p class="small">قصّ البطاقات؛ تطابق المجموعات المصطلح مع تعريفه.</p><div class="tickets">' +
      concepts.map(k => '<div class="ticket" style="min-height:90px;text-align:center;font-size:22px;font-weight:800">' + esc(k.term) + '</div><div class="ticket" style="min-height:90px">' + esc(k.definition) + '</div>').join('') + '</div>' + window.CREDIT_HTML() + '</div>';
  };

  /* ---------- الشرائح ---------- */
  window.buildSlides = function (L) {
    const S = [];
    const ph = t => (L.phases || []).find(p => p.tool === t) || {};
    S.push({ k: 'cover', title: L.meta.title, html: '<div class="kicker">' + esc([L.meta.subject, L.meta.grade].filter(Boolean).join(' · ')) + '</div><h1>' + esc(L.meta.title) + '</h1><div class="box"><p>🌟 قيمة الأسبوع: <b>' + esc(L.value.weekValue) + '</b></p><p>' + esc(L.value.statement) + '</p></div><p style="opacity:.8">🇸🇦 ' + esc(L.value.vision2030) + '</p><p class="kicker">' + esc(window.CREDIT.line) + '</p>' });
    S.push({ k: 'outcomes', title: 'نواتج التعلم', minutes: 1, tool: 'picker', html: '<div class="kicker">اليوم بنهاية الحصة سنكون قادرين على…</div><h2>🎯 نواتج التعلم</h2><ol>' + li(L.outcomes.map(o => o.replace(/^أن\s+/, ''))) + '</ol><p class="kicker">🎲 سيُختار طالب عشوائيًا ليقرأ النواتج</p>' });
    S.push({ k: 'charter', title: 'ميثاقنا', html: '<h2>🤝 ميثاق التعامل</h2><ul>' + li(L.charter) + '</ul><p class="kicker">🌿 ' + esc(L.health) + '</p>' });
    S.push({ k: 'diag', title: 'تحدي الدقيقتين', minutes: (ph('cards').minutes || 2), tool: 'timer', html: '<div class="kicker">تقويم تشخيصي</div><h2>⚡ تحدي الدقيقتين</h2><div class="box"><p>' + esc(L.diagnostic.question) + '</p></div><p class="kicker">فكّر بصمت… ثم ارفع بطاقتك عند الإشارة</p>' });
    (L.explanation || []).forEach((e, i) => {
      S.push({ k: 'exp', title: e.title, img: e.imagePrompt, html: '<div class="split"><div><div class="kicker">الفكرة ' + (i + 1) + '</div><h2>' + esc(e.title) + '</h2><ul>' + li(e.points) + '</ul>' + (e.example ? '<div class="box"><p>💡 ' + esc(e.example) + '</p></div>' : '') + '</div><div class="imgslot" data-prompt="' + esc(e.imagePrompt || '') + '"></div></div>' });
    });
    if ((L.keyConcepts || []).length) S.push({ k: 'concepts', title: 'المفاهيم', html: '<h2>📌 المفاهيم الرئيسة</h2>' + L.keyConcepts.map(k => '<div class="box"><p><b>' + esc(k.term) + ':</b> ' + esc(k.definition) + '</p></div>').join('') + '<p class="kicker">✍️ لخّص في دفترك: ' + esc(L.literacy.writing) + '</p>' });
    S.push({ k: 'tps', title: 'فكر – زاوج – شارك', minutes: (ph('timer').minutes || 5), tool: 'timer', html: '<div class="kicker">فكر (1) · زاوج (2) · شارك (2)</div><h2>🌍 سؤال الحياة</h2><div class="box"><p>' + esc(L.life.question) + '</p></div><p>' + esc(L.life.scenario) + '</p>' });
    S.push({ k: 'ws', title: 'ورقة العمل', minutes: (ph('worksheet').minutes || 8), tool: 'timer', html: '<h2>📝 ورقة العمل المتمايزة</h2><div class="box"><p>🟢 انطلق ← 🟡 حلّق ← 🟣 أبدع</p><p>ابدأ بمستواك ثم تحدَّ نفسك بالمستوى الأعلى.</p></div><p>🔢 ' + esc(L.numeracy.task) + '</p><p class="kicker">الرؤوس المرقمة: سيُختار رقم عشوائي لعرض إجابة المجموعة</p>' });
    S.push({ k: 'quiz', title: 'الكويز التفاعلي', minutes: (ph('quiz').minutes || 6), tool: 'quiz', html: '<div class="split"><div><div class="kicker">تقويم تكويني</div><h2>📱 كويز تفاعلي</h2><p>امسح الرمز وأجب من جوالك — أو استخدم بطاقات A/B/C/D</p><div id="liveBox" class="box livebars"><p class="small">النتائج المباشرة تظهر هنا</p></div></div><div style="text-align:center"><div class="qr" id="slideQR"></div></div></div>' });
    const H = L.hot || {};
    S.push({ k: 'hot', title: 'تفكير أعمق', minutes: (ph('picker').minutes || 4), tool: 'think', html: '<h2>🧠 فكّر بعمق</h2>' + [['لماذا؟', H.why], ['ماذا لو؟', H.whatIf], ['ما رأيك؟ وما دليلك؟', H.opinion]].filter(x => x[1]).map(x => '<div class="box"><p><b>' + x[0] + '</b> ' + esc(x[1].q) + '</p></div>').join('') + '<p class="kicker">⏳ 5 ثوانٍ تفكير صامت قبل الاختيار</p>' });
    S.push({ k: 'creative', title: 'تحدي الإبداع', html: '<h2>💡 تحدي الإبداع وحل المشكلات</h2><div class="box"><p>' + esc((H.creative || {}).q) + '</p></div><div class="box"><p>' + esc((H.problem || {}).q) + '</p></div><p class="kicker">🌐 ' + esc(L.diversity) + '</p>' });
    S.push({ k: 'peer', title: 'تقويم الأقران', minutes: (ph('peer').minutes || 3), tool: 'timer', html: '<div class="kicker">الدقيقة الذكية</div><h2>👥 تقويم الأقران</h2><p>' + esc(L.peer.instructions) + '</p><div class="box"><ul>' + li(L.peer.criteria) + '</ul></div><p class="kicker">❓ دقيقة لاستفساراتكم</p>' });
    S.push({ k: 'exit', title: 'بطاقة الخروج', minutes: (ph('exit').minutes || 4), tool: 'timer', html: '<h2>🎫 بطاقة الخروج</h2><div class="box"><p>' + esc(L.exitTicket.question) + '</p></div><h2 style="margin-top:3vh">🏠 واجبكم الليلة على منصة مدرستي</h2><p>' + esc(L.homework.madrasati) + '</p><p class="kicker">🔎 ' + esc(L.research.task) + '</p>' });
    S.push({ k: 'end', title: 'نجوم الحصة', html: '<h1>🏆 نجوم الحصة</h1><div id="starsBox" class="box"><p>شكرًا لتميزكم اليوم!</p></div><p>🇸🇦 ' + esc(L.value.nationalFact) + '</p><p class="kicker">' + esc(window.CREDIT.line) + '</p>' });
    assignTimes(S, L);
    return S;
  };

  /* توقيت كل شريحة بالثواني بحيث يساوي المجموع زمن الحصة بالضبط */
  function assignTimes(S, L) {
    const total = (+L.meta.duration || 45) * 60;
    const G = { open: ['cover', 'outcomes', 'charter'], diag: ['diag'], explain: ['exp', 'concepts'], tps: ['tps'], ws: ['ws'], quiz: ['quiz'], hot: ['hot', 'creative'], peer: ['peer'], exit: ['exit', 'end'] };
    const DEF = { open: 120, diag: 180, explain: 540, tps: 300, ws: 480, quiz: 360, hot: 240, peer: 180, exit: 300 };
    const MAPT = { cards: 'diag', video: 'explain', discussion: 'explain', worksheet: 'ws', quiz: 'quiz', picker: 'hot', peer: 'peer', exit: 'exit' };
    const sec = {};
    (L.phases || []).forEach((p, i) => {
      const g = i === 0 ? 'open' : (MAPT[p.tool] || (p.tool === 'timer' && !sec.tps ? 'tps' : 'explain'));
      sec[g] = (sec[g] || 0) + (+p.minutes || 0) * 60;
    });
    Object.keys(DEF).forEach(g => { if (!sec[g]) sec[g] = DEF[g] * total / 2700; });
    const sum = Object.keys(DEF).reduce((a, g) => a + sec[g], 0);
    const W = { cover: 0.3, outcomes: 0.4, charter: 0.3, hot: 0.62, creative: 0.38, exit: 0.8, end: 0.2 };
    Object.keys(G).forEach(g => {
      const sl = S.filter(s => G[g].indexOf(s.k) >= 0); if (!sl.length) return;
      const w = sl.map(s => W[s.k] || 1), tw = w.reduce((a, b) => a + b, 0);
      sl.forEach((s, i) => { s.sec = Math.max(15, Math.round(sec[g] * total / sum * w[i] / tw / 5) * 5); });
    });
    S.forEach(s => { if (!s.sec) s.sec = 30; });
    const diff = total - S.reduce((a, s) => a + s.sec, 0);
    const big = S.reduce((m, s, i) => s.sec > S[m].sec ? i : m, 0); S[big].sec += diff;
    S.forEach(s => { s.minutes = Math.round(s.sec / 6) / 10; });
  }
  const mmss = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  window.mmss = mmss;
  window.timingTable = function (L) {
    let t = 0;
    return '<table><tr><th>#</th><th>الشريحة / الجزئية</th><th>المدة</th><th>من – إلى</th></tr>' + window.buildSlides(L).map((s, i) => { const a = t; t += s.sec; return '<tr><td>' + (i + 1) + '</td><td>' + esc(s.title) + '</td><td>' + mmss(s.sec) + '</td><td>' + mmss(a) + ' – ' + mmss(t) + '</td></tr>'; }).join('') + '<tr><th colspan="2">المجموع</th><th colspan="2">' + mmss(t) + '</th></tr></table>';
  };

  window.renderSlidesTab = function (L) {
    const S = window.buildSlides(L);
    return '<div class="card"><div class="row" style="justify-content:space-between"><h2 style="margin:0">🖥️ العرض التفاعلي (' + S.length + ' شريحة)</h2><div class="row"><button class="primary" data-act="present">▶️ ابدأ العرض</button><button data-act="pptx">⬇️ PowerPoint (.pptx)</button><button data-act="gamma">✨ نسخة مبهرة عبر Gamma</button></div></div>' +
      '<p class="small"><b>▶️ العرض يمشي تلقائيًا بالثواني</b> وينتقل لكل جزئية عند انتهاء وقتها · <b>مسافة</b> = إيقاف/متابعة.</p><p class="small muted">الأسهم للتنقل · T مؤقت كبير · R اختيار طالب · W زمن التفكير 5 ثوانٍ · D النرد · Q رمز الكويز · F ملء الشاشة · 🎙️ أوامر صوتية · 📱 تحكم من الجوال.</p>' +
      '<ol>' + S.map(s => '<li><b>' + esc(s.title) + '</b>' + ' <span class="small muted">⏱️ ' + mmss(s.sec) + '</span>' + '</li>').join('') + '</ol></div>';
  };

  /* ---------- التقرير ---------- */
  window.renderReport = function (L) {
    const R = window.buildReport(L);
    const avg = (R.reduce((a, r) => a + r.score, 0) / R.length).toFixed(2);
    const full = R.filter(r => r.score === 4).length;
    const bars = R.map(r => '<div class="bar"><span>ف' + r.c.id + '</span><span class="t"><i style="width:' + (r.score * 25) + '%"></i></span><span class="score s' + r.score + '">' + r.score + '</span></div>').join('');
    const body = R.map(r => '<h3>الفقرة (' + r.c.id + ') <span class="score s' + r.score + '">' + r.score + '/4</span></h3>' +
      '<p class="small"><b>المؤشر (' + r.c.indicator + '):</b> ' + esc(r.c.indicatorText) + '<br><b>الفقرة:</b> ' + esc(r.c.text) + (r.c.note ? '<br><i>' + esc(r.c.note) + '</i>' : '') + '<br><b>سلم التقدير:</b> ' + r.c.scaleText.map((s, i) => (i + 1) + ': ' + s).join(' · ') + '<br><b>عدد الشواهد المحققة في الدرس:</b> ' + r.count + '</p>' +
      '<table><tr><th style="width:30%">المشاهدة الدالة</th><th>ما يقابلها في الدرس</th><th style="width:28%">ما تفعله عمليًا</th></tr>' +
      r.rows.map(x => '<tr><td>' + (x.ok ? '✅ ' : '⚠️ ') + esc(x.observable) + '</td><td>' + esc(x.evidence) + '</td><td class="small">' + esc(x.action) + '</td></tr>').join('') + '</table>').join('');
    const std = (window.PLAN_STANDARDS || []).map(g => '<tr><th colspan="3">' + esc(g.group) + '</th></tr>' + g.items.map(it => '<tr><td>(' + it.n + ') ' + esc(it.name) + '</td><td class="small">' + esc(it.action) + '</td><td class="small">' + esc(planEvidence(L, it.key)) + '</td></tr>').join('')).join('');
    return '<div class="doc" contenteditable="true">' + header(L, 'التقرير المتكامل للدرس') +
      '<h3>📊 الخلاصة</h3><p>متوسط الدرجة المتوقعة: <b>' + avg + ' / 4</b> — فقرات بالدرجة الكاملة: <b>' + full + ' من ' + R.length + '</b>.</p><p class="small">الدرجة المتوقعة محسوبة من عدد الشواهد المصممة في الدرس مقابل سلم كل فقرة، وتتحقق فعليًا عند تنفيذ ما في عمود «ما تفعله عمليًا».</p>' +
      '<div class="bars">' + bars + '</div>' +
      '<h3>🧾 نواتج التعلم وما يقيسها</h3><table><tr><th>الناتج</th><th>أداة القياس في الدرس</th></tr>' + (L.outcomes || []).map((o, i) => '<tr><td>' + esc(o) + '</td><td>' + esc(['التشخيص + الكويز + ورقة العمل (المستوى الأول)', 'ورقة العمل (المستوى الثاني) + تقويم الأقران', 'سؤال الحياة + المهمة التطبيقية + بطاقة الخروج', 'أسئلة التفكير العليا + المستوى الثالث'][i] || 'الكويز وبطاقة الخروج') + '</td></tr>').join('') + '</table>' +
      '<h2 class="pagebreak" style="margin-top:20px">تقرير المؤشرات — بطاقة الملاحظة الصفية</h2>' + body +
      '<h2 class="pagebreak" style="margin-top:20px">مطابقة خطة العمل الإجرائية للمعلم</h2><table><tr><th>المعيار</th><th>الإجراء المقترح</th><th>ما يقابله في الدرس</th></tr>' + std + '</table>' +
      window.CREDIT_HTML() + '</div>';
  };

  function planEvidence(L, key) {
    const m = {
      identity: 'قيمة ' + L.value.weekValue + ' + ' + L.value.vision2030,
      charter: 'ميثاق التعامل: ' + (L.charter || []).slice(0, 2).join('، '),
      resources: (L.resources || []).map(r => r.title).slice(0, 3).join('، '),
      timer: 'مؤقت مرئي لكل نشاط في وضع العرض (' + (L.phases || []).length + ' أنشطة)',
      picker: 'عجلة الأسماء وأعواد المثلجات الرقمية دون تكرار + سجل المشاركة',
      points: 'لوحة النقاط ونجوم الحصة: ' + (L.motivation || []).slice(0, 2).join('، '),
      diversity: L.diversity,
      outcomes: (L.outcomes || []).length + ' نواتج معلنة في الشريحة الأولى ويقيسها الكويز وبطاقة الخروج',
      worksheet: 'ورقة عمل بثلاثة مستويات (انطلق/حلّق/أبدع)',
      life: L.life.question,
      hot: ((L.hot || {}).whatIf || {}).q || '',
      strategies: (L.strategies || []).map(s => s.name).join('، '),
      self: L.research.task + ' + تقويم ذاتي',
      digital: 'كويز QR مباشر + تصدير Kahoot/Wordwall + واجب مدرستي',
      literacy: L.literacy.reading,
      numeracy: L.numeracy.task,
      assessment: 'ملاحظة + كويز + ورقة عمل + أقران + بطاقة خروج',
      exit: L.exitTicket.question,
      feedback: ((L.feedback || [])[0] || {}).phrase || '',
      health: L.health
    };
    return m[key] || '';
  }

  /* ---------- دليل المعلم ---------- */
  window.renderGuide = function (L) {
    let t = 0;
    const script = (L.phases || []).map(p => { const a = t; t += +p.minutes || 0; return '<tr><td>' + a + '–' + t + '</td><td><b>' + esc(p.name) + '</b></td><td>' + esc(p.teacher) + '</td><td class="small">' + esc(toolName(p.tool)) + '</td></tr>'; }).join('');
    const tips = (window.TIPS || []).map(g => '<h3>' + esc(g.title) + '</h3><ul>' + g.items.map(x => '<li>☐ ' + esc(x) + '</li>').join('') + '</ul>').join('');
    return '<div class="doc" contenteditable="true">' + header(L, 'دليل المعلم للتنفيذ') +
      '<h3>📋 قبل الحصة (ما يلزمك تنفيذه عمليًا)</h3><ul>' +
      ['اطبع ورقة العمل (نسخة لكل طالب + نسخة مكبرة) وبطاقات الخروج وبطاقات A/B/C/D من تبويب «البطاقات».',
        'افتح التحضير على درس اليوم، وتأكد من مطابقته للتوزيع الزمني (الفرق أسبوع فقط).',
        'أدخل أسماء الطلاب في تبويب «أدوات الحصة» لتعمل عجلة الأسماء وأعواد المثلجات وسجل المشاركة.',
        'قسّم الطلاب إلى مجموعات رباعية مرقمة (1–4) — المحرك يولّد المجموعات تلقائيًا.',
        'حمّل المقطع/الصور المقترحة في «الخطة» مسبقًا تحسبًا لضعف الإنترنت.',
        'اكتب ناتج التعلم أعلى السبورة، وجهّز «ركن التعلم» بالبطاقات والنسخ المكبرة.',
        'ارفع واجب مدرستي: ' + L.homework.madrasati,
        'جرّب فتح الكويز بمسح QR من جوالك قبل الحصة.',
        'تأكد من تهوية الصف وترتيب الجلوس بما يمنع التشتت.'].map(x => '<li>☐ ' + esc(x) + '</li>').join('') + '</ul>' +
      '<h3>🎬 سيناريو الحصة دقيقة بدقيقة</h3><table><tr><th>الدقيقة</th><th>النشاط</th><th>ما تفعله</th><th>الأداة في المحرك</th></tr>' + script + '</table>' +
      '<h3>🗣️ عبارات جاهزة تقولها</h3><ul>' + li(['«اليوم بنهاية الحصة سنكون قادرين على…» (اطلب من طالب قراءتها)', '«سأختار بالعجلة، فكّر بصمت 5 ثوانٍ…»', '«ارفعوا البطاقات معًا الآن»', '«' + L.life.question + '»', '«واجبكم التفاعلي والإثراء متاح الليلة عبر منصة مدرستي»', '«لدينا دقيقة لأسئلتكم واستفساراتكم»'].concat((L.feedback || []).map(f => '«' + f.phrase + '»'))) + '</ul>' +
      '<h3>🎯 تكتيكات الدرجة الكاملة</h3>' + tips +
      '<p><b>تذكّر:</b> المقوّم يبحث عن «بيئة صفية منظمة، نشطة، يتحدث ويفكر فيها الطلاب أكثر مما يتحدث المعلم».</p>' +
      window.CREDIT_HTML() + '</div>';
  };
  function toolName(t) {
    return ({ timer: 'المؤقت المرئي', picker: 'عجلة الأسماء', quiz: 'كويز QR مباشر', worksheet: 'ورقة العمل + المؤقت', cards: 'بطاقات A/B/C/D + المؤقت', peer: 'معيار الأقران + المؤقت', exit: 'بطاقة الخروج + نجوم الحصة', video: 'الشرائح + المقطع', discussion: 'عجلة الأسماء' })[t] || 'المؤقت';
  }
})();
