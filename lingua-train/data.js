/* قطار اللغات — البيانات
   كل جملة: فعل + مفعول به + (مكان، سبب، كيفية، مالك) تُستخدم في أسئلة الاستفهام.
   لإضافة جمل جديدة: أضف سطراً في UNITS، ولإضافة فعل جديد: أضفه في VERBS. */
window.LT = window.LT || {};

LT.LANGS = [
  { id: 'en', name: 'English', ar: 'الإنجليزية', flag: '🇬🇧', tts: ['en-US', 'en-GB', 'en'] },
  { id: 'es', name: 'Español', ar: 'الإسبانية', flag: '🇪🇸', tts: ['es-MX', 'es-US', 'es-ES', 'es'] },
  { id: 'fr', name: 'Français', ar: 'الفرنسية', flag: '🇫🇷', tts: ['fr-FR', 'fr-CA', 'fr'] },
  { id: 'it', name: 'Italiano', ar: 'الإيطالية', flag: '🇮🇹', tts: ['it-IT', 'it'] },
  { id: 'pt', name: 'Português', ar: 'البرتغالية البرازيلية', flag: '🇧🇷', tts: ['pt-BR', 'pt-PT', 'pt'] },
  { id: 'de', name: 'Deutsch', ar: 'الألمانية', flag: '🇩🇪', tts: ['de-DE', 'de-AT', 'de'] },
];

/* الضمائر: w = الكلمة، s = خانة التصريف (0 أنا، 1 أنتَ، 2 هو/هي، 3 نحن، 4 أنتم، 5 هم) */
LT.PRON = {
  en: { i: ['I', 0], you: ['you', 1], he: ['he', 2], she: ['she', 2], we: ['we', 3], youpl: ['you', 4], they: ['they', 5] },
  es: { i: ['yo', 0], you: ['tú', 1], he: ['él', 2], she: ['ella', 2], we: ['nosotros', 3], youpl: ['ustedes', 5], they: ['ellos', 5] },
  fr: { i: ['je', 0], you: ['tu', 1], he: ['il', 2], she: ['elle', 2], we: ['nous', 3], youpl: ['vous', 4], they: ['ils', 5] },
  it: { i: ['io', 0], you: ['tu', 1], he: ['lui', 2], she: ['lei', 2], we: ['noi', 3], youpl: ['voi', 4], they: ['loro', 5] },
  pt: { i: ['eu', 0], you: ['você', 2], he: ['ele', 2], she: ['ela', 2], we: ['nós', 3], youpl: ['vocês', 5], they: ['eles', 5] },
  de: { i: ['ich', 0], you: ['du', 1], he: ['er', 2], she: ['sie', 2], we: ['wir', 3], youpl: ['ihr', 4], they: ['sie', 5] },
};
LT.FR_STRESSED = { i: 'Moi', you: 'Toi', he: 'Lui', she: 'Elle', we: 'Nous', youpl: 'Vous', they: 'Eux' };
LT.PRON_AR = { i: 'أنا', you: 'أنتَ', he: 'هو', she: 'هي', we: 'نحن', youpl: 'أنتم', they: 'هم' };
LT.PRON_EMOJI = { i: '🙋', you: '👉', he: '👨', she: '👩', we: '👥', youpl: '🫵', they: '👨‍👩‍👧' };

/* جولات الضمائر: نبدأ بـ«أنا» في كل الجمل، ثم نعود للجملة الأولى بضمير جديد (جرعات) */
LT.ROUNDS = [
  { key: 'i', ar: 'أنا', pr: ['i'] },
  { key: 'you', ar: 'أنتَ', pr: ['you'] },
  { key: 'heshe', ar: 'هو / هي', pr: ['he', 'she'] },
  { key: 'we', ar: 'نحن', pr: ['we'] },
  { key: 'they', ar: 'هم', pr: ['they'] },
];

LT.TENSES = [
  { id: 'past', ar: 'الماضي', icon: '⏪' },
  { id: 'present', ar: 'الحاضر', icon: '▶️' },
  { id: 'future', ar: 'المستقبل', icon: '⏩' },
];

LT.ROWS = [
  { id: 'aff', ar: 'مثبت', icon: '✅' },
  { id: 'neg', ar: 'منفي', icon: '🚫' },
  { id: 'yn', ar: 'سؤال نعم / لا', icon: '❔' },
  { id: 'who', ar: 'مَن؟ الفاعل', icon: '👤' },
  { id: 'what', ar: 'ماذا؟ المفعول به', icon: '📦' },
  { id: 'when', ar: 'متى؟ الزمان', icon: '⏰' },
  { id: 'where', ar: 'أين؟ المكان', icon: '📍' },
  { id: 'why', ar: 'لماذا؟ السبب', icon: '💡' },
  { id: 'how', ar: 'كيف؟ الكيفية', icon: '🛠️' },
  { id: 'whose', ar: 'لِمَن؟ الملكية', icon: '🔑' },
];

LT.ROLES = {
  subj: 'الفاعل', aux: 'فعل مساعد', verb: 'الفعل الرئيسي', obj: 'المفعول به', neg: 'أداة النفي',
  qw: 'أداة الاستفهام', time: 'الزمان', place: 'المكان', reason: 'السبب', manner: 'الكيفية',
  poss: 'المالك', ans: 'الجواب', x: 'رابط',
};

/* كلمات الزمان لكل زمن (ثلاثة بدائل تتناوب بين الجمل) */
LT.TIME = {
  en: [['yesterday', 'last week', 'last night'], ['every day', 'every morning', 'on weekends'], ['tomorrow', 'next week', 'tonight']],
  es: [['ayer', 'la semana pasada', 'anoche'], ['todos los días', 'todas las mañanas', 'los fines de semana'], ['mañana', 'la próxima semana', 'esta noche']],
  fr: [['hier', 'la semaine dernière', 'hier soir'], ['tous les jours', 'tous les matins', 'le week-end'], ['demain', 'la semaine prochaine', 'ce soir']],
  it: [['ieri', 'la settimana scorsa', 'ieri sera'], ['ogni giorno', 'ogni mattina', 'nel fine settimana'], ['domani', 'la settimana prossima', 'stasera']],
  pt: [['ontem', 'na semana passada', 'ontem à noite'], ['todos os dias', 'todas as manhãs', 'nos fins de semana'], ['amanhã', 'na próxima semana', 'hoje à noite']],
  de: [['gestern', 'letzte Woche', 'gestern Abend'], ['jeden Tag', 'jeden Morgen', 'am Wochenende'], ['morgen', 'nächste Woche', 'heute Abend']],
  ar: [['أمس', 'الأسبوع الماضي', 'الليلة الماضية'], ['كل يوم', 'كل صباح', 'في عطلة الأسبوع'], ['غدًا', 'الأسبوع القادم', 'الليلة']],
};
LT.TIME_EMOJI = [['📅', '🗓️', '🌙'], ['🔁', '🌅', '🏖️'], ['🌄', '📆', '🌃']];

