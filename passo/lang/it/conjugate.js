/*
 * Passo a Passo — Italian conjugation engine.
 * Produces every verb form the course needs, plus a breakdown
 * (stem / ending, auxiliary / participle) that the instructor uses to explain it.
 * Works in the browser (window.ItConj) and in Node (module.exports) for tests.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ItConj = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // p = person index 0..5 (io, tu, lui/lei, noi, voi, loro), g = gender for agreement
  const PRONOUNS = {
    io: { p: 0, g: 'm' }, tu: { p: 1, g: 'm' }, lui: { p: 2, g: 'm' }, lei: { p: 2, g: 'f' },
    noi: { p: 3, g: 'm' }, voi: { p: 4, g: 'm' }, loro: { p: 5, g: 'm' },
  };
  const PERSON_KEYS = ['io', 'tu', 'lui', 'noi', 'voi', 'loro'];

  // Verbs that build compound tenses with "essere"
  const ESSERE_AUX = new Set([
    'essere', 'andare', 'venire', 'arrivare', 'partire', 'tornare', 'uscire', 'stare',
    'nascere', 'rimanere', 'entrare', 'restare', 'morire', 'diventare',
  ]);
  // -ire verbs that insert -isc-
  const ISC = new Set(['capire', 'finire', 'preferire', 'pulire', 'spedire', 'costruire']);

  // Latin-like bases that make some irregulars regular in imperfetto / gerundio / congiuntivo
  const BASE = { fare: 'facere', bere: 'bevere', dire: 'dicere' };

  const PRES = {
    essere: ['sono', 'sei', 'è', 'siamo', 'siete', 'sono'],
    avere: ['ho', 'hai', 'ha', 'abbiamo', 'avete', 'hanno'],
    andare: ['vado', 'vai', 'va', 'andiamo', 'andate', 'vanno'],
    fare: ['faccio', 'fai', 'fa', 'facciamo', 'fate', 'fanno'],
    bere: ['bevo', 'bevi', 'beve', 'beviamo', 'bevete', 'bevono'],
    venire: ['vengo', 'vieni', 'viene', 'veniamo', 'venite', 'vengono'],
    volere: ['voglio', 'vuoi', 'vuole', 'vogliamo', 'volete', 'vogliono'],
    potere: ['posso', 'puoi', 'può', 'possiamo', 'potete', 'possono'],
    dovere: ['devo', 'devi', 'deve', 'dobbiamo', 'dovete', 'devono'],
    dire: ['dico', 'dici', 'dice', 'diciamo', 'dite', 'dicono'],
    stare: ['sto', 'stai', 'sta', 'stiamo', 'state', 'stanno'],
    uscire: ['esco', 'esci', 'esce', 'usciamo', 'uscite', 'escono'],
    sapere: ['so', 'sai', 'sa', 'sappiamo', 'sapete', 'sanno'],
    dare: ['do', 'dai', 'dà', 'diamo', 'date', 'danno'],
    rimanere: ['rimango', 'rimani', 'rimane', 'rimaniamo', 'rimanete', 'rimangono'],
  };
  const IMPF = { essere: ['ero', 'eri', 'era', 'eravamo', 'eravate', 'erano'] };
  const FUT = {
    essere: 'sar', avere: 'avr', andare: 'andr', fare: 'far', bere: 'berr', venire: 'verr',
    volere: 'vorr', potere: 'potr', dovere: 'dovr', vedere: 'vedr', vivere: 'vivr', stare: 'star',
    dire: 'dir', sapere: 'sapr', rimanere: 'rimarr', dare: 'dar',
  };
  const PART = {
    essere: 'stato', fare: 'fatto', bere: 'bevuto', venire: 'venuto', dire: 'detto', vedere: 'visto',
    prendere: 'preso', leggere: 'letto', scrivere: 'scritto', mettere: 'messo', aprire: 'aperto',
    vivere: 'vissuto', chiudere: 'chiuso', rimanere: 'rimasto', scegliere: 'scelto', perdere: 'perso',
    rispondere: 'risposto', chiedere: 'chiesto', decidere: 'deciso', nascere: 'nato', morire: 'morto',
    conoscere: 'conosciuto', vincere: 'vinto', correre: 'corso',
  };
  const CONG = {
    essere: ['sia', 'sia', 'sia', 'siamo', 'siate', 'siano'],
    avere: ['abbia', 'abbia', 'abbia', 'abbiamo', 'abbiate', 'abbiano'],
    andare: ['vada', 'vada', 'vada', 'andiamo', 'andiate', 'vadano'],
    fare: ['faccia', 'faccia', 'faccia', 'facciamo', 'facciate', 'facciano'],
    venire: ['venga', 'venga', 'venga', 'veniamo', 'veniate', 'vengano'],
    volere: ['voglia', 'voglia', 'voglia', 'vogliamo', 'vogliate', 'vogliano'],
    potere: ['possa', 'possa', 'possa', 'possiamo', 'possiate', 'possano'],
    dovere: ['debba', 'debba', 'debba', 'dobbiamo', 'dobbiate', 'debbano'],
    stare: ['stia', 'stia', 'stia', 'stiamo', 'stiate', 'stiano'],
    sapere: ['sappia', 'sappia', 'sappia', 'sappiamo', 'sappiate', 'sappiano'],
    uscire: ['esca', 'esca', 'esca', 'usciamo', 'usciate', 'escano'],
    rimanere: ['rimanga', 'rimanga', 'rimanga', 'rimaniamo', 'rimaniate', 'rimangano'],
    dare: ['dia', 'dia', 'dia', 'diamo', 'diate', 'diano'],
  };

  const END = {
    pres: {
      are: ['o', 'i', 'a', 'iamo', 'ate', 'ano'], ere: ['o', 'i', 'e', 'iamo', 'ete', 'ono'],
      ire: ['o', 'i', 'e', 'iamo', 'ite', 'ono'], isc: ['isco', 'isci', 'isce', 'iamo', 'ite', 'iscono'],
    },
    impf: ['o', 'i', 'a', 'amo', 'ate', 'ano'],
    fut: ['ò', 'ai', 'à', 'emo', 'ete', 'anno'],
    cond: ['ei', 'esti', 'ebbe', 'emmo', 'este', 'ebbero'],
    cong: {
      are: ['i', 'i', 'i', 'iamo', 'iate', 'ino'], ere: ['a', 'a', 'a', 'iamo', 'iate', 'ano'],
      ire: ['a', 'a', 'a', 'iamo', 'iate', 'ano'], isc: ['isca', 'isca', 'isca', 'iamo', 'iate', 'iscano'],
    },
  };

  // Tense catalogue: simple tenses, compound (aux + participle), progressive (stare + gerundio)
  const COMPOUND = { pp: 'pres', trap: 'imp', fant: 'fut', condp: 'cond' };
  const PROGRESSIVE = { prog_past: 'imp', prog_pres: 'pres', prog_fut: 'fut' };
  const SIMPLE = new Set(['pres', 'imp', 'fut', 'cond', 'cong']);

  const klass = (inf) => (BASE[inf] || inf).slice(-3); // 'are' | 'ere' | 'ire'
  const stemOf = (inf) => (BASE[inf] || inf).slice(0, -3);

  // Spelling rules when a stem meets an ending
  function join(stem, end, conj) {
    if (conj === 'are') {
      if (/[cg]$/.test(stem) && /^[ie]/.test(end)) return { base: stem + 'h', end }; // cerchi, pagherò
      if (/[cg]i$/.test(stem) && /^e/.test(end)) return { base: stem.slice(0, -1), end }; // mangerò
    }
    if (/i$/.test(stem) && /^i/.test(end)) return { base: stem, end: end.slice(1) }; // studi, mangiamo
    return { base: stem, end };
  }

  function presente(inf, p) {
    if (PRES[inf]) return { text: PRES[inf][p], irregular: true };
    const c = klass(inf);
    const set = c === 'ire' && ISC.has(inf) ? END.pres.isc : END.pres[c];
    const j = join(stemOf(inf), set[p], c);
    return { text: j.base + j.end, base: j.base, end: j.end };
  }

  function imperfetto(inf, p) {
    if (IMPF[inf]) return { text: IMPF[inf][p], irregular: true };
    const c = klass(inf);
    const base = stemOf(inf) + { are: 'av', ere: 'ev', ire: 'iv' }[c];
    return { text: base + END.impf[p], base: stemOf(inf), end: base.slice(stemOf(inf).length) + END.impf[p], irregular: !!BASE[inf] };
  }

  function futStem(inf) {
    if (FUT[inf]) return { stem: FUT[inf], irregular: true };
    const c = klass(inf);
    if (c === 'ire') return { stem: stemOf(inf) + 'ir' };
    const j = join(stemOf(inf), 'er', c);
    return { stem: j.base + j.end };
  }

  function futuro(inf, p, set) {
    const f = futStem(inf);
    return { text: f.stem + set[p], base: f.stem, end: set[p], irregular: !!f.irregular };
  }

  function congiuntivo(inf, p) {
    if (CONG[inf]) return { text: CONG[inf][p], irregular: true };
    const c = klass(inf);
    const set = c === 'ire' && ISC.has(inf) ? END.cong.isc : END.cong[c];
    const j = join(stemOf(inf), set[p], c);
    return { text: j.base + j.end, base: j.base, end: j.end };
  }

  function participle(inf) {
    if (PART[inf]) return PART[inf];
    const c = klass(inf);
    return inf.slice(0, -3) + { are: 'ato', ere: 'uto', ire: 'ito' }[c];
  }

  function gerund(inf) {
    const c = klass(inf);
    return stemOf(inf) + (c === 'are' ? 'ando' : 'endo');
  }

  const auxOf = (inf) => (ESSERE_AUX.has(inf) ? 'essere' : 'avere');

  function agree(part, p, g) {
    if (!/o$/.test(part)) return part;
    const plural = p >= 3;
    return part.slice(0, -1) + (plural ? (g === 'f' ? 'e' : 'i') : (g === 'f' ? 'a' : 'o'));
  }

  function simple(inf, tense, p) {
    switch (tense) {
      case 'pres': return presente(inf, p);
      case 'imp': return imperfetto(inf, p);
      case 'fut': return futuro(inf, p, END.fut);
      case 'cond': return futuro(inf, p, END.cond);
      case 'cong': return congiuntivo(inf, p);
      default: throw new Error('Unknown simple tense: ' + tense);
    }
  }

  /**
   * conjugate('mangiare', 'pp', 0, 'm') → { kind:'compound', text:'ho mangiato', aux:{text:'ho', inf:'avere'}, part:'mangiato' }
   * opts.auxVerb: auxiliary decided by another verb (modal + infinitive). opts.mid: adverb between aux and participle (già).
   */
  function conjugate(inf, tense, p, g, opts) {
    opts = opts || {};
    g = g || 'm';
    if (SIMPLE.has(tense)) {
      const r = simple(inf, tense, p);
      return Object.assign({ kind: 'simple', tense, inf }, r);
    }
    if (COMPOUND[tense]) {
      const auxInf = opts.auxVerb ? auxOf(opts.auxVerb) : auxOf(inf);
      const aux = simple(auxInf, COMPOUND[tense], p).text;
      let part = participle(inf);
      if (auxInf === 'essere') part = agree(part, p, g);
      const text = [aux, opts.mid, part].filter(Boolean).join(' ');
      return { kind: 'compound', tense, inf, text, aux: { text: aux, inf: auxInf }, part, mid: opts.mid, irregularPart: !!PART[inf] };
    }
    if (PROGRESSIVE[tense]) {
      const aux = simple('stare', PROGRESSIVE[tense], p).text;
      const part = gerund(inf);
      return { kind: 'prog', tense, inf, text: aux + ' ' + part, aux: { text: aux, inf: 'stare' }, part };
    }
    throw new Error('Unknown tense: ' + tense);
  }

  return { PRONOUNS, PERSON_KEYS, conjugate, participle, gerund, auxOf, ESSERE_AUX };
});
