/* أدوات الحصة: الأسماء والاختيار العشوائي، المؤقت المرئي، زمن التفكير، النرد،
   المجموعات، لوحة النقاط، الكويز المباشر، التحكم عن بعد، الأوامر الصوتية، وضع العرض. */
(function () {
  const $ = s => document.querySelector(s);
  const esc = window.esc;
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  window.STORE = store;
  const CLS = window.CLS = Object.assign({ names: [], pool: [], counts: {}, groups: [], points: {} }, store.get('le_class', {}));
  const saveCls = () => store.set('le_class', CLS);
  window.toast = function (msg, ms) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(() => t.remove(), ms || 2200);
  };

  /* ---------- صوت ---------- */
  let actx;
  function beep(freq, dur, times) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      for (let i = 0; i < (times || 1); i++) {
        const o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = freq || 880; o.connect(g); g.connect(actx.destination);
        const t0 = actx.currentTime + i * (dur + 0.12);
        g.gain.setValueAtTime(0.25, t0); g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
        o.start(t0); o.stop(t0 + dur);
      }
    } catch (e) {}
  }

  /* ---------- الاختيار العشوائي (أعواد المثلجات دون تكرار) ---------- */
  function pickName() {
    if (!CLS.names.length) return null;
    if (!CLS.pool.length) CLS.pool = CLS.names.slice();
    const i = Math.floor(Math.random() * CLS.pool.length);
    const name = CLS.pool.splice(i, 1)[0];
    CLS.counts[name] = (CLS.counts[name] || 0) + 1; saveCls();
    return name;
  }
  window.pickStudent = function (cb) {
    if (!CLS.names.length) {
      const n = 1 + Math.floor(Math.random() * 30);
      showOverlay('<div class="label">🎲 رقم الطالب في الكشف</div><div class="huge">' + n + '</div><div class="small">أضف أسماء الطلاب في «أدوات الحصة» لتظهر الأسماء</div>');
      return;
    }
    const final = pickName();
    let k = 0; const names = CLS.names;
    showOverlay('<div class="label">🎯 المختار للإجابة</div><div class="huge" id="spin" style="font-size:clamp(40px,10vw,130px)"></div>');
    const el = $('#spin');
    const iv = setInterval(() => { el.textContent = names[k++ % names.length]; beep(500 + (k % 5) * 60, 0.03); }, 70);
    setTimeout(() => { clearInterval(iv); el.textContent = final; beep(990, 0.25, 2); if (cb) cb(final); refreshTally(); }, 1800);
  };

  /* ---------- طبقة العرض فوق الشاشة ---------- */
  function showOverlay(html, keep) {
    const o = $('#overlay');
    o.innerHTML = html + (keep ? '' : '<div class="row" style="justify-content:center"><button id="ovClose">إغلاق ✕</button></div>');
    o.classList.remove('hide');
    const c = $('#ovClose'); if (c) c.onclick = hideOverlay;
  }
  function hideOverlay() { $('#overlay').classList.add('hide'); $('#overlay').innerHTML = ''; stopTimer(); }
  window.hideOverlay = hideOverlay;

  /* ---------- المؤقت المرئي ---------- */
  let T = { left: 0, total: 0, iv: null, paused: false };
  function stopTimer() { clearInterval(T.iv); T.iv = null; }
  function fmt(s) { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
  window.startTimer = function (minutes, label) {
    stopTimer();
    T = { left: Math.round(minutes * 60), total: Math.round(minutes * 60), paused: false };
    const C = 2 * Math.PI * 45;
    showOverlay('<div class="label">' + esc(label || '⏱️ الوقت المتبقي') + '</div><div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="7"/><circle id="ringArc" cx="50" cy="50" r="45" fill="none" stroke="#2cc4ac" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + C + '" stroke-dashoffset="0"/></svg><div class="huge" id="tLeft">' + fmt(T.left) + '</div></div>' +
      '<div class="row" style="justify-content:center"><button id="tPause">⏸️ إيقاف مؤقت</button><button id="tPlus">＋1 دقيقة</button><button id="tMinus">−30 ث</button><button id="tClose">إغلاق ✕</button></div>', true);
    $('#tPause').onclick = () => { T.paused = !T.paused; $('#tPause').textContent = T.paused ? '▶️ متابعة' : '⏸️ إيقاف مؤقت'; };
    $('#tPlus').onclick = () => { T.left += 60; T.total += 60; };
    $('#tMinus').onclick = () => { T.left = Math.max(0, T.left - 30); };
    $('#tClose').onclick = hideOverlay;
    T.iv = setInterval(() => {
      if (T.paused) return;
      T.left--;
      const el = $('#tLeft'), arc = $('#ringArc'); if (!el) return stopTimer();
      el.textContent = fmt(T.left);
      arc.setAttribute('stroke-dashoffset', C * (1 - T.left / T.total));
      arc.setAttribute('stroke', T.left <= 10 ? '#ff5d5d' : T.left <= T.total * 0.3 ? '#ffd166' : '#2cc4ac');
      if (T.left === 10) beep(660, 0.12);
      if (T.left <= 0) { stopTimer(); el.textContent = 'انتهى الوقت'; el.style.fontSize = 'clamp(40px,8vw,100px)'; beep(880, 0.35, 3); }
    }, 1000);
  };
  window.timerCmd = function (c) { if (!T.iv && c !== 'start') return; if (c === 'pause') T.paused = !T.paused; if (c === 'plus') { T.left += 60; T.total += 60; } };

  /* زمن التفكير الصامت ثم الاختيار */
  window.thinkTime = function (sec, thenPick) {
    sec = sec || 5; let s = sec;
    showOverlay('<div class="label">🤫 زمن التفكير الصامت</div><div class="huge" id="thk">' + s + '</div><div class="label small">فكّر… لا ترفع يدك</div>', true);
    const iv = setInterval(() => {
      s--; const e = $('#thk'); if (!e) return clearInterval(iv);
      e.textContent = s; beep(440, 0.05);
      if (s <= 0) { clearInterval(iv); beep(880, 0.2); if (thenPick) window.pickStudent(); else hideOverlay(); }
    }, 1000);
  };

  window.rollDice = function (max) {
    max = max || 6; const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
    showOverlay('<div class="label">🎲 النرد العشوائي' + (max === 4 ? ' — الرؤوس المرقمة' : '') + '</div><div class="huge" id="dc">🎲</div>');
    let k = 0; const iv = setInterval(() => { $('#dc').textContent = max === 6 ? faces[k++ % 6] : (1 + (k++ % max)); }, 80);
    setTimeout(() => { clearInterval(iv); const v = 1 + Math.floor(Math.random() * max); const e = $('#dc'); if (e) e.textContent = (max === 6 ? faces[v - 1] + ' ' : '') + v; beep(990, 0.2, 2); }, 1300);
  };

  /* ---------- المجموعات والنقاط ---------- */
  function makeGroups(size) {
    const names = CLS.names.length ? CLS.names.slice() : Array.from({ length: 24 }, (_, i) => 'طالب ' + (i + 1));
    for (let i = names.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [names[i], names[j]] = [names[j], names[i]]; }
    const g = []; for (let i = 0; i < names.length; i += size) g.push(names.slice(i, i + size));
    if (g.length > 1 && g[g.length - 1].length < Math.ceil(size / 2)) { const last = g.pop(); last.forEach((n, i) => g[i % g.length].push(n)); }
    CLS.groups = g; CLS.points = {}; g.forEach((_, i) => CLS.points[i] = 0); saveCls();
  }
  const ROLES = ['القائد', 'الكاتب', 'المتحدث', 'مراقب الوقت', 'المشجع'];

  /* ---------- تبويب أدوات الحصة ---------- */
  window.renderTools = function (L) {
    return '<div class="toolgrid">' +
      '<div class="tool"><h3>👥 أسماء الطلاب</h3><textarea id="tNames" placeholder="اسم في كل سطر">' + esc(CLS.names.join('\n')) + '</textarea><div class="row" style="margin-top:6px"><button class="primary" id="tSaveNames">حفظ</button><span class="small muted" id="tNamesCount">' + CLS.names.length + ' طالب</span></div><div class="small muted">تُحفظ في جهازك فقط.</div></div>' +
      '<div class="tool"><h3>🍦 أعواد المثلجات / عجلة الأسماء</h3><div class="picked" id="tPicked">—</div><div class="row" style="justify-content:center"><button class="primary" id="tPick">🎯 اختر طالبًا</button><button id="tThink">🤫 فكّر 5 ث ثم اختر</button><button id="tResetPool">↺ دورة جديدة</button></div><div class="small muted" style="margin-top:6px">لا يتكرر الاسم حتى يشارك الجميع (فرص متكافئة).</div><div class="chips" id="tTally" style="margin-top:6px"></div></div>' +
      '<div class="tool"><h3>⏱️ المؤقت المرئي</h3><div class="row"><input id="tMin" type="number" value="3" min="0.5" step="0.5" style="width:90px"><span>دقيقة</span><button class="primary" id="tStart">ابدأ</button></div><div class="row" style="margin-top:8px">' + (L.phases || []).map(p => '<button class="small" data-min="' + p.minutes + '" data-lbl="' + esc(p.name) + '">' + esc(p.name.split(/[:(–]/)[0].trim().slice(0, 24)) + ' · ' + p.minutes + 'د</button>').join('') + '</div></div>' +
      '<div class="tool"><h3>🎲 النرد</h3><div class="row"><button id="tDice6">نرد 1–6</button><button id="tDice4">الرؤوس المرقمة 1–4</button></div></div>' +
      '<div class="tool"><h3>🧩 تكوين المجموعات</h3><div class="row"><input id="tGSize" type="number" value="4" min="2" max="8" style="width:80px"><button class="primary" id="tMakeG">كوّن المجموعات</button></div><div id="tGroups" class="small" style="margin-top:8px"></div></div>' +
      '<div class="tool"><h3>🏆 لوحة النقاط</h3><div id="tPoints"></div><button id="tShowPoints" style="margin-top:6px">عرض على الشاشة</button></div>' +
      '<div class="tool" style="grid-column:1/-1"><h3>📱 الكويز المباشر (QR) — تقنية تفاعلية حقيقية</h3><div class="row" style="align-items:flex-start;gap:18px"><div class="qr" id="tQR"></div><div style="flex:1;min-width:220px"><p class="small">يمسح الطلاب الرمز ويجيبون من جوالاتهم؛ تظهر النتائج هنا مباشرة. يعمل بدون حسابات أو تطبيقات. إن انقطع الاتصال المباشر يعمل الكويز ذاتيًا ويُظهر للطالب درجته وتفسير كل إجابة.</p><div class="row"><button class="primary" id="tLive">🔴 تشغيل الاستقبال المباشر</button><button id="tCopyQuiz">نسخ رابط الكويز</button><a class="btn" id="tOpenQuiz" target="_blank" rel="noopener">فتح الكويز</a></div><div id="tLiveStat" class="small muted" style="margin-top:6px">الاستقبال المباشر متوقف.</div><div id="tLiveBars" class="livebars"></div></div></div></div>' +
      '<div class="tool" style="grid-column:1/-1"><h3>🕹️ التحكم في اللابتوب من الجوال</h3><div class="row" style="align-items:flex-start;gap:18px"><div class="qr" id="tRemoteQR"></div><div style="flex:1;min-width:220px"><p class="small">امسح الرمز بجوالك ليصبح جهاز تحكم: تنقل الشرائح، تشغيل المؤقت، اختيار طالب، زمن التفكير، النرد، عرض الكويز — وأنت تتجول بين الطلاب.</p><button class="primary" id="tRemote">تفعيل التحكم عن بعد</button><div id="tRemoteStat" class="small muted" style="margin-top:6px"></div><p class="small">🎙️ وفي وضع العرض يمكنك أيضًا قول: «التالي»، «السابق»، «مؤقت»، «اختر طالب»، «فكّر»، «نرد».</p></div></div></div>' +
      '</div>';
  };

  function refreshTally() {
    const el = $('#tTally'); if (!el) return;
    el.innerHTML = CLS.names.map(n => '<span class="chip">' + esc(n) + ' · ' + (CLS.counts[n] || 0) + '</span>').join('');
  }
  function refreshGroups() {
    const el = $('#tGroups'); if (!el) return;
    el.innerHTML = CLS.groups.map((g, i) => '<div><b>المجموعة ' + (i + 1) + ':</b> ' + g.map((n, j) => esc(n) + ' <span class="muted">(' + (j + 1) + '–' + ROLES[j % ROLES.length] + ')</span>').join('، ') + '</div>').join('');
    const p = $('#tPoints'); if (!p) return;
    p.innerHTML = CLS.groups.length ? CLS.groups.map((g, i) => '<div class="row" style="justify-content:space-between;margin:3px 0"><b>المجموعة ' + (i + 1) + '</b><span><button data-pt="' + i + '" data-d="-1">−</button> <b style="display:inline-block;min-width:30px;text-align:center">' + (CLS.points[i] || 0) + '</b> <button class="primary" data-pt="' + i + '" data-d="1">＋</button></span></div>').join('') : '<span class="small muted">كوّن المجموعات أولًا.</span>';
  }
  function showPoints() {
    const rows = CLS.groups.map((g, i) => [i, CLS.points[i] || 0]).sort((a, b) => b[1] - a[1]);
    showOverlay('<div class="label">🏆 لوحة المتصدرين</div><div style="font-size:clamp(22px,4vw,46px);line-height:1.6">' + rows.map((r, k) => (['🥇', '🥈', '🥉'][k] || '⭐') + ' المجموعة ' + (r[0] + 1) + ' — ' + r[1] + ' نقطة').join('<br>') + '</div>');
  }
  window.showPoints = showPoints;

  window.bindTools = function (L) {
    refreshTally(); refreshGroups();
    $('#tSaveNames').onclick = () => {
      CLS.names = $('#tNames').value.split(/\n|،|,/).map(s => s.trim()).filter(Boolean);
      CLS.pool = CLS.names.slice(); saveCls(); $('#tNamesCount').textContent = CLS.names.length + ' طالب'; refreshTally(); toast('تم حفظ الأسماء');
    };
    $('#tPick').onclick = () => window.pickStudent(n => { $('#tPicked').textContent = n; });
    $('#tThink').onclick = () => window.thinkTime(5, true);
    $('#tResetPool').onclick = () => { CLS.pool = CLS.names.slice(); saveCls(); toast('بدأت دورة جديدة'); };
    $('#tStart').onclick = () => window.startTimer(+$('#tMin').value || 3);
    document.querySelectorAll('[data-min]').forEach(b => b.onclick = () => window.startTimer(+b.dataset.min, b.dataset.lbl));
    $('#tDice6').onclick = () => window.rollDice(6);
    $('#tDice4').onclick = () => window.rollDice(4);
    $('#tMakeG').onclick = () => { makeGroups(+$('#tGSize').value || 4); refreshGroups(); };
    $('#tPoints').onclick = e => { const b = e.target.closest('[data-pt]'); if (!b) return; CLS.points[b.dataset.pt] = (CLS.points[b.dataset.pt] || 0) + (+b.dataset.d); saveCls(); refreshGroups(); if (+b.dataset.d > 0) beep(1200, 0.08); };
    $('#tShowPoints').onclick = showPoints;
    const url = window.quizURL(L, LIVE.id);
    window.makeQR($('#tQR'), url, 190);
    $('#tOpenQuiz').href = url;
    $('#tCopyQuiz').onclick = () => copyText(window.quizURL(L, LIVE.id));
    $('#tLive').onclick = () => startLive(L).then(() => { window.makeQR($('#tQR'), window.quizURL(L, LIVE.id), 190); $('#tOpenQuiz').href = window.quizURL(L, LIVE.id); });
    $('#tRemote').onclick = () => startLive(L).then(() => {
      window.makeQR($('#tRemoteQR'), window.appBase() + 'remote.html#h=' + LIVE.id + '&k=' + LIVE.pin, 170);
      $('#tRemoteStat').textContent = 'رمز الأمان: ' + LIVE.pin + ' — افتح وضع العرض في اللابتوب ثم تحكم من الجوال.';
    });
    renderLive();
  };

  window.copyText = function (t) {
    const done = () => toast('تم النسخ ✔');
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(t).then(done, fallback); else fallback();
    function fallback() { const a = document.createElement('textarea'); a.value = t; document.body.appendChild(a); a.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('انسخ يدويًا'); } a.remove(); }
  };

  /* ---------- الاتصال المباشر (PeerJS / WebRTC) ---------- */
  const LIVE = window.LIVE = { id: null, peer: null, pin: String(1000 + Math.floor(Math.random() * 9000)), students: {}, conns: [] };
  function loadPeer() {
    if (window.Peer) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = 'vendor/peerjs.min.js';
      s.onload = res; s.onerror = () => rej(new Error('تعذر تحميل مكتبة الاتصال')); document.head.appendChild(s);
    });
  }
  function startLive(L) {
    if (LIVE.peer && LIVE.id) return Promise.resolve();
    const st = $('#tLiveStat'); if (st) st.innerHTML = '<span class="spinner"></span> جارٍ تشغيل الاستقبال…';
    return loadPeer().then(() => new Promise((res, rej) => {
      const id = 'le' + Math.random().toString(36).slice(2, 9);
      const p = new window.Peer(id);
      LIVE.peer = p;
      p.on('open', pid => { LIVE.id = pid; if ($('#tLiveStat')) $('#tLiveStat').textContent = '🟢 الاستقبال المباشر يعمل. اطلب من الطلاب مسح الرمز.'; res(); });
      p.on('error', e => { if ($('#tLiveStat')) $('#tLiveStat').textContent = '⚠️ تعذر الاتصال المباشر (' + e.type + ') — الكويز يعمل ذاتيًا للطلاب.'; rej(e); });
      p.on('connection', conn => {
        LIVE.conns.push(conn);
        conn.on('data', d => onData(conn, d));
        conn.on('close', () => { LIVE.conns = LIVE.conns.filter(c => c !== conn); });
      });
    })).catch(e => { toast('الاتصال المباشر غير متاح الآن — الكويز يعمل ذاتيًا'); });
  }
  window.startLive = startLive;
  function onData(conn, d) {
    if (!d || typeof d !== 'object') return;
    if (d.type === 'cmd') {
      if (String(d.pin) !== LIVE.pin) { conn.send({ type: 'err', msg: 'رمز الأمان غير صحيح' }); return; }
      window.remoteCmd && window.remoteCmd(d.cmd, d.arg); conn.send({ type: 'ok', cmd: d.cmd, slide: (window.PRES && PRES.i + 1) + '/' + (window.PRES && PRES.S ? PRES.S.length : 0) });
      return;
    }
    const sid = conn.peer;
    const s = LIVE.students[sid] = LIVE.students[sid] || { name: 'طالب', answers: {}, score: 0 };
    if (d.type === 'join') s.name = String(d.name || 'طالب').slice(0, 40);
    if (d.type === 'answer') { s.answers[d.qi] = { c: d.choice, ok: !!d.ok }; s.score = Object.values(s.answers).filter(a => a.ok).length; }
    renderLive();
  }
  function renderLive() {
    const L = window.CURRENT; if (!L) return;
    const st = Object.values(LIVE.students);
    const html = '<p class="small">👥 انضم: <b>' + st.length + '</b></p>' + (L.quiz || []).map((q, i) => {
      const ans = st.map(s => s.answers[i]).filter(Boolean); const ok = ans.filter(a => a.ok).length;
      const pct = ans.length ? Math.round(ok / ans.length * 100) : 0;
      return '<div class="lb"><span>س' + (i + 1) + '</span><span class="t"><i style="width:' + pct + '%;background:' + (pct < 50 ? '#ff6b6b' : '#2cc4ac') + '"></i></span><span>' + (ans.length ? pct + '%' : '—') + '</span></div>';
    }).join('') + (st.length ? '<p class="small">🏅 ' + st.sort((a, b) => b.score - a.score).slice(0, 5).map(s => esc(s.name) + ' (' + s.score + ')').join(' · ') + '</p>' : '');
    ['#tLiveBars', '#pSlide #liveBox'].forEach(s => { const e = $(s); if (e) e.innerHTML = html; });
  }

  /* ---------- وضع العرض ---------- */
  const PRES = window.PRES = { i: 0, S: [], rec: null, left: 0, playing: false, iv: null, keys: false };
  window.startPresentation = function (L) {
    PRES.S = window.buildSlides(L); PRES.i = 0;
    PRES.total = PRES.S.reduce((a, s) => a + s.sec, 0);
    const p = $('#present'); p.classList.remove('hide');
    p.innerHTML = '<div class="autobar"><i id="aBar"></i></div><div class="aclock" id="aClock"></div><div class="stage"><div class="slide" id="pSlide"></div></div><div class="credit">' + esc(window.CREDIT.line) + '</div>' +
      '<div class="pbar"><button data-p="prev">→ السابق</button><button data-p="play" id="pPlay" class="playbtn">⏸️ إيقاف</button><span class="count" id="pCount"></span><button data-p="next">التالي ←</button><button data-p="add">＋30ث</button>' +
      '<button data-p="timer">⏱️ مؤقت</button><button data-p="pick">🎯 اختر طالبًا</button><button data-p="think">🤫 فكّر 5ث</button><button data-p="dice">🎲 نرد</button><button data-p="points">🏆 النقاط</button><button data-p="qr">📱 QR</button><button data-p="script">📝 السيناريو</button><button data-p="voice">🎙️ صوت</button><button data-p="remote">🕹️ جوال</button><button data-p="fs">⛶</button><button data-p="close">✕ خروج</button></div>';
    p.querySelector('.pbar').onclick = e => { const b = e.target.closest('[data-p]'); if (b) window.remoteCmd(b.dataset.p); };
    showSlide();
    setPlay(true);
    clearInterval(PRES.iv); PRES.iv = setInterval(tick, 1000);
    startLive(L).then(() => { if (PRES.S[PRES.i] && PRES.S[PRES.i].k === 'quiz') showSlide(true); });
    if (!PRES.keys) { document.addEventListener('keydown', keyNav); PRES.keys = true; }
    toast('▶️ العرض يمشي تلقائيًا بالتوقيت — اضغط «إيقاف» أو مسافة للإيقاف', 3500);
  };
  /* التشغيل التلقائي بالثواني */
  function setPlay(on) {
    PRES.playing = on; const b = $('#pPlay');
    if (b) { b.textContent = on ? '⏸️ إيقاف' : '▶️ متابعة'; b.classList.toggle('paused', !on); }
    updClock();
  }
  function elapsed() { let e = 0; for (let k = 0; k < PRES.i; k++) e += PRES.S[k].sec; return e + (PRES.S[PRES.i].sec - PRES.left); }
  function updClock() {
    const s = PRES.S[PRES.i]; if (!s) return;
    const bar = $('#aBar'), c = $('#aClock'); if (!c) return;
    bar.style.width = (100 * (s.sec - PRES.left) / s.sec) + '%';
    bar.style.background = PRES.left <= 10 ? '#ff5d5d' : PRES.left <= s.sec * 0.3 ? '#ffd166' : '#2cc4ac';
    c.className = 'aclock' + (PRES.left <= 10 ? ' warn' : '') + (PRES.playing ? '' : ' stopped');
    c.innerHTML = '<b>' + window.mmss(Math.max(0, PRES.left)) + '</b><span>' + (PRES.playing ? 'متبقٍ لهذه الجزئية' : '⏸️ متوقف') + ' · الحصة ' + window.mmss(elapsed()) + ' / ' + window.mmss(PRES.total) + '</span>';
  }
  function tick() {
    if ($('#present').classList.contains('hide')) { clearInterval(PRES.iv); return; }
    if (!PRES.playing) return;
    PRES.left--;
    if (PRES.left === 10) beep(660, 0.12);
    if (PRES.left <= 0) {
      beep(880, 0.3, 2);
      if (PRES.i < PRES.S.length - 1) { PRES.i++; hideOverlay(); showSlide(); }
      else { PRES.left = 0; setPlay(false); toast('🏁 انتهت الحصة في وقتها', 4000); }
    }
    updClock();
  }
  function fitSlide() {
    const st = document.querySelector('#present .stage'), el = $('#pSlide'); if (!st || !el) return;
    const sc = Math.min(st.clientWidth / 1280, st.clientHeight / 720);
    el.style.transform = 'translate(-50%,-50%) scale(' + sc + ')';
  }
  window.addEventListener('resize', fitSlide);
  function renderScriptPanel() {
    const s = PRES.S[PRES.i] || {}, sc = s.script || {};
    let p = $('#scriptPanel'); if (!p) { p = document.createElement('div'); p.id = 'scriptPanel'; $('#present').appendChild(p); }
    const L = a => (a || []).map(x => '<li>' + esc(x) + '</li>').join('');
    p.innerHTML = '<b>📝 ' + esc(s.title) + '</b><h4>🗣️ قل:</h4><ul>' + L(sc.teacher) + '</ul><h4>🙋 المتوقع من الطلاب:</h4><ul>' + L(sc.students) + '</ul><h4>🖱️ نفّذ:</h4><ul>' + L(sc.actions) + '</ul>';
  }
  function keyNav(e) {
    if ($('#present').classList.contains('hide')) return;
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key;
    if (k === ' ' || k === 'Spacebar' || /^[pP]$/.test(k)) { e.preventDefault(); window.remoteCmd('play'); }
    else if (k === 'ArrowLeft' || k === 'PageDown') { e.preventDefault(); window.remoteCmd('next'); }
    else if (k === 'ArrowRight' || k === 'PageUp') window.remoteCmd('prev');
    else if (k === 'Escape') { if (!$('#overlay').classList.contains('hide')) hideOverlay(); else window.remoteCmd('close'); }
    else if (/^[tT]$/.test(k)) window.remoteCmd('timer');
    else if (/^[rR]$/.test(k)) window.remoteCmd('pick');
    else if (/^[wW]$/.test(k)) window.remoteCmd('think');
    else if (/^[dD]$/.test(k)) window.remoteCmd('dice');
    else if (/^[qQ]$/.test(k)) window.remoteCmd('qr');
    else if (/^[fF]$/.test(k)) window.remoteCmd('fs');
  }
  function showSlide(keepTime) {
    const s = PRES.S[PRES.i]; if (!s) return;
    if (!keepTime) PRES.left = s.sec;
    const el = $('#pSlide'); el.innerHTML = s.html;
    $('#pCount').textContent = (PRES.i + 1) + ' / ' + PRES.S.length + ' · ' + window.mmss(s.sec);
    updClock();
    el.querySelectorAll('.a').forEach((x, i) => x.style.setProperty('--i', i));
    fitSlide();
    const iw = el.querySelector('.imgwrap');
    if (iw && iw.dataset.prompt && ($('#optImages') ? $('#optImages').checked : true)) {
      const img = new Image(); img.alt = '';
      img.onload = () => iw.appendChild(img);
      img.src = 'https://image.pollinations.ai/prompt/' + encodeURIComponent(iw.dataset.prompt + ', colorful flat educational illustration, no text') + '?width=800&height=720&nologo=true&seed=' + (PRES.i + 3);
    }
    if ($('#scriptPanel')) renderScriptPanel();
    LIVE.conns.forEach(c => { try { if (c.open) c.send({ type: 'slide', n: PRES.i + 1, total: PRES.S.length, title: s.title, sec: s.sec, script: s.script }); } catch (e) {} });
    if (s.k === 'quiz') { const q = el.querySelector('#slideQR'); if (q) window.makeQR(q, window.quizURL(window.CURRENT, LIVE.id), 330); renderLive(); }
    if (s.k === 'end') {
      const stars = Object.entries(CLS.counts || {}).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]);
      const top = Object.values(LIVE.students).sort((a, b) => b.score - a.score).slice(0, 3).map(x => x.name);
      const b = el.querySelector('#starsBox'); if (b && (stars.length || top.length)) b.innerHTML = '⭐ ' + esc(Array.from(new Set(top.concat(stars))).slice(0, 5).join(' · '));
    }
  }
  window.remoteCmd = function (cmd, arg) {
    const s = PRES.S[PRES.i] || {};
    switch (cmd) {
      case 'hello': if (PRES.S.length) showSlide(true); break;
      case 'next': if (PRES.i < PRES.S.length - 1) { PRES.i++; hideOverlay(); showSlide(); } break;
      case 'prev': if (PRES.i > 0) { PRES.i--; hideOverlay(); showSlide(); } break;
      case 'goto': PRES.i = Math.max(0, Math.min(PRES.S.length - 1, +arg || 0)); hideOverlay(); showSlide(); break;
      case 'timer': window.startTimer(Math.max(PRES.left, 10) / 60, s.title); break;
      case 'play': setPlay(!PRES.playing); break;
      case 'pause': if (T.iv) window.timerCmd('pause'); else setPlay(!PRES.playing); break;
      case 'add': PRES.left += 30; s.sec += 30; PRES.total += 30; updClock(); break;
      case 'plus': if (T.iv) window.timerCmd('plus'); else { PRES.left += 60; s.sec += 60; PRES.total += 60; updClock(); } break;
      case 'pick': window.pickStudent(); break;
      case 'think': window.thinkTime(5, true); break;
      case 'dice': window.rollDice(arg === 4 ? 4 : 6); break;
      case 'points': showPoints(); break;
      case 'hide': hideOverlay(); break;
      case 'qr': showOverlay('<div class="label">📱 امسح للكويز التفاعلي</div><div class="qr" id="ovQR"></div>'); window.makeQR($('#ovQR'), window.quizURL(window.CURRENT, LIVE.id), Math.min(440, window.innerHeight * 0.6)); break;
      case 'fs': try { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); } catch (e) {} break;
      case 'voice': toggleVoice(); break;
      case 'script': if ($('#scriptPanel')) $('#scriptPanel').remove(); else renderScriptPanel(); break;
      case 'remote': startLive(window.CURRENT).then(() => {
        showOverlay('<div class="label">🕹️ امسح بجوالك للتحكم في العرض</div><div class="qr" id="ovRQ"></div><div class="label">رمز الأمان: ' + LIVE.pin + '</div>');
        window.makeQR($('#ovRQ'), window.appBase() + 'remote.html#h=' + LIVE.id + '&k=' + LIVE.pin, 300);
      }); break;
      case 'close': clearInterval(PRES.iv); PRES.playing = false; $('#present').classList.add('hide'); hideOverlay(); if (PRES.rec) { try { PRES.rec.stop(); } catch (e) {} PRES.rec = null; } try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {} break;
    }
  };

  /* ---------- الأوامر الصوتية ---------- */
  function toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast('الأوامر الصوتية غير مدعومة في هذا المتصفح (استخدم Chrome)');
    if (PRES.rec) { PRES.rec.stop(); PRES.rec = null; return toast('أُوقفت الأوامر الصوتية'); }
    const r = new SR(); r.lang = 'ar-SA'; r.continuous = true; r.interimResults = false;
    r.onresult = e => {
      const t = e.results[e.results.length - 1][0].transcript.trim();
      const map = [[/أوقف|اوقف|وقف|إيقاف|كمل|تابع|استمر/, 'play'], [/التالي|بعده|بعدها|next/, 'next'], [/السابق|ارجع|قبل/, 'prev'], [/مؤقت|الوقت|ابدأ/, 'timer'], [/فكر|فكّر|تفكير/, 'think'], [/اختر|طالب|عشوائي/, 'pick'], [/نرد|زهر/, 'dice'], [/نقاط|المتصدرين/, 'points'], [/كويز|الرمز|باركود/, 'qr'], [/اغلق|أغلق|إغلاق|توقف/, 'hide']];
      const m = map.find(x => x[0].test(t)); toast('🎙️ ' + t); if (m) window.remoteCmd(m[1]);
    };
    r.onend = () => { if (PRES.rec === r) try { r.start(); } catch (e) {} };
    try { r.start(); PRES.rec = r; toast('🎙️ الأوامر الصوتية تعمل: قل «التالي» أو «اختر طالب»'); } catch (e) { toast('تعذر تشغيل الميكروفون'); }
  }
})();
