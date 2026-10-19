/*
 * Passo a Passo — lesson model.
 * Resolves a lesson's sentences into rows (one per tense) of tokens,
 * one token per segment, so all rows line up column by column.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PassoModel = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const pick = (v, rowKey) => (v && typeof v === 'object' && !Array.isArray(v) && rowKey in v ? v[rowKey] : v);
  const isMeaning = (m) => m && typeof m === 'object' && ('ar' in m || 'en' in m);
  const pickMeaning = (m, rowKey) => (isMeaning(m) ? m : m && m[rowKey]) || null;
  const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

  function rowsOf(pack, lesson) {
    return lesson.rows.map((key) => {
      const t = pack.lex.TENSES[key];
      const label = (lesson.rowLabels && lesson.rowLabels[key]) || t.short;
      return { key, label, it: t.it, time: t.time, icon: t.icon, name: t.name, use: t.use };
    });
  }

  function resolveSentence(pack, lesson, sent, si) {
    const { conjugate, PRONOUNS } = pack.conj;
    const { PRONOUN_INFO, VERBS } = pack.lex;
    const segs = sent.segs.map((seg) => ({ role: seg.r, src: seg, cells: [] }));
    const rows = [];

    lesson.rows.forEach((rowKey) => {
      let current = PRONOUNS.io; // person carried from the last subject
      const tokens = sent.segs.map((seg, i) => {
        let tok;
        if (seg.r === 'subj' && seg.p) {
          const info = PRONOUN_INFO[seg.p];
          current = PRONOUNS[seg.p];
          tok = { text: info.it, m: info.m, ic: info.ic, disp: { type: 'plain' }, pron: seg.p };
        } else if (seg.r === 'verb' && seg.v) {
          const who = seg.p ? PRONOUNS[seg.p] : current;
          const tense = seg.t || (seg.tmap && seg.tmap[rowKey]) || rowKey;
          const c = conjugate(seg.v, tense, who.p, who.g, { mid: seg.mid, auxVerb: seg.auxVerb });
          const lexv = VERBS[seg.v] || {};
          tok = { text: c.text, m: { ar: lexv.ar, en: lexv.en }, ic: lexv.ic || '⚡', disp: dispOf(c), conj: c, tense, person: who.p };
        } else {
          tok = { text: pick(seg.it, rowKey), m: pickMeaning(seg.m, rowKey), ic: pick(seg.ic, rowKey), disp: { type: 'plain' } };
        }
        tok.role = seg.r;
        tok.post = seg.post || '';
        tok.seg = i;
        segs[i].cells.push(tok);
        return tok;
      });
      if (tokens.length) tokens[0].first = true;
      const full = tokens.map((t, i) => (i === 0 ? cap(t.text) : t.text) + t.post).join(' ') + (sent.end || '.');
      const gi = lesson.rows.indexOf(rowKey);
      rows.push({
        key: rowKey, tokens, full,
        gloss: { ar: sent.g.ar[gi], en: sent.g.en[gi] },
        id: `${lesson.id}:${si}:${rowKey}`,
      });
    });

    segs.forEach((s) => { s.same = s.cells.every((c) => c.text === s.cells[0].text); });
    return { index: si, segs, rows, note: sent.note, src: sent };
  }

  function dispOf(c) {
    if (c.kind === 'simple') {
      return c.end && !c.irregular && c.text.endsWith(c.end)
        ? { type: 'split', base: c.text.slice(0, c.text.length - c.end.length), end: c.end }
        : { type: 'plain', irregular: !!c.irregular };
    }
    return { type: 'aux', aux: c.aux.text, mid: c.mid, part: c.part };
  }

  function buildLesson(pack, lesson) {
    const rows = rowsOf(pack, lesson);
    const sentences = (lesson.sentences || []).map((s, i) => resolveSentence(pack, lesson, s, i));
    return { lesson, rows, sentences };
  }

  function allLessons(pack) {
    const out = [];
    pack.course.units.forEach((u) => u.lessons.forEach((l) => out.push(Object.assign({ unit: u }, l))));
    return out;
  }

  return { buildLesson, allLessons, cap };
});