/* [en, es, fr, it, pt, de, ar, emoji] */
LT.PLACES = [
  ['at home', 'en casa', 'à la maison', 'a casa', 'em casa', 'zu Hause', 'في البيت', '🏠'],
  ['at school', 'en la escuela', "à l'école", 'a scuola', 'na escola', 'in der Schule', 'في المدرسة', '🏫'],
  ['at work', 'en el trabajo', 'au travail', 'al lavoro', 'no trabalho', 'bei der Arbeit', 'في العمل', '💼'],
  ['in the kitchen', 'en la cocina', 'dans la cuisine', 'in cucina', 'na cozinha', 'in der Küche', 'في المطبخ', '🍳'],
  ['in the park', 'en el parque', 'au parc', 'al parco', 'no parque', 'im Park', 'في المنتزه', '🌳'],
  ['at the café', 'en la cafetería', 'au café', 'al bar', 'no café', 'im Café', 'في المقهى', '☕'],
  ['in the library', 'en la biblioteca', 'à la bibliothèque', 'in biblioteca', 'na biblioteca', 'in der Bibliothek', 'في المكتبة', '📚'],
  ['in the garden', 'en el jardín', 'dans le jardin', 'in giardino', 'no jardim', 'im Garten', 'في الحديقة', '🌷'],
  ['at the market', 'en el mercado', 'au marché', 'al mercato', 'na feira', 'auf dem Markt', 'في السوق', '🛒'],
  ['in the office', 'en la oficina', 'au bureau', 'in ufficio', 'no escritório', 'im Büro', 'في المكتب', '🏢'],
  ['in the city', 'en la ciudad', 'en ville', 'in città', 'na cidade', 'in der Stadt', 'في المدينة', '🏙️'],
  ['at the restaurant', 'en el restaurante', 'au restaurant', 'al ristorante', 'no restaurante', 'im Restaurant', 'في المطعم', '🍽️'],
  ['in the classroom', 'en el salón de clases', 'en classe', 'in classe', 'na sala de aula', 'im Klassenzimmer', 'في الفصل', '🧑‍🏫'],
  ['at the station', 'en la estación', 'à la gare', 'alla stazione', 'na estação', 'am Bahnhof', 'في المحطة', '🚉'],
  ['in the living room', 'en la sala', 'dans le salon', 'in salotto', 'na sala', 'im Wohnzimmer', 'في الصالة', '🛋️'],
  ['at the beach', 'en la playa', 'à la plage', 'al mare', 'na praia', 'am Strand', 'على الشاطئ', '🏖️'],
  ['in the bedroom', 'en la recámara', 'dans la chambre', 'in camera', 'no quarto', 'im Schlafzimmer', 'في غرفة النوم', '🛏️'],
  ['at the supermarket', 'en el supermercado', 'au supermarché', 'al supermercato', 'no supermercado', 'im Supermarkt', 'في السوبرماركت', '🏪'],
];

LT.REASONS = [
  ['for the exam', 'para el examen', "pour l'examen", "per l'esame", 'para a prova', 'für die Prüfung', 'من أجل الامتحان', '📝'],
  ['for work', 'para el trabajo', 'pour le travail', 'per lavoro', 'para o trabalho', 'für die Arbeit', 'من أجل العمل', '💼'],
  ['for the party', 'para la fiesta', 'pour la fête', 'per la festa', 'para a festa', 'für die Party', 'من أجل الحفلة', '🎉'],
  ['for my family', 'para mi familia', 'pour ma famille', 'per la mia famiglia', 'para a minha família', 'für meine Familie', 'من أجل عائلتي', '👨‍👩‍👧'],
  ['for fun', 'por diversión', 'pour le plaisir', 'per divertimento', 'por diversão', 'zum Spaß', 'للمتعة', '😄'],
  ['for the class', 'para la clase', 'pour le cours', 'per la lezione', 'para a aula', 'für den Unterricht', 'من أجل الدرس', '📘'],
  ['for my health', 'por mi salud', 'pour ma santé', 'per la mia salute', 'pela minha saúde', 'für meine Gesundheit', 'من أجل صحتي', '💪'],
  ['for the trip', 'para el viaje', 'pour le voyage', 'per il viaggio', 'para a viagem', 'für die Reise', 'من أجل الرحلة', '✈️'],
  ['for my friend', 'para mi amigo', 'pour mon ami', 'per il mio amico', 'para o meu amigo', 'für meinen Freund', 'من أجل صديقي', '🤝'],
  ['for the guests', 'para los invitados', 'pour les invités', 'per gli ospiti', 'para os convidados', 'für die Gäste', 'من أجل الضيوف', '🧑‍🤝‍🧑'],
  ['for the project', 'para el proyecto', 'pour le projet', 'per il progetto', 'para o projeto', 'für das Projekt', 'من أجل المشروع', '📊'],
  ['for the birthday', 'para el cumpleaños', "pour l'anniversaire", 'per il compleanno', 'para o aniversário', 'für den Geburtstag', 'من أجل عيد الميلاد', '🎂'],
  ['for dinner', 'para la cena', 'pour le dîner', 'per la cena', 'para o jantar', 'für das Abendessen', 'من أجل العشاء', '🍲'],
  ['for the children', 'para los niños', 'pour les enfants', 'per i bambini', 'para as crianças', 'für die Kinder', 'من أجل الأطفال', '🧒'],
];

LT.MANNERS = [
  ['slowly', 'despacio', 'lentement', 'lentamente', 'devagar', 'langsam', 'ببطء', '🐢'],
  ['quickly', 'rápido', 'rapidement', 'velocemente', 'rápido', 'schnell', 'بسرعة', '⚡'],
  ['carefully', 'con cuidado', 'avec soin', 'con attenzione', 'com cuidado', 'sorgfältig', 'بعناية', '🔍'],
  ['quietly', 'en silencio', 'en silence', 'in silenzio', 'em silêncio', 'leise', 'بهدوء', '🤫'],
  ['by hand', 'a mano', 'à la main', 'a mano', 'à mão', 'mit der Hand', 'باليد', '✋'],
  ['online', 'por internet', 'en ligne', 'online', 'pela internet', 'online', 'عبر الإنترنت', '🌐'],
  ['easily', 'fácilmente', 'facilement', 'facilmente', 'facilmente', 'leicht', 'بسهولة', '👌'],
  ['with a pen', 'con una pluma', 'avec un stylo', 'con una penna', 'com uma caneta', 'mit einem Stift', 'بقلم', '🖊️'],
  ['with a knife', 'con un cuchillo', 'avec un couteau', 'con un coltello', 'com uma faca', 'mit einem Messer', 'بسكين', '🔪'],
  ['with soap and water', 'con agua y jabón', "avec de l'eau et du savon", 'con acqua e sapone', 'com água e sabão', 'mit Wasser und Seife', 'بالماء والصابون', '🧼'],
  ['with my phone', 'con mi teléfono', 'avec mon téléphone', 'con il mio telefono', 'com o meu celular', 'mit meinem Handy', 'بهاتفي', '📱'],
  ['loudly', 'en voz alta', 'à voix haute', 'ad alta voce', 'em voz alta', 'laut', 'بصوت عالٍ', '📢'],
  ['with love', 'con amor', 'avec amour', 'con amore', 'com amor', 'mit Liebe', 'بحب', '❤️'],
  ['in cash', 'en efectivo', 'en espèces', 'in contanti', 'em dinheiro', 'bar', 'نقدًا', '💵'],
  ['by card', 'con tarjeta', 'par carte', 'con la carta', 'no cartão', 'mit Karte', 'بالبطاقة', '💳'],
];

