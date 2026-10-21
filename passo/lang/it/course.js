/*
 * Passo a Passo — Italian course (A1 → C1).
 * Each lesson shows the same sentence in several tenses ("rows") side by side.
 * Sentences are lists of segments (subject, verb, object …); verbs are conjugated
 * by the engine for each row, so authors only write the infinitive.
 * Glosses (g) are aligned with the lesson's rows.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ItCourse = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const subj = (p, x) => Object.assign({ r: 'subj', p }, x);
  const verb = (v, x) => Object.assign({ r: 'verb', v }, x);
  const w = (r, it, ar, en, ic, x) => Object.assign({ r, it, ic, m: { ar, en } }, x);
  const obj = (it, ar, en, ic, x) => w('obj', it, ar, en, ic, x);
  const comp = (it, ar, en, ic, x) => w('comp', it, ar, en, ic, x);
  const conj = (it, ar, en, x) => w('conj', it, ar, en, '🔗', x);
  const NON = w('neg', 'non', 'لا / لم / لن', 'not', '🚫');
  const byRow = (rows, values) => rows.reduce((o, k, i) => ((o[k] = values[i]), o), {});
  const time = (rows, it, ar, en, ic) => ({
    r: 'time', it: byRow(rows, it), ic: byRow(rows, ic || it.map(() => '🕒')),
    m: byRow(rows, ar.map((a, i) => ({ ar: a, en: en[i] }))),
  });

  const TRIO = ['pp', 'pres', 'fut'];
  const PROG = ['prog_past', 'prog_pres', 'prog_fut'];
  const PERFECT = ['trap', 'pp', 'fant'];
  const DAYS = time(TRIO, ['ieri', 'oggi', 'domani'], ['أمس', 'اليوم', 'غدًا'], ['yesterday', 'today', 'tomorrow'], ['⏪', '📅', '⏩']);

  const units = [
    {
      id: 'u0', level: 'A0',
      title: { ar: 'الخريطة الكاملة', en: 'The big picture' },
      desc: { ar: 'تصوّر عام لأزمنة وتراكيب الإيطالية قبل أن نبدأ', en: 'An overview of Italian tenses and structures before we start' },
      lessons: [
        { id: 'overview', type: 'overview', title: { ar: 'خريطة الأزمنة والتراكيب', en: 'Map of tenses & structures' },
          goal: { ar: 'نتعرّف على الأزمنة الأكثر استعمالًا، وكيف نبني الجملة.', en: 'Meet the most used tenses and how a sentence is built.' } },
      ],
    },
    {
      id: 'u1', level: 'A1',
      title: { ar: 'الثلاثي البسيط: ماضٍ • حاضر • مستقبل', en: 'The simple trio: past • present • future' },
      desc: { ar: 'جمل بسيطة: فاعل + فعل + مفعول به', en: 'Simple sentences: subject + verb + object' },
      lessons: [
        {
          id: 'u1l0', rows: TRIO,
          title: { ar: 'أهم فعلين: essere و avere', en: 'The two key verbs: essere & avere' },
          goal: { ar: '«essere» يعني «يكون» و«avere» يعني «عنده». هذولي أكثر فعلين تسمعهم في إيطاليا.', en: '“Essere” means “to be” and “avere” means “to have” — the two verbs you will hear most in Italy.' },
          sentences: [
            { segs: [subj('tu'), verb('essere'), comp('in Italia', 'في إيطاليا', 'in Italy', '🇮🇹')],
              g: { ar: ['كنتَ في إيطاليا', 'أنتَ في إيطاليا', 'ستكون في إيطاليا'], en: ['You have been in Italy', 'You are in Italy', 'You will be in Italy'] } },
            { segs: [subj('lei'), verb('avere'), obj('un cane', 'كلب', 'a dog', '🐶')],
              g: { ar: ['كان عندها كلب', 'عندها كلب', 'سيكون عندها كلب'], en: ['She has had a dog', 'She has a dog', 'She will have a dog'] } },
            { segs: [subj('noi'), verb('essere'), comp('a casa', 'في البيت', 'at home', '🏠'), DAYS],
              g: { ar: ['كنّا في البيت أمس', 'نحن في البيت اليوم', 'سنكون في البيت غدًا'], en: ['We were at home yesterday', 'We are at home today', 'We will be at home tomorrow'] } },
            { segs: [subj('loro'), verb('avere'), obj('una macchina', 'سيارة', 'a car', '🚗')],
              g: { ar: ['كان عندهم سيارة', 'عندهم سيارة', 'سيكون عندهم سيارة'], en: ['They have had a car', 'They have a car', 'They will have a car'] } },
          ],
        },
        {
          id: 'u1l1', rows: TRIO,
          title: { ar: 'أنا: أول جملة', en: '“I”: your first sentence' },
          goal: { ar: 'نبني جملًا مع «io» يعني «أنا» في الماضي والحاضر والمستقبل.', en: 'We build sentences with “io” — “I” — in the past, present and future.' },
          sentences: [
            { segs: [subj('io'), verb('mangiare'), obj('una mela', 'تفاحة', 'an apple', '🍎')],
              g: { ar: ['أكلتُ تفاحة', 'آكلُ تفاحة', 'سآكلُ تفاحة'], en: ['I ate an apple', 'I eat an apple', 'I will eat an apple'] } },
            { segs: [subj('io'), verb('bere'), obj('un caffè', 'قهوة', 'a coffee', '☕')],
              g: { ar: ['شربتُ قهوة', 'أشربُ قهوة', 'سأشربُ قهوة'], en: ['I drank a coffee', 'I drink a coffee', 'I will drink a coffee'] } },
            { segs: [subj('io'), verb('parlare'), obj('italiano', 'الإيطالية', 'Italian', '🇮🇹')],
              g: { ar: ['تكلّمتُ الإيطالية', 'أتكلّمُ الإيطالية', 'سأتكلّمُ الإيطالية'], en: ['I spoke Italian', 'I speak Italian', 'I will speak Italian'] } },
            { segs: [subj('io'), verb('comprare'), obj('il pane', 'الخبز', 'the bread', '🍞')],
              g: { ar: ['اشتريتُ الخبز', 'أشتري الخبز', 'سأشتري الخبز'], en: ['I bought the bread', 'I buy the bread', 'I will buy the bread'] } },
          ],
        },
        {
          id: 'u1l2', rows: TRIO,
          title: { ar: 'أنتَ، هو، هي', en: 'You, he, she' },
          goal: { ar: 'نغيّر الفاعل ونرى كيف تتغيّر نهاية الفعل.', en: 'We change the subject and watch the verb ending change.' },
          sentences: [
            { segs: [subj('tu'), verb('studiare'), obj("l'italiano", 'الإيطالية', 'Italian', '📚')],
              g: { ar: ['درستَ الإيطالية', 'تدرسُ الإيطالية', 'ستدرسُ الإيطالية'], en: ['You studied Italian', 'You study Italian', 'You will study Italian'] } },
            { segs: [subj('lui'), verb('guardare'), obj('un film', 'فيلمًا', 'a film', '🎬')],
              g: { ar: ['شاهدَ فيلمًا', 'يشاهدُ فيلمًا', 'سيشاهدُ فيلمًا'], en: ['He watched a film', 'He watches a film', 'He will watch a film'] } },
            { segs: [subj('lei'), verb('leggere'), obj('un libro', 'كتابًا', 'a book', '📖')],
              g: { ar: ['قرأتْ كتابًا', 'تقرأُ كتابًا', 'ستقرأُ كتابًا'], en: ['She read a book', 'She reads a book', 'She will read a book'] } },
            { segs: [subj('tu'), verb('scrivere'), obj('una lettera', 'رسالة', 'a letter', '✉️')],
              g: { ar: ['كتبتَ رسالة', 'تكتبُ رسالة', 'ستكتبُ رسالة'], en: ['You wrote a letter', 'You write a letter', 'You will write a letter'] } },
          ],
        },
        {
          id: 'u1l3', rows: TRIO,
          title: { ar: 'نحن، أنتم، هم', en: 'We, you all, they' },
          goal: { ar: 'نكمل الضمائر بصيغة الجمع.', en: 'We complete the plural pronouns.' },
          sentences: [
            { segs: [subj('noi'), verb('cucinare'), obj('la pasta', 'المعكرونة', 'pasta', '🍝')],
              g: { ar: ['طبخنا المعكرونة', 'نطبخُ المعكرونة', 'سنطبخُ المعكرونة'], en: ['We cooked pasta', 'We cook pasta', 'We will cook pasta'] } },
            { segs: [subj('voi'), verb('ascoltare'), obj('la musica', 'الموسيقى', 'music', '🎵')],
              g: { ar: ['استمعتم إلى الموسيقى', 'تستمعون إلى الموسيقى', 'ستستمعون إلى الموسيقى'], en: ['You all listened to music', 'You all listen to music', 'You all will listen to music'] } },
            { segs: [subj('loro'), verb('prendere'), obj('il treno', 'القطار', 'the train', '🚆')],
              g: { ar: ['ركبوا القطار', 'يركبون القطار', 'سيركبون القطار'], en: ['They took the train', 'They take the train', 'They will take the train'] } },
            { segs: [subj('noi'), verb('vedere'), obj('gli amici', 'الأصدقاء', 'our friends', '👫')],
              g: { ar: ['رأينا الأصدقاء', 'نرى الأصدقاء', 'سنرى الأصدقاء'], en: ['We saw our friends', 'We see our friends', 'We will see our friends'] } },
          ],
        },
        {
          id: 'u1l4', rows: TRIO,
          title: { ar: 'أفعال الحركة مع essere', en: 'Motion verbs with essere' },
          goal: { ar: 'بعض الأفعال تستخدم «essere» في الماضي، ونهايتها تتبع الفاعل.', en: 'Some verbs use “essere” in the past, and their ending follows the subject.' },
          sentences: [
            { segs: [subj('io'), verb('andare'), comp('a Roma', 'إلى روما', 'to Rome', '🏛️'), DAYS],
              g: { ar: ['ذهبتُ إلى روما أمس', 'أذهبُ إلى روما اليوم', 'سأذهبُ إلى روما غدًا'], en: ['I went to Rome yesterday', 'I go to Rome today', 'I will go to Rome tomorrow'] } },
            { segs: [subj('lei'), verb('arrivare'), comp('a casa', 'إلى البيت', 'home', '🏠'), DAYS],
              g: { ar: ['وصلتْ إلى البيت أمس', 'تصلُ إلى البيت اليوم', 'ستصلُ إلى البيت غدًا'], en: ['She arrived home yesterday', 'She arrives home today', 'She will arrive home tomorrow'] } },
            { segs: [subj('noi'), verb('partire'), comp('per Milano', 'إلى ميلانو', 'for Milan', '🚄')],
              g: { ar: ['سافرنا إلى ميلانو', 'نسافرُ إلى ميلانو', 'سنسافرُ إلى ميلانو'], en: ['We left for Milan', 'We leave for Milan', 'We will leave for Milan'] } },
            { segs: [subj('loro'), verb('tornare'), comp("dall'Italia", 'من إيطاليا', 'from Italy', '✈️')],
              g: { ar: ['عادوا من إيطاليا', 'يعودون من إيطاليا', 'سيعودون من إيطاليا'], en: ['They came back from Italy', 'They come back from Italy', 'They will come back from Italy'] } },
          ],
        },
        {
          id: 'u1l5', rows: TRIO,
          title: { ar: 'تركيب النفي: non', en: 'Structure: negation with non' },
          goal: { ar: 'نضع «non» قبل الفعل فنحوّل الجملة إلى نفي.', en: 'We put “non” before the verb to make the sentence negative.' },
          sentences: [
            { segs: [subj('io'), NON, verb('mangiare'), obj('la carne', 'اللحم', 'meat', '🥩')],
              g: { ar: ['لم آكل اللحم', 'لا آكلُ اللحم', 'لن آكلَ اللحم'], en: ["I didn't eat meat", "I don't eat meat", "I won't eat meat"] } },
            { segs: [subj('lui'), NON, verb('lavorare'), DAYS],
              g: { ar: ['لم يعمل أمس', 'لا يعملُ اليوم', 'لن يعملَ غدًا'], en: ["He didn't work yesterday", "He doesn't work today", "He won't work tomorrow"] } },
            { segs: [subj('noi'), NON, verb('capire'), obj('la domanda', 'السؤال', 'the question', '❓')],
              g: { ar: ['لم نفهم السؤال', 'لا نفهمُ السؤال', 'لن نفهمَ السؤال'], en: ["We didn't understand the question", "We don't understand the question", "We won't understand the question"] } },
          ],
        },
        {
          id: 'u1l6', rows: TRIO,
          title: { ar: 'تركيب السؤال', en: 'Structure: questions' },
          goal: { ar: 'نسأل بأدوات الاستفهام، ونحذف الفاعل لأن نهاية الفعل تكفي.', en: 'We ask with question words and drop the subject — the verb ending is enough.' },
          sentences: [
            { end: '?', segs: [w('qw', 'cosa', 'ماذا', 'what', '❔'), verb('mangiare', { p: 'tu' })],
              g: { ar: ['ماذا أكلتَ؟', 'ماذا تأكل؟', 'ماذا ستأكل؟'], en: ['What did you eat?', 'What do you eat?', 'What will you eat?'] } },
            { end: '?', segs: [w('qw', 'dove', 'أين / إلى أين', 'where', '🗺️'), verb('andare', { p: 'tu' })],
              g: { ar: ['إلى أين ذهبتَ؟', 'إلى أين تذهب؟', 'إلى أين ستذهب؟'], en: ['Where did you go?', 'Where do you go?', 'Where will you go?'] } },
            { end: '?', segs: [w('qw', 'quando', 'متى', 'when', '⏰'), verb('arrivare', { p: 'voi' })],
              g: { ar: ['متى وصلتم؟', 'متى تصلون؟', 'متى ستصلون؟'], en: ['When did you all arrive?', 'When do you all arrive?', 'When will you all arrive?'] } },
            { end: '?', segs: [verb('parlare', { p: 'tu' }), obj('inglese', 'الإنجليزية', 'English', '🇬🇧')],
              note: { ar: 'سؤال نعم/لا: نفس ترتيب الجملة، فقط نرفع نبرة الصوت في النهاية.', en: 'A yes/no question keeps the same word order — only the voice rises at the end.' },
              g: { ar: ['هل تكلّمتَ الإنجليزية؟', 'هل تتكلّمُ الإنجليزية؟', 'هل ستتكلّمُ الإنجليزية؟'], en: ['Did you speak English?', 'Do you speak English?', 'Will you speak English?'] } },
          ],
        },
        {
          id: 'u1l7', rows: TRIO,
          title: { ar: 'أفعال كل يوم: fare • venire • dire', en: 'Everyday verbs: fare • venire • dire' },
          goal: { ar: 'أفعال شاذة لكنها في كل جملة تقريبًا. نحفظها بالتكرار.', en: 'Irregular verbs that show up in almost every sentence. We learn them by repetition.' },
          sentences: [
            { segs: [subj('io'), verb('fare'), obj('colazione', 'الفطور', 'breakfast', '🥐'), DAYS],
              g: { ar: ['فطرتُ أمس', 'أفطرُ اليوم', 'سأفطرُ غدًا'], en: ['I had breakfast yesterday', 'I have breakfast today', 'I will have breakfast tomorrow'] } },
            { segs: [subj('tu'), verb('venire'), comp('con me', 'معي', 'with me', '🤝')],
              g: { ar: ['جئتَ معي', 'تجي معي', 'ستجي معي'], en: ['You came with me', 'You come with me', 'You will come with me'] } },
            { segs: [subj('loro'), verb('fare'), obj('la spesa', 'المقاضي', 'the shopping', '🛒')],
              g: { ar: ['اشتروا المقاضي', 'يشترون المقاضي', 'سيشترون المقاضي'], en: ['They did the shopping', 'They do the shopping', 'They will do the shopping'] } },
            { segs: [subj('lui'), verb('dire'), obj('la verità', 'الحقيقة', 'the truth', '💬')],
              g: { ar: ['قال الحقيقة', 'يقول الحقيقة', 'سيقول الحقيقة'], en: ['He told the truth', 'He tells the truth', 'He will tell the truth'] } },
          ],
        },
      ],
    },
    {
      id: 'u2', level: 'A2',
      title: { ar: 'الجمل المركّبة: e • ma • o', en: 'Compound sentences: e • ma • o' },
      desc: { ar: 'نربط جملتين بسيطتين بأداة ربط', en: 'Join two simple sentences with a connector' },
      lessons: [
        {
          id: 'u2l1', rows: TRIO,
          title: { ar: 'و / لكن: e • ma', en: 'And / but: e • ma' },
          goal: { ar: 'نربط جملتين بـ «e» يعني «و» و«ma» يعني «لكن».', en: 'We join two sentences with “e” (and) and “ma” (but).' },
          sentences: [
            { segs: [subj('io'), verb('mangiare'), obj('la pizza', 'البيتزا', 'pizza', '🍕'), conj('e', 'و', 'and'), subj('tu'), verb('bere'), obj("l'acqua", 'الماء', 'water', '💧')],
              g: { ar: ['أكلتُ البيتزا وأنتَ شربتَ الماء', 'آكلُ البيتزا وأنتَ تشربُ الماء', 'سآكلُ البيتزا وأنتَ ستشربُ الماء'],
                en: ['I ate pizza and you drank water', 'I eat pizza and you drink water', 'I will eat pizza and you will drink water'] } },
            { segs: [subj('lui'), verb('studiare'), comp('molto', 'كثيرًا', 'a lot', '📚'), conj('ma', 'لكن', 'but'), NON, verb('capire'), obj('la lezione', 'الدرس', 'the lesson', '🧩')],
              note: { ar: 'في الجملة الثانية لم نكرّر «lui»؛ نهاية الفعل تكفي.', en: 'In the second clause we did not repeat “lui” — the verb ending is enough.' },
              g: { ar: ['درسَ كثيرًا لكنه لم يفهم الدرس', 'يدرسُ كثيرًا لكنه لا يفهم الدرس', 'سيدرسُ كثيرًا لكنه لن يفهم الدرس'],
                en: ["He studied a lot but didn't understand the lesson", "He studies a lot but doesn't understand the lesson", "He will study a lot but won't understand the lesson"] } },
            { segs: [subj('noi'), verb('andare'), comp('al mare', 'إلى البحر', 'to the sea', '🏖️'), conj('e', 'و', 'and'), verb('nuotare')],
              g: { ar: ['ذهبنا إلى البحر وسبحنا', 'نذهبُ إلى البحر ونسبح', 'سنذهبُ إلى البحر وسنسبح'],
                en: ['We went to the sea and swam', 'We go to the sea and swim', 'We will go to the sea and swim'] } },
            { segs: [subj('lei'), verb('parlare'), obj('italiano', 'الإيطالية', 'Italian', '🇮🇹'), conj('ma', 'لكن', 'but'), NON, verb('parlare'), obj('inglese', 'الإنجليزية', 'English', '🇬🇧')],
              g: { ar: ['تكلّمتْ الإيطالية لكنها لم تتكلّم الإنجليزية', 'تتكلّمُ الإيطالية لكنها لا تتكلّم الإنجليزية', 'ستتكلّمُ الإيطالية لكنها لن تتكلّم الإنجليزية'],
                en: ["She spoke Italian but didn't speak English", "She speaks Italian but doesn't speak English", "She will speak Italian but won't speak English"] } },
          ],
        },
        {
          id: 'u2l2', rows: TRIO,
          title: { ar: 'أو / لذلك: o • quindi', en: 'Or / so: o • quindi' },
          goal: { ar: 'نختار بـ «o» ونستنتج بـ «quindi».', en: 'We choose with “o” and conclude with “quindi”.' },
          sentences: [
            { end: '?', segs: [subj('tu'), verb('prendere'), obj('il treno', 'القطار', 'the train', '🚆'), conj('o', 'أو', 'or'), obj("l'autobus", 'الحافلة', 'the bus', '🚌')],
              g: { ar: ['هل ركبتَ القطار أم الحافلة؟', 'هل تركبُ القطار أم الحافلة؟', 'هل ستركبُ القطار أم الحافلة؟'],
                en: ['Did you take the train or the bus?', 'Do you take the train or the bus?', 'Will you take the train or the bus?'] } },
            { segs: [subj('io'), verb('finire'), obj('il lavoro', 'العمل', 'work', '💼', { post: ',' }), conj('quindi', 'لذلك', 'so'), verb('uscire')],
              g: { ar: ['أنهيتُ العمل، لذلك خرجتُ', 'أُنهي العمل، لذلك أخرج', 'سأُنهي العمل، لذلك سأخرج'],
                en: ['I finished work, so I went out', 'I finish work, so I go out', 'I will finish work, so I will go out'] } },
            { segs: [subj('loro'), verb('lavorare'), comp('molto', 'كثيرًا', 'a lot', '💪'), conj('ma', 'لكن', 'but'), verb('guadagnare'), comp('poco', 'قليلًا', 'little', '🪙')],
              g: { ar: ['عملوا كثيرًا لكنهم كسبوا قليلًا', 'يعملون كثيرًا لكنهم يكسبون قليلًا', 'سيعملون كثيرًا لكنهم سيكسبون قليلًا'],
                en: ['They worked a lot but earned little', 'They work a lot but earn little', 'They will work a lot but earn little'] } },
          ],
        },
      ],
    },
    {
      id: 'u3', level: 'A2',
      title: { ar: 'الثلاثي المستمر و Imperfetto', en: 'The continuous trio & the imperfetto' },
      desc: { ar: 'كنتُ أفعل • أفعل الآن • سأكون أفعل، ثم العادة في الماضي', en: 'Was doing • doing now • will be doing, then past habits' },
      lessons: [
        {
          id: 'u3l1', rows: PROG,
          title: { ar: 'الآن بالضبط: stare + gerundio', en: 'Right now: stare + gerundio' },
          goal: { ar: 'نصف حدثًا جاريًا: الفعل stare مع صيغة ‎-ando / -endo.', en: 'We describe an ongoing action: stare + the -ando / -endo form.' },
          sentences: [
            { segs: [subj('io'), verb('mangiare'), obj('una pizza', 'بيتزا', 'a pizza', '🍕')],
              g: { ar: ['كنتُ آكلُ بيتزا', 'أنا آكلُ بيتزا الآن', 'سأكونُ آكلًا بيتزا'], en: ['I was eating a pizza', 'I am eating a pizza', 'I will be eating a pizza'] } },
            { segs: [subj('tu'), verb('leggere'), obj('il giornale', 'الجريدة', 'the newspaper', '📰')],
              g: { ar: ['كنتَ تقرأُ الجريدة', 'أنتَ تقرأُ الجريدة الآن', 'ستكونُ تقرأُ الجريدة'], en: ['You were reading the newspaper', 'You are reading the newspaper', 'You will be reading the newspaper'] } },
            { segs: [subj('loro'), verb('guardare'), obj('la TV', 'التلفاز', 'TV', '📺')],
              g: { ar: ['كانوا يشاهدون التلفاز', 'يشاهدون التلفاز الآن', 'سيكونون يشاهدون التلفاز'], en: ['They were watching TV', 'They are watching TV', 'They will be watching TV'] } },
            { segs: [subj('noi'), verb('fare'), obj('i compiti', 'الواجبات', 'homework', '📝')],
              g: { ar: ['كنّا نحلّ الواجبات', 'نحلّ الواجبات الآن', 'سنكونُ نحلّ الواجبات'], en: ['We were doing homework', 'We are doing homework', 'We will be doing homework'] } },
          ],
        },
        {
          id: 'u3l2', rows: ['imp', 'pp'],
          title: { ar: 'عادة أم مرة واحدة؟ Imperfetto ضد Passato prossimo', en: 'Habit or once? Imperfetto vs passato prossimo' },
          goal: { ar: 'نقارن بين العادة في الماضي والحدث الذي حصل مرة واحدة.', en: 'We compare a past habit with something that happened once.' },
          sentences: [
            { segs: [time(['imp', 'pp'], ['da bambino', 'ieri'], ['في صغري', 'أمس'], ['as a child', 'yesterday'], ['🧒', '⏪']), subj('io'), verb('giocare'), comp('a calcio', 'كرة القدم', 'football', '⚽')],
              g: { ar: ['في صغري كنتُ ألعبُ كرة القدم', 'أمس لعبتُ كرة القدم'], en: ['As a child I used to play football', 'Yesterday I played football'] } },
            { segs: [time(['imp', 'pp'], ['ogni estate', "l'estate scorsa"], ['كل صيف', 'الصيف الماضي'], ['every summer', 'last summer'], ['🔁', '☀️']), subj('noi'), verb('andare'), comp('al mare', 'إلى البحر', 'to the sea', '🏖️')],
              g: { ar: ['كل صيف كنّا نذهبُ إلى البحر', 'الصيف الماضي ذهبنا إلى البحر'], en: ['Every summer we used to go to the sea', 'Last summer we went to the sea'] } },
            { segs: [time(['imp', 'pp'], ['ogni giorno', 'stamattina'], ['كل يوم', 'هذا الصباح'], ['every day', 'this morning'], ['📆', '🌅']), subj('lei'), verb('bere'), obj('un tè', 'شايًا', 'a tea', '🍵')],
              g: { ar: ['كل يوم كانت تشربُ شايًا', 'هذا الصباح شربتْ شايًا'], en: ['Every day she used to drink a tea', 'This morning she drank a tea'] } },
          ],
        },
      ],
    },
    {
      id: 'u4', level: 'B1',
      title: { ar: 'الجمل المعقّدة: perché • quando • se • che', en: 'Complex sentences: perché • quando • se • che' },
      desc: { ar: 'جملة رئيسية + جملة تابعة', en: 'A main clause + a subordinate clause' },
      lessons: [
        {
          id: 'u4l1', rows: TRIO,
          title: { ar: 'السبب: perché', en: 'Reason: perché' },
          goal: { ar: 'نشرح السبب بـ «perché» يعني «لأن». في الماضي نصف الحالة بـ imperfetto.', en: 'We give a reason with “perché” (because). In the past, the state uses the imperfetto.' },
          sentences: [
            { segs: [subj('io'), verb('mangiare'), comp('molto', 'كثيرًا', 'a lot', '🍽️'), conj('perché', 'لأن', 'because'), verb('avere', { tmap: { pp: 'imp' } }), obj('fame', 'جوع', 'hunger', '😋')],
              note: { ar: '«ho fame» حرفيًا: «عندي جوع» — هكذا يقول الإيطاليون «أنا جائع».', en: '“Ho fame” is literally “I have hunger” — that is how Italians say “I am hungry”.' },
              g: { ar: ['أكلتُ كثيرًا لأنني كنتُ جائعًا', 'آكلُ كثيرًا لأنني جائع', 'سآكلُ كثيرًا لأنني سأكون جائعًا'], en: ['I ate a lot because I was hungry', 'I eat a lot because I am hungry', 'I will eat a lot because I will be hungry'] } },
            { segs: [subj('lei'), verb('rimanere'), comp('a casa', 'في البيت', 'at home', '🏠'), conj('perché', 'لأن', 'because'), verb('essere', { tmap: { pp: 'imp' } }), comp('malata', 'مريضة', 'ill', '🤒')],
              g: { ar: ['بقيتْ في البيت لأنها كانت مريضة', 'تبقى في البيت لأنها مريضة', 'ستبقى في البيت لأنها ستكون مريضة'], en: ['She stayed at home because she was ill', 'She stays at home because she is ill', 'She will stay at home because she will be ill'] } },
            { segs: [subj('noi'), verb('studiare'), obj("l'italiano", 'الإيطالية', 'Italian', '📚'), conj('perché', 'لأن', 'because'), verb('volere', { tmap: { pp: 'imp' } }), w('inf', 'vivere', 'أن نعيش', 'to live', '🏡'), comp('a Roma', 'في روما', 'in Rome', '🏛️')],
              g: { ar: ['درسنا الإيطالية لأننا كنا نريد أن نعيش في روما', 'ندرسُ الإيطالية لأننا نريد أن نعيش في روما', 'سندرسُ الإيطالية لأننا سنريد أن نعيش في روما'], en: ['We studied Italian because we wanted to live in Rome', 'We study Italian because we want to live in Rome', 'We will study Italian because we will want to live in Rome'] } },
          ],
        },
        {
          id: 'u4l2', rows: TRIO,
          title: { ar: 'الوقت: quando', en: 'Time: quando' },
          goal: { ar: '«quando» يعني «عندما». في المستقبل نستخدم المستقبل في الجملتين.', en: '“Quando” means “when”. For the future, Italian uses the future in both clauses.' },
          sentences: [
            { segs: [conj('quando', 'عندما', 'when'), subj('io'), verb('arrivare'), comp('a casa', 'إلى البيت', 'home', '🏠', { post: ',' }), verb('chiamare'), obj('mia madre', 'أمي', 'my mother', '👩‍🦳')],
              g: { ar: ['عندما وصلتُ إلى البيت اتصلتُ بأمي', 'عندما أصلُ إلى البيت أتصلُ بأمي', 'عندما سأصلُ إلى البيت سأتصلُ بأمي'], en: ['When I arrived home, I called my mother', 'When I arrive home, I call my mother', 'When I arrive home, I will call my mother'] } },
            { segs: [conj('quando', 'عندما', 'when'), subj('lui'), verb('finire'), obj('il lavoro', 'العمل', 'work', '💼', { post: ',' }), verb('andare'), comp('in palestra', 'إلى النادي', 'to the gym', '🏋️')],
              g: { ar: ['عندما أنهى العمل ذهبَ إلى النادي', 'عندما يُنهي العمل يذهبُ إلى النادي', 'عندما سيُنهي العمل سيذهبُ إلى النادي'], en: ['When he finished work, he went to the gym', 'When he finishes work, he goes to the gym', 'When he finishes work, he will go to the gym'] } },
            { segs: [conj('quando', 'عندما', 'when'), subj('noi'), verb('vedere'), obj('Roma', 'روما', 'Rome', '🏛️', { post: ',' }), verb('essere', { tmap: { pp: 'imp' } }), comp('felici', 'سعداء', 'happy', '😊')],
              g: { ar: ['عندما رأينا روما كنّا سعداء', 'عندما نرى روما نكون سعداء', 'عندما سنرى روما سنكون سعداء'], en: ['When we saw Rome, we were happy', 'When we see Rome, we are happy', 'When we see Rome, we will be happy'] } },
          ],
        },
        {
          id: 'u4l3', rows: ['pres', 'fut'],
          title: { ar: 'الشرط الواقعي: se', en: 'Real condition: se' },
          goal: { ar: '«se» يعني «إذا». نقارن الحاضر بالمستقبل.', en: '“Se” means “if”. We compare present and future.' },
          sentences: [
            { segs: [conj('se', 'إذا', 'if'), verb('piovere', { p: 'lui', post: ',' }), subj('io'), verb('rimanere'), comp('a casa', 'في البيت', 'at home', '🏠')],
              note: { ar: '«piove» فعل بلا فاعل، مثل «تمطر» بالعربي.', en: '“Piove” has no subject — like “it rains”.' },
              g: { ar: ['إذا أمطرت أبقى في البيت', 'إذا أمطرت سأبقى في البيت'], en: ['If it rains, I stay at home', 'If it rains, I will stay at home'] } },
            { segs: [conj('se', 'إذا', 'if'), subj('tu'), verb('studiare', { post: ',' }), verb('passare'), obj("l'esame", 'الامتحان', 'the exam', '🎓')],
              g: { ar: ['إذا درستَ تنجح في الامتحان', 'إذا درستَ ستنجح في الامتحان'], en: ['If you study, you pass the exam', 'If you study, you will pass the exam'] } },
            { segs: [conj('se', 'إذا', 'if'), verb('avere', { p: 'noi' }), obj('tempo', 'وقت', 'time', '⏳', { post: ',' }), verb('visitare', { p: 'noi' }), obj('il museo', 'المتحف', 'the museum', '🖼️')],
              g: { ar: ['إذا كان عندنا وقت نزور المتحف', 'إذا كان عندنا وقت سنزور المتحف'], en: ['If we have time, we visit the museum', 'If we have time, we will visit the museum'] } },
          ],
        },
        {
          id: 'u4l4', rows: TRIO,
          title: { ar: 'الاسم الموصول: che', en: 'Relative clause: che' },
          goal: { ar: '«che» يعني «الذي / التي»، تصف شيئًا بجملة كاملة.', en: '“Che” means “who / that” — it describes something with a whole clause.' },
          sentences: [
            { segs: [subj('io'), verb('conoscere'), obj('una ragazza', 'فتاة', 'a girl', '👩'), conj('che', 'التي', 'who'), verb('parlare', { p: 'lei', tmap: { pp: 'imp' } }), obj('tre lingue', 'ثلاث لغات', 'three languages', '🌍')],
              g: { ar: ['تعرّفتُ على فتاة تتكلّم ثلاث لغات', 'أعرفُ فتاة تتكلّم ثلاث لغات', 'سأتعرّفُ على فتاة تتكلّم ثلاث لغات'], en: ['I met a girl who spoke three languages', 'I know a girl who speaks three languages', 'I will meet a girl who will speak three languages'] } },
            { segs: [subj('lui'), verb('comprare'), obj('la macchina', 'السيارة', 'the car', '🚗'), conj('che', 'التي', 'that'), verb('volere', { tmap: { pp: 'imp' } })],
              g: { ar: ['اشترى السيارة التي كان يريدها', 'يشتري السيارة التي يريدها', 'سيشتري السيارة التي سيريدها'], en: ['He bought the car that he wanted', 'He buys the car that he wants', 'He will buy the car that he will want'] } },
          ],
        },
      ],
    },
    {
      id: 'u5', level: 'B1',
      title: { ar: 'الثلاثي التام: كان قد • قد • سيكون قد', en: 'The perfect trio: had • have • will have' },
      desc: { ar: 'حدث انتهى قبل لحظة معيّنة', en: 'An action finished before a given moment' },
      lessons: [
        {
          id: 'u5l1', rows: PERFECT,
          title: { ar: 'già: قد انتهى', en: 'Già: already done' },
          goal: { ar: 'نغيّر زمن الفعل المساعد فقط: avevo / ho / avrò + التصريف الماضي.', en: 'Only the helper verb changes: avevo / ho / avrò + past participle.' },
          sentences: [
            { segs: [subj('io'), verb('finire', { mid: 'già' }), obj('il lavoro', 'العمل', 'the work', '💼')],
              note: { ar: '«già» يعني «سابقًا / بالفعل»، ويجلس بين المساعد والتصريف.', en: '“Già” means “already” and sits between the helper and the participle.' },
              g: { ar: ['كنتُ قد أنهيتُ العمل', 'لقد أنهيتُ العمل', 'سأكونُ قد أنهيتُ العمل'], en: ['I had already finished the work', 'I have already finished the work', 'I will have already finished the work'] } },
            { segs: [subj('lei'), verb('partire', { mid: 'già' }), comp('per Parigi', 'إلى باريس', 'for Paris', '🗼')],
              g: { ar: ['كانت قد سافرتْ إلى باريس', 'لقد سافرتْ إلى باريس', 'ستكونُ قد سافرتْ إلى باريس'], en: ['She had already left for Paris', 'She has already left for Paris', 'She will have already left for Paris'] } },
            { segs: [subj('noi'), verb('mangiare'), comp('prima delle otto', 'قبل الثامنة', 'before eight', '🕗')],
              g: { ar: ['كنّا قد أكلنا قبل الثامنة', 'لقد أكلنا قبل الثامنة', 'سنكونُ قد أكلنا قبل الثامنة'], en: ['We had eaten before eight', 'We have eaten before eight', 'We will have eaten before eight'] } },
          ],
        },
      ],
    },
    {
      id: 'u6', level: 'B2',
      title: { ar: 'أفعال القدرة والوجوب، والشرطي', en: 'Modal verbs & the conditional' },
      desc: { ar: 'devo • posso • voglio + مصدر، ثم vorrei / avrei voluto', en: 'devo • posso • voglio + infinitive, then vorrei / avrei voluto' },
      lessons: [
        {
          id: 'u6l1', rows: TRIO,
          title: { ar: 'تركيب: فعل مساعد + مصدر', en: 'Structure: modal + infinitive' },
          goal: { ar: 'نصرّف الفعل الأول فقط، والثاني يبقى في المصدر.', en: 'Only the first verb is conjugated — the second stays in the infinitive.' },
          sentences: [
            { segs: [subj('io'), verb('dovere'), w('inf', 'lavorare', 'أن أعمل', 'to work', '💼'), comp('il sabato', 'يوم السبت', 'on Saturday', '📅')],
              g: { ar: ['اضطررتُ أن أعمل يوم السبت', 'يجب أن أعمل يوم السبت', 'سيجب أن أعمل يوم السبت'], en: ['I had to work on Saturday', 'I have to work on Saturday', 'I will have to work on Saturday'] } },
            { segs: [subj('tu'), verb('potere'), w('inf', 'parlare', 'أن تتكلّم', 'to speak', '🗣️'), comp('con il capo', 'مع المدير', 'with the boss', '👔')],
              g: { ar: ['استطعتَ أن تتكلّم مع المدير', 'تستطيع أن تتكلّم مع المدير', 'ستستطيع أن تتكلّم مع المدير'], en: ['You were able to speak with the boss', 'You can speak with the boss', 'You will be able to speak with the boss'] } },
            { segs: [subj('lei'), verb('volere', { tmap: { pp: 'imp' } }), w('inf', 'imparare', 'أن تتعلّم', 'to learn', '🧠'), obj('lo spagnolo', 'الإسبانية', 'Spanish', '🇪🇸')],
              g: { ar: ['كانت تريد أن تتعلّم الإسبانية', 'تريد أن تتعلّم الإسبانية', 'ستريد أن تتعلّم الإسبانية'], en: ['She wanted to learn Spanish', 'She wants to learn Spanish', 'She will want to learn Spanish'] } },
            { segs: [subj('noi'), verb('dovere', { auxVerb: 'partire' }), w('inf', 'partire', 'أن نسافر', 'to leave', '🧳'), comp('presto', 'مبكرًا', 'early', '🌅')],
              note: { ar: 'مع فعل حركة بعده، المساعد يصير essere: «siamo dovuti partire».', en: 'With a motion verb after it, the helper becomes essere: “siamo dovuti partire”.' },
              g: { ar: ['اضطررنا أن نسافر مبكرًا', 'يجب أن نسافر مبكرًا', 'سيجب أن نسافر مبكرًا'], en: ['We had to leave early', 'We have to leave early', 'We will have to leave early'] } },
          ],
        },
        {
          id: 'u6l2', rows: ['condp', 'cond'],
          title: { ar: 'الشرطي: vorrei • avrei voluto', en: 'The conditional: vorrei • avrei voluto' },
          goal: { ar: 'للطلب المؤدّب والنصيحة والأمنيات.', en: 'For polite requests, advice and wishes.' },
          sentences: [
            { segs: [subj('io'), verb('volere'), obj('un caffè', 'قهوة', 'a coffee', '☕')],
              note: { ar: '«vorrei» أهم كلمة في المقهى والمطعم!', en: '“Vorrei” is the most useful word in any café or restaurant!' },
              g: { ar: ['كنتُ أودّ قهوة', 'أودّ قهوة، من فضلك'], en: ['I would have liked a coffee', 'I would like a coffee'] } },
            { segs: [subj('tu'), verb('dovere'), w('inf', 'dormire', 'أن تنام', 'to sleep', '😴'), comp('di più', 'أكثر', 'more', '➕')],
              g: { ar: ['كان يجب أن تنام أكثر', 'يجب أن تنام أكثر'], en: ['You should have slept more', 'You should sleep more'] } },
            { segs: [subj('noi'), verb('andare'), comp('in Italia', 'إلى إيطاليا', 'to Italy', '🇮🇹', { post: ',' }), conj('ma', 'لكن', 'but'), NON, verb('avere', { tmap: { condp: 'imp', cond: 'pres' } }), obj('soldi', 'مال', 'money', '💶')],
              g: { ar: ['كنّا سنذهب إلى إيطاليا، لكن لم يكن عندنا مال', 'كنّا سنذهب إلى إيطاليا، لكن ليس عندنا مال'], en: ['We would have gone to Italy, but we had no money', "We would go to Italy, but we don't have money"] } },
          ],
        },
      ],
    },
    {
      id: 'u7', level: 'C1',
      title: { ar: 'Congiuntivo والجمل المركّبة المعقّدة', en: 'Congiuntivo & compound-complex sentences' },
      desc: { ar: 'اليقين مقابل الرأي، ثم جمل طويلة مثل المتحدثين الأصليين', en: 'Certainty vs opinion, then long native-like sentences' },
      lessons: [
        {
          id: 'u7l1', rows: ['pres', 'cong'],
          rowLabels: { pres: { ar: 'يقين', en: 'Certainty' }, cong: { ar: 'رأي / أمل', en: 'Opinion / hope' } },
          title: { ar: 'اليقين أم الرأي؟ so che • penso che', en: 'Certain or opinion? so che • penso che' },
          goal: { ar: 'بعد «أعرف أن» نستخدم الحاضر، وبعد «أظن أن / آمل أن» نستخدم congiuntivo.', en: 'After “I know that” we use the present; after “I think / hope that” we use the congiuntivo.' },
          sentences: [
            { segs: [{ r: 'verb', it: { pres: 'so', cong: 'penso' }, ic: { pres: '✅', cong: '🤔' }, m: { pres: { ar: 'أعرف', en: 'I know' }, cong: { ar: 'أظن', en: 'I think' } } }, conj('che', 'أنّ', 'that'), subj('lui'), verb('essere'), comp('a casa', 'في البيت', 'at home', '🏠')],
              g: { ar: ['أعرف أنه في البيت', 'أظن أنه في البيت'], en: ['I know that he is at home', 'I think that he is at home'] } },
            { segs: [{ r: 'verb', it: { pres: 'so', cong: 'spero' }, ic: { pres: '✅', cong: '🤞' }, m: { pres: { ar: 'أعرف', en: 'I know' }, cong: { ar: 'آمل', en: 'I hope' } } }, conj('che', 'أنّ', 'that'), subj('tu'), verb('venire'), DAYS_ONLY_TOMORROW()],
              g: { ar: ['أعرف أنك ستأتي غدًا', 'آمل أن تأتي غدًا'], en: ['I know that you are coming tomorrow', 'I hope that you come tomorrow'] } },
            { segs: [{ r: 'verb', it: { pres: 'vedo', cong: 'voglio' }, ic: { pres: '👁️', cong: '🙏' }, m: { pres: { ar: 'أرى', en: 'I see' }, cong: { ar: 'أريد', en: 'I want' } } }, conj('che', 'أنّ', 'that'), subj('voi'), verb('parlare'), obj('italiano', 'الإيطالية', 'Italian', '🇮🇹')],
              g: { ar: ['أرى أنكم تتكلّمون الإيطالية', 'أريد أن تتكلّموا الإيطالية'], en: ['I see that you all speak Italian', 'I want you all to speak Italian'] } },
            { segs: [{ r: 'verb', it: { pres: 'è certo', cong: 'è possibile' }, ic: { pres: '💯', cong: '🎲' }, m: { pres: { ar: 'من المؤكد', en: 'it is certain' }, cong: { ar: 'من الممكن', en: 'it is possible' } } }, conj('che', 'أنّ', 'that'), subj('loro'), verb('arrivare'), comp('tardi', 'متأخرين', 'late', '⏰')],
              g: { ar: ['من المؤكد أنهم يصلون متأخرين', 'من الممكن أن يصلوا متأخرين'], en: ['It is certain that they arrive late', 'It is possible that they arrive late'] } },
          ],
        },
        {
          id: 'u7l2', rows: TRIO,
          title: { ar: 'الجملة المركّبة المعقّدة', en: 'The compound-complex sentence' },
          goal: { ar: 'نجمع كل شيء: جملة تابعة + جملتان رئيسيتان مربوطتان.', en: 'Everything together: a subordinate clause + two linked main clauses.' },
          sentences: [
            { segs: [conj('quando', 'عندما', 'when'), subj('io'), verb('arrivare'), comp('a casa', 'إلى البيت', 'home', '🏠', { post: ',' }), verb('cucinare'), obj('la cena', 'العشاء', 'dinner', '🍲'), conj('e poi', 'ثم', 'and then'), verb('guardare'), obj('un film', 'فيلمًا', 'a film', '🎬')],
              g: { ar: ['عندما وصلتُ إلى البيت طبختُ العشاء ثم شاهدتُ فيلمًا', 'عندما أصلُ إلى البيت أطبخُ العشاء ثم أشاهدُ فيلمًا', 'عندما سأصلُ إلى البيت سأطبخُ العشاء ثم سأشاهدُ فيلمًا'],
                en: ['When I got home, I cooked dinner and then watched a film', 'When I get home, I cook dinner and then watch a film', 'When I get home, I will cook dinner and then watch a film'] } },
            { segs: [subj('noi'), verb('uscire'), comp('presto', 'مبكرًا', 'early', '🌅'), conj('perché', 'لأن', 'because'), verb('piovere', { p: 'lui', tmap: { pp: 'imp' }, post: ',' }), conj('ma', 'لكن', 'but'), verb('arrivare'), comp('tardi', 'متأخرين', 'late', '⏰')],
              g: { ar: ['خرجنا مبكرًا لأنها كانت تمطر، لكننا وصلنا متأخرين', 'نخرجُ مبكرًا لأنها تمطر، لكننا نصلُ متأخرين', 'سنخرجُ مبكرًا لأنها ستمطر، لكننا سنصلُ متأخرين'],
                en: ['We went out early because it was raining, but we arrived late', 'We go out early because it is raining, but we arrive late', 'We will go out early because it will rain, but we will arrive late'] } },
          ],
        },
      ],
    },
  ];

  function DAYS_ONLY_TOMORROW() {
    return { r: 'time', it: 'domani', ic: '⏩', m: { ar: 'غدًا', en: 'tomorrow' } };
  }

  return { units };
});
