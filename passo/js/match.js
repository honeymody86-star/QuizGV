/* Passo a Passo — compares what the learner said with the expected sentence. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PassoMatch = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const PRONOUNS = ['io', 'tu', 'lui', 'lei', 'noi', 'voi', 'loro'];

  function norm(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/['’`]/g, '').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }

  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n;
    if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return prev[n];
  }

  const ratio = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);

  // Italian drops subject pronouns freely, so accept the answer with or without them.
  function variants(expected) {
    const e = norm(expected);
    const out = [e];
    const words = e.split(' ');
    if (PRONOUNS.includes(words[0])) out.push(words.slice(1).join(' '));
    const withoutAny = words.filter((w) => !PRONOUNS.includes(w)).join(' ');
    if (!out.includes(withoutAny)) out.push(withoutAny);
    return out;
  }

  /** Returns { ok, score } — score 0..1 of the best alternative heard. */
  function judge(expected, heardAlts, threshold) {
    threshold = threshold || 0.78;
    let best = 0;
    const targets = variants(expected);
    (heardAlts || []).forEach((h) => {
      const n = norm(h);
      targets.forEach((t) => { best = Math.max(best, ratio(n, t)); });
    });
    return { ok: best >= threshold, score: best };
  }

  return { norm, judge, ratio };
});
