/* تقرير الزيارة الصفية (بنود بطاقة الملاحظة فقط) + سيناريو المعلم بالعامية + بطاقة الخروج */
(function () {
  const esc = window.esc, mmss = s => window.mmss(s);

  /* مواضع كل فقرة في العرض والشاهد الموثق */
  const WHERE = {
    1: [['diag', 'exp', 'pattern', 'ws', 'quiz'], 'ورقة العمل بمستوياتها الثلاثة ولقطة الكويز'],
    2: [['plan', 'tps', 'ws', 'quiz'], 'شريحة الخطة بالزمن والعدّاد التلقائي'],
    3: [['outcomes', 'ws', 'hot'], 'سجل الاختيار العشوائي للطلاب'],
    4: [['cover', 'plan'], 'التحضير ومطابقته للتوزيع الزمني'],
    5: [['outcomes', 'pattern', 'exp', 'tps'], 'شريحة الأهداف وخطة الدرس'],
    6: [['tps', 'ws', 'hot'], 'ورقة العمل المتمايزة وأدوار المجموعات'],
    7: [['quiz', 'exit'], 'نتائج الكويز المباشر وواجب منصة مدرستي'],
    8: [['tps', 'creative'], 'إجابات سؤال الحياة والمشكلة'],
    9: [['exp', 'pattern', 'ws'], 'دفاتر التلخيص ومهمة الحساب'],
    10: [['hot', 'creative'], 'إجابات أسئلة التفكير العليا'],
    11: [['plan', 'tps', 'ws', 'peer'], 'ملاحظة العمل التعاوني'],
    12: [['quiz', 'exit'], 'لقطة نتائج الكويز'],
    13: [['cover', 'diag', 'quiz', 'end'], 'لوحة النقاط ونجوم الحصة'],
    14: [['tps', 'ws', 'quiz'], 'ملاحظة الزائر لتفاعل الطلاب'],
    15: [['diag', 'quiz', 'exit'], 'بطاقات الخروج ونتائج الكويز'],
    16: [['ws', 'peer', 'exit'], 'ورقة العمل وتقويم الأقران والتقويم الذاتي'],
    17: [['quiz', 'ws', 'peer'], 'أوراق العمل المصححة بتعليقات وصفية']
  };
  const nums = a => a.length ? (a.length === 1 ? 'الشريحة ' + a[0] : 'الشرائح ' + a.join('، ')) : '—';
  const box = '<span class="rate">التقدير: ☐1 ☐2 ☐3 ☐4</span>';

  function head(L, title, sub) {
    return '<div class="rephead"><div><div class="rk">' + esc(sub) + '</div><h2>' + esc(title) + '</h2><div class="small">' + esc([L.meta.unit, L.meta.lessonType, L.meta.page ? 'ص ' + L.meta.page : ''].filter(Boolean).join(' · ')) + '</div></div><div class="repLogo">📘</div></div>';
  }
  function infoTable(L) {
    const f = (a, b) => '<th>' + a + '</th><td>' + (b || '........................') + '</td>';
    return '<table class="info"><tr>' + f('المدرسة', esc(window.CREDIT.school)) + f('المادة', esc(L.meta.subject)) + '</tr><tr>' + f('المعلم', '') + f('الزائر', '') + '</tr><tr>' + f('الصف / الشعبة', esc(L.meta.grade || L.meta.stage)) + f('عدد الطلاب', '') + '</tr><tr>' + f('اليوم والتاريخ', '') + f('الحصة', esc(L.meta.duration) + ' دقيقة') + '</tr><tr><th>الدرس</th><td colspan="3">' + esc(L.meta.title) + '</td></tr><tr><th>الهدف الرئيس</th><td colspan="3">' + esc(L.focus || L.outcomes[0]) + '</td></tr></table>';
  }
  function flow(L, S) {
    const G = [['open', 'مقدمة الدرس'], ['diag', 'التهيئة والتشخيص'], ['explain', 'الشرح'], ['tps', 'تطبيق تعاوني'], ['ws', 'ورقة العمل'], ['quiz', 'الكويز التفاعلي'], ['hot', 'التفكير العميق'], ['peer', 'تقويم الأقران'], ['exit', 'الختام']];
    return '<table><tr><th>الدقيقة</th><th>المرحلة</th><th>ما يحدث</th><th>الشرائح</th></tr>' + G.map(g => {
      const ss = S.filter(s => s.g === g[0]); if (!ss.length) return '';
      const a = ss[0].from, b = ss[ss.length - 1].from + ss[ss.length - 1].sec;
      return '<tr><td class="ltr">' + mmss(a) + '–' + mmss(b) + '</td><td><b>' + g[1] + '</b></td><td>' + esc(ss.map(s => s.title).join(' · ')) + '</td><td>' + ss.map(s => s.n).join('، ') + '</td></tr>';
    }).join('') + '</table>';
  }

  window.renderReport = function (L) {
    const S = window.buildSlides(L), R = window.buildReport(L);
    const items = R.map(r => {
      const w = WHERE[r.c.id] || [[], ''];
      const n = S.filter(s => w[0].indexOf(s.k) >= 0).map(s => s.n);
      return '<div class="item"><div class="ihead"><span class="inum">' + r.c.id + '</span><div><div class="iind">المؤشر (' + r.c.indicator + ') · ' + esc(r.c.indicatorText) + '</div><b>' + esc(r.c.text) + '</b></div></div>' +
        '<table><tr><th style="width:36%">المشاهدات الدالة (من البطاقة)</th><th>ما يطبَّق في الحصة</th></tr>' +
        r.rows.map(x => '<tr><td>' + (x.ok ? '✓ ' : '◻ ') + esc(x.observable) + '</td><td>' + esc(x.evidence) + (x.action ? '<div class="act">↵ ' + esc(x.action) + '</div>' : '') + '</td></tr>').join('') + '</table>' +
        '<div class="ifoot"><span>موضعه في العرض: <b>' + nums(n) + '</b></span><span>الشاهد: <b>' + esc(w[1]) + '</b></span>' + box + '</div></div>';
    }).join('');
    return '<div class="doc report" contenteditable="true">' + head(L, 'مطابقة معايير الأداء الصفي لدرس ' + L.meta.title, 'تقرير زيارة صفية') + infoTable(L) +
      '<div class="stats"><div><b>17</b><span>بندًا في بطاقة الملاحظة</span></div><div><b>' + S.length + '</b><span>شريحة في العرض</span></div><div><b>' + (L.quiz || []).length + '</b><span>أسئلة في الكويز</span></div><div><b>1</b><span>ورقة عمل بثلاثة مستويات</span></div></div>' +
      '<h3>سير الحصة</h3>' + flow(L, S) +
      '<h3 class="pagebreak">بطاقة الملاحظة الصفية (هيئة تقويم التعليم والتدريب)</h3><p class="small">لكل بند: المشاهدات الدالة كما في البطاقة، وما يقابلها في الحصة، وموضعه في العرض، والشاهد الموثّق. خانة التقدير للزائر.</p>' + items +
      '<h3>ملخص الملاحظة والتغذية الراجعة</h3><table class="notes"><tr><th>ممارسات متميزة تستحق الاستمرار</th><td></td></tr><tr><th>أولوية تحسين</th><td></td></tr><tr><th>دليل أثر الممارسة في تعلم الطلاب</th><td></td></tr><tr><th>خطوة عملية للحصة القادمة</th><td></td></tr></table>' +
      '<div class="sign"><span>المعلم: ........................ التوقيع: ..........</span><span>الزائر: ........................ التوقيع: ..........</span></div>' +
      window.CREDIT_HTML() + '</div>';
  };

  /* ---------- سيناريو المعلم بالعامية السعودية ---------- */
  window.renderScript = function (L) {
    const S = window.buildSlides(L);
    const blocks = []; S.forEach(s => { const b = blocks[blocks.length - 1]; if (b && b.sk === s.sk) b.s.push(s); else blocks.push({ sk: s.sk, s: [s] }); });
    const names = { welcome: 'الافتتاح والترحيب', outcomes: 'إعلان الأهداف', diag: 'التهيئة والتقويم القبلي', explain: 'الشرح', tps: 'فكر – زاوج – شارك', ws: 'ورقة العمل في المجموعات', quiz: 'الكويز التفاعلي', hot: 'التفكير العميق والتحدي', peer: 'تقويم الأقران والاستفسارات', exit: 'بطاقة الخروج والواجب', end: 'الختام ونجوم الحصة' };
    const ul = (a, cls) => (a || []).map(x => '<li class="' + cls + '">' + esc(x) + '</li>').join('');
    return '<div class="doc script" contenteditable="true">' + head(L, 'سيناريو الحصة للمعلم: ' + L.meta.title, 'وش تقول ووش يسوون الطلاب — دقيقة بدقيقة') +
      '<p class="small">🎬 العرض يمشي تلقائيًا بالتوقيت، وهذا النص معك على الجوال أيضًا (زر «📝 السيناريو» أو جهاز التحكم). لا تحتاج السبورة: كل شيء على الشاشة.</p>' +
      blocks.map((b, i) => {
        const sc = (L.script || {})[b.sk] || {}, a = b.s[0].from, z = b.s[b.s.length - 1].from + b.s[b.s.length - 1].sec;
        return '<div class="scene"><div class="shead"><span class="stime">' + mmss(a) + ' – ' + mmss(z) + '</span><b>' + (i + 1) + '. ' + esc(names[b.sk] || b.sk) + '</b><span class="sslides">' + nums(b.s.map(s => s.n)) + '</span></div>' +
          '<div class="cols"><div><h4>🗣️ المعلم يقول</h4><ul>' + ul(sc.teacher, 'say') + '</ul></div><div><h4>🙋 الطلاب</h4><ul>' + ul(sc.students, 'stu') + '</ul><h4>🖱️ ينفّذ على العرض</h4><ul>' + ul(sc.actions, 'do') + '</ul></div></div></div>';
      }).join('') +
      '<h3>💬 عبارات تغذية راجعة جاهزة</h3><ul>' + (L.feedback || []).map(f => '<li><b>' + esc(f.situation) + ':</b> «' + esc(f.phrase) + '»</li>').join('') + '</ul>' +
      window.CREDIT_HTML() + '</div>';
  };

  /* ---------- بطاقة الخروج (4 في الصفحة) ---------- */
  window.renderCards = function (L) {
    const t = '<div class="ticket"><b>🎫 بطاقة الخروج — ' + esc(L.meta.title) + '</b><div class="small">الاسم: ........................</div><p dir="auto">' + esc(L.exitTicket.question) + '</p><div class="lines"></div><div class="lines"></div><div class="small">🟢 أستطيع · 🟡 تقريبًا · 🔴 أحتاج مساعدة</div></div>';
    return '<div class="doc" contenteditable="true"><h2>🎫 بطاقة الخروج (4 في الصفحة — قصّها)</h2><p class="small printonly-hide">الإجابة النموذجية: ' + esc(L.exitTicket.answer) + '</p><div class="tickets">' + t.repeat(4) + '</div>' + window.CREDIT_HTML() + '</div>';
  };
})();