/* أجوبة «لِمَن؟» — الألمانية بصيغة المضاف إليه (Genitiv) */
LT.POSS = [
  ["my brother's", 'De mi hermano', 'À mon frère', 'Di mio fratello', 'Do meu irmão', 'meines Bruders', 'أخي', '👦'],
  ["my sister's", 'De mi hermana', 'À ma sœur', 'Di mia sorella', 'Da minha irmã', 'meiner Schwester', 'أختي', '👧'],
  ["my mother's", 'De mi mamá', 'À ma mère', 'Di mia madre', 'Da minha mãe', 'meiner Mutter', 'أمي', '👩'],
  ["my father's", 'De mi papá', 'À mon père', 'Di mio padre', 'Do meu pai', 'meines Vaters', 'أبي', '👨'],
  ["my friend's", 'De mi amigo', 'À mon ami', 'Del mio amico', 'Do meu amigo', 'meines Freundes', 'صديقي', '🧑'],
  ["the teacher's", 'Del profesor', 'Au professeur', 'Del professore', 'Do professor', 'des Lehrers', 'المعلم', '🧑‍🏫'],
  ["my neighbor's", 'De mi vecino', 'À mon voisin', 'Del mio vicino', 'Do meu vizinho', 'meines Nachbarn', 'جاري', '🏘️'],
  ["my grandmother's", 'De mi abuela', 'À ma grand-mère', 'Di mia nonna', 'Da minha avó', 'meiner Oma', 'جدتي', '👵'],
  ["my boss's", 'De mi jefe', 'À mon chef', 'Del mio capo', 'Do meu chefe', 'meines Chefs', 'مديري', '👔'],
  ["my uncle's", 'De mi tío', 'À mon oncle', 'Di mio zio', 'Do meu tio', 'meines Onkels', 'عمي', '🧔'],
  ["my cousin's", 'De mi primo', 'À mon cousin', 'Di mio cugino', 'Do meu primo', 'meines Cousins', 'ابن عمي', '🧑‍🦱'],
];

/* الأفعال. لكل لغة: [المصدر، المضارع إن كان شاذاً، الماضي/اسم المفعول إن كان شاذاً، المستقبل الإيطالي إن كان شاذاً]
   en: [الفعل، الماضي]  — es/pt: [مصدر، مضارع، ماضٍ بسيط]  — fr/it/de: [مصدر، مضارع، اسم مفعول]  — 0 = قياسي */
const FAIRE = ['faire', 'fais,fais,fait,faisons,faites,font', 'fait'];
const FARE = ['fare', 'faccio,fai,fa,facciamo,fate,fanno', 'fatto', 'farò,farai,farà,faremo,farete,faranno'];
const FAZER = ['fazer', 'faço,fazes,faz,fazemos,fazeis,fazem', 'fiz,fizeste,fez,fizemos,fizestes,fizeram'];
const HACER = ['hacer', 'hago,haces,hace,hacemos,hacéis,hacen', 'hice,hiciste,hizo,hicimos,hicisteis,hicieron'];
const MACHEN = ['machen', 0, 'gemacht'];
const PRENDRE = ['prendre', 'prends,prends,prend,prenons,prenez,prennent', 'pris'];

