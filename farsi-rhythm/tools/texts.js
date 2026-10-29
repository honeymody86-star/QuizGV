// يطبع قائمة النصوص التي تحتاج تسجيلاً صوتياً: [{key, lang, text}]
// يجب أن تطابق المفاتيح ما يبنيه app.js في CLIP_KEYS.
const C = require('../data.js');
const firstMeaning = ar => ar.split('/')[0].replace(/\(.*?\)/g, '').trim();
const out = [];
C.words.forEach(w => {
  out.push({ key: 'fa/w' + w.id, lang: 'fa', text: w.voc });
  out.push({ key: 'ar/w' + w.id, lang: 'ar', text: firstMeaning(w.ar) });
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
