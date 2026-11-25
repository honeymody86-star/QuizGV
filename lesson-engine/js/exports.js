/* التصدير والتكامل مع الأدوات الخارجية:
   Word، PowerPoint، Kahoot/Wayground (Excel)، Wordwall، نماذج Google، NotebookLM، Gamma، Canva،
   ChatGPT/Gemini للصور والمحاكاة، و Claude للتحكم بالجهاز. */
(function () {
  const esc = window.esc;
  function loadOne(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = src; s.onload = res;
      s.onerror = () => { s.remove(); rej(new Error('تعذر تحميل المكتبة — تحقق من الإنترنت')); }; document.head.appendChild(s);
    });
  }
  /* النسخة المحلية أولًا ثم jsDelivr ثم unpkg */
  function loadScript(local, cdn) {
    if (loadScript.done[local]) return Promise.resolve();
    const alt = cdn.replace('https://cdn.jsdelivr.net/npm/', 'https://unpkg.com/');
    return loadOne(local).catch(() => loadOne(cdn)).catch(() => loadOne(alt)).then(() => { loadScript.done[local] = 1; });
  }
  loadScript.done = {};
  function download(name, blob) {
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
  }
  window.downloadFile = download;
  const safe = s => String(s || 'درس').replace(/[\\/:*?"<>|]+/g, '').slice(0, 60);

  /* ---------- Word ---------- */
  window.exportWord = function (L) {
    const css = 'body{font-family:"Traditional Arabic","Sakkal Majalla",Tahoma;direction:rtl;font-size:14pt}table{border-collapse:collapse;width:100%}td,th{border:1px solid #888;padding:4px;vertical-align:top}th{background:#e8f0fb}h2{color:#0f5c51}h3{color:#1f4e9c}.credit{text-align:center;color:#555;font-size:10pt}.lvl{border:2px solid #999;padding:6px;margin:6px 0}.ans{color:#0a6b3d}.lines{border-bottom:1px dotted #999;height:18pt}';
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><style>' + css + '</style></head><body dir="rtl">' +
      window.renderPlan(L) + '<br style="page-break-before:always">' + window.renderWorksheet(L).replace(/<div class="row noprint"[\s\S]*?<\/div>/, '') +
      '<br style="page-break-before:always">' + window.renderCards(L) + '<br style="page-break-before:always">' + window.renderReport(L) + '</body></html>';
    download(safe(L.meta.title) + ' - الدرس والتقرير.doc', new Blob(['﻿' + html], { type: 'application/msword' }));
  };
  window.exportScriptWord = function (L) {
    const css = 'body{font-family:"Traditional Arabic","Sakkal Majalla",Tahoma;direction:rtl;font-size:14pt}h2{color:#3d2fb0}.scene{border:1px solid #bbb;margin:8pt 0;padding:6pt}.shead{background:#efeafc;padding:4pt}h4{color:#0f7b6c;margin:4pt 0}.stu{color:#1f4e9c}.do{color:#7a4b00}.credit{text-align:center;color:#555;font-size:10pt}';
    const html = '<html><head><meta charset="utf-8"><style>' + css + '</style></head><body dir="rtl">' + window.renderScript(L) + '</body></html>';
    download(safe(L.meta.title) + ' - سيناريو المعلم.doc', new Blob(['\ufeff' + html], { type: 'application/msword' }));
  };

  /* ---------- PowerPoint ---------- */
  window.exportPPTX = async function (L) {
    await loadScript('vendor/pptxgen.bundle.js', 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js');
    const p = new window.PptxGenJS(); p.layout = 'LAYOUT_WIDE'; p.rtlMode = true;
    p.title = L.meta.title; p.author = window.CREDIT.author;
    const TH = { light: ['FBF6EE', '22244D'], teal: ['E9FBF6', '22244D'], violet: ['2B2160', 'FFFFFF'], dark: ['17163A', 'FFFFFF'], grad: ['7B3FE4', 'FFFFFF'] };
    const PAL = ['FF6B9A', 'FFCF5A', '2CC4AC', '7B6CFF', '4AA3FF'];
    const F = 'Tajawal';
    window.buildSlides(L).forEach(sl => {
      const th = TH[sl.theme] || TH.light, dark = th[1] === 'FFFFFF';
      const s = p.addSlide(); s.background = { color: th[0] };
      // أشكال زخرفية
      s.addShape(p.ShapeType.ellipse, { x: -1.2, y: -1.2, w: 3.2, h: 3.2, fill: { color: PAL[sl.n % 5], transparency: 78 } });
      s.addShape(p.ShapeType.roundRect, { x: 11.4, y: 5.6, w: 2.4, h: 2.4, rectRadius: 0.4, rotate: 20, fill: { color: PAL[(sl.n + 2) % 5], transparency: 75 } });
      s.addShape(p.ShapeType.ellipse, { x: 12.2, y: 0.3, w: 0.7, h: 0.7, fill: { color: PAL[(sl.n + 1) % 5], transparency: 50 } });
      const d = document.createElement('div'); d.innerHTML = sl.html;
      const chip = d.querySelector('.chipTag');
      if (chip) { s.addShape(p.ShapeType.roundRect, { x: 9.6, y: 0.35, w: 3.2, h: 0.42, rectRadius: 0.2, fill: { color: (sl.color || '#FF6B9A').replace('#', '') } }); s.addText(chip.textContent, { x: 9.6, y: 0.35, w: 3.2, h: 0.42, fontSize: 12, bold: true, color: 'FFFFFF', align: 'center', fontFace: F }); }
      const h = d.querySelector('h1,h2');
      s.addText(h ? h.textContent : sl.title, { x: 0.6, y: 0.85, w: 12.1, h: 1, fontSize: sl.k === 'cover' || sl.k === 'end' ? 40 : 30, bold: true, color: dark ? 'FFFFFF' : '22244D', align: 'right', rtlMode: true, fontFace: F });
      const sel = '.sub,.hero b,.cardx,.qcard,.pts li,.excard,.hq,.ex,.step,.chk,.tl,.trow,.strip,.noteAr,.pill';
      const items = Array.from(new Set(Array.from(d.querySelectorAll(sel)).map(e => e.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean))).slice(0, 7);
      const formula = Array.from(d.querySelectorAll('.fchip,.op')).map(e => e.textContent).join('  ');
      let y = 2.0;
      if (formula) { s.addText(formula, { x: 0.8, y, w: 11.8, h: 0.9, fontSize: 28, bold: true, color: 'FFCF5A', align: 'center', fontFace: F }); y += 1.1; }
      const w = sl.k === 'quiz' ? 7.6 : 12.1, hh = Math.min(0.78, (6.9 - y) / Math.max(1, items.length));
      items.forEach((t, i) => {
        s.addShape(p.ShapeType.roundRect, { x: 0.6 + (sl.k === 'quiz' ? 4.6 : 0), y, w, h: hh - 0.1, rectRadius: 0.12, fill: { color: dark ? 'FFFFFF' : 'FFFFFF', transparency: dark ? 88 : 0 }, line: { color: PAL[i % 5], width: 1.5 } });
        s.addText(t, { x: 0.75 + (sl.k === 'quiz' ? 4.6 : 0), y, w: w - 0.3, h: hh - 0.1, fontSize: t.length > 90 ? 13 : 17, color: dark ? 'FFFFFF' : '22244D', align: 'right', rtlMode: true, valign: 'middle', fontFace: F });
        y += hh;
      });
      if (sl.k === 'quiz') {
        const c = document.createElement('div'); const src = window.makeQR(c, window.quizURL(L, null), 300);
        if (src) { s.addShape(p.ShapeType.roundRect, { x: 0.6, y: 2.0, w: 4.0, h: 4.0, rectRadius: 0.2, fill: { color: 'FFFFFF' } }); s.addImage({ data: src.replace(/^data:/, ''), x: 0.8, y: 2.2, w: 3.6, h: 3.6 }); }
      }
      s.addText('⏱️ ' + window.mmss(sl.sec) + '   ·   ' + sl.n, { x: 0.4, y: 7.0, w: 3, h: 0.35, fontSize: 11, color: dark ? 'CCCCEE' : '777799', align: 'left', fontFace: F });
      s.addText(window.CREDIT.line, { x: 4, y: 7.0, w: 8.9, h: 0.35, fontSize: 10, color: dark ? 'CCCCEE' : '777799', align: 'right', fontFace: F });
      const sc = sl.script || {}; s.addNotes(['⏱️ ' + window.mmss(sl.sec)].concat((sc.teacher || []).map(x => '🗣️ ' + x), (sc.students || []).map(x => '🙋 ' + x), (sc.actions || []).map(x => '🖱️ ' + x)).join('\n'));
    });
    await p.writeFile({ fileName: safe(L.meta.title) + '.pptx' });
  };

  /* ---------- Kahoot / Wayground (Excel) ---------- */
  window.exportKahoot = async function (L) {
    await loadScript('vendor/xlsx.full.min.js', 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    const head = ['Question - max 120 characters', 'Answer 1 - max 75 characters', 'Answer 2 - max 75 characters', 'Answer 3 - max 75 characters', 'Answer 4 - max 75 characters', 'Time limit (sec) – 5, 10, 20, 30, 60, 90, 120, or 240 secs', 'Correct answer(s) - choose at least one'];
    const rows = (L.quiz || []).map(q => [q.q.slice(0, 120)].concat(q.options.map(o => String(o).slice(0, 75))).concat([30, (q.correct || 0) + 1]));
    const ws = XLSX.utils.aoa_to_sheet([head].concat(rows));
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'Kahoot');
    const head2 = ['Question Text', 'Question Type', 'Option 1', 'Option 2', 'Option 3', 'Option 4', 'Option 5', 'Correct Answer', 'Time in seconds', 'Image Link', 'Answer explanation'];
    const rows2 = (L.quiz || []).map(q => [q.q, 'Multiple Choice'].concat(q.options).concat(['', (q.correct || 0) + 1, 30, '', q.explain || '']));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([head2].concat(rows2)), 'Wayground-Quizizz');
    XLSX.writeFile(wb, safe(L.meta.title) + ' - Kahoot-Wayground.xlsx');
  };

  window.wordwallText = L => (L.quiz || []).map((q, i) => (i + 1) + '. ' + q.q + '\n' + q.options.map((o, j) => (j === q.correct ? '* ' : '  ') + o).join('\n')).join('\n\n');

  window.formsScript = function (L) {
    const qs = JSON.stringify((L.quiz || []).map(q => ({ q: q.q, o: q.options, c: q.correct, e: q.explain || '' })));
    return '// 1) افتح https://script.google.com ← مشروع جديد ← الصق هذا الكود ← تشغيل (Run) ← اسمح بالصلاحيات\n' +
      '// 2) سيظهر رابط الاختبار في السجل (Execution log) — اختبار ذاتي التصحيح مجاني في Google Forms\n' +
      'function createQuiz() {\n  var form = FormApp.create(' + JSON.stringify('اختبار: ' + L.meta.title) + ');\n  form.setIsQuiz(true);\n' +
      '  form.setDescription(' + JSON.stringify(window.CREDIT.line) + ');\n  form.addTextItem().setTitle("الاسم").setRequired(true);\n' +
      '  var qs = ' + qs + ';\n  qs.forEach(function (q) {\n    var item = form.addMultipleChoiceItem();\n    item.setTitle(q.q).setPoints(1).setChoices(q.o.map(function (o, i) { return item.createChoice(o, i === q.c); }));\n' +
      '    if (q.e) item.setFeedbackForCorrect(FormApp.createFeedback().setText(q.e).build()).setFeedbackForIncorrect(FormApp.createFeedback().setText(q.e).build());\n  });\n' +
      '  Logger.log("رابط الطلاب: " + form.getPublishedUrl());\n  Logger.log("رابط التعديل: " + form.getEditUrl());\n}\n';
  };

  window.notebookSource = function (L) {
    return 'درس: ' + L.meta.title + '\nالمادة: ' + L.meta.subject + ' — ' + L.meta.grade + '\n\nنواتج التعلم:\n' + L.outcomes.map(o => '- ' + o).join('\n') +
      '\n\nالملخص:\n' + L.summary + '\n\nالمفاهيم:\n' + (L.keyConcepts || []).map(k => '- ' + k.term + ': ' + k.definition).join('\n') +
      '\n\nالشرح:\n' + (L.explanation || []).map(e => '## ' + e.title + '\n' + e.points.map(p => '- ' + p).join('\n') + (e.example ? '\nمثال: ' + e.example : '')).join('\n\n') +
      '\n\nالربط بالحياة: ' + L.life.question + ' — ' + L.life.scenario + '\nالهوية الوطنية: ' + L.value.vision2030 + ' — ' + L.value.nationalFact +
      '\n\nأسئلة للمراجعة:\n' + (L.quiz || []).map(q => '- ' + q.q + ' (الإجابة: ' + q.options[q.correct] + ')').join('\n') + '\n\n' + window.CREDIT.line;
  };

  function prompts(L) {
    const ttl = L.meta.title, sub = L.meta.subject, gr = L.meta.grade;
    const outline = window.buildSlides(L).map((s, i) => { const d = document.createElement('div'); d.innerHTML = s.html; return (i + 1) + '. ' + s.title + '\n' + Array.from(d.querySelectorAll('li,.box p')).map(e => '   - ' + e.textContent.trim()).join('\n'); }).join('\n');
    return [
      { id: 'gamma', icon: '✨', name: 'عرض مبهر في Gamma', url: 'https://gamma.app/create', note: 'مجاني برصيد ابتدائي. اختر «لصق نص» ثم الصق.', text: 'أنشئ عرضًا تقديميًا تعليميًا جذابًا باللغة العربية (من اليمين لليسار) لطلاب ' + gr + ' في مادة ' + sub + ' بعنوان «' + ttl + '». استخدم ألوانًا هادئة (أخضر وأزرق)، صورًا تعليمية، وأيقونات، وخطًا واضحًا. التزم بهذا المخطط تمامًا:\n\n' + outline + '\n\nأضف في الشريحة الأخيرة: ' + window.CREDIT.line },
      { id: 'nblm', icon: '🎧', name: 'NotebookLM: بودكاست وفيديو وخريطة ذهنية', url: 'https://notebooklm.google.com/', note: 'أضف ملف «مصدر NotebookLM» (زر التنزيل بالأسفل) أو صورة الدرس كمصدر، ثم الصق في «تخصيص» Audio/Video Overview.', text: 'أنشئ ملخصًا صوتيًا (Audio Overview) باللغة العربية الفصحى المبسطة لطلاب ' + gr + ' عن درس «' + ttl + '» مدته 5–7 دقائق: ابدأ بسؤال مثير، اشرح المفاهيم بأمثلة من الحياة في السعودية، اذكر ارتباط الدرس برؤية 2030، واختم بثلاثة أسئلة مراجعة. ثم أنشئ خريطة ذهنية ودليل دراسة وبطاقات تعليمية (Flashcards) واختبارًا قصيرًا من المصدر نفسه.' },
      { id: 'img', icon: '🖼️', name: 'صور تعليمية (Gemini / ChatGPT / Copilot)', url: 'https://gemini.google.com/app', note: 'مجاني في Gemini وCopilot وChatGPT (بحد يومي).', text: (L.explanation || []).map((e, i) => (i + 1) + ') ' + (e.imagePrompt || '') + ', 16:9, educational infographic style, no text').join('\n') },
      { id: 'sim', icon: '🧪', name: 'محاكاة/لعبة تفاعلية (Gemini Canvas / ChatGPT Canvas / Claude)', url: 'https://gemini.google.com/app', note: 'اختر Canvas في Gemini (مجاني) ثم الصق؛ سيبني صفحة تفاعلية يمكن مشاركتها برابط.', text: 'أنشئ صفحة ويب تفاعلية واحدة (HTML) باللغة العربية واتجاه RTL لطلاب ' + gr + ' عن درس «' + ttl + '» في مادة ' + sub + '. تتضمن: محاكاة أو نشاط سحب وإفلات يوضح الفكرة الرئيسة، ولعبة تحدٍّ من 6 أسئلة بمؤقت ونقاط وتغذية راجعة فورية لكل إجابة، وتصميمًا جذابًا مناسبًا للعرض على السبورة الذكية. المحتوى:\n' + L.summary + '\nالأسئلة:\n' + window.wordwallText(L) },
      { id: 'video', icon: '🎬', name: 'سيناريو مقطع دقيقة (Canva / CapCut / Gemini Veo)', url: 'https://www.canva.com/ar_sa/', note: 'Canva مجاني للمعلمين عبر Canva for Education.', text: 'اكتب سيناريو مقطع تعليمي مدته 60 ثانية بالعربية عن «' + ttl + '» لطلاب ' + gr + ': مشهد افتتاحي بسؤال مثير، 3 مشاهد شرح بصرية مع نص تعليق صوتي قصير لكل مشهد، ومشهد ختامي يربط بالحياة: ' + L.life.question + '. اقترح لكل مشهد وصف الصورة/الحركة.' },
      { id: 'padlet', icon: '🧱', name: 'جدار Padlet للعصف الذهني', url: 'https://padlet.com/', note: 'أنشئ جدارًا واعرض رمزه ليكتب الطلاب أفكارهم.', text: 'سؤال الجدار: ' + ((L.hot || {}).creative || {}).q + '\nسؤال إضافي: ' + L.life.question },
      { id: 'claude', icon: '🖥️', name: 'دع Claude يتحكم بجهازك وينفذ عنك', url: 'https://claude.ai/download', note: 'في تطبيق Claude لسطح المكتب فعّل «استخدام الحاسوب» (Computer use) أو إضافة Claude in Chrome، ثم الصق هذا الطلب. سيطلب إذنك قبل كل تطبيق.', text: 'افتح «محرك الدروس المتميزة» على الرابط: ' + window.appBase() + '\nثم نفّذ لي ما يلي خطوة بخطوة واطلب إذني قبل أي إرسال أو مشاركة:\n1) ارفع صورة الدرس من مجلد التنزيلات وأنشئ الدرس.\n2) نزّل ملف Word وملف PowerPoint وملف Kahoot.\n3) افتح kahoot.com وأنشئ اختبارًا جديدًا واستورد ملف Excel (Import spreadsheet).\n4) افتح Gamma والصق موجّه العرض وأنشئ العرض.\n5) اطبع ورقة العمل وبطاقات الخروج على الطابعة الافتراضية.\n6) في وقت الحصة افتح وضع العرض بملء الشاشة.' }
    ];
  }

  window.renderIntegrations = function (L) {
    const P = prompts(L);
    return '<div class="card"><h2>🔗 تنزيلات جاهزة للأدوات</h2><div class="linkgrid">' +
      '<div class="linkcard"><b>🟣 Kahoot + Wayground (Quizizz)</b><span class="small muted">ملف Excel بورقتين جاهزتين للاستيراد.</span><div class="row" style="margin-top:6px"><button class="primary" data-x="kahoot">⬇️ تنزيل</button><a class="btn" target="_blank" rel="noopener" href="https://create.kahoot.it/">Kahoot</a><a class="btn" target="_blank" rel="noopener" href="https://wayground.com/admin">Wayground</a></div></div>' +
      '<div class="linkcard"><b>🎡 Wordwall</b><span class="small muted">انسخ الأسئلة والصقها في قالب «اختبار» أو «عجلة».</span><div class="row" style="margin-top:6px"><button class="primary" data-x="wordwall">📋 نسخ</button><a class="btn" target="_blank" rel="noopener" href="https://wordwall.net/ar/create/picktemplate">Wordwall</a></div></div>' +
      '<div class="linkcard"><b>📝 نماذج Google (اختبار ذاتي التصحيح)</b><span class="small muted">كود يُنشئ الاختبار في حسابك مجانًا.</span><div class="row" style="margin-top:6px"><button class="primary" data-x="forms">📋 نسخ الكود</button><a class="btn" target="_blank" rel="noopener" href="https://script.google.com/home/projects/create">فتح Apps Script</a></div></div>' +
      '<div class="linkcard"><b>🎧 مصدر NotebookLM</b><span class="small muted">ملف نصي بمحتوى الدرس كمصدر للبودكاست والفيديو.</span><div class="row" style="margin-top:6px"><button class="primary" data-x="nblm">⬇️ تنزيل</button></div></div>' +
      '<div class="linkcard"><b>📊 PowerPoint</b><span class="small muted">يعمل مع ClassPoint لإضافة أسئلة تفاعلية داخل العرض.</span><div class="row" style="margin-top:6px"><button class="primary" data-x="pptx">⬇️ تنزيل</button><a class="btn" target="_blank" rel="noopener" href="https://www.classpoint.io/">ClassPoint</a></div></div>' +
      '<div class="linkcard"><b>💾 ملف الدرس (JSON)</b><span class="small muted">لحفظه ومشاركته مع زملائك وفتحه لاحقًا.</span><div class="row" style="margin-top:6px"><button class="primary" data-x="json">⬇️ تنزيل</button><button data-x="import">📂 فتح ملف</button></div></div>' +
      '<div class="linkcard"><b>🏫 منصة مدرستي</b><span class="small muted">ارفع ورقة العمل والكويز كواجب، وأحِل الطلاب للإثراء.</span><div class="row" style="margin-top:6px"><a class="btn" target="_blank" rel="noopener" href="https://schools.madrasati.sa/">مدرستي</a><a class="btn" target="_blank" rel="noopener" href="https://ien.edu.sa/">عين</a></div></div>' +
      '<div class="linkcard"><b>🧪 معامل افتراضية</b><span class="small muted">محاكاة مجانية لدروس العلوم والرياضيات.</span><div class="row" style="margin-top:6px"><a class="btn" target="_blank" rel="noopener" href="https://phet.colorado.edu/ar_SA/simulations/browse">PhET</a><a class="btn" target="_blank" rel="noopener" href="https://www.geogebra.org/">GeoGebra</a></div></div>' +
      '</div></div>' +
      '<div class="card"><h2>🤖 موجّهات جاهزة لأدوات الذكاء الاصطناعي المجانية</h2><p class="small muted">انسخ الموجّه وافتح الأداة. كلها تعمل بالحسابات المجانية.</p>' +
      P.map(p => '<h3>' + p.icon + ' ' + esc(p.name) + '</h3><p class="small muted">' + esc(p.note) + '</p><div class="copybox"><textarea readonly id="pr_' + p.id + '">' + esc(p.text) + '</textarea></div><div class="row" style="margin-top:6px"><button class="primary" data-copy="pr_' + p.id + '">📋 نسخ</button><a class="btn" target="_blank" rel="noopener" href="' + p.url + '">فتح الأداة ↗</a></div>').join('') +
      '</div>';
  };

  window.bindIntegrations = function (L, root) {
    root.addEventListener('click', e => {
      const c = e.target.closest('[data-copy]'); if (c) return window.copyText(document.getElementById(c.dataset.copy).value);
      const x = e.target.closest('[data-x]'); if (!x) return;
      const a = x.dataset.x;
      const err = er => window.toast('⚠️ ' + er.message, 4000);
      if (a === 'kahoot') window.exportKahoot(L).catch(err);
      if (a === 'wordwall') window.copyText(window.wordwallText(L));
      if (a === 'forms') window.copyText(window.formsScript(L));
      if (a === 'nblm') download(safe(L.meta.title) + ' - مصدر NotebookLM.txt', new Blob([window.notebookSource(L)], { type: 'text/plain;charset=utf-8' }));
      if (a === 'pptx') window.exportPPTX(L).catch(err);
      if (a === 'json') download(safe(L.meta.title) + '.lesson.json', new Blob([JSON.stringify(L, null, 2)], { type: 'application/json' }));
      if (a === 'import') window.importLessonFile();
    });
  };
  window.gammaPrompt = L => prompts(L)[0].text;
})();