LT.VERBS = {
  read: { ar: 'يقرأ', e: '📖', en: ['read', 'read'], es: ['leer', 0, 'leí,leíste,leyó,leímos,leísteis,leyeron'], fr: ['lire', 'lis,lis,lit,lisons,lisez,lisent', 'lu'], it: ['leggere', 0, 'letto'], pt: ['ler', 'leio,lês,lê,lemos,ledes,leem'], de: ['lesen', 'lese,liest,liest,lesen,lest,lesen', 'gelesen'] },
  drink: { ar: 'يشرب', e: '🥤', en: ['drink', 'drank'], es: ['beber'], fr: ['boire', 'bois,bois,boit,buvons,buvez,boivent', 'bu'], it: ['bere', 'bevo,bevi,beve,beviamo,bevete,bevono', 'bevuto', 'berrò,berrai,berrà,berremo,berrete,berranno'], pt: ['beber'], de: ['trinken', 0, 'getrunken'] },
  eat: { ar: 'يأكل', e: '🍽️', en: ['eat', 'ate'], es: ['comer'], fr: ['manger', 0, 'mangé'], it: ['mangiare'], pt: ['comer'], de: ['essen', 'esse,isst,isst,essen,esst,essen', 'gegessen'] },
  open: { ar: 'يفتح', e: '🔓', en: ['open', 'opened'], es: ['abrir'], fr: ['ouvrir', 'ouvre,ouvres,ouvre,ouvrons,ouvrez,ouvrent', 'ouvert'], it: ['aprire', 0, 'aperto'], pt: ['abrir'], de: ['öffnen', 0, 'geöffnet'] },
  clean: { ar: 'ينظّف', e: '🧹', en: ['clean', 'cleaned'], es: ['limpiar'], fr: ['nettoyer', 'nettoie,nettoies,nettoie,nettoyons,nettoyez,nettoient', 'nettoyé'], it: ['pulire', 'pulisco,pulisci,pulisce,puliamo,pulite,puliscono', 'pulito'], pt: ['limpar'], de: ['putzen', 0, 'geputzt'] },
  cook: { ar: 'يطبخ', e: '👩‍🍳', en: ['cook', 'cooked'], es: ['cocinar'], fr: ['cuisiner'], it: ['cucinare'], pt: ['cozinhar'], de: ['kochen', 0, 'gekocht'] },
  watch: { ar: 'يشاهد', e: '👀', en: ['watch', 'watched'], es: ['ver', 'veo,ves,ve,vemos,veis,ven', 'vi,viste,vio,vimos,visteis,vieron'], fr: ['regarder'], it: ['guardare'], pt: ['ver', 'vejo,vês,vê,vemos,vedes,veem', 'vi,viste,viu,vimos,vistes,viram'], de: ['sehen', 'sehe,siehst,sieht,sehen,seht,sehen', 'gesehen'] },
  wash: { ar: 'يغسل', e: '🫧', en: ['wash', 'washed'], es: ['lavar'], fr: ['laver'], it: ['lavare'], pt: ['lavar'], de: ['waschen', 'wasche,wäschst,wäscht,waschen,wascht,waschen', 'gewaschen'] },
  do: { ar: 'يحلّ / يعمل', e: '✍️', en: ['do', 'did'], es: HACER, fr: FAIRE, it: FARE, pt: FAZER, de: MACHEN },
  make: { ar: 'يحضّر', e: '🥄', en: ['make', 'made'], es: ['preparar'], fr: ['préparer'], it: ['preparare'], pt: FAZER, de: MACHEN },
  listen: { ar: 'يستمع إلى', e: '🎧', en: ['listen to', 'listened'], es: ['escuchar'], fr: ['écouter'], it: ['ascoltare'], pt: ['ouvir', 'ouço,ouves,ouve,ouvimos,ouvis,ouvem'], de: ['hören', 0, 'gehört'] },
  buy: { ar: 'يشتري', e: '🛍️', en: ['buy', 'bought'], es: ['comprar'], fr: ['acheter', 'achète,achètes,achète,achetons,achetez,achètent', 'acheté'], it: ['comprare'], pt: ['comprar'], de: ['kaufen', 0, 'gekauft'] },
  order: { ar: 'يطلب', e: '📲', en: ['order', 'ordered'], es: ['pedir', 'pido,pides,pide,pedimos,pedís,piden', 'pedí,pediste,pidió,pedimos,pedisteis,pidieron'], fr: ['commander'], it: ['ordinare'], pt: ['pedir', 'peço,pedes,pede,pedimos,pedis,pedem'], de: ['bestellen', 0, 'bestellt'] },
  pay: { ar: 'يدفع', e: '💰', en: ['pay', 'paid'], es: ['pagar'], fr: ['payer', 'paie,paies,paie,payons,payez,paient', 'payé'], it: ['pagare'], pt: ['pagar'], de: ['bezahlen', 0, 'bezahlt'] },
  cut: { ar: 'يقطّع', e: '🔪', en: ['cut', 'cut'], es: ['cortar'], fr: ['couper'], it: ['tagliare'], pt: ['cortar'], de: ['schneiden', 0, 'geschnitten'] },
  bake: { ar: 'يخبز', e: '🧁', en: ['bake', 'baked'], es: ['hornear'], fr: FAIRE, it: FARE, pt: FAZER, de: ['backen', 0, 'gebacken'] },
  sell: { ar: 'يبيع', e: '🏷️', en: ['sell', 'sold'], es: ['vender'], fr: ['vendre', 'vends,vends,vend,vendons,vendez,vendent', 'vendu'], it: ['vendere'], pt: ['vender'], de: ['verkaufen', 0, 'verkauft'] },
  look: { ar: 'يبحث عن', e: '🔎', en: ['look for', 'looked'], es: ['buscar'], fr: ['chercher'], it: ['cercare'], pt: ['procurar'], de: ['suchen', 0, 'gesucht'] },
  learn: { ar: 'يتعلّم', e: '🧠', en: ['learn', 'learned'], es: ['aprender'], fr: ['apprendre', 'apprends,apprends,apprend,apprenons,apprenez,apprennent', 'appris'], it: ['imparare'], pt: ['aprender'], de: ['lernen', 0, 'gelernt'] },
  write: { ar: 'يكتب', e: '✏️', en: ['write', 'wrote'], es: ['escribir'], fr: ['écrire', 'écris,écris,écrit,écrivons,écrivez,écrivent', 'écrit'], it: ['scrivere', 0, 'scritto'], pt: ['escrever'], de: ['schreiben', 0, 'geschrieben'] },
  send: { ar: 'يرسل', e: '📤', en: ['send', 'sent'], es: ['enviar', 'envío,envías,envía,enviamos,enviáis,envían'], fr: ['envoyer', 'envoie,envoies,envoie,envoyons,envoyez,envoient', 'envoyé'], it: ['mandare'], pt: ['enviar'], de: ['schicken', 0, 'geschickt'] },
  use: { ar: 'يستخدم', e: '🖱️', en: ['use', 'used'], es: ['usar'], fr: ['utiliser'], it: ['usare'], pt: ['usar'], de: ['benutzen', 0, 'benutzt'] },
  print: { ar: 'يطبع', e: '🖨️', en: ['print', 'printed'], es: ['imprimir'], fr: ['imprimer'], it: ['stampare'], pt: ['imprimir'], de: ['drucken', 0, 'gedruckt'] },
  check: { ar: 'يراجع', e: '☑️', en: ['check', 'checked'], es: ['revisar'], fr: ['vérifier'], it: ['controllare'], pt: ['verificar'], de: ['prüfen', 0, 'geprüft'] },
  translate: { ar: 'يترجم', e: '🌐', en: ['translate', 'translated'], es: ['traducir', 'traduzco,traduces,traduce,traducimos,traducís,traducen', 'traduje,tradujiste,tradujo,tradujimos,tradujisteis,tradujeron'], fr: ['traduire', 'traduis,traduis,traduit,traduisons,traduisez,traduisent', 'traduit'], it: ['tradurre', 'traduco,traduci,traduce,traduciamo,traducete,traducono', 'tradotto', 'tradurrò,tradurrai,tradurrà,tradurremo,tradurrete,tradurranno'], pt: ['traduzir', 'traduzo,traduzes,traduz,traduzimos,traduzis,traduzem'], de: ['übersetzen', 0, 'übersetzt'] },
  finish: { ar: 'يُنهي', e: '🏁', en: ['finish', 'finished'], es: ['terminar'], fr: ['finir', 'finis,finis,finit,finissons,finissez,finissent', 'fini'], it: ['finire', 'finisco,finisci,finisce,finiamo,finite,finiscono', 'finito'], pt: ['terminar'], de: ['beenden', 0, 'beendet'] },
  understand: { ar: 'يفهم', e: '💡', en: ['understand', 'understood'], es: ['entender', 'entiendo,entiendes,entiende,entendemos,entendéis,entienden'], fr: ['comprendre', 'comprends,comprends,comprend,comprenons,comprenez,comprennent', 'compris'], it: ['capire', 'capisco,capisci,capisce,capiamo,capite,capiscono', 'capito'], pt: ['entender'], de: ['verstehen', 0, 'verstanden'] },
  draw: { ar: 'يرسم', e: '🖍️', en: ['draw', 'drew'], es: ['dibujar'], fr: ['dessiner'], it: ['disegnare'], pt: ['desenhar'], de: ['zeichnen', 0, 'gezeichnet'] },
  drive: { ar: 'يقود', e: '🚘', en: ['drive', 'drove'], es: ['manejar'], fr: ['conduire', 'conduis,conduis,conduit,conduisons,conduisez,conduisent', 'conduit'], it: ['guidare'], pt: ['dirigir', 'dirijo,diriges,dirige,dirigimos,dirigis,dirigem'], de: ['fahren', 'fahre,fährst,fährt,fahren,fahrt,fahren', 'gefahren'] },
  book: { ar: 'يحجز', e: '🛎️', en: ['book', 'booked'], es: ['reservar'], fr: ['réserver'], it: ['prenotare'], pt: ['reservar'], de: ['buchen', 0, 'gebucht'] },
  rent: { ar: 'يستأجر', e: '🗝️', en: ['rent', 'rented'], es: ['rentar'], fr: ['louer'], it: ['affittare'], pt: ['alugar'], de: ['mieten', 0, 'gemietet'] },
  bring: { ar: 'يُحضِر', e: '🎒', en: ['bring', 'brought'], es: ['traer', 'traigo,traes,trae,traemos,traéis,traen', 'traje,trajiste,trajo,trajimos,trajisteis,trajeron'], fr: ['apporter'], it: ['portare'], pt: ['trazer', 'trago,trazes,traz,trazemos,trazeis,trazem', 'trouxe,trouxeste,trouxe,trouxemos,trouxestes,trouxeram'], de: ['bringen', 0, 'gebracht'] },
  pack: { ar: 'يجهّز (الحقيبة)', e: '🧳', en: ['pack', 'packed'], es: HACER, fr: FAIRE, it: FARE, pt: FAZER, de: ['packen', 0, 'gepackt'] },
  takephoto: { ar: 'يلتقط (صوراً)', e: '📸', en: ['take', 'took'], es: ['tomar'], fr: PRENDRE, it: FARE, pt: ['tirar'], de: MACHEN },
  water: { ar: 'يسقي', e: '💧', en: ['water', 'watered'], es: ['regar', 'riego,riegas,riega,regamos,regáis,riegan'], fr: ['arroser'], it: ['annaffiare'], pt: ['regar'], de: ['gießen', 0, 'gegossen'] },
  plant: { ar: 'يزرع', e: '🌱', en: ['plant', 'planted'], es: ['plantar'], fr: ['planter'], it: ['piantare'], pt: ['plantar'], de: ['pflanzen', 0, 'gepflanzt'] },
  paint: { ar: 'يدهن', e: '🖌️', en: ['paint', 'painted'], es: ['pintar'], fr: ['peindre', 'peins,peins,peint,peignons,peignez,peignent', 'peint'], it: ['dipingere', 0, 'dipinto'], pt: ['pintar'], de: ['streichen', 0, 'gestrichen'] },
  fix: { ar: 'يُصلح', e: '🔧', en: ['fix', 'fixed'], es: ['arreglar'], fr: ['réparer'], it: ['riparare'], pt: ['consertar'], de: ['reparieren', 0, 'repariert'] },
  sing: { ar: 'يغنّي', e: '🎤', en: ['sing', 'sang'], es: ['cantar'], fr: ['chanter'], it: ['cantare'], pt: ['cantar'], de: ['singen', 0, 'gesungen'] },
  close: { ar: 'يُغلق', e: '🔒', en: ['close', 'closed'], es: ['cerrar', 'cierro,cierras,cierra,cerramos,cerráis,cierran'], fr: ['fermer'], it: ['chiudere', 0, 'chiuso'], pt: ['fechar'], de: ['schließen', 0, 'geschlossen'] },
  receive: { ar: 'يستلم', e: '📥', en: ['receive', 'received'], es: ['recibir'], fr: ['recevoir', 'reçois,reçois,reçoit,recevons,recevez,reçoivent', 'reçu'], it: ['ricevere'], pt: ['receber'], de: ['bekommen', 0, 'bekommen'] },
  heat: { ar: 'يسخّن', e: '🔥', en: ['heat', 'heated'], es: ['calentar', 'caliento,calientas,calienta,calentamos,calentáis,calientan'], fr: ['chauffer'], it: ['scaldare'], pt: ['esquentar'], de: ['wärmen', 0, 'gewärmt'] },
  taste: { ar: 'يتذوّق', e: '👅', en: ['taste', 'tasted'], es: ['probar', 'pruebo,pruebas,prueba,probamos,probáis,prueban'], fr: ['goûter'], it: ['assaggiare'], pt: ['provar'], de: ['probieren', 0, 'probiert'] },
  serve: { ar: 'يقدّم', e: '🍽️', en: ['serve', 'served'], es: ['servir', 'sirvo,sirves,sirve,servimos,servís,sirven', 'serví,serviste,sirvió,servimos,servisteis,sirvieron'], fr: ['servir', 'sers,sers,sert,servons,servez,servent', 'servi'], it: ['servire'], pt: ['servir', 'sirvo,serves,serve,servimos,servis,servem'], de: ['servieren', 0, 'serviert'] },
  mix: { ar: 'يخلط', e: '🥣', en: ['mix', 'mixed'], es: ['mezclar'], fr: ['mélanger'], it: ['mescolare'], pt: ['misturar'], de: ['mischen', 0, 'gemischt'] },
  fill: { ar: 'يملأ', e: '🚰', en: ['fill', 'filled'], es: ['llenar'], fr: ['remplir', 'remplis,remplis,remplit,remplissons,remplissez,remplissent', 'rempli'], it: ['riempire', 'riempio,riempi,riempie,riempiamo,riempite,riempiono'], pt: ['encher'], de: ['füllen', 0, 'gefüllt'] },
  carry: { ar: 'يحمل', e: '💪', en: ['carry', 'carried'], es: ['llevar'], fr: ['porter'], it: ['portare'], pt: ['carregar'], de: ['tragen', 'trage,trägst,trägt,tragen,tragt,tragen', 'getragen'] },
  count: { ar: 'يعدّ', e: '🔢', en: ['count', 'counted'], es: ['contar', 'cuento,cuentas,cuenta,contamos,contáis,cuentan'], fr: ['compter'], it: ['contare'], pt: ['contar'], de: ['zählen', 0, 'gezählt'] },
  choose: { ar: 'يختار', e: '👆', en: ['choose', 'chose'], es: ['elegir', 'elijo,eliges,elige,elegimos,elegís,eligen', 'elegí,elegiste,eligió,elegimos,elegisteis,eligieron'], fr: ['choisir', 'choisis,choisis,choisit,choisissons,choisissez,choisissent', 'choisi'], it: ['scegliere', 'scelgo,scegli,sceglie,scegliamo,scegliete,scelgono', 'scelto'], pt: ['escolher'], de: ['wählen', 0, 'gewählt'] },
  iron: { ar: 'يكوي', e: '♨️', en: ['iron', 'ironed'], es: ['planchar'], fr: ['repasser'], it: ['stirare'], pt: ['passar'], de: ['bügeln', 'bügle,bügelst,bügelt,bügeln,bügelt,bügeln', 'gebügelt'] },
  install: { ar: 'يثبّت', e: '⬇️', en: ['install', 'installed'], es: ['instalar'], fr: ['installer'], it: ['installare'], pt: ['instalar'], de: ['installieren', 0, 'installiert'] },
  delete: { ar: 'يحذف', e: '🗑️', en: ['delete', 'deleted'], es: ['borrar'], fr: ['effacer'], it: ['cancellare'], pt: ['apagar'], de: ['löschen', 0, 'gelöscht'] },
  charge: { ar: 'يشحن', e: '🔌', en: ['charge', 'charged'], es: ['cargar'], fr: ['charger'], it: ['caricare'], pt: ['carregar'], de: ['laden', 'lade,lädst,lädt,laden,ladet,laden', 'geladen'] },
  sign: { ar: 'يوقّع', e: '🖋️', en: ['sign', 'signed'], es: ['firmar'], fr: ['signer'], it: ['firmare'], pt: ['assinar'], de: ['unterschreiben', 0, 'unterschrieben'] },
  explain: { ar: 'يشرح', e: '🗣️', en: ['explain', 'explained'], es: ['explicar'], fr: ['expliquer'], it: ['spiegare'], pt: ['explicar'], de: ['erklären', 0, 'erklärt'] },
  teach: { ar: 'يدرّس', e: '🧑‍🏫', en: ['teach', 'taught'], es: ['enseñar'], fr: ['enseigner'], it: ['insegnare'], pt: ['ensinar'], de: ['unterrichten', 0, 'unterrichtet'] },
  repeat: { ar: 'يكرّر', e: '🔁', en: ['repeat', 'repeated'], es: ['repetir', 'repito,repites,repite,repetimos,repetís,repiten', 'repetí,repetiste,repitió,repetimos,repetisteis,repitieron'], fr: ['répéter', 'répète,répètes,répète,répétons,répétez,répètent', 'répété'], it: ['ripetere'], pt: ['repetir', 'repito,repetes,repete,repetimos,repetis,repetem'], de: ['wiederholen', 0, 'wiederholt'] },
  show: { ar: 'يعرض', e: '👁️', en: ['show', 'showed'], es: ['mostrar', 'muestro,muestras,muestra,mostramos,mostráis,muestran'], fr: ['montrer'], it: ['mostrare'], pt: ['mostrar'], de: ['zeigen', 0, 'gezeigt'] },
  park: { ar: 'يركن', e: '🅿️', en: ['park', 'parked'], es: ['estacionar'], fr: ['garer'], it: ['parcheggiare'], pt: ['estacionar'], de: ['parken', 0, 'geparkt'] },
  decorate: { ar: 'يزيّن', e: '🎈', en: ['decorate', 'decorated'], es: ['decorar'], fr: ['décorer'], it: ['decorare'], pt: ['decorar'], de: ['schmücken', 0, 'geschmückt'] },
  start: { ar: 'يبدأ', e: '🚦', en: ['start', 'started'], es: ['empezar', 'empiezo,empiezas,empieza,empezamos,empezáis,empiezan'], fr: ['commencer'], it: ['iniziare'], pt: ['começar'], de: ['beginnen', 0, 'begonnen'] },
};

