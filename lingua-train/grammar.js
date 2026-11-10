/* قطار اللغات — محرّك القواعد
   يبني لكل جملة ٣ أزمنة × ١١ صيغة (منها المبني للمجهول). كل صيغة = سطر + سطر جواب اختياري.
   كل سطر = مصفوفة كلمات {w, r} حيث r هو دور الكلمة (فاعل، فعل مساعد، ...) لتلوينها.
   العربية تُبنى بالطريقة نفسها لتظهر ترجمةً لكل صيغة. */
(function () {
  const LT = window.LT;
  const tk = (w, r = 'x', o) => Object.assign({ w, r }, o || {});
  const words = (str, r) => str.split(' ').filter(Boolean).map(w => tk(w, r));
  const P_ = (w) => tk(w, 'p', { jl: 1 });          // علامة ترقيم ملتصقة بما قبلها
  const DOT = () => P_('.');
  const COMMA = (L) => P_(L === 'ar' ? '،' : ',');
  const QM = (L) => (L === 'fr' ? P_(' ?') : L === 'ar' ? P_('؟') : P_('?'));   // الفرنسية: مسافة غير منكسرة قبل ؟
  const INV = () => tk('¿', 'p', { jr: 1 });          // علامة الاستفهام الإسبانية المقلوبة
  const pick = (csv, i) => csv.split(',')[i];

  /* أي ضمير يُسأل به وأي ضمير يجيب: أنا ← يُسأل «أنتَ» ويجيب «أنا» */
  const Q_PRON = { i: 'you', you: 'you', he: 'he', she: 'she', we: 'youpl', they: 'they' };
  const A_PRON = { i: 'i', you: 'i', he: 'he', she: 'she', we: 'we', they: 'they' };

  /* ---------- التصريف ---------- */
  const EN = {
    s3(b) {
      if (b === 'do') return 'does';
      if (b === 'have') return 'has';
      if (/(s|sh|ch|x|z|o)$/.test(b)) return b + 'es';
      if (/[^aeiou]y$/.test(b)) return b.slice(0, -1) + 'ies';
      return b + 's';
    },
  };
  /* مطابقة اسم المفعول في الإسبانية والبرتغالية والإيطالية (o ← a / os / as) */
  function agreeO(pp, g, pl, L) {
    if (!pp.endsWith('o')) return pp;
    const st = pp.slice(0, -1);
    if (L === 'it') return st + (pl ? (g === 'f' ? 'e' : 'i') : (g === 'f' ? 'a' : 'o'));
    return st + (g === 'f' ? 'a' : 'o') + (pl ? 's' : '');
  }
  const ES = {
    pres(v, s) {
      if (v[1]) return pick(v[1], s);
      const st = v[0].slice(0, -2), e = v[0].slice(-2);
      return st + { ar: ['o', 'as', 'a', 'amos', 'áis', 'an'], er: ['o', 'es', 'e', 'emos', 'éis', 'en'], ir: ['o', 'es', 'e', 'imos', 'ís', 'en'] }[e][s];
    },
    pret(v, s) {
      if (v[2]) return pick(v[2], s);
      const st = v[0].slice(0, -2), e = v[0].slice(-2);
      if (e === 'ar') {
        if (s === 0) {
          if (st.endsWith('c')) return st.slice(0, -1) + 'qué';
          if (st.endsWith('g')) return st + 'ué';
          if (st.endsWith('z')) return st.slice(0, -1) + 'cé';
        }
        return st + ['é', 'aste', 'ó', 'amos', 'asteis', 'aron'][s];
      }
      return st + ['í', 'iste', 'ió', 'imos', 'isteis', 'ieron'][s];
    },
    pp(v) {
      if (v[3]) return v[3];
      const st = v[0].slice(0, -2), e = v[0].slice(-2);
      if (e === 'ar') return st + 'ado';
      return st + (/[aeo]$/.test(st) ? 'ído' : 'ido');
    },
    IR: ['voy', 'vas', 'va', 'vamos', 'vais', 'van'],
  };
  const FR = {
    pres(v, s) {
      if (v[1]) return pick(v[1], s);
      const st = v[0].slice(0, -2);
      if (s === 3 && st.endsWith('g')) return st + 'eons';
      if (s === 3 && st.endsWith('c')) return st.slice(0, -1) + 'çons';
      return st + ['e', 'es', 'e', 'ons', 'ez', 'ent'][s];
    },
    pp(v) { return v[2] || v[0].slice(0, -2) + 'é'; },
    AVOIR: ['ai', 'as', 'a', 'avons', 'avez', 'ont'],
    ALLER: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'],
  };
  const IT = {
    pres(v, s) {
      if (v[1]) return pick(v[1], s);
      const e = v[0].slice(-3);
      let st = v[0].slice(0, -3);
      let end = { are: ['o', 'i', 'a', 'iamo', 'ate', 'ano'], ere: ['o', 'i', 'e', 'iamo', 'ete', 'ono'], ire: ['o', 'i', 'e', 'iamo', 'ite', 'ono'] }[e][s];
      if (e === 'are' && /[cg]$/.test(st) && /^[ie]/.test(end)) st += 'h';
      if (st.endsWith('i') && end.startsWith('i')) end = end.slice(1);
      return st + end;
    },
    pp(v) { return v[2] || v[0].slice(0, -3) + { are: 'ato', ere: 'uto', ire: 'ito' }[v[0].slice(-3)]; },
    fut(v, s) {
      if (v[3]) return pick(v[3], s);
      const e = v[0].slice(-3);
      let b = v[0].slice(0, -3);
      if (e === 'are') {
        if (/[cg]$/.test(b)) b += 'h';
        else if (/[cg]i$/.test(b)) b = b.slice(0, -1);
        b += 'er';
      } else b += e === 'ere' ? 'er' : 'ir';
      return b + ['ò', 'ai', 'à', 'emo', 'ete', 'anno'][s];
    },
    AVERE: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'],
  };
  const PT = {
    pres(v, s) {
      if (v[1]) return pick(v[1], s);
      const st = v[0].slice(0, -2), e = v[0].slice(-2);
      return st + { ar: ['o', 'as', 'a', 'amos', 'ais', 'am'], er: ['o', 'es', 'e', 'emos', 'eis', 'em'], ir: ['o', 'es', 'e', 'imos', 'is', 'em'] }[e][s];
    },
    pret(v, s) {
      if (v[2]) return pick(v[2], s);
      const st = v[0].slice(0, -2), e = v[0].slice(-2);
      if (e === 'ar') {
        if (s === 0) {
          if (st.endsWith('c')) return st.slice(0, -1) + 'quei';
          if (st.endsWith('g')) return st + 'uei';
          if (st.endsWith('ç')) return st.slice(0, -1) + 'cei';
        }
        return st + ['ei', 'aste', 'ou', 'amos', 'astes', 'aram'][s];
      }
      if (e === 'er') return st + ['i', 'este', 'eu', 'emos', 'estes', 'eram'][s];
      return st + ['i', 'iste', 'iu', 'imos', 'istes', 'iram'][s];
    },
    pp(v) {
      if (v[3]) return v[3];
      const st = v[0].slice(0, -2), e = v[0].slice(-2);
      return st + (e === 'ar' ? 'ado' : 'ido');
    },
    IR: ['vou', 'vais', 'vai', 'vamos', 'ides', 'vão'],
  };
  const DE = {
    pres(v, s) {
      if (v[1]) return pick(v[1], s);
      const inf = v[0];
      const st = inf.endsWith('en') ? inf.slice(0, -2) : inf.slice(0, -1);
      if (s === 3 || s === 5) return inf;
      let e = ['e', 'st', 't', '', 't', ''][s];
      if (/(d|t|chn|fn|gn|dm|tm)$/.test(st) && /^[st]/.test(e)) e = 'e' + e;
      else if (/(s|ß|z|x)$/.test(st) && e === 'st') e = 't';
      return st + e;
    },
    HABEN: ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
    WERDEN: ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
    NOM: { m: 'der', f: 'die', n: 'das', p: 'die' },
    ACC: { m: 'den', f: 'die', n: 'das', p: 'die' },
  };
  /* العربية: الترتيب أنا، أنتَ، هو، هي، نحن، أنتم، هم */
  const AR = {
    past(a, s) {
      if (a.p.includes(',')) return pick(a.p, s);
      return a.p + ['تُ', 'تَ', '', 'ت', 'نا', 'تم', 'وا'][s];
    },
    pres(a, s) {
      if (a.r.includes(',')) return pick(a.r, s);
      return ['أ', 'ت', 'ي', 'ت', 'ن', 'ت', 'ي'][s] + a.r + (s >= 5 ? 'ون' : '');
    },
    sub(a, s) { return AR.pres(a, s).replace(/ون$/, 'وا'); },     // المنصوب بعد «لن»
    jus(a, s) { return a.j ? pick(a.j, s) : AR.sub(a, s); },       // المجزوم بعد «لم»
    pass(a, t, f) {                                                   // المبني للمجهول مع التأنيث
      if (t === 0) return a.ps[0] + (f ? 'تِ' : '');
      return f ? a.ps[1].replace(/^يُ/, 'تُ') : a.ps[1];
    },
  };

  /* ---------- قراءة بيانات الجملة ---------- */
  const LIDX = { en: 3, es: 4, fr: 5, it: 6, pt: 7, de: 8, ar: 9 };
  const POOL_IDX = { en: 0, es: 1, fr: 2, it: 3, pt: 4, de: 5, ar: 6 };

  function sentenceInfo(u, i) {
    const row = LT.UNITS[u].s[i];
    return {
      u, i, verb: row[0], emoji: row[1], ar: row[2], raw: row,
      place: row[10], reason: row[11], manner: row[12], poss: row[13], timeVar: row[14] || 0,
    };
  }
  function objectOf(L, S) {
    const parts = S.raw[LIDX[L]].split('|');
    if (L === 'en') return { np: parts[0], n: parts[1], pl: parts[2] === 'pl' };
    if (L === 'fr' || L === 'it') return { np: parts[0], g: parts[1], pl: parts[2] === 'pl' };
    if (L === 'de') return { g: parts[0], n: parts[1], pl: parts[0] === 'p' };
    if (L === 'ar') return { np: parts[0], n: parts[1], g: parts[2] };
    const g = /^(la|las|a|as)$/i.test(parts[0].split(' ')[0]) ? 'f' : 'm';
    return { np: parts[0], pl: parts[1] === 'pl', g };
  }
  const pool = (arr, i, L) => arr[i][POOL_IDX[L]];

  /* ---------- بناء الصيغ ---------- */
  function build(L, S, pk, t) {
    const O = objectOf(L, S);
    const PR = LT.PRON[L];
    const qk = Q_PRON[pk], ak = A_PRON[pk];
    const P = (k) => tk(PR[k][0], 'subj', L === 'fr' && PR[k][0] === 'je' ? { el: 1 } : null);
    const slot = (k) => PR[k][1];
    const T = () => words(LT.TIME[L][S.timeVar][t], 'time');
    const PLACE = () => words(pool(LT.PLACES, S.place, L), 'place');
    const REASON = () => words(pool(LT.REASONS, S.reason, L), 'reason');
    const MANNER = () => words(pool(LT.MANNERS, S.manner, L), 'manner');
    const POSS = () => words(pool(LT.POSS, S.poss, L), 'poss');
    const rows = {};

    if (L === 'ar') {
      const A = LT.AR_VERBS[S.verb];
      const OBJ = () => words(O.np, 'obj');
      const fem = O.g === 'f';
      const V = (k) => {
        const s = slot(k);
        if (t === 0) return [tk(AR.past(A, s), 'verb')];
        if (t === 1) return [tk(AR.pres(A, s), 'verb')];
        return [tk('س', 'aux', { jr: 1 }), tk(AR.pres(A, s), 'verb')];
      };
      const NEG = (k) => {
        const s = slot(k);
        if (t === 0) return [tk('لم', 'neg'), tk(AR.jus(A, s), 'verb')];
        if (t === 1) return [tk('لا', 'neg'), tk(AR.pres(A, s), 'verb')];
        return [tk('لن', 'neg'), tk(AR.sub(A, s), 'verb')];
      };
      const wh = (q) => [[tk(q, 'qw'), ...V(qk), ...OBJ(), ...T(), QM(L)]];
      rows.aff = [[P(pk), ...V(pk), ...OBJ(), ...T(), DOT()]];
      rows.neg = [[P(pk), ...NEG(pk), ...OBJ(), ...T(), DOT()]];
      rows.yn = [[tk('هل', 'qw'), ...V(qk), ...OBJ(), ...T(), QM(L)], [tk('نعم', 'ans'), COMMA(L), ...V(ak), ...OBJ(), ...T(), DOT()]];
      rows.who = [[tk('مَن', 'qw'), ...V('he'), ...OBJ(), ...T(), QM(L)], [P(ak), DOT()]];
      rows.what = [[tk('ماذا', 'qw'), ...V(qk), ...T(), QM(L)], [...OBJ(), DOT()]];
      rows.when = [[tk('متى', 'qw'), ...V(qk), ...OBJ(), QM(L)], [...T(), DOT()]];
      rows.where = [...wh('أين'), [...PLACE(), DOT()]];
      rows.why = [...wh('لماذا'), [...REASON(), DOT()]];
      rows.how = [...wh('كيف'), [...MANNER(), DOT()]];
      rows.whose = [[...words(O.n, 'obj'), tk('مَن', 'qw'), ...V(qk), ...T(), QM(L)], [...words(O.n, 'obj'), ...POSS(), DOT()]];
      rows.pass = [[...(t === 2 ? [tk('س', 'aux', { jr: 1 })] : []), tk(AR.pass(A, t, fem), 'verb'), ...OBJ(), ...T(), DOT()]];
      return LT.ROWS.map(r => rows[r.id].map(line => finishLine(L, line)));
    }

    const V = LT.VERBS[S.verb][L];

    if (L === 'en') {
      const [base, ...part] = V[0].split(' ');
      const prt = () => part.map(w => tk(w, 'verb'));
      const OBJ = () => words(O.np, 'obj');
      const is3 = (k) => slot(k) === 2;
      const fin = (k) => t === 0 ? [tk(V[1], 'verb'), ...prt()]
        : t === 1 ? [tk(is3(k) ? EN.s3(base) : base, 'verb'), ...prt()]
          : [tk('will', 'aux'), tk(base, 'verb'), ...prt()];
      const aux = (k) => tk(t === 0 ? 'did' : t === 1 ? (is3(k) ? 'does' : 'do') : 'will', 'aux');
      const bare = () => [tk(base, 'verb'), ...prt()];
      const wh = (q) => [[tk(q, 'qw'), aux(qk), P(qk), ...bare(), ...OBJ(), ...T(), QM(L)]];
      const be = t === 0 ? [tk(O.pl ? 'were' : 'was', 'aux')] : t === 1 ? [tk(O.pl ? 'are' : 'is', 'aux')] : [tk('will', 'aux'), tk('be', 'aux')];
      rows.aff = [[P(pk), ...fin(pk), ...OBJ(), ...T(), DOT()]];
      rows.neg = [[P(pk), aux(pk), tk('not', 'neg'), ...bare(), ...OBJ(), ...T(), DOT()]];
      rows.yn = [[aux(qk), P(qk), ...bare(), ...OBJ(), ...T(), QM(L)], [tk('Yes', 'ans'), COMMA(L), P(ak), aux(ak), DOT()]];
      rows.who = [[tk('Who', 'qw'), ...fin('he'), ...OBJ(), ...T(), QM(L)], [P(ak), aux(ak), DOT()]];
      rows.what = [[tk('What', 'qw'), aux(qk), P(qk), ...bare(), ...T(), QM(L)], [...OBJ(), DOT()]];
      rows.when = [[tk('When', 'qw'), aux(qk), P(qk), ...bare(), ...OBJ(), QM(L)], [...T(), DOT()]];
      rows.where = [...wh('Where'), [...PLACE(), DOT()]];
      rows.why = [...wh('Why'), [...REASON(), DOT()]];
      rows.how = [...wh('How'), [...MANNER(), DOT()]];
      rows.whose = [[tk('Whose', 'qw'), tk(O.n, 'obj'), aux(qk), P(qk), ...bare(), ...T(), QM(L)], [...POSS(), DOT()]];
      rows.pass = [[...OBJ(), ...be, tk(V[2] || V[1], 'verb'), ...prt(), ...T(), DOT()]];
    }

    if (L === 'es' || L === 'pt') {
      const C = L === 'es' ? ES : PT;
      const OBJ = () => words(O.np, 'obj');
      const vf = (s) => t === 0 ? [tk(C.pret(V, s), 'verb')] : t === 1 ? [tk(C.pres(V, s), 'verb')]
        : L === 'es' ? [tk(C.IR[s], 'aux'), tk('a', 'aux'), tk(V[0], 'verb')] : [tk(C.IR[s], 'aux'), tk(V[0], 'verb')];
      const open = L === 'es' ? () => [INV()] : () => [];
      const NO = L === 'es' ? 'no' : 'não', YES = L === 'es' ? 'Sí' : 'Sim';
      const qWithPron = L === 'pt';  // البرتغالية تذكر الضمير في السؤال، الإسبانية تحذفه
      const QW = { es: { who: ['Quién'], what: ['Qué'], when: ['Cuándo'], where: ['Dónde'], why: ['Por', 'qué'], how: ['Cómo'], whose: ['De', 'quién'] }, pt: { who: ['Quem'], what: ['O', 'que'], when: ['Quando'], where: ['Onde'], why: ['Por', 'que'], how: ['Como'], whose: ['De', 'quem'] } }[L];
      const q = (id) => QW[id].map(w => tk(w, 'qw'));
      const qp = () => qWithPron ? [P(qk)] : [];
      const wh = (id) => [[...open(), ...q(id), ...qp(), ...vf(slot(qk)), ...OBJ(), ...T(), QM(L)]];
      const cop = O.pl ? (L === 'es' ? 'son' : 'são') : (L === 'es' ? 'es' : 'é');
      const ser = L === 'es'
        ? [tk(t === 0 ? (O.pl ? 'fueron' : 'fue') : t === 1 ? (O.pl ? 'son' : 'es') : (O.pl ? 'serán' : 'será'), 'aux')]
        : t === 0 ? [tk(O.pl ? 'foram' : 'foi', 'aux')] : t === 1 ? [tk(O.pl ? 'são' : 'é', 'aux')] : [tk(O.pl ? 'vão' : 'vai', 'aux'), tk('ser', 'aux')];
      rows.aff = [[P(pk), ...vf(slot(pk)), ...OBJ(), ...T(), DOT()]];
      rows.neg = [[P(pk), tk(NO, 'neg'), ...vf(slot(pk)), ...OBJ(), ...T(), DOT()]];
      rows.yn = [[...open(), P(qk), ...vf(slot(qk)), ...OBJ(), ...T(), QM(L)], [tk(YES, 'ans'), COMMA(L), P(ak), ...vf(slot(ak)), ...OBJ(), ...T(), DOT()]];
      rows.who = [[...open(), ...q('who'), ...vf(2), ...OBJ(), ...T(), QM(L)], [P(ak), DOT()]];
      rows.what = [[...open(), ...q('what'), ...qp(), ...vf(slot(qk)), ...T(), QM(L)], [...OBJ(), DOT()]];
      rows.when = [[...open(), ...q('when'), ...qp(), ...vf(slot(qk)), ...OBJ(), QM(L)], [...T(), DOT()]];
      rows.where = [...wh('where'), [...PLACE(), DOT()]];
      rows.why = [...wh('why'), [...REASON(), DOT()]];
      rows.how = [...wh('how'), [...MANNER(), DOT()]];
      rows.whose = [[...open(), ...q('whose'), tk(cop, 'aux'), ...OBJ(), tk('que', 'x'), ...qp(), ...vf(slot(qk)), ...T(), QM(L)], [...POSS(), DOT()]];
      rows.pass = [[...OBJ(), ...ser, tk(agreeO(C.pp(V), O.g, O.pl, L), 'verb'), ...T(), DOT()]];
    }

    if (L === 'fr') {
      const OBJ = () => words(O.np, 'obj');
      const agr = (O.g === 'f' ? 'e' : '') + (O.pl ? 's' : '');
      const ppA = (pp) => (pp.endsWith('s') && O.g !== 'f') ? pp : pp + agr;
      const vf = (s, agree) => t === 0 ? [tk(FR.AVOIR[s], 'aux'), tk(agree ? ppA(FR.pp(V)) : FR.pp(V), 'verb')]
        : t === 1 ? [tk(FR.pres(V, s), 'verb')] : [tk(FR.ALLER[s], 'aux'), tk(V[0], 'verb')];
      const ESTCE = () => [tk('est-ce', 'qw'), tk('que', 'qw', { el: 1 })];
      const wh = (w) => [[tk(w, 'qw'), ...ESTCE(), P(qk), ...vf(slot(qk)), ...OBJ(), ...T(), QM(L)]];
      const neg = (s) => { const v = vf(s); return [tk('ne', 'neg', { el: 1 }), v[0], tk('pas', 'neg'), ...v.slice(1)]; };
      const etre = t === 0 ? [tk(O.pl ? 'ont' : 'a', 'aux'), tk('été', 'aux')] : t === 1 ? [tk(O.pl ? 'sont' : 'est', 'aux')] : [tk(O.pl ? 'vont' : 'va', 'aux'), tk('être', 'aux')];
      rows.aff = [[P(pk), ...vf(slot(pk)), ...OBJ(), ...T(), DOT()]];
      rows.neg = [[P(pk), ...neg(slot(pk)), ...OBJ(), ...T(), DOT()]];
      rows.yn = [[tk('Est-ce', 'qw'), tk('que', 'qw', { el: 1 }), P(qk), ...vf(slot(qk)), ...OBJ(), ...T(), QM(L)], [tk('Oui', 'ans'), COMMA(L), P(ak), ...vf(slot(ak)), ...OBJ(), ...T(), DOT()]];
      rows.who = [[tk('Qui', 'qw'), ...vf(2), ...OBJ(), ...T(), QM(L)], [tk(LT.FR_STRESSED[ak], 'subj'), DOT()]];
      rows.what = [[tk("Qu'est-ce", 'qw'), tk('que', 'qw', { el: 1 }), P(qk), ...vf(slot(qk)), ...T(), QM(L)], [...OBJ(), DOT()]];
      rows.when = [[tk('Quand', 'qw'), ...ESTCE(), P(qk), ...vf(slot(qk)), ...OBJ(), QM(L)], [...T(), DOT()]];
      rows.where = [...wh('Où'), [...PLACE(), DOT()]];
      rows.why = [...wh('Pourquoi'), [...REASON(), DOT()]];
      rows.how = [...wh('Comment'), [...MANNER(), DOT()]];
      rows.whose = [[tk('À', 'qw'), tk('qui', 'qw'), tk(O.pl ? 'sont' : 'est', 'aux'), ...OBJ(), tk('que', 'x', { el: 1 }), P(qk), ...vf(slot(qk), true), ...T(), QM(L)], [...POSS(), DOT()]];
      rows.pass = [[...OBJ(), ...etre, tk(ppA(FR.pp(V)), 'verb'), ...T(), DOT()]];
    }

    if (L === 'it') {
      const OBJ = () => words(O.np, 'obj');
      const vf = (s) => t === 0 ? [tk(IT.AVERE[s], 'aux'), tk(IT.pp(V), 'verb')] : t === 1 ? [tk(IT.pres(V, s), 'verb')] : [tk(IT.fut(V, s), 'verb')];
      const QW = { who: ['Chi'], what: ['Che', 'cosa'], when: ['Quando'], where: ['Dove'], why: ['Perché'], how: ['Come'], whose: ['Di', 'chi'] };
      const q = (id) => QW[id].map(w => tk(w, 'qw'));
      const wh = (id) => [[...q(id), ...vf(slot(qk)), ...OBJ(), ...T(), QM(L)]];
      const ess = t === 0 ? [tk(O.pl ? 'sono' : 'è', 'aux'), tk(agreeO('stato', O.g, O.pl, 'it'), 'aux')] : t === 1 ? [tk(O.pl ? 'vengono' : 'viene', 'aux')] : [tk(O.pl ? 'saranno' : 'sarà', 'aux')];
      rows.aff = [[P(pk), ...vf(slot(pk)), ...OBJ(), ...T(), DOT()]];
      rows.neg = [[P(pk), tk('non', 'neg'), ...vf(slot(pk)), ...OBJ(), ...T(), DOT()]];
      rows.yn = [[P(qk), ...vf(slot(qk)), ...OBJ(), ...T(), QM(L)], [tk('Sì', 'ans'), COMMA(L), P(ak), ...vf(slot(ak)), ...OBJ(), ...T(), DOT()]];
      rows.who = [[...q('who'), ...vf(2), ...OBJ(), ...T(), QM(L)], [P(ak), DOT()]];
      rows.what = [[...q('what'), ...vf(slot(qk)), ...T(), QM(L)], [...OBJ(), DOT()]];
      rows.when = [[...q('when'), ...vf(slot(qk)), ...OBJ(), QM(L)], [...T(), DOT()]];
      rows.where = [...wh('where'), [...PLACE(), DOT()]];
      rows.why = [...wh('why'), [...REASON(), DOT()]];
      rows.how = [...wh('how'), [...MANNER(), DOT()]];
      rows.whose = [[...q('whose'), tk(O.pl ? 'sono' : 'è', 'aux'), ...OBJ(), tk('che', 'x'), ...vf(slot(qk)), ...T(), QM(L)], [...POSS(), DOT()]];
      rows.pass = [[...OBJ(), ...ess, tk(agreeO(IT.pp(V), O.g, O.pl, 'it'), 'verb'), ...T(), DOT()]];
    }

    if (L === 'de') {
      const acc = () => [tk(DE.ACC[O.g], 'obj'), tk(O.n, 'obj')];
      const nom = () => [tk(DE.NOM[O.g], 'obj'), tk(O.n, 'obj')];
      const parts = (s) => t === 0 ? { fin: tk(DE.HABEN[s], 'aux'), end: tk(V[2], 'verb') }
        : t === 1 ? { fin: tk(DE.pres(V, s), 'verb'), end: null } : { fin: tk(DE.WERDEN[s], 'aux'), end: tk(V[0], 'verb') };
      const E = (p) => p.end ? [p.end] : [];
      const p0 = parts(slot(pk)), pq = parts(slot(qk)), pa = parts(slot(ak)), p3 = parts(2);
      const NICHT = () => tk('nicht', 'neg');
      const wh = (w) => [[tk(w, 'qw'), pq.fin, P(qk), ...acc(), ...T(), ...E(pq), QM(L)]];
      const pfin = tk(t === 0 ? (O.pl ? 'wurden' : 'wurde') : (O.pl ? 'werden' : 'wird'), 'aux');
      rows.aff = [[P(pk), p0.fin, ...acc(), ...T(), ...E(p0), DOT()]];
      rows.neg = [t === 1 ? [P(pk), p0.fin, ...acc(), NICHT(), ...T(), DOT()] : [P(pk), p0.fin, ...acc(), ...T(), NICHT(), ...E(p0), DOT()]];
      rows.yn = [[pq.fin, P(qk), ...acc(), ...T(), ...E(pq), QM(L)], [tk('Ja', 'ans'), COMMA(L), P(ak), pa.fin, ...acc(), ...T(), ...E(pa), DOT()]];
      rows.who = [[tk('Wer', 'qw'), p3.fin, ...acc(), ...T(), ...E(p3), QM(L)], [P(ak), DOT()]];
      rows.what = [[tk('Was', 'qw'), pq.fin, P(qk), ...T(), ...E(pq), QM(L)], [...acc(), DOT()]];
      rows.when = [[tk('Wann', 'qw'), pq.fin, P(qk), ...acc(), ...E(pq), QM(L)], [...T(), DOT()]];
      rows.where = [...wh('Wo'), [...PLACE(), DOT()]];
      rows.why = [...wh('Warum'), [...REASON(), DOT()]];
      rows.how = [...wh('Wie'), [...MANNER(), DOT()]];
      rows.whose = [[tk('Wessen', 'qw'), tk(O.n, 'obj'), pq.fin, P(qk), ...T(), ...E(pq), QM(L)], [...nom(), ...POSS(), DOT()]];
      rows.pass = [[...nom(), pfin, ...T(), tk(V[2], 'verb'), ...(t === 2 ? [tk('werden', 'aux')] : []), DOT()]];
    }

    return LT.ROWS.map(r => rows[r.id].map(line => finishLine(L, line)));
  }

  /* الحذف الفرنسي (je → j'، que → qu'، ne → n') وتكبير أول حرف */
  function finishLine(L, line) {
    const out = line.map(t => Object.assign({}, t));
    if (L === 'fr') elide(out);
    const first = out.find(t => /\p{L}/u.test(t.w));
    if (first) first.w = first.w.charAt(0).toLocaleUpperCase() + first.w.slice(1);
    return out;
  }
  function elide(out) {
    for (let i = 0; i < out.length - 1; i++) {
      if (out[i].el && !out[i].jr && /^[aeiouyàâéèêëîïôûœ]/i.test(out[i + 1].w)) {
        out[i].w = out[i].w.slice(0, -1) + "'";
        out[i].jr = 1;
      }
    }
  }

  /* تجميع الكلمات الملتصقة (j' + ai) في وحدة عرض واحدة */
  function units(line) {
    const out = [];
    line.forEach((t, i) => {
      const prev = line[i - 1];
      if (out.length && (t.jl || (prev && prev.jr))) out[out.length - 1].push(t);
      else out.push([t]);
    });
    return out;
  }
  const unitText = (u) => u.map(t => t.w).join('');
  const lineText = (line) => units(line).map(unitText).join(' ');

  /* كل صيغ الدرس: مصفوفة خلايا (صفاً صفاً، من الماضي إلى المستقبل) */
  function lesson(L, u, i, pk) {
    const S = sentenceInfo(u, i);
    const byTense = [0, 1, 2].map(t => build(L, S, pk, t));
    const cells = [];
    LT.ROWS.forEach((row, r) => [0, 1, 2].forEach(t => cells.push({ r, t, row, tense: LT.TENSES[t], lines: byTense[t][r] })));
    return { S, cells };
  }

  function pronounFor(round, i) {
    const pr = LT.ROUNDS[round].pr;
    return pr[i % pr.length];
  }

  /* ---------- الجمل المركبة والقصة والحوار ---------- */
  const ROW = (id) => LT.ROWS.findIndex(r => r.id === id);
  /* جملة بلا نقطة في آخرها، مع حذف الزمان إن طُلب وتصغير أول حرف */
  function clause(L, u, i, pk, t, rowId, o = {}) {
    let line = build(L, sentenceInfo(u, i), pk, t)[ROW(rowId)][0].map(x => Object.assign({}, x));
    line = line.filter(x => !(x.r === 'p' && x.jl && /^[.]$/.test(x.w)));
    if (o.noTime) line = line.filter(x => x.r !== 'time');
    if (o.lower) {
      const first = line.find(x => /\p{L}/u.test(x.w));
      if (first && !(L === 'en' && first.w === 'I')) first.w = first.w.charAt(0).toLocaleLowerCase() + first.w.slice(1);
    }
    if (o.dropSubj) line = line.filter(x => x.r !== 'subj');
    return line;
  }
  const conn = (L, id) => {
    const c = LT.CONNECTORS.find(x => x.id === id);
    const w = L === 'ar' ? c.arw : c[L];
    return w.split(' ').map((x, k, a) => (x.endsWith(',') || x.endsWith('،')) && k === a.length - 1
      ? [tk(x.slice(0, -1), 'conn'), P_(x.slice(-1))] : [tk(x, 'conn')]).flat();
  };
  /* كلمة ربط في أول الجملة: الألمانية تقدّم الفعل على الفاعل */
  function startWith(L, id, cl) {
    let body = cl;
    if (L === 'de') {
      const si = body.findIndex(x => x.r === 'subj');
      if (si === 0 && body[1]) body = [body[1], body[0], ...body.slice(2)];
    }
    if (L === 'ar') body = body.filter(x => x.r !== 'subj');
    return [...conn(L, id), ...body];
  }
  /* ربط جملتين: «و» العربية تلتصق بما بعدها */
  function joinWith(L, id, a, b) {
    const comma = (id === 'but') ? [COMMA(L)] : [];
    if (L === 'ar') {
      const right = b.filter(x => x.r !== 'subj');
      if (id === 'and') return [...a, tk('و', 'conn', { jr: 1 }), ...right];
      return [...a, ...comma, ...conn(L, id), ...right];
    }
    return [...a, ...comma, ...conn(L, id), ...b];
  }
  const close = (L, line) => {
    const out = [...line, DOT()];
    if (L === 'fr') elide(out);
    const first = out.find(x => /\p{L}/u.test(x.w));
    if (first) first.w = first.w.charAt(0).toLocaleUpperCase() + first.w.slice(1);
    return out;
  };

  /* قصة الوحدة بالماضي: جمل بسيطة ومركبة مع كلمات الربط */
  function story(L, u, pk = 'she') {
    const n = LT.UNITS[u].s.length;
    const A = (i, o = {}) => clause(L, u, i % n, pk, 0, 'aff', Object.assign({ noTime: true, lower: true }, o));
    const N = (i) => clause(L, u, i % n, pk, 0, 'neg', { noTime: true, lower: true });
    const parts = [
      { kind: 'simple', conn: 'first', line: startWith(L, 'first', clause(L, u, 0, pk, 0, 'aff', { lower: true })) },
      { kind: 'compound', conn: 'and', line: startWith(L, 'then', joinWith(L, 'and', A(1), A(2))) },
      { kind: 'compound', conn: 'but', line: startWith(L, 'after', joinWith(L, 'but', A(3), N(4))) },
      { kind: 'simple', conn: null, line: A(5) },
      { kind: 'compound', conn: 'and', line: startWith(L, 'then', joinWith(L, 'and', A(6), A(7))) },
      { kind: 'compound', conn: 'but', line: startWith(L, 'finally', joinWith(L, 'but', A(8), N(9))) },
    ];
    return parts.map(p => Object.assign(p, { line: close(L, p.line) }));
  }
  /* جملة مركبة جاهزة للتمارين: نوعها and / but / or */
  function compound(L, u, i, j, pk, t, kind) {
    if (kind === 'or') {
      const a = clause(L, u, i, pk, t, 'yn', { noTime: true });
      const b = clause(L, u, j, pk, t, 'yn', { noTime: true, lower: true }).filter(x => !(x.r === 'p' && /[?؟¿]/.test(x.w)));
      const a2 = a.filter(x => !(x.r === 'p' && x.jl && /[?؟]/.test(x.w)));
      // العربية: «أم» بدل «أو» في السؤال، ولا تتكرر «هل»
      const line = L === 'ar' ? [...a2, tk('أم', 'conn'), ...b.filter(x => x.w !== 'هل'), QM(L)] : [...a2, ...conn(L, 'or'), ...b, QM(L)];
      if (L === 'fr') elide(line);
      return line;
    }
    const a = clause(L, u, i, pk, t, 'aff', { noTime: true, lower: true });
    const b = kind === 'but' ? clause(L, u, j, pk, t, 'neg', { noTime: true, lower: true }) : clause(L, u, j, pk, t, 'aff', { noTime: true, lower: true });
    return close(L, joinWith(L, kind, a, b));
  }
  const simple = (L, u, i, pk, t) => close(L, clause(L, u, i, pk, t, 'aff', { lower: true }));

  /* حوار بين سارة وعمر من جملتين في الوحدة */
  function dialogue(L, u, i, j) {
    const S1 = sentenceInfo(u, i), S2 = sentenceInfo(u, j);
    const f = (S, t, id, k) => build(L, S, 'i', t)[ROW(id)][k];
    const say = (who, line) => ({ who, line });
    const fixed = (key) => [tk(LT.CHAT[key][L], 'x')];
    return [
      say('a', fixed('hi')), say('b', fixed('hi')),
      say('a', f(S1, 0, 'yn', 0)), say('b', f(S1, 0, 'yn', 1)),
      say('a', f(S1, 0, 'where', 0)), say('b', f(S1, 0, 'where', 1)),
      say('a', f(S1, 0, 'why', 0)), say('b', f(S1, 0, 'why', 1)),
      say('b', fixed('andyou')),
      say('b', f(S2, 2, 'what', 0)), say('a', f(S2, 2, 'what', 1)),
      say('b', f(S2, 2, 'when', 0)), say('a', f(S2, 2, 'when', 1)),
      say('b', f(S2, 2, 'how', 0)), say('a', f(S2, 2, 'how', 1)),
      say('b', fixed('great')), say('a', fixed('bye')),
    ];
  }

  LT.G = { lesson, build, sentenceInfo, units, unitText, lineText, pronounFor, objectOf, POOL_IDX, story, compound, simple, dialogue, ROW };
})();
