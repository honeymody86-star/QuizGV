/* Passo a Passo — Italian language pack: tenses, pronouns, verbs. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ItLex = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // time: past | present | future — drives row colour and order.
  // freq: 1..3 how often natives use it (shown as stars in the overview).
  const TENSES = {
    pp: {
      it: 'Passato prossimo', time: 'past', freq: 3, icon: '⏪',
      short: { ar: 'الماضي', en: 'Past' },
      name: { ar: 'الماضي القريب', en: 'Present perfect / simple past' },
      use: { ar: 'لحدث انتهى في الماضي', en: 'a finished action in the past' },
    },
    pres: {
      it: 'Presente', time: 'present', freq: 3, icon: '⏺️',
      short: { ar: 'الحاضر', en: 'Present' },
      name: { ar: 'المضارع', en: 'Simple present' },
      use: { ar: 'للحاضر والعادات', en: 'now and habits' },
    },
    fut: {
      it: 'Futuro semplice', time: 'future', freq: 2, icon: '⏩',
      short: { ar: 'المستقبل', en: 'Future' },
      name: { ar: 'المستقبل البسيط', en: 'Simple future' },
      use: { ar: 'لحدث سيحصل', en: 'something that will happen' },
    },
    imp: {
      it: 'Imperfetto', time: 'past', freq: 3, icon: '🔁',
      short: { ar: 'الماضي المستمر', en: 'Past habit' },
      name: { ar: 'الماضي الناقص', en: 'Imperfect' },
      use: { ar: 'للعادة والوصف في الماضي', en: 'habits and descriptions in the past' },
    },
    prog_past: {
      it: 'Stavo + gerundio', time: 'past', freq: 2, icon: '⏪',
      short: { ar: 'كنتُ أفعل', en: 'Was doing' },
      name: { ar: 'الماضي المستمر', en: 'Past continuous' },
      use: { ar: 'لحدث كان جاريًا في لحظة ماضية', en: 'an action in progress in the past' },
    },
    prog_pres: {
      it: 'Sto + gerundio', time: 'present', freq: 2, icon: '⏺️',
      short: { ar: 'أفعل الآن', en: 'Doing now' },
      name: { ar: 'المضارع المستمر', en: 'Present continuous' },
      use: { ar: 'لحدث يجري الآن', en: 'an action happening right now' },
    },
    prog_fut: {
      it: 'Starò + gerundio', time: 'future', freq: 1, icon: '⏩',
      short: { ar: 'سأكون أفعل', en: 'Will be doing' },
      name: { ar: 'المستقبل المستمر', en: 'Future continuous' },
      use: { ar: 'لحدث سيكون جاريًا في المستقبل', en: 'an action in progress in the future' },
    },
    trap: {
      it: 'Trapassato prossimo', time: 'past', freq: 1, icon: '⏮️',
      short: { ar: 'ماضي الماضي', en: 'Had done' },
      name: { ar: 'الماضي الأسبق', en: 'Past perfect' },
      use: { ar: 'لحدث انتهى قبل حدث ماضٍ آخر', en: 'an action finished before another past one' },
    },
    fant: {
      it: 'Futuro anteriore', time: 'future', freq: 1, icon: '⏭️',
      short: { ar: 'سأكون قد فعلت', en: 'Will have done' },
      name: { ar: 'المستقبل التام', en: 'Future perfect' },
      use: { ar: 'لحدث سينتهي قبل لحظة مستقبلية', en: 'an action finished before a future moment' },
    },
    cond: {
      it: 'Condizionale presente', time: 'present', freq: 2, icon: '💭',
      short: { ar: 'الشرطي', en: 'Would' },
      name: { ar: 'الشرطي الحاضر', en: 'Present conditional' },
      use: { ar: 'للأدب والرغبة والافتراض', en: 'politeness, wishes, hypotheses' },
    },
    condp: {
      it: 'Condizionale passato', time: 'past', freq: 1, icon: '💭',
      short: { ar: 'الشرطي الماضي', en: 'Would have' },
      name: { ar: 'الشرطي الماضي', en: 'Past conditional' },
      use: { ar: 'لما كان سيحصل ولم يحصل', en: 'what would have happened' },
    },
    cong: {
      it: 'Congiuntivo presente', time: 'present', freq: 2, icon: '🤔',
      short: { ar: 'الرأي والشك', en: 'Opinion' },
      name: { ar: 'صيغة الشك (المضارع)', en: 'Present subjunctive' },
      use: { ar: 'بعد أفعال الرأي والأمل والرغبة', en: 'after verbs of opinion, hope and wish' },
    },
  };

  const PRONOUN_INFO = {
    io: { it: 'io', ic: '🙋', m: { ar: 'أنا', en: 'I' } },
    tu: { it: 'tu', ic: '👉', m: { ar: 'أنتَ', en: 'you' } },
    lui: { it: 'lui', ic: '👨', m: { ar: 'هو', en: 'he' } },
    lei: { it: 'lei', ic: '👩', m: { ar: 'هي', en: 'she' } },
    noi: { it: 'noi', ic: '👥', m: { ar: 'نحن', en: 'we' } },
    voi: { it: 'voi', ic: '🫵', m: { ar: 'أنتم', en: 'you all' } },
    loro: { it: 'loro', ic: '👨‍👩‍👧', m: { ar: 'هم', en: 'they' } },
  };

  const VERBS = {
    mangiare: { ar: 'يأكل', en: 'to eat', ic: '🍽️' },
    bere: { ar: 'يشرب', en: 'to drink', ic: '🥤' },
    parlare: { ar: 'يتكلّم', en: 'to speak', ic: '🗣️' },
    comprare: { ar: 'يشتري', en: 'to buy', ic: '🛒' },
    studiare: { ar: 'يدرس', en: 'to study', ic: '📚' },
    guardare: { ar: 'يشاهد', en: 'to watch', ic: '👀' },
    leggere: { ar: 'يقرأ', en: 'to read', ic: '📖' },
    scrivere: { ar: 'يكتب', en: 'to write', ic: '✍️' },
    cucinare: { ar: 'يطبخ', en: 'to cook', ic: '👨‍🍳' },
    ascoltare: { ar: 'يستمع', en: 'to listen', ic: '🎧' },
    prendere: { ar: 'يأخذ / يركب', en: 'to take', ic: '🤲' },
    vedere: { ar: 'يرى', en: 'to see', ic: '👁️' },
    andare: { ar: 'يذهب', en: 'to go', ic: '🚶' },
    arrivare: { ar: 'يصل', en: 'to arrive', ic: '📍' },
    partire: { ar: 'يغادر / يسافر', en: 'to leave', ic: '🧳' },
    tornare: { ar: 'يعود', en: 'to come back', ic: '↩️' },
    lavorare: { ar: 'يعمل', en: 'to work', ic: '💼' },
    capire: { ar: 'يفهم', en: 'to understand', ic: '💡' },
    nuotare: { ar: 'يسبح', en: 'to swim', ic: '🏊' },
    finire: { ar: 'يُنهي', en: 'to finish', ic: '🏁' },
    uscire: { ar: 'يخرج', en: 'to go out', ic: '🚪' },
    guadagnare: { ar: 'يكسب', en: 'to earn', ic: '💶' },
    fare: { ar: 'يفعل / يعمل', en: 'to do / make', ic: '🛠️' },
    giocare: { ar: 'يلعب', en: 'to play', ic: '⚽' },
    essere: { ar: 'يكون', en: 'to be', ic: '🟰' },
    avere: { ar: 'عنده / يملك', en: 'to have', ic: '🤲' },
    rimanere: { ar: 'يبقى', en: 'to stay', ic: '🏠' },
    volere: { ar: 'يريد', en: 'to want', ic: '🙏' },
    vivere: { ar: 'يعيش', en: 'to live', ic: '🏡' },
    chiamare: { ar: 'يتصل', en: 'to call', ic: '📞' },
    piovere: { ar: 'تمطر', en: 'to rain', ic: '🌧️' },
    passare: { ar: 'ينجح (في)', en: 'to pass', ic: '🎓' },
    visitare: { ar: 'يزور', en: 'to visit', ic: '🖼️' },
    conoscere: { ar: 'يتعرّف / يعرف', en: 'to know / meet', ic: '🤝' },
    dovere: { ar: 'يجب عليه', en: 'must / have to', ic: '❗' },
    potere: { ar: 'يستطيع', en: 'can', ic: '💪' },
    imparare: { ar: 'يتعلّم', en: 'to learn', ic: '🧠' },
    dormire: { ar: 'ينام', en: 'to sleep', ic: '😴' },
    sapere: { ar: 'يعرف', en: 'to know', ic: '✅' },
    pensare: { ar: 'يظن', en: 'to think', ic: '🤔' },
    sperare: { ar: 'يأمل', en: 'to hope', ic: '🤞' },
    venire: { ar: 'يأتي', en: 'to come', ic: '👋' },
    dire: { ar: 'يقول', en: 'to say', ic: '🗣️' },
  };

  return { TENSES, PRONOUN_INFO, VERBS, speechLang: 'it-IT', name: { ar: 'الإيطالية', en: 'Italian', it: 'Italiano' }, flag: '🇮🇹' };
});