/* الوحدات = خطوط القطار. كل جملة:
   [فعل، أيقونة، المعنى بالعربية، en 'the X|X'، es 'np|pl?'، fr 'np|m/f|pl?'، it 'np|pl?'، pt 'np|pl?'، de 'm/f/n/p|Nomen'، مكان، سبب، كيفية، مالك] */
LT.UNITS = [
  {
    ar: 'الحياة اليومية', color: '#d62839', icon: '🏠', s: [
      ['read', '📖', 'قراءة الكتاب', 'the book|book', 'el libro', 'le livre|m', 'il libro', 'o livro', 'n|Buch', 6, 0, 0, 0],
      ['drink', '☕', 'شرب القهوة', 'the coffee|coffee', 'el café', 'le café|m', 'il caffè', 'o café', 'm|Kaffee', 5, 1, 0, 3],
      ['eat', '🍎', 'أكل التفاحة', 'the apple|apple', 'la manzana', 'la pomme|f', 'la mela', 'a maçã', 'm|Apfel', 3, 6, 1, 1],
      ['open', '🚪', 'فتح الباب', 'the door|door', 'la puerta', 'la porte|f', 'la porta', 'a porta', 'f|Tür', 9, 9, 3, 6],
      ['clean', '🧹', 'تنظيف الغرفة', 'the room|room', 'el cuarto', 'la chambre|f', 'la stanza', 'o quarto', 'n|Zimmer', 0, 2, 2, 1],
      ['cook', '🍲', 'طبخ الشوربة', 'the soup|soup', 'la sopa', 'la soupe|f', 'la zuppa', 'a sopa', 'f|Suppe', 3, 12, 12, 7],
      ['watch', '🎬', 'مشاهدة الفيلم', 'the movie|movie', 'la película', 'le film|m', 'il film', 'o filme', 'm|Film', 14, 4, 3, 10],
      ['wash', '🚗', 'غسل السيارة', 'the car|car', 'el carro', 'la voiture|f', 'la macchina', 'o carro', 'n|Auto', 7, 7, 9, 3],
      ['do', '📝', 'حلّ الواجب', 'the homework|homework', 'la tarea', 'les devoirs|m|pl', 'i compiti|pl', 'a lição de casa', 'p|Hausaufgaben', 0, 5, 2, 0],
      ['listen', '🎵', 'الاستماع إلى الموسيقى', 'the music|music', 'la música', 'la musique|f', 'la musica', 'a música', 'f|Musik', 4, 6, 10, 4],
    ]
  },
  {
    ar: 'التسوّق والطعام', color: '#1e6fd9', icon: '🛒', s: [
      ['buy', '🎟️', 'شراء التذاكر', 'the tickets|tickets', 'los boletos|pl', 'les billets|m|pl', 'i biglietti|pl', 'os ingressos|pl', 'p|Tickets', 13, 7, 14, 4],
      ['make', '🍵', 'تحضير الشاي', 'the tea|tea', 'el té', 'le thé|m', 'il tè', 'o chá', 'm|Tee', 3, 9, 1, 2],
      ['order', '🍕', 'طلب البيتزا', 'the pizza|pizza', 'la pizza', 'la pizza|f', 'la pizza', 'a pizza', 'f|Pizza', 0, 11, 10, 0],
      ['pay', '🧾', 'دفع الفاتورة', 'the bill|bill', 'la cuenta', "l'addition|f", 'il conto', 'a conta', 'f|Rechnung', 11, 12, 14, 8],
      ['cut', '🍞', 'تقطيع الخبز', 'the bread|bread', 'el pan', 'le pain|m', 'il pane', 'o pão', 'n|Brot', 3, 13, 8, 7],
      ['bake', '🎂', 'خَبز الكعكة', 'the cake|cake', 'el pastel', 'le gâteau|m', 'la torta', 'o bolo', 'm|Kuchen', 0, 11, 12, 1],
      ['sell', '🚲', 'بيع الدراجة', 'the bike|bike', 'la bicicleta', 'le vélo|m', 'la bicicletta', 'a bicicleta', 'n|Fahrrad', 8, 7, 5, 10],
      ['wash', '🍽️', 'غسل الصحون', 'the dishes|dishes', 'los platos|pl', 'la vaisselle|f', 'i piatti|pl', 'a louça', 'n|Geschirr', 3, 9, 9, 2],
      ['drink', '🧃', 'شرب العصير', 'the juice|juice', 'el jugo', 'le jus|m', 'il succo', 'o suco', 'm|Saft', 4, 6, 0, 0],
      ['look', '🔑', 'البحث عن المفاتيح', 'the keys|keys', 'las llaves|pl', 'les clés|f|pl', 'le chiavi|pl', 'as chaves|pl', 'p|Schlüssel', 14, 1, 2, 3],
    ]
  },
  {
    ar: 'المدرسة والعمل', color: '#1a936f', icon: '🏫', s: [
      ['learn', '📘', 'تعلّم الدرس', 'the lesson|lesson', 'la lección', 'la leçon|f', 'la lezione', 'a lição', 'f|Lektion', 1, 0, 6, 5],
      ['write', '📄', 'كتابة التقرير', 'the report|report', 'el informe', 'le rapport|m', 'la relazione', 'o relatório', 'm|Bericht', 9, 10, 1, 8],
      ['send', '📧', 'إرسال البريد الإلكتروني', 'the email|email', 'el correo', "l'e-mail|m", "l'email", 'o e-mail', 'f|E-Mail', 9, 1, 10, 3],
      ['use', '💻', 'استخدام الحاسوب', 'the computer|computer', 'la computadora', "l'ordinateur|m", 'il computer', 'o computador', 'm|Computer', 6, 10, 6, 1],
      ['print', '🖨️', 'طباعة الصور', 'the photos|photos', 'las fotos|pl', 'les photos|f|pl', 'le foto|pl', 'as fotos|pl', 'p|Fotos', 9, 2, 6, 4],
      ['check', '✅', 'مراجعة الإجابات', 'the answers|answers', 'las respuestas|pl', 'les réponses|f|pl', 'le risposte|pl', 'as respostas|pl', 'p|Antworten', 12, 0, 2, 4],
      ['translate', '🌍', 'ترجمة النص', 'the text|text', 'el texto', 'le texte|m', 'il testo', 'o texto', 'm|Text', 12, 5, 0, 5],
      ['finish', '🏁', 'إنهاء المشروع', 'the project|project', 'el proyecto', 'le projet|m', 'il progetto', 'o projeto', 'n|Projekt', 9, 1, 1, 9],
      ['understand', '❓', 'فهم السؤال', 'the question|question', 'la pregunta', 'la question|f', 'la domanda', 'a pergunta', 'f|Frage', 12, 0, 6, 5],
      ['draw', '🗺️', 'رسم الخريطة', 'the map|map', 'el mapa', 'la carte|f', 'la mappa', 'o mapa', 'f|Karte', 1, 5, 7, 10],
    ]
  },
  {
    ar: 'السفر والمدينة', color: '#e07a12', icon: '✈️', s: [
      ['drive', '🚗', 'قيادة السيارة', 'the car|car', 'el carro', 'la voiture|f', 'la macchina', 'o carro', 'n|Auto', 10, 1, 0, 3],
      ['book', '🏨', 'حجز الغرفة', 'the room|room', 'la habitación', 'la chambre|f', 'la camera', 'o quarto', 'n|Zimmer', 0, 7, 5, 8],
      ['rent', '🏢', 'استئجار الشقة', 'the apartment|apartment', 'el departamento', "l'appartement|m", "l'appartamento", 'o apartamento', 'f|Wohnung', 10, 7, 5, 9],
      ['bring', '📷', 'إحضار الكاميرا', 'the camera|camera', 'la cámara', "l'appareil photo|m", 'la macchina fotografica', 'a câmera', 'f|Kamera', 15, 7, 2, 9],
      ['pack', '🧳', 'تجهيز الحقيبة', 'the suitcase|suitcase', 'la maleta', 'la valise|f', 'la valigia', 'a mala', 'm|Koffer', 16, 7, 1, 1],
      ['check', '🛂', 'فحص جواز السفر', 'the passport|passport', 'el pasaporte', 'le passeport|m', 'il passaporto', 'o passaporte', 'm|Pass', 13, 7, 2, 3],
      ['takephoto', '📸', 'التقاط الصور', 'the photos|photos', 'las fotos|pl', 'les photos|f|pl', 'le foto|pl', 'as fotos|pl', 'p|Fotos', 15, 4, 10, 4],
      ['buy', '💐', 'شراء الورد', 'the flowers|flowers', 'las flores|pl', 'les fleurs|f|pl', 'i fiori|pl', 'as flores|pl', 'p|Blumen', 8, 11, 13, 7],
      ['wash', '👕', 'غسل الملابس', 'the clothes|clothes', 'la ropa', 'les vêtements|m|pl', 'i vestiti|pl', 'as roupas|pl', 'f|Kleidung', 0, 7, 4, 0],
      ['look', '📱', 'البحث عن الهاتف', 'the phone|phone', 'el teléfono', 'le téléphone|m', 'il telefono', 'o celular', 'n|Handy', 11, 1, 2, 4],
    ]
  },
  {
    ar: 'البيت والهوايات', color: '#7b4fd6', icon: '🎨', s: [
      ['water', '🪴', 'سقي النباتات', 'the plants|plants', 'las plantas|pl', 'les plantes|f|pl', 'le piante|pl', 'as plantas|pl', 'p|Pflanzen', 7, 3, 2, 7],
      ['plant', '🌳', 'زراعة الشجرة', 'the tree|tree', 'el árbol', "l'arbre|m", "l'albero", 'a árvore', 'm|Baum', 7, 13, 4, 3],
      ['paint', '🎨', 'دهان الجدار', 'the wall|wall', 'la pared', 'le mur|m', 'la parete', 'a parede', 'f|Wand', 14, 2, 0, 6],
      ['fix', '🔧', 'إصلاح الدراجة', 'the bike|bike', 'la bicicleta', 'le vélo|m', 'la bicicletta', 'a bicicleta', 'n|Fahrrad', 7, 13, 2, 10],
      ['sing', '🎤', 'غناء الأغنية', 'the song|song', 'la canción', 'la chanson|f', 'la canzone', 'a canção', 'n|Lied', 1, 2, 11, 1],
      ['close', '🪟', 'إغلاق النافذة', 'the window|window', 'la ventana', 'la fenêtre|f', 'la finestra', 'a janela', 'n|Fenster', 16, 13, 3, 2],
      ['read', '📰', 'قراءة الجريدة', 'the newspaper|newspaper', 'el periódico', 'le journal|m', 'il giornale', 'o jornal', 'f|Zeitung', 5, 1, 1, 3],
      ['listen', '📻', 'الاستماع إلى الراديو', 'the radio|radio', 'la radio', 'la radio|f', 'la radio', 'o rádio', 'n|Radio', 3, 4, 3, 7],
      ['draw', '🖼️', 'رسم الصورة', 'the picture|picture', 'el retrato', 'le portrait|m', 'il ritratto', 'o retrato', 'n|Bild', 4, 4, 7, 10],
      ['receive', '📦', 'استلام الطرد', 'the package|package', 'el paquete', 'le colis|m', 'il pacco', 'o pacote', 'n|Paket', 9, 11, 1, 6],
    ]
  },
  {
    ar: 'العائلة والمناسبات', color: '#0e8fa3', icon: '🎉', s: [
      ['make', '🥪', 'تحضير الشطيرة', 'the sandwich|sandwich', 'el sándwich', 'le sandwich|m', 'il panino', 'o sanduíche', 'n|Sandwich', 3, 13, 1, 0],
      ['eat', '🥗', 'أكل السلطة', 'the salad|salad', 'la ensalada', 'la salade|f', "l'insalata", 'a salada', 'm|Salat', 11, 6, 0, 4],
      ['bring', '🎁', 'إحضار الهدايا', 'the gifts|gifts', 'los regalos|pl', 'les cadeaux|m|pl', 'i regali|pl', 'os presentes|pl', 'p|Geschenke', 0, 11, 2, 10],
      ['send', '💌', 'إرسال الدعوات', 'the invitations|invitations', 'las invitaciones|pl', 'les invitations|f|pl', 'gli inviti|pl', 'os convites|pl', 'p|Einladungen', 0, 2, 5, 1],
      ['watch', '⚽', 'مشاهدة المباراة', 'the game|game', 'el partido', 'le match|m', 'la partita', 'o jogo', 'n|Spiel', 5, 4, 5, 0],
      ['clean', '🧽', 'تنظيف الطاولة', 'the table|table', 'la mesa', 'la table|f', 'il tavolo', 'a mesa', 'm|Tisch', 3, 12, 9, 7],
      ['open', '🎀', 'فتح الهدايا', 'the gifts|gifts', 'los regalos|pl', 'les cadeaux|m|pl', 'i regali|pl', 'os presentes|pl', 'p|Geschenke', 14, 11, 1, 1],
      ['cook', '🍚', 'طبخ الأرز', 'the rice|rice', 'el arroz', 'le riz|m', 'il riso', 'o arroz', 'm|Reis', 3, 9, 0, 2],
      ['start', '📚', 'بدء الدورة', 'the course|course', 'el curso', 'le cours|m', 'il corso', 'o curso', 'm|Kurs', 0, 1, 5, 10],
      ['order', '🍔', 'طلب الطعام', 'the food|food', 'la comida', 'le repas|m', 'il cibo', 'a comida', 'n|Essen', 0, 9, 5, 4],
    ]
  },
  {
    ar: 'المطبخ والملابس', color: '#c2185b', icon: '🍳', s: [
      ['heat', '🥛', 'تسخين الحليب', 'the milk|milk', 'la leche', 'le lait|m', 'il latte', 'o leite', 'f|Milch', 3, 13, 0, 7],
      ['taste', '🥫', 'تذوّق الصلصة', 'the sauce|sauce', 'la salsa', 'la sauce|f', 'il sugo', 'o molho', 'f|Soße', 3, 12, 2, 2],
      ['serve', '🍽️', 'تقديم العشاء', 'the dinner|dinner', 'la cena', 'le dîner|m', 'la cena', 'o jantar', 'n|Abendessen', 14, 9, 12, 1],
      ['mix', '🥚', 'خلط البيض', 'the eggs|eggs', 'los huevos|pl', 'les œufs|m|pl', 'le uova|pl', 'os ovos|pl', 'p|Eier', 3, 11, 1, 7],
      ['fill', '🍶', 'ملء القارورة', 'the bottle|bottle', 'la botella', 'la bouteille|f', 'la bottiglia', 'a garrafa', 'f|Flasche', 4, 7, 2, 0],
      ['carry', '🛍️', 'حمل الأكياس', 'the bags|bags', 'las bolsas|pl', 'les sacs|m|pl', 'le borse|pl', 'as sacolas|pl', 'p|Taschen', 17, 3, 4, 6],
      ['count', '💵', 'عدّ النقود', 'the money|money', 'el dinero', "l'argent|m", 'i soldi|pl', 'o dinheiro', 'n|Geld', 9, 1, 2, 8],
      ['choose', '👗', 'اختيار الفستان', 'the dress|dress', 'el vestido', 'la robe|f', 'il vestito', 'o vestido', 'n|Kleid', 10, 2, 5, 1],
      ['iron', '👔', 'كيّ القميص', 'the shirt|shirt', 'la camisa', 'la chemise|f', 'la camicia', 'a camisa', 'n|Hemd', 16, 1, 2, 3],
      ['taste', '🧀', 'تذوّق الجبن', 'the cheese|cheese', 'el queso', 'le fromage|m', 'il formaggio', 'o queijo', 'm|Käse', 8, 4, 0, 9],
    ]
  },
  {
    ar: 'التقنية والمكتب', color: '#4f7d2a', icon: '💻', s: [
      ['install', '📲', 'تثبيت التطبيق', 'the app|app', 'la aplicación', "l'application|f", "l'app", 'o aplicativo', 'f|App', 9, 1, 6, 0],
      ['delete', '💬', 'حذف الرسالة', 'the message|message', 'el mensaje', 'le message|m', 'il messaggio', 'a mensagem', 'f|Nachricht', 0, 8, 1, 4],
      ['charge', '🔋', 'شحن الهاتف', 'the phone|phone', 'el teléfono', 'le téléphone|m', 'il telefono', 'o celular', 'n|Handy', 5, 7, 1, 10],
      ['sign', '✍️', 'توقيع العقد', 'the contract|contract', 'el contrato', 'le contrat|m', 'il contratto', 'o contrato', 'm|Vertrag', 9, 1, 7, 8],
      ['explain', '💡', 'شرح الفكرة', 'the idea|idea', 'la idea', "l'idée|f", "l'idea", 'a ideia', 'f|Idee', 12, 10, 6, 5],
      ['teach', '🧑‍🏫', 'تدريس الفصل', 'the class|class', 'la clase', 'le cours|m', 'la lezione', 'a aula', 'f|Klasse', 1, 13, 0, 5],
      ['repeat', '🔁', 'تكرار الجملة', 'the sentence|sentence', 'la oración', 'la phrase|f', 'la frase', 'a frase', 'm|Satz', 12, 0, 11, 4],
      ['show', '📋', 'عرض الخطة', 'the plan|plan', 'el plan', 'le plan|m', 'il piano', 'o plano', 'm|Plan', 9, 10, 5, 8],
      ['park', '🅿️', 'ركن السيارة', 'the car|car', 'el carro', 'la voiture|f', 'la macchina', 'o carro', 'n|Auto', 13, 1, 0, 9],
      ['decorate', '🏡', 'تزيين البيت', 'the house|house', 'la casa', 'la maison|f', 'la casa', 'a casa', 'n|Haus', 7, 2, 12, 7],
    ]
  },
];
