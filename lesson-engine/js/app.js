/* الربط العام للواجهة */
(function () {
  const $ = s => document.querySelector(s);
  const S = window.STORE;
  const IMAGES = [];
  let MODE = S.get('le_mode2', 'auto');

  /* ---------- السمة ---------- */
  const theme = S.get('le_theme', '');
  if (theme) document.documentElement.dataset.theme = theme;
  $('#btnTheme').onclick = () => {
    const cur = document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const nx = cur === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = nx; S.set('le_theme', nx);
  };

  /* ---------- الصور ---------- */
  async function addFiles(files) {
    for (const f of files) {
      if (!/^image\//.test(f.type)) continue;
      try { IMAGES.push(await window.prepareImage(f)); } catch (e) { status(e.message, true); }
    }
    drawThumbs();
    if (IMAGES.length && MODE !== 'bridge') { if (MODE === 'auto') $('#offText').value = ''; generate(); }
  }
  function drawThumbs() {
    $('#thumbs').innerHTML = IMAGES.map((im, i) => '<figure><img src="' + im.dataUrl + '" alt="صفحة ' + (i + 1) + '"><button data-rm="' + i + '">✕</button></figure>').join('');
  }
  $('#thumbs').onclick = e => { const b = e.target.closest('[data-rm]'); if (b) { IMAGES.splice(+b.dataset.rm, 1); drawThumbs(); } };
  $('#drop').onclick = () => $('#file').click();
  $('#btnPick').onclick = () => $('#file').click();
  $('#btnCam').onclick = () => $('#cam').click();
  $('#file').onchange = e => { addFiles(e.target.files); e.target.value = ''; };
  $('#cam').onchange = e => { addFiles(e.target.files); e.target.value = ''; };
  ['dragover', 'dragenter'].forEach(ev => $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.add('on'); }));
  ['dragleave', 'drop'].forEach(ev => $('#drop').addEventListener(ev, e => { e.preventDefault(); $('#drop').classList.remove('on'); }));
  $('#drop').addEventListener('drop', e => addFiles(e.dataTransfer.files));
  document.addEventListener('paste', e => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const fs = Array.from(e.clipboardData.items || []).filter(i => i.kind === 'file').map(i => i.getAsFile());
    if (fs.length) addFiles(fs);
  });

  /* ---------- أوضاع التوليد ---------- */
  function setMode(m) {
    MODE = m; S.set('le_mode2', m);
    document.querySelectorAll('.mode').forEach(x => x.classList.toggle('sel', x.dataset.mode === m));
    $('#pBridge').classList.toggle('hide', m !== 'bridge');
    $('#pAI').classList.toggle('hide', m !== 'auto');
    $('#pOffline').classList.toggle('hide', m !== 'offline');
  }
  $('#modes').onclick = e => { const m = e.target.closest('.mode'); if (m) setMode(m.dataset.mode); };
  setMode(MODE);

  const P = window.PROVIDERS;
  $('#aiProvider').innerHTML = Object.entries(P).map(([k, v]) => '<option value="' + k + '">' + v.label + '</option>').join('');
  function provUI() {
    const k = $('#aiProvider').value, v = P[k];
    $('#aiModels').innerHTML = v.models.map(m => '<option value="' + m + '">').join('');
    $('#aiModel').value = S.get('le_model_' + k, v.models[0]);
    $('#aiKey').value = S.get('le_key_' + k, '');
    $('#keyLink').href = v.keyUrl; $('#keyLink').textContent = v.free ? 'احصل عليه مجانًا ↗' : 'لوحة المفاتيح ↗';
  }
  /* رابط المدرسة: يحمل مفتاح التفعيل فيُحفظ تلقائيًا عند المعلم */
  (function () {
    const h = new URLSearchParams(location.hash.slice(1));
    const k = h.get('k');
    if (k) {
      const pv = P[h.get('p')] ? h.get('p') : 'gemini';
      S.set('le_key_' + pv, k); S.set('le_provider', pv); S.set('le_mode2', 'auto'); MODE = 'auto';
      try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
      setTimeout(() => window.toast('✔ تم تفعيل المحرك — ضع صورة الدرس فقط', 4000), 300);
    }
  })();
  $('#aiProvider').value = S.get('le_provider', 'gemini'); provUI();
  $('#aiProvider').onchange = () => { S.set('le_provider', $('#aiProvider').value); provUI(); };
  $('#btnSchoolLink').onclick = () => {
    const pv = $('#aiProvider').value, key = $('#aiKey').value.trim();
    if (!key) return window.toast('الصق مفتاح التفعيل أولًا', 3000);
    S.set('le_key_' + pv, key);
    window.copyText(window.appBase() + 'index.html#k=' + encodeURIComponent(key) + (pv !== 'gemini' ? '&p=' + pv : ''));
    window.toast('✔ نُسخ رابط المعلمين — أرسله في القروب', 4000);
  };
  $('#aiKey').onchange = () => S.set('le_key_' + $('#aiProvider').value, $('#aiKey').value.trim());
  $('#aiModel').onchange = () => S.set('le_model_' + $('#aiProvider').value, $('#aiModel').value.trim());

  function info() {
    return {
      subject: $('#fSubject').value.trim(), grade: $('#fGrade').value.trim(), title: $('#fTitle').value.trim(),
      duration: +$('#fDuration').value || 45, students: $('#fStudents').value.trim(), value: $('#fValue').value.trim(), notes: $('#fNotes').value.trim()
    };
  }
  $('#btnCopyPrompt').onclick = () => {
    window.copyText(window.buildMasterPrompt(info()));
    if (!IMAGES.length) window.toast('تذكّر إرفاق صورة الدرس في المحادثة مع الموجّه', 3500);
  };

  function status(msg, err) {
    const s = $('#status'); s.classList.remove('hide'); s.classList.toggle('err', !!err); s.innerHTML = msg;
  }

  $('#btnOCR').onclick = async () => {
    if (!IMAGES.length) return status('أضف صورة الدرس أولًا.', true);
    try {
      status('<span class="spinner"></span> جارٍ قراءة النص من الصورة… (أول مرة تحتاج تنزيل ملفات اللغة)');
      const t = await window.runOCR(IMAGES, m => status('<span class="spinner"></span> ' + m));
      $('#offText').value = t.trim(); status('✔ تم استخراج النص. راجعه ثم اضغط «إنشاء الدرس».');
    } catch (e) { status('⚠️ ' + e.message + '\nيمكنك كتابة/لصق نص الدرس يدويًا والمتابعة.', true); }
  };

  /* ---------- التوليد (تلقائي بالكامل) ---------- */
  const STEPS = ['قراءة صورة الدرس', 'بناء الدرس وفق مؤشرات بطاقة الملاحظة', 'تجهيز العرض الموقوت والأوراق والتقرير'];
  function progress(i, note) {
    const el = $('#progress'); el.classList.remove('hide');
    el.innerHTML = STEPS.map((t, k) => '<div class="st ' + (k < i ? 'done' : k === i ? 'on' : '') + '">' + (k < i ? '✅' : k === i ? '<span class="spinner"></span>' : '⏳') + ' ' + t + '</div>').join('') +
      '<div class="pb"><i style="width:' + Math.round((i + 0.5) / STEPS.length * 100) + '%"></i></div>' + (note ? '<div class="small muted" style="margin-top:6px">' + note + '</div>' : '');
  }
  function keyedProvider() {
    const sel = $('#aiProvider').value;
    if (S.get('le_key_' + sel, '')) return sel;
    return Object.keys(P).find(k => S.get('le_key_' + k, '')) || null;
  }
  let BUSY = false;
  async function generate() {
    if (BUSY) return; BUSY = true;
    const inf = info();
    $('#btnGenerate').disabled = true; $('#status').classList.add('hide');
    try {
      let L = null;
      if (MODE === 'bridge') {
        const raw = $('#pasteJSON').value.trim();
        if (!raw) throw new Error('الصق رد أداة الذكاء الاصطناعي في المربع أولًا.');
        L = window.extractJSON(raw);
      } else if (MODE === 'auto' && (IMAGES.length || inf.title)) {
        progress(0, 'يستغرق عادة من 30 إلى 90 ثانية…');
        const pv = keyedProvider();
        if (pv) {
          try {
            const txt = await window.callAI({ provider: pv, model: S.get('le_model_' + pv, P[pv].models[0]), key: S.get('le_key_' + pv, ''), prompt: window.buildMasterPrompt(inf), images: IMAGES });
            progress(1); L = window.extractJSON(txt);
          } catch (e) { console.warn(e); }
        }
        if (!L) {
          try {
            const txt = await window.callKeyless({ prompt: window.buildMasterPrompt(inf), images: IMAGES });
            progress(1); L = window.extractJSON(txt);
          } catch (e) { console.warn(e); }
        }
      }
      if (!L) { progress(1, 'يكمل المحرك الذاتي بناء الدرس…'); L = await offline(inf); }
      progress(2);
      L = normalize(L, inf);
      show(L);
      $('#progress').classList.add('hide');
    } catch (e) {
      $('#progress').classList.add('hide');
      status('⚠️ ' + e.message, true);
    } finally { BUSY = false; $('#btnGenerate').disabled = false; }
  }
  $('#btnGenerate').onclick = generate;
  async function offline(inf) {
    let text = $('#offText').value.trim();
    if (!text && IMAGES.length) {
      try {
        text = await window.runOCR(IMAGES, m => progress(1, 'قراءة نص الصورة: ' + m));
        $('#offText').value = text.trim();
      } catch (e) { text = ''; }
    }
    if (!inf.title) {
      const first = (text.split('\n').map(s => s.trim()).find(s => s.length > 4 && s.length < 60)) || 'درس اليوم';
      inf.title = first;
    }
    return window.buildOfflineLesson(Object.assign({}, inf, { text }));
  }
  $('#btnDemo').onclick = () => show(normalize(JSON.parse(JSON.stringify(window.DEMO_LESSON)), {}));

  /* ---------- تطبيع الدرس وإكمال الناقص ---------- */
  function fill(a, b) {
    if (Array.isArray(b)) return Array.isArray(a) && a.length ? a : b;
    if (b && typeof b === 'object') {
      const o = (a && typeof a === 'object' && !Array.isArray(a)) ? a : {};
      Object.keys(b).forEach(k => { o[k] = fill(o[k], b[k]); });
      return o;
    }
    return (a === undefined || a === null || a === '') ? b : a;
  }
  function normalize(L, inf) {
    inf = inf || {};
    L = L || {}; L.meta = L.meta || {};
    if (inf.title) L.meta.title = L.meta.title || inf.title;
    ['subject', 'grade'].forEach(k => { if (inf[k] && !L.meta[k]) L.meta[k] = inf[k]; });
    L.meta.duration = +L.meta.duration || inf.duration || 45;
    if (inf.value && L.value) L.value.weekValue = inf.value;
    const fb = window.buildOfflineLesson({ title: L.meta.title || inf.title || 'درس اليوم', subject: L.meta.subject || inf.subject, grade: L.meta.grade || inf.grade, duration: L.meta.duration, text: [L.summary || ''].concat((L.explanation || []).map(e => (e.points || []).join('. '))).join('. '), value: inf.value });
    delete fb._offline;
    const off = L._offline;
    L = fill(L, fb);
    if (off) L._offline = true;
    L.quiz = (L.quiz || []).filter(q => q && q.q && Array.isArray(q.options) && q.options.length >= 2).map(q => {
      q.options = q.options.slice(0, 4).map(String); while (q.options.length < 4) q.options.push('لا شيء مما سبق');
      q.correct = Math.max(0, Math.min(3, parseInt(q.correct, 10) || 0)); return q;
    });
    if (!L.quiz.length) L.quiz = fb.quiz;
    if (!L.phases.some(p => p.tool === 'quiz')) L.phases.splice(Math.max(1, L.phases.length - 2), 0, { name: 'كويز QR تفاعلي (تقويم تكويني)', minutes: 5, tool: 'quiz', teacher: 'يعرض QR ويتابع النتائج المباشرة ويعالج الأخطاء.', students: 'يجيبون من الأجهزة أو ببطاقات A/B/C/D.', evidence: 'تقنية تفاعلية + تقويم تكويني' });
    const total = L.phases.reduce((a, p) => a + (+p.minutes || 0), 0);
    if (total !== L.meta.duration && total > 0) {
      L.phases.forEach(p => p.minutes = Math.max(1, Math.round((+p.minutes || 1) * L.meta.duration / total)));
      const d = L.meta.duration - L.phases.reduce((a, p) => a + p.minutes, 0);
      const big = L.phases.reduce((m, p, i) => p.minutes > L.phases[m].minutes ? i : m, 0); L.phases[big].minutes += d;
    }
    L._planAligned = $('#fPlan').checked;
    return L;
  }

  /* ---------- عرض المخرجات ---------- */
  const TABS = [
    ['plan', '📘 خطة الدرس'], ['ws', '📝 ورقة العمل'], ['cards', '🎫 البطاقات'], ['slides', '🖥️ العرض'],
    ['tools', '🧰 أدوات الحصة'], ['integ', '🔗 أدوات خارجية'], ['report', '📊 التقرير والمؤشرات'], ['guide', '🧭 دليل المعلم']
  ];
  let TAB = 'plan';
  function show(L) {
    window.CURRENT = L;
    $('#inputSection').classList.add('hide'); $('#out').classList.remove('hide');
    $('#outTitle').textContent = L.meta.title;
    $('#outMeta').textContent = [L.meta.subject, L.meta.grade, L.meta.duration + ' دقيقة', L._offline ? 'المحرك الذاتي — راجع المحتوى' : ''].filter(Boolean).join(' · ');
    $('#tabs').innerHTML = TABS.map(t => '<button data-tab="' + t[0] + '">' + t[1] + '</button>').join('');
    tab('plan'); autosave(L); window.scrollTo(0, 0);
  }
  window.showLesson = show;
  function tab(t) {
    TAB = t; const L = window.CURRENT;
    document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.tab === t));
    const v = $('#views');
    const R = { plan: window.renderPlan, ws: window.renderWorksheet, cards: window.renderCards, slides: window.renderSlidesTab, tools: window.renderTools, integ: window.renderIntegrations, report: window.renderReport, guide: window.renderGuide };
    v.innerHTML = '<div class="' + (/plan|ws|cards|report|guide/.test(t) ? '' : 'card') + '" style="margin-top:10px">' + R[t](L) + '</div>';
    if (/plan|ws|cards|report|guide/.test(t)) v.insertAdjacentHTML('afterbegin', '<p class="small muted noprint" style="margin:8px 0 0">✏️ يمكنك تعديل أي نص بالنقر عليه مباشرة قبل الطباعة.</p>');
    if (t === 'ws') {
      window.makeQR($('#wsQR'), window.quizURL(L, null), 140);
      $('#wsLarge').onchange = e => $('#wsDoc').classList.toggle('large', e.target.checked);
      $('#wsAns').onchange = e => document.querySelectorAll('#wsDoc .ans').forEach(a => a.style.display = e.target.checked ? '' : 'none');
    }
    if (t === 'tools') window.bindTools(L);
    if (t === 'integ') window.bindIntegrations(L, v);
    if (t === 'slides') v.onclick = e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'present') window.startPresentation(L);
      if (b.dataset.act === 'pptx') window.exportPPTX(L).catch(er => window.toast('⚠️ ' + er.message, 4000));
      if (b.dataset.act === 'gamma') { window.copyText(window.gammaPrompt(L)); window.open('https://gamma.app/create', '_blank', 'noopener'); }
    }; else v.onclick = null;
  }
  $('#tabs').onclick = e => { const b = e.target.closest('[data-tab]'); if (b) tab(b.dataset.tab); };
  $('#btnPresent').onclick = () => window.startPresentation(window.CURRENT);
  $('#btnPrint').onclick = () => {
    if (!/plan|ws|cards|report|guide/.test(TAB)) { tab('plan'); }
    if (TAB === 'ws' && $('#wsAns') && $('#wsAns').checked) window.toast('الإجابات ظاهرة — ألغِ «إظهار الإجابات» لنسخة الطلاب', 3500);
    setTimeout(() => window.print(), 150);
  };
  $('#btnWord').onclick = () => window.exportWord(window.CURRENT);
  $('#btnSave').onclick = () => { autosave(window.CURRENT, true); window.toast('حُفظ الدرس في «دروسي»'); };
  $('#btnNew').onclick = () => { IMAGES.length = 0; drawThumbs(); $('#out').classList.add('hide'); $('#inputSection').classList.remove('hide'); $('#pasteJSON').value = ''; window.scrollTo(0, 0); };

  /* ---------- دروسي (الحفظ المحلي) ---------- */
  function autosave(L) {
    const list = S.get('le_lessons', []);
    const id = L._id || (L._id = Date.now());
    const i = list.findIndex(x => x.id === id);
    const item = { id, title: L.meta.title, subject: L.meta.subject, date: new Date().toLocaleDateString('ar-SA'), L };
    if (i >= 0) list[i] = item; else list.unshift(item);
    S.set('le_lessons', list.slice(0, 25));
  }
  $('#btnHistory').onclick = () => {
    const list = S.get('le_lessons', []);
    const o = $('#overlay');
    o.innerHTML = '<div class="label">📚 دروسي المحفوظة</div><div style="max-height:60vh;overflow:auto;min-width:min(520px,90vw);text-align:right">' +
      (list.length ? list.map(x => '<div class="row" style="justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.15);padding:8px 0"><span>' + window.esc(x.title) + ' <span class="small" style="opacity:.7">' + window.esc(x.subject || '') + ' · ' + x.date + '</span></span><span><button data-open="' + x.id + '">فتح</button> <button data-del="' + x.id + '">حذف</button></span></div>').join('') : '<p>لا توجد دروس محفوظة بعد.</p>') +
      '</div><div class="row" style="justify-content:center"><button id="hImport">📂 فتح ملف درس</button><button id="hClose">إغلاق ✕</button></div>';
    o.classList.remove('hide');
    o.onclick = e => {
      const op = e.target.closest('[data-open]'), dl = e.target.closest('[data-del]');
      if (op) { const x = S.get('le_lessons', []).find(y => y.id == op.dataset.open); o.classList.add('hide'); o.onclick = null; if (x) show(x.L); }
      if (dl) { S.set('le_lessons', S.get('le_lessons', []).filter(y => y.id != dl.dataset.del)); e.target.closest('.row').remove(); }
      if (e.target.id === 'hClose') { o.classList.add('hide'); o.onclick = null; }
      if (e.target.id === 'hImport') { o.classList.add('hide'); o.onclick = null; window.importLessonFile(); }
    };
  };
  window.importLessonFile = function () {
    const f = document.createElement('input'); f.type = 'file'; f.accept = '.json,application/json';
    f.onchange = () => { const r = new FileReader(); r.onload = () => { try { show(normalize(window.extractJSON(r.result), {})); } catch (e) { window.toast('⚠️ ملف غير صالح'); } }; r.readAsText(f.files[0]); };
    f.click();
  };
})();
