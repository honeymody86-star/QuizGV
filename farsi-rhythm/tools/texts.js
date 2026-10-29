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
process.stdout.write(JSON.stringify(out));
