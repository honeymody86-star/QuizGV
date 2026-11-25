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
      '<h3>🎯 نواتج التعلم (تُعرض في العرض ويقرؤها طالب)</h3><ol>' + li(L.outcomes) + '</ol>' +
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
      (items || []).slice(0, 2).map(x => '<li>' + esc(x.q) + '<div class="lines"></div><div class="ans printonly-hide">✔ ' + esc(x.a) + '</div></li>').join('') + '</ol></div>';
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
      '<table><tr><th colspan="2">👥 تقويم الأقران — اسم المصحح: ..................</th></tr>' + (L.peer.criteria || []).slice(0, 3).map(c => '<tr><td>' + esc(c) + '</td><td style="width:90px">☐ تحقق ☐ لا</td></tr>').join('') + '<tr><td colspan="2">ملاحظة تطويرية لزميلي: ......................................................</td></tr></table>' +
      '<table><tr><th colspan="4">🪞 تقويمي الذاتي</th></tr>' + (L.self || []).slice(0, 3).map(s => '<tr><td>' + esc(s) + '</td><td>🟢</td><td>🟡</td><td>🔴</td></tr>').join('') + '</table>' +
      window.CREDIT_HTML() + '</div>';
  };

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
        'ناتج التعلم معروض في الشريحة الثانية تلقائيًا؛ جهّز «ركن التعلم» بالبطاقات والنسخ المكبرة.',
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
