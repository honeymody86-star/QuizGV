// Run: node --test tests/
const test = require('node:test');
const assert = require('node:assert');
const C = require('../lang/it/conjugate.js');
const lex = require('../lang/it/lexicon.js');
const course = require('../lang/it/course.js');
const M = require('../js/model.js');
const match = require('../js/match.js');

const pack = { conj: C, lex, course };
const f = (v, t, p, g, o) => C.conjugate(v, t, p, g, o).text;

test('presente: regular, -isc-, spelling rules and irregulars', () => {
  assert.deepStrictEqual([0, 1, 2, 3, 4, 5].map((p) => f('parlare', 'pres', p)), ['parlo', 'parli', 'parla', 'parliamo', 'parlate', 'parlano']);
  assert.strictEqual(f('capire', 'pres', 0), 'capisco');
  assert.strictEqual(f('capire', 'pres', 3), 'capiamo');
  assert.strictEqual(f('cercare', 'pres', 1), 'cerchi');
  assert.strictEqual(f('mangiare', 'pres', 1), 'mangi');
  assert.strictEqual(f('studiare', 'pres', 3), 'studiamo');
  assert.strictEqual(f('andare', 'pres', 5), 'vanno');
  assert.strictEqual(f('uscire', 'pres', 0), 'esco');
});

test('passato prossimo: avere / essere and agreement', () => {
  assert.strictEqual(f('mangiare', 'pp', 0), 'ho mangiato');
  assert.strictEqual(f('andare', 'pp', 0, 'm'), 'sono andato');
  assert.strictEqual(f('arrivare', 'pp', 2, 'f'), 'è arrivata');
  assert.strictEqual(f('partire', 'pp', 3, 'm'), 'siamo partiti');
  assert.strictEqual(f('leggere', 'pp', 2), 'ha letto');
  assert.strictEqual(f('conoscere', 'pp', 0), 'ho conosciuto');
});

test('futuro / condizionale stems', () => {
  assert.strictEqual(f('mangiare', 'fut', 0), 'mangerò');
  assert.strictEqual(f('cercare', 'fut', 3), 'cercheremo');
  assert.strictEqual(f('bere', 'fut', 0), 'berrò');
  assert.strictEqual(f('rimanere', 'fut', 2), 'rimarrà');
  assert.strictEqual(f('volere', 'cond', 0), 'vorrei');
  assert.strictEqual(f('dovere', 'cond', 1), 'dovresti');
});

test('imperfetto, progressive, perfect and subjunctive', () => {
  assert.strictEqual(f('fare', 'imp', 0), 'facevo');
  assert.strictEqual(f('essere', 'imp', 2), 'era');
  assert.strictEqual(f('fare', 'prog_pres', 3), 'stiamo facendo');
  assert.strictEqual(f('finire', 'trap', 0, 'm', { mid: 'già' }), 'avevo già finito');
  assert.strictEqual(f('partire', 'fant', 2, 'f', { mid: 'già' }), 'sarà già partita');
  assert.strictEqual(f('andare', 'condp', 3), 'saremmo andati');
  assert.strictEqual(f('essere', 'cong', 2), 'sia');
  assert.strictEqual(f('parlare', 'cong', 4), 'parliate');
  assert.strictEqual(f('venire', 'cong', 1), 'venga');
});

test('every lesson resolves, glosses line up and verbs are in the lexicon', () => {
  const all = M.allLessons(pack);
  assert.ok(all.length >= 15);
  all.filter((l) => l.sentences).forEach((l) => {
    l.rows.forEach((k) => assert.ok(lex.TENSES[k], `${l.id}: unknown tense ${k}`));
    const m = M.buildLesson(pack, l);
    m.sentences.forEach((s, i) => {
      assert.strictEqual(s.src.g.ar.length, l.rows.length, `${l.id}#${i} ar glosses`);
      assert.strictEqual(s.src.g.en.length, l.rows.length, `${l.id}#${i} en glosses`);
      s.rows.forEach((r) => {
        assert.ok(r.full && !/undefined/.test(r.full), `${l.id}#${i} ${r.full}`);
        r.tokens.forEach((t) => {
          if (t.conj) assert.ok(lex.VERBS[t.conj.inf], `missing verb ${t.conj.inf}`);
          assert.ok(t.m && t.m.ar && t.m.en, `${l.id}#${i} meaning for "${t.text}"`);
        });
      });
    });
  });
});

test('sample sentences', () => {
  const m = M.buildLesson(pack, M.allLessons(pack).find((l) => l.id === 'u1l1'));
  assert.deepStrictEqual(m.sentences[0].rows.map((r) => r.full), ['Io ho mangiato una mela.', 'Io mangio una mela.', 'Io mangerò una mela.']);
  const q = M.buildLesson(pack, M.allLessons(pack).find((l) => l.id === 'u1l6'));
  assert.strictEqual(q.sentences[1].rows[0].full, 'Dove sei andato?');
});

test('speech matching accepts dropped pronouns and small errors', () => {
  assert.ok(match.judge('Io mangio una mela.', ['mangio una mela']).ok);
  assert.ok(match.judge("Tu hai studiato l'italiano.", ['tu hai studiato litaliano']).ok);
  assert.ok(match.judge('Io mangerò una mela.', ['io mangero una mela']).ok);
  assert.ok(!match.judge('Io mangerò una mela.', ['io bevo un caffè']).ok);
});
