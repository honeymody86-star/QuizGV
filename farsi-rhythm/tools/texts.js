// يطبع قائمة النصوص التي تحتاج تسجيلاً صوتياً: [{key, lang, text}]
// يجب أن تطابق المفاتيح ما يبنيه app.js في CLIP_KEYS.
const C = require('../data.js');
const firstMeaning = ar => ar.split('/')[0].replace(/\(.*?\)/g, '').trim();
const out = [];
C.words.forEach(w => {
  out.push({ key: 'fa/w' + w.id, lang: 'fa', text: w.voc });
  out.push({ key: 'ar/w' + w.id, lang: 'ar', text: firstMeaning(w.ar) });
});
// تصريف الأفعال: الماضي والمضارع لكل الضمائر + معنى «أنا» بالعربية
C.verbs.forEach(id => {
  const v = C.words[id].verb;
  v.past.forEach((t, p) => out.push({ key: `fa/v${id}_p${p}`, lang: 'fa', text: t }));
  v.pres.forEach((t, p) => out.push({ key: `fa/v${id}_n${p}`, lang: 'fa', text: t }));
  out.push({ key: `ar/v${id}_p`, lang: 'ar', text: v.arPast });
  out.push({ key: `ar/v${id}_n`, lang: 'ar', text: v.arPres });
  out.push({ key: `fa/ve${id}_n`, lang: 'fa', text: v.ex.presFa }, { key: `fa/ve${id}_p`, lang: 'fa', text: v.ex.pastFa });
  out.push({ key: `ar/ve${id}_n`, lang: 'ar', text: v.ex.presAr }, { key: `ar/ve${id}_p`, lang: 'ar', text: v.ex.pastAr });
});
C.sentences.forEach(s => {
  out.push({ key: 'fa/s' + s.id, lang: 'fa', text: s.fa });
  out.push({ key: 'ar/s' + s.id, lang: 'ar', text: s.ar });
});
require('../songs.js').forEach(g => g.lines.forEach(l => {
  out.push({ key: `fa/l${g.id}_${l.i}`, lang: 'fa', text: l.fa });
  out.push({ key: `ar/l${g.id}_${l.i}`, lang: 'ar', text: l.ar });
}));
process.stdout.write(JSON.stringify(out));
