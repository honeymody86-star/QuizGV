/* قطار اللغات — البيانات
   كل جملة: فعل + مفعول به + زمان، ومعها (مكان، سبب، كيفية، مالك) تُستخدم في أجوبة الأسئلة.
   اختيرت الأفعال والمفاعيل بحيث تصلح لكل الصيغ: العادة في الحاضر، والمبني للمجهول، وسؤال «لِمَن؟».
   لإضافة جملة: أضف سطراً في UNITS. لإضافة فعل: أضفه في VERBS (وفي AR_VERBS للترجمة العربية). */
window.LT = window.LT || {};

LT.LANGS = [
  { id: 'en', name: 'English', ar: 'الإنجليزية', flag: '🇬🇧', tts: ['en-US', 'en-GB', 'en'] },
  { id: 'es', name: 'Español', ar: 'الإسبانية', flag: '🇪🇸', tts: ['es-MX', 'es-US', 'es-ES', 'es'] },
  { id: 'fr', name: 'Français', ar: 'الفرنسية', flag: '🇫🇷', tts: ['fr-FR', 'fr-CA', 'fr'] },
  { id: 'it', name: 'Italiano', ar: 'الإيطالية', flag: '🇮🇹', tts: ['it-IT', 'it'] },
  { id: 'pt', name: 'Português', ar: 'البرتغالية البرازيلية', flag: '🇧🇷', tts: ['pt-BR', 'pt-PT', 'pt'] },
  { id: 'de', name: 'Deutsch', ar: 'الألمانية', flag: '🇩🇪', tts: ['de-DE', 'de-AT', 'de'] },
];
/* العربية: لغة الترجمة (يمكن نطقها عند الطلب) */
LT.AR_LANG = { id: 'ar', name: 'العربية', ar: 'العربية', flag: '🇸🇦', tts: ['ar-SA', 'ar-EG', 'ar-AE', 'ar'], rtl: true };

/* الضمائر: [الكلمة، خانة التصريف] (0 أنا، 1 أنتَ، 2 هو/هي، 3 نحن، 4 أنتم، 5 هم) */
LT.PRON = {
  en: { i: ['I', 0], you: ['you', 1], he: ['he', 2], she: ['she', 2], we: ['we', 3], youpl: ['you', 4], they: ['they', 5] },
  es: { i: ['yo', 0], you: ['tú', 1], he: ['él', 2], she: ['ella', 2], we: ['nosotros', 3], youpl: ['ustedes', 5], they: ['ellos', 5] },
  fr: { i: ['je', 0], you: ['tu', 1], he: ['il', 2], she: ['elle', 2], we: ['nous', 3], youpl: ['vous', 4], they: ['ils', 5] },
  it: { i: ['io', 0], you: ['tu', 1], he: ['lui', 2], she: ['lei', 2], we: ['noi', 3], youpl: ['voi', 4], they: ['loro', 5] },
  pt: { i: ['eu', 0], you: ['você', 2], he: ['ele', 2], she: ['ela', 2], we: ['nós', 3], youpl: ['vocês', 5], they: ['eles', 5] },
  de: { i: ['ich', 0], you: ['du', 1], he: ['er', 2], she: ['sie', 2], we: ['wir', 3], youpl: ['ihr', 4], they: ['sie', 5] },
  ar: { i: ['أنا', 0], you: ['أنتَ', 1], he: ['هو', 2], she: ['هي', 3], we: ['نحن', 4], youpl: ['أنتم', 5], they: ['هم', 6] },
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
  { id: 'pass', ar: 'المبني للمجهول', icon: '🔄' },
];

LT.ROLES = {
  subj: 'الفاعل', aux: 'فعل مساعد', verb: 'الفعل الرئيسي', obj: 'المفعول به / نائب الفاعل', neg: 'أداة النفي',
  qw: 'أداة الاستفهام', time: 'الزمان', place: 'المكان', reason: 'السبب', manner: 'الكيفية',
  poss: 'المالك', conn: 'كلمة الربط', ans: 'الجواب', x: 'رابط',
};

/* كلمات الزمان: كل مجموعة ثلاثية تتناسب فيها الأزمنة (أمس / كل يوم / غداً) */
LT.TIME = {
  en: [['yesterday', 'every day', 'tomorrow'], ['yesterday morning', 'every morning', 'tomorrow morning'], ['last night', 'every evening', 'tonight'], ['last weekend', 'on weekends', 'next weekend']],
  es: [['ayer', 'todos los días', 'mañana'], ['ayer por la mañana', 'todas las mañanas', 'mañana por la mañana'], ['anoche', 'todas las noches', 'esta noche'], ['el fin de semana pasado', 'los fines de semana', 'el próximo fin de semana']],
  fr: [['hier', 'tous les jours', 'demain'], ['hier matin', 'tous les matins', 'demain matin'], ['hier soir', 'tous les soirs', 'ce soir'], ['le week-end dernier', 'le week-end', 'le week-end prochain']],
  it: [['ieri', 'ogni giorno', 'domani'], ['ieri mattina', 'ogni mattina', 'domani mattina'], ['ieri sera', 'ogni sera', 'stasera'], ['lo scorso fine settimana', 'nel fine settimana', 'il prossimo fine settimana']],
  pt: [['ontem', 'todos os dias', 'amanhã'], ['ontem de manhã', 'todas as manhãs', 'amanhã de manhã'], ['ontem à noite', 'todas as noites', 'hoje à noite'], ['no fim de semana passado', 'nos fins de semana', 'no próximo fim de semana']],
  de: [['gestern', 'jeden Tag', 'morgen'], ['gestern Morgen', 'jeden Morgen', 'morgen früh'], ['gestern Abend', 'jeden Abend', 'heute Abend'], ['letztes Wochenende', 'am Wochenende', 'nächstes Wochenende']],
  ar: [['أمس', 'كل يوم', 'غدًا'], ['صباح أمس', 'كل صباح', 'صباح الغد'], ['مساء أمس', 'كل مساء', 'هذا المساء'], ['في العطلة الماضية', 'في العطلات', 'في العطلة القادمة']],
};
LT.TIME_EMOJI = [['📅', '🔁', '🌄'], ['🌅', '☀️', '🌤️'], ['🌙', '🌆', '🌃'], ['🏖️', '🎡', '🧺']];

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
  ['at the airport', 'en el aeropuerto', "à l'aéroport", "all'aeroporto", 'no aeroporto', 'am Flughafen', 'في المطار', '🛫'],
  ['on the bus', 'en el autobús', 'dans le bus', "sull'autobus", 'no ônibus', 'im Bus', 'في الحافلة', '🚌'],
  ['on the train', 'en el tren', 'dans le train', 'sul treno', 'no trem', 'im Zug', 'في القطار', '🚆'],
  ['at the post office', 'en la oficina de correos', 'à la poste', 'alla posta', 'nos correios', 'auf der Post', 'في مكتب البريد', '🏤'],
  ['at the hotel', 'en el hotel', "à l'hôtel", 'in albergo', 'no hotel', 'im Hotel', 'في الفندق', '🏨'],
  ['in the garage', 'en el garaje', 'au garage', 'in garage', 'na garagem', 'in der Garage', 'في المرآب', '🧰'],
  ['at the laundromat', 'en la lavandería', 'à la laverie', 'in lavanderia', 'na lavanderia', 'im Waschsalon', 'في مغسلة الملابس', '🧺'],
  ['on the balcony', 'en el balcón', 'sur le balcon', 'sul balcone', 'na varanda', 'auf dem Balkon', 'في الشرفة', '🌇'],
  ['at the university', 'en la universidad', "à l'université", "all'università", 'na universidade', 'an der Uni', 'في الجامعة', '🎓'],
  ['at the gym', 'en el gimnasio', 'à la salle de sport', 'in palestra', 'na academia', 'im Fitnessstudio', 'في النادي الرياضي', '🏋️'],
  ['at the bank', 'en el banco', 'à la banque', 'in banca', 'no banco', 'in der Bank', 'في البنك', '🏦'],
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
  ['for my neighbor', 'para mi vecino', 'pour mon voisin', 'per il mio vicino', 'para o meu vizinho', 'für meinen Nachbarn', 'من أجل جاري', '🏘️'],
  ['for the meeting', 'para la reunión', 'pour la réunion', 'per la riunione', 'para a reunião', 'für das Meeting', 'من أجل الاجتماع', '🗓️'],
  ['for my brother', 'para mi hermano', 'pour mon frère', 'per mio fratello', 'para o meu irmão', 'für meinen Bruder', 'من أجل أخي', '👦'],
  ['for the game', 'para el partido', 'pour le match', 'per la partita', 'para o jogo', 'für das Spiel', 'من أجل المباراة', '⚽'],
  ['for my sister', 'para mi hermana', 'pour ma sœur', 'per mia sorella', 'para a minha irmã', 'für meine Schwester', 'من أجل أختي', '👧'],
  ['for my grandmother', 'para mi abuela', 'pour ma grand-mère', 'per mia nonna', 'para a minha avó', 'für meine Oma', 'من أجل جدتي', '👵'],
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
  ['with water', 'con agua', "avec de l'eau", "con l'acqua", 'com água', 'mit Wasser', 'بالماء', '💧'],
  ['with a cable', 'con un cable', 'avec un câble', 'con un cavo', 'com um cabo', 'mit einem Kabel', 'بسلك', '🔌'],
  ['in color', 'a color', 'en couleur', 'a colori', 'em cores', 'in Farbe', 'بالألوان', '🌈'],
  ['with a cloth', 'con un trapo', 'avec un chiffon', 'con un panno', 'com um pano', 'mit einem Tuch', 'بقطعة قماش', '🧽'],
  ['with a needle', 'con una aguja', 'avec une aiguille', 'con un ago', 'com uma agulha', 'mit einer Nadel', 'بإبرة', '🪡'],
  ['with my laptop', 'con mi laptop', 'avec mon ordinateur portable', 'con il mio portatile', 'com o meu notebook', 'mit meinem Laptop', 'بحاسوبي المحمول', '💻'],
  ['in the sun', 'al sol', 'au soleil', 'al sole', 'ao sol', 'in der Sonne', 'في الشمس', '☀️'],
  ['on my back', 'en la espalda', 'sur le dos', 'sulle spalle', 'nas costas', 'auf dem Rücken', 'على ظهري', '🎒'],
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
  ["my colleague's", 'De mi colega', 'À mon collègue', 'Del mio collega', 'Do meu colega', 'meines Kollegen', 'زميلي', '🧑‍💼'],
  ["my student's", 'De mi alumno', 'À mon élève', 'Del mio studente', 'Do meu aluno', 'meines Schülers', 'طالبي', '🧑‍🎓'],
];

/* كلمات الربط لبناء الجمل المركبة والقصص والحوارات
   pos: 'start' = في أول الجملة (الألمانية تقلب الفعل بعدها)، 'join' = تربط جملتين */
LT.CONNECTORS = [
  { id: 'first', pos: 'start', ar: 'أولًا', use: 'لبداية الأحداث', en: 'First,', es: 'Primero,', fr: "D'abord,", it: 'Prima,', pt: 'Primeiro,', de: 'Zuerst', arw: 'أولًا،' },
  { id: 'then', pos: 'start', ar: 'ثم', use: 'للحدث التالي', en: 'Then', es: 'Luego', fr: 'Ensuite', it: 'Poi', pt: 'Depois', de: 'Dann', arw: 'ثم' },
  { id: 'after', pos: 'start', ar: 'بعد ذلك', use: 'لحدث بعد حدث', en: 'After that,', es: 'Después de eso,', fr: 'Après ça,', it: 'Dopo,', pt: 'Depois disso,', de: 'Danach', arw: 'بعد ذلك،' },
  { id: 'finally', pos: 'start', ar: 'وأخيرًا', use: 'لآخر حدث', en: 'Finally,', es: 'Finalmente,', fr: 'Enfin,', it: 'Infine,', pt: 'Finalmente,', de: 'Schließlich', arw: 'وأخيرًا،' },
  { id: 'and', pos: 'join', ar: 'و', use: 'لجمع جملتين متشابهتين', en: 'and', es: 'y', fr: 'et', it: 'e', pt: 'e', de: 'und', arw: 'و' },
  { id: 'but', pos: 'join', ar: 'لكن', use: 'للمقارنة بين مثبت ومنفي', en: 'but', es: 'pero', fr: 'mais', it: 'ma', pt: 'mas', de: 'aber', arw: 'لكن' },
  { id: 'or', pos: 'join', ar: 'أو', use: 'للاختيار بين أمرين', en: 'or', es: 'o', fr: 'ou', it: 'o', pt: 'ou', de: 'oder', arw: 'أو' },
];
/* كلمات ثابتة للحوار */
LT.CHAT = {
  hi: { en: 'Hi!', es: '¡Hola!', fr: 'Salut !', it: 'Ciao!', pt: 'Oi!', de: 'Hallo!', ar: 'مرحبًا!' },
  andyou: { en: 'And you?', es: '¿Y tú?', fr: 'Et toi ?', it: 'E tu?', pt: 'E você?', de: 'Und du?', ar: 'وأنتَ؟' },
  great: { en: 'Great!', es: '¡Genial!', fr: 'Super !', it: 'Fantastico!', pt: 'Legal!', de: 'Super!', ar: 'رائع!' },
  bye: { en: 'See you!', es: '¡Nos vemos!', fr: 'À plus !', it: 'A presto!', pt: 'Até mais!', de: 'Bis bald!', ar: 'إلى اللقاء!' },
};

/* الأفعال لكل لغة:
   en: [المصدر، الماضي، التصريف الثالث]   es / pt: [المصدر، المضارع، الماضي البسيط، اسم المفعول]
   fr / de: [المصدر، المضارع، اسم المفعول]   it: [المصدر، المضارع، اسم المفعول، المستقبل]
   0 أو غياب العنصر = قياسي */
const FAIRE = ['faire', 'fais,fais,fait,faisons,faites,font', 'fait'];
const FARE = ['fare', 'faccio,fai,fa,facciamo,fate,fanno', 'fatto', 'farò,farai,farà,faremo,farete,faranno'];
const FAZER = ['fazer', 'faço,fazes,faz,fazemos,fazeis,fazem', 'fiz,fizeste,fez,fizemos,fizestes,fizeram', 'feito'];
const HACER = ['hacer', 'hago,haces,hace,hacemos,hacéis,hacen', 'hice,hiciste,hizo,hicimos,hicisteis,hicieron', 'hecho'];
const MACHEN = ['machen', 0, 'gemacht'];
const PRENDRE = ['prendre', 'prends,prends,prend,prenons,prenez,prennent', 'pris'];
const NEHMEN = ['nehmen', 'nehme,nimmst,nimmt,nehmen,nehmt,nehmen', 'genommen'];

LT.VERBS = {
  read: { ar: 'يقرأ', e: '📖', en: ['read', 'read', 'read'], es: ['leer', 0, 'leí,leíste,leyó,leímos,leísteis,leyeron'], fr: ['lire', 'lis,lis,lit,lisons,lisez,lisent', 'lu'], it: ['leggere', 0, 'letto'], pt: ['ler', 'leio,lês,lê,lemos,ledes,leem'], de: ['lesen', 'lese,liest,liest,lesen,lest,lesen', 'gelesen'] },
  drink: { ar: 'يشرب', e: '🥤', en: ['drink', 'drank', 'drunk'], es: ['beber'], fr: ['boire', 'bois,bois,boit,buvons,buvez,boivent', 'bu'], it: ['bere', 'bevo,bevi,beve,beviamo,bevete,bevono', 'bevuto', 'berrò,berrai,berrà,berremo,berrete,berranno'], pt: ['beber'], de: ['trinken', 0, 'getrunken'] },
  eat: { ar: 'يأكل', e: '🍽️', en: ['eat', 'ate', 'eaten'], es: ['comer'], fr: ['manger', 0, 'mangé'], it: ['mangiare'], pt: ['comer'], de: ['essen', 'esse,isst,isst,essen,esst,essen', 'gegessen'] },
  open: { ar: 'يفتح', e: '🔓', en: ['open', 'opened'], es: ['abrir', 0, 0, 'abierto'], fr: ['ouvrir', 'ouvre,ouvres,ouvre,ouvrons,ouvrez,ouvrent', 'ouvert'], it: ['aprire', 0, 'aperto'], pt: ['abrir', 0, 0, 'aberto'], de: ['öffnen', 0, 'geöffnet'] },
  clean: { ar: 'ينظّف', e: '🧹', en: ['clean', 'cleaned'], es: ['limpiar'], fr: ['nettoyer', 'nettoie,nettoies,nettoie,nettoyons,nettoyez,nettoient', 'nettoyé'], it: ['pulire', 'pulisco,pulisci,pulisce,puliamo,pulite,puliscono', 'pulito'], pt: ['limpar', 0, 0, 'limpo'], de: ['putzen', 0, 'geputzt'] },
  cook: { ar: 'يطبخ', e: '👩‍🍳', en: ['cook', 'cooked'], es: ['cocinar'], fr: ['cuisiner'], it: ['cucinare'], pt: ['cozinhar'], de: ['kochen', 0, 'gekocht'] },
  makebed: { ar: 'يرتّب', e: '🛏️', en: ['make', 'made', 'made'], es: HACER, fr: FAIRE, it: FARE, pt: ['arrumar'], de: MACHEN },
  watch: { ar: 'يشاهد', e: '👀', en: ['watch', 'watched'], es: ['ver', 'veo,ves,ve,vemos,veis,ven', 'vi,viste,vio,vimos,visteis,vieron', 'visto'], fr: ['regarder'], it: ['guardare'], pt: ['ver', 'vejo,vês,vê,vemos,vedes,veem', 'vi,viste,viu,vimos,vistes,viram', 'visto'], de: ['sehen', 'sehe,siehst,sieht,sehen,seht,sehen', 'gesehen'] },
  wash: { ar: 'يغسل', e: '🫧', en: ['wash', 'washed'], es: ['lavar'], fr: ['laver'], it: ['lavare'], pt: ['lavar'], de: ['waschen', 'wasche,wäschst,wäscht,waschen,wascht,waschen', 'gewaschen'] },
  do: { ar: 'يحلّ', e: '✍️', en: ['do', 'did', 'done'], es: HACER, fr: FAIRE, it: FARE, pt: FAZER, de: MACHEN },
  takemed: { ar: 'يتناول', e: '💊', en: ['take', 'took', 'taken'], es: ['tomar'], fr: PRENDRE, it: ['prendere', 0, 'preso'], pt: ['tomar'], de: NEHMEN },
  make: { ar: 'يحضّر', e: '🥄', en: ['make', 'made', 'made'], es: ['preparar'], fr: ['préparer'], it: ['preparare'], pt: FAZER, de: MACHEN },
  buy: { ar: 'يشتري', e: '🛍️', en: ['buy', 'bought', 'bought'], es: ['comprar'], fr: ['acheter', 'achète,achètes,achète,achetons,achetez,achètent', 'acheté'], it: ['comprare'], pt: ['comprar'], de: ['kaufen', 0, 'gekauft'] },
  order: { ar: 'يطلب', e: '📲', en: ['order', 'ordered'], es: ['pedir', 'pido,pides,pide,pedimos,pedís,piden', 'pedí,pediste,pidió,pedimos,pedisteis,pidieron'], fr: ['commander'], it: ['ordinare'], pt: ['pedir', 'peço,pedes,pede,pedimos,pedis,pedem'], de: ['bestellen', 0, 'bestellt'] },
  pay: { ar: 'يدفع', e: '💰', en: ['pay', 'paid', 'paid'], es: ['pagar'], fr: ['payer', 'paie,paies,paie,payons,payez,paient', 'payé'], it: ['pagare'], pt: ['pagar', 0, 0, 'pago'], de: ['bezahlen', 0, 'bezahlt'] },
  cut: { ar: 'يقطّع', e: '🔪', en: ['cut', 'cut', 'cut'], es: ['cortar'], fr: ['couper'], it: ['tagliare'], pt: ['cortar'], de: ['schneiden', 0, 'geschnitten'] },
  bake: { ar: 'يخبز', e: '🧁', en: ['bake', 'baked'], es: ['hornear'], fr: FAIRE, it: FARE, pt: FAZER, de: ['backen', 0, 'gebacken'] },
  carry: { ar: 'يحمل', e: '💪', en: ['carry', 'carried'], es: ['llevar'], fr: ['porter'], it: ['portare'], pt: ['carregar'], de: ['tragen', 'trage,trägst,trägt,tragen,tragt,tragen', 'getragen'] },
  learn: { ar: 'يتعلّم', e: '🧠', en: ['learn', 'learned'], es: ['aprender'], fr: ['apprendre', 'apprends,apprends,apprend,apprenons,apprenez,apprennent', 'appris'], it: ['imparare'], pt: ['aprender'], de: ['lernen', 0, 'gelernt'] },
  write: { ar: 'يكتب', e: '✏️', en: ['write', 'wrote', 'written'], es: ['escribir', 0, 0, 'escrito'], fr: ['écrire', 'écris,écris,écrit,écrivons,écrivez,écrivent', 'écrit'], it: ['scrivere', 0, 'scritto'], pt: ['escrever', 0, 0, 'escrito'], de: ['schreiben', 0, 'geschrieben'] },
  send: { ar: 'يرسل', e: '📤', en: ['send', 'sent', 'sent'], es: ['enviar', 'envío,envías,envía,enviamos,enviáis,envían'], fr: ['envoyer', 'envoie,envoies,envoie,envoyons,envoyez,envoient', 'envoyé'], it: ['mandare'], pt: ['enviar'], de: ['schicken', 0, 'geschickt'] },
  use: { ar: 'يستخدم', e: '🖱️', en: ['use', 'used'], es: ['usar'], fr: ['utiliser'], it: ['usare'], pt: ['usar'], de: ['benutzen', 0, 'benutzt'] },
  print: { ar: 'يطبع', e: '🖨️', en: ['print', 'printed'], es: ['imprimir', 0, 0, 'impreso'], fr: ['imprimer'], it: ['stampare'], pt: ['imprimir', 0, 0, 'impresso'], de: ['drucken', 0, 'gedruckt'] },
  check: { ar: 'يراجع', e: '☑️', en: ['check', 'checked'], es: ['revisar'], fr: ['vérifier'], it: ['controllare'], pt: ['verificar'], de: ['prüfen', 0, 'geprüft'] },
  translate: { ar: 'يترجم', e: '🌐', en: ['translate', 'translated'], es: ['traducir', 'traduzco,traduces,traduce,traducimos,traducís,traducen', 'traduje,tradujiste,tradujo,tradujimos,tradujisteis,tradujeron'], fr: ['traduire', 'traduis,traduis,traduit,traduisons,traduisez,traduisent', 'traduit'], it: ['tradurre', 'traduco,traduci,traduce,traduciamo,traducete,traducono', 'tradotto', 'tradurrò,tradurrai,tradurrà,tradurremo,tradurrete,tradurranno'], pt: ['traduzir', 'traduzo,traduzes,traduz,traduzimos,traduzis,traduzem'], de: ['übersetzen', 0, 'übersetzt'] },
  organize: { ar: 'ينظّم', e: '🗂️', en: ['organize', 'organized'], es: ['organizar'], fr: ['ranger'], it: ['sistemare'], pt: ['organizar'], de: ['ordnen', 'ordne,ordnest,ordnet,ordnen,ordnet,ordnen', 'geordnet'] },
  copy: { ar: 'ينسخ', e: '📋', en: ['copy', 'copied'], es: ['copiar'], fr: ['recopier'], it: ['copiare'], pt: ['copiar'], de: ['kopieren', 0, 'kopiert'] },
  draw: { ar: 'يرسم', e: '🖍️', en: ['draw', 'drew', 'drawn'], es: ['dibujar'], fr: ['dessiner'], it: ['disegnare'], pt: ['desenhar'], de: ['zeichnen', 0, 'gezeichnet'] },
  drive: { ar: 'يقود', e: '🚘', en: ['drive', 'drove', 'driven'], es: ['manejar'], fr: ['conduire', 'conduis,conduis,conduit,conduisons,conduisez,conduisent', 'conduit'], it: ['guidare'], pt: ['dirigir', 'dirijo,diriges,dirige,dirigimos,dirigis,dirigem'], de: ['fahren', 'fahre,fährst,fährt,fahren,fahrt,fahren', 'gefahren'] },
  park: { ar: 'يركن', e: '🅿️', en: ['park', 'parked'], es: ['estacionar'], fr: ['garer'], it: ['parcheggiare'], pt: ['estacionar'], de: ['parken', 0, 'geparkt'] },
  bring: { ar: 'يُحضِر', e: '🎒', en: ['bring', 'brought', 'brought'], es: ['traer', 'traigo,traes,trae,traemos,traéis,traen', 'traje,trajiste,trajo,trajimos,trajisteis,trajeron'], fr: ['apporter'], it: ['portare'], pt: ['trazer', 'trago,trazes,traz,trazemos,trazeis,trazem', 'trouxe,trouxeste,trouxe,trouxemos,trouxestes,trouxeram'], de: ['bringen', 0, 'gebracht'] },
  pack: { ar: 'يجهّز', e: '🧳', en: ['pack', 'packed'], es: HACER, fr: FAIRE, it: FARE, pt: FAZER, de: ['packen', 0, 'gepackt'] },
  takephoto: { ar: 'يلتقط', e: '📸', en: ['take', 'took', 'taken'], es: ['tomar'], fr: PRENDRE, it: FARE, pt: ['tirar'], de: MACHEN },
  water: { ar: 'يسقي', e: '💧', en: ['water', 'watered'], es: ['regar', 'riego,riegas,riega,regamos,regáis,riegan'], fr: ['arroser'], it: ['annaffiare'], pt: ['regar'], de: ['gießen', 0, 'gegossen'] },
  mow: { ar: 'يقصّ', e: '✂️', en: ['cut', 'cut', 'cut'], es: ['cortar'], fr: ['tondre', 'tonds,tonds,tond,tondons,tondez,tondent', 'tondu'], it: ['tagliare'], pt: ['cortar'], de: ['mähen', 0, 'gemäht'] },
  paint: { ar: 'يرسم', e: '🖌️', en: ['paint', 'painted'], es: ['pintar'], fr: ['peindre', 'peins,peins,peint,peignons,peignez,peignent', 'peint'], it: ['dipingere', 0, 'dipinto'], pt: ['pintar'], de: ['malen', 0, 'gemalt'] },
  fix: { ar: 'يُصلح', e: '🔧', en: ['fix', 'fixed'], es: ['arreglar'], fr: ['réparer'], it: ['riparare'], pt: ['consertar'], de: ['reparieren', 0, 'repariert'] },
  sing: { ar: 'يغنّي', e: '🎤', en: ['sing', 'sang', 'sung'], es: ['cantar'], fr: ['chanter'], it: ['cantare'], pt: ['cantar'], de: ['singen', 0, 'gesungen'] },
  close: { ar: 'يُغلق', e: '🔒', en: ['close', 'closed'], es: ['cerrar', 'cierro,cierras,cierra,cerramos,cerráis,cierran'], fr: ['fermer'], it: ['chiudere', 0, 'chiuso'], pt: ['fechar'], de: ['schließen', 0, 'geschlossen'] },
  fold: { ar: 'يطوي', e: '👚', en: ['fold', 'folded'], es: ['doblar'], fr: ['plier'], it: ['piegare'], pt: ['dobrar'], de: ['falten', 0, 'gefaltet'] },
  heat: { ar: 'يسخّن', e: '🔥', en: ['heat', 'heated'], es: ['calentar', 'caliento,calientas,calienta,calentamos,calentáis,calientan'], fr: ['chauffer'], it: ['scaldare'], pt: ['esquentar'], de: ['wärmen', 0, 'gewärmt'] },
  taste: { ar: 'يتذوّق', e: '👅', en: ['taste', 'tasted'], es: ['probar', 'pruebo,pruebas,prueba,probamos,probáis,prueban'], fr: ['goûter'], it: ['assaggiare'], pt: ['provar'], de: ['probieren', 0, 'probiert'] },
  serve: { ar: 'يقدّم', e: '🍽️', en: ['serve', 'served'], es: ['servir', 'sirvo,sirves,sirve,servimos,servís,sirven', 'serví,serviste,sirvió,servimos,servisteis,sirvieron'], fr: ['servir', 'sers,sers,sert,servons,servez,servent', 'servi'], it: ['servire'], pt: ['servir', 'sirvo,serves,serve,servimos,servis,servem'], de: ['servieren', 0, 'serviert'] },
  mix: { ar: 'يخلط', e: '🥣', en: ['mix', 'mixed'], es: ['mezclar'], fr: ['mélanger'], it: ['mescolare'], pt: ['misturar'], de: ['mischen', 0, 'gemischt'] },
  fill: { ar: 'يملأ', e: '🚰', en: ['fill', 'filled'], es: ['llenar'], fr: ['remplir', 'remplis,remplis,remplit,remplissons,remplissez,remplissent', 'rempli'], it: ['riempire', 'riempio,riempi,riempie,riempiamo,riempite,riempiono'], pt: ['encher'], de: ['füllen', 0, 'gefüllt'] },
  peel: { ar: 'يقشّر', e: '🥔', en: ['peel', 'peeled'], es: ['pelar'], fr: ['éplucher'], it: ['sbucciare'], pt: ['descascar'], de: ['schälen', 0, 'geschält'] },
  count: { ar: 'يعدّ', e: '🔢', en: ['count', 'counted'], es: ['contar', 'cuento,cuentas,cuenta,contamos,contáis,cuentan'], fr: ['compter'], it: ['contare'], pt: ['contar'], de: ['zählen', 0, 'gezählt'] },
  choose: { ar: 'يختار', e: '👆', en: ['choose', 'chose', 'chosen'], es: ['elegir', 'elijo,eliges,elige,elegimos,elegís,eligen', 'elegí,elegiste,eligió,elegimos,elegisteis,eligieron'], fr: ['choisir', 'choisis,choisis,choisit,choisissons,choisissez,choisissent', 'choisi'], it: ['scegliere', 'scelgo,scegli,sceglie,scegliamo,scegliete,scelgono', 'scelto'], pt: ['escolher'], de: ['wählen', 0, 'gewählt'] },
  iron: { ar: 'يكوي', e: '♨️', en: ['iron', 'ironed'], es: ['planchar'], fr: ['repasser'], it: ['stirare'], pt: ['passar'], de: ['bügeln', 'bügle,bügelst,bügelt,bügeln,bügelt,bügeln', 'gebügelt'] },
  charge: { ar: 'يشحن', e: '🔌', en: ['charge', 'charged'], es: ['cargar'], fr: ['charger'], it: ['caricare'], pt: ['carregar'], de: ['laden', 'lade,lädst,lädt,laden,ladet,laden', 'geladen'] },
  sign: { ar: 'يوقّع', e: '🖋️', en: ['sign', 'signed'], es: ['firmar'], fr: ['signer'], it: ['firmare'], pt: ['assinar'], de: ['unterschreiben', 0, 'unterschrieben'] },
  explain: { ar: 'يشرح', e: '🗣️', en: ['explain', 'explained'], es: ['explicar'], fr: ['expliquer'], it: ['spiegare'], pt: ['explicar'], de: ['erklären', 0, 'erklärt'] },
  teach: { ar: 'يدرّس', e: '🧑‍🏫', en: ['teach', 'taught', 'taught'], es: ['dar', 'doy,das,da,damos,dais,dan', 'di,diste,dio,dimos,disteis,dieron', 'dado'], fr: ['enseigner'], it: ['insegnare'], pt: ['dar', 'dou,dás,dá,damos,dais,dão', 'dei,deste,deu,demos,destes,deram', 'dado'], de: ['unterrichten', 0, 'unterrichtet'] },
  repeat: { ar: 'يكرّر', e: '🔁', en: ['repeat', 'repeated'], es: ['repetir', 'repito,repites,repite,repetimos,repetís,repiten', 'repetí,repetiste,repitió,repetimos,repetisteis,repitieron'], fr: ['répéter', 'répète,répètes,répète,répétons,répétez,répètent', 'répété'], it: ['ripetere'], pt: ['repetir', 'repito,repetes,repete,repetimos,repetis,repetem'], de: ['wiederholen', 0, 'wiederholt'] },
  show: { ar: 'يعرض', e: '👁️', en: ['show', 'showed', 'shown'], es: ['mostrar', 'muestro,muestras,muestra,mostramos,mostráis,muestran'], fr: ['montrer'], it: ['mostrare'], pt: ['mostrar'], de: ['zeigen', 0, 'gezeigt'] },
  washcup: { ar: 'يغسل', e: '🫧', en: ['wash', 'washed'], es: ['lavar'], fr: ['laver'], it: ['lavare'], pt: ['lavar'], de: ['spülen', 0, 'gespült'] },
  correct: { ar: 'يصحّح', e: '🖍️', en: ['correct', 'corrected'], es: ['corregir', 'corrijo,corriges,corrige,corregimos,corregís,corrigen', 'corregí,corregiste,corrigió,corregimos,corregisteis,corrigieron'], fr: ['corriger'], it: ['correggere', 0, 'corretto'], pt: ['corrigir', 'corrijo,corriges,corrige,corrigimos,corrigis,corrigem'], de: ['korrigieren', 0, 'korrigiert'] },
  dry: { ar: 'يجفّف', e: '☀️', en: ['dry', 'dried'], es: ['secar'], fr: ['sécher', 'sèche,sèches,sèche,séchons,séchez,sèchent', 'séché'], it: ['asciugare'], pt: ['secar'], de: ['trocknen', 'trockne,trocknest,trocknet,trocknen,trocknet,trocknen', 'getrocknet'] },
  edit: { ar: 'يعدّل', e: '✂️', en: ['edit', 'edited'], es: ['editar'], fr: ['retoucher'], it: ['modificare'], pt: ['editar'], de: ['bearbeiten', 0, 'bearbeitet'] },
  wrap: { ar: 'يغلّف', e: '🎀', en: ['wrap', 'wrapped'], es: ['envolver', 'envuelvo,envuelves,envuelve,envolvemos,envolvéis,envuelven', 0, 'envuelto'], fr: ['emballer'], it: ['incartare'], pt: ['embrulhar'], de: ['verpacken', 0, 'verpackt'] },
  sew: { ar: 'يخيط', e: '🪡', en: ['sew', 'sewed', 'sewn'], es: ['coser'], fr: ['coudre', 'couds,couds,coud,cousons,cousez,cousent', 'cousu'], it: ['cucire', 'cucio,cuci,cuce,cuciamo,cucite,cuciono'], pt: ['costurar'], de: ['nähen', 0, 'genäht'] },
  prepare: { ar: 'يجهّز', e: '📊', en: ['prepare', 'prepared'], es: ['preparar'], fr: ['préparer'], it: ['preparare'], pt: ['preparar'], de: ['erstellen', 0, 'erstellt'] },
  save: { ar: 'يحفظ', e: '💾', en: ['save', 'saved'], es: ['guardar'], fr: ['sauvegarder'], it: ['salvare'], pt: ['salvar'], de: ['speichern', 0, 'gespeichert'] },
  set: { ar: 'يجهّز', e: '🍴', en: ['set', 'set', 'set'], es: ['poner', 'pongo,pones,pone,ponemos,ponéis,ponen', 'puse,pusiste,puso,pusimos,pusisteis,pusieron', 'puesto'], fr: ['mettre', 'mets,mets,met,mettons,mettez,mettent', 'mis'], it: ['apparecchiare'], pt: ['pôr', 'ponho,pões,põe,pomos,pondes,põem', 'pus,puseste,pôs,pusemos,pusestes,puseram', 'posto'], de: ['decken', 0, 'gedeckt'] },
};

/* تصريف الأفعال العربية (بلا تشكيل إلا علامة الضمير) بترتيب: أنا، أنتَ، هو، هي، نحن، أنتم، هم
   p: الماضي (كلمة واحدة = جذع قياسي يُضاف له تُ تَ – تْ نا تم وا، أو قائمة كاملة)
   r: المضارع (جذع بلا حرف المضارعة، أو قائمة كاملة)   j: المجزوم إن اختلف (بعد «لم»)
   ps: المبني للمجهول [ماضٍ، مضارع] للمذكر بالتشكيل */
LT.AR_VERBS = {
  read: { p: 'قرأتُ,قرأتَ,قرأ,قرأت,قرأنا,قرأتم,قرؤوا', r: 'أقرأ,تقرأ,يقرأ,تقرأ,نقرأ,تقرؤون,يقرؤون', ps: ['قُرِئَ', 'يُقْرَأُ'] },
  drink: { p: 'شرب', r: 'شرب', ps: ['شُرِبَ', 'يُشْرَبُ'] },
  eat: { p: 'أكل', r: 'آكل,تأكل,يأكل,تأكل,نأكل,تأكلون,يأكلون', ps: ['أُكِلَ', 'يُؤْكَلُ'] },
  open: { p: 'فتح', r: 'فتح', ps: ['فُتِحَ', 'يُفْتَحُ'] },
  clean: { p: 'نظّف', r: 'نظّف', ps: ['نُظِّفَ', 'يُنَظَّفُ'] },
  cook: { p: 'طبخ', r: 'طبخ', ps: ['طُبِخَ', 'يُطْبَخُ'] },
  makebed: { p: 'رتّب', r: 'رتّب', ps: ['رُتِّبَ', 'يُرَتَّبُ'] },
  watch: { p: 'شاهد', r: 'شاهد', ps: ['شُوهِدَ', 'يُشَاهَدُ'] },
  wash: { p: 'غسل', r: 'غسل', ps: ['غُسِلَ', 'يُغْسَلُ'] },
  do: { p: 'حللتُ,حللتَ,حلّ,حلّت,حللنا,حللتم,حلّوا', r: 'حلّ', ps: ['حُلَّ', 'يُحَلُّ'] },
  takemed: { p: 'تناول', r: 'تناول', ps: ['تُنُوِّلَ', 'يُتَنَاوَلُ'] },
  make: { p: 'حضّر', r: 'حضّر', ps: ['حُضِّرَ', 'يُحَضَّرُ'] },
  buy: { p: 'اشتريتُ,اشتريتَ,اشترى,اشترت,اشترينا,اشتريتم,اشتروا', r: 'أشتري,تشتري,يشتري,تشتري,نشتري,تشترون,يشترون', j: 'أشترِ,تشترِ,يشترِ,تشترِ,نشترِ,تشتروا,يشتروا', ps: ['اشْتُرِيَ', 'يُشْتَرَى'] },
  order: { p: 'طلب', r: 'طلب', ps: ['طُلِبَ', 'يُطْلَبُ'] },
  pay: { p: 'دفع', r: 'دفع', ps: ['دُفِعَ', 'يُدْفَعُ'] },
  cut: { p: 'قطّع', r: 'قطّع', ps: ['قُطِّعَ', 'يُقَطَّعُ'] },
  bake: { p: 'خبز', r: 'خبز', ps: ['خُبِزَ', 'يُخْبَزُ'] },
  carry: { p: 'حمل', r: 'حمل', ps: ['حُمِلَ', 'يُحْمَلُ'] },
  learn: { p: 'تعلّم', r: 'تعلّم', ps: ['تُعُلِّمَ', 'يُتَعَلَّمُ'] },
  write: { p: 'كتب', r: 'كتب', ps: ['كُتِبَ', 'يُكْتَبُ'] },
  send: { p: 'أرسل', r: 'رسل', ps: ['أُرْسِلَ', 'يُرْسَلُ'] },
  use: { p: 'استخدم', r: 'ستخدم', ps: ['اسْتُخْدِمَ', 'يُسْتَخْدَمُ'] },
  print: { p: 'طبع', r: 'طبع', ps: ['طُبِعَ', 'يُطْبَعُ'] },
  check: { p: 'راجع', r: 'راجع', ps: ['رُوجِعَ', 'يُرَاجَعُ'] },
  translate: { p: 'ترجم', r: 'ترجم', ps: ['تُرْجِمَ', 'يُتَرْجَمُ'] },
  organize: { p: 'نظّم', r: 'نظّم', ps: ['نُظِّمَ', 'يُنَظَّمُ'] },
  copy: { p: 'نسخ', r: 'نسخ', ps: ['نُسِخَ', 'يُنْسَخُ'] },
  draw: { p: 'رسم', r: 'رسم', ps: ['رُسِمَ', 'يُرْسَمُ'] },
  paint: { p: 'رسم', r: 'رسم', ps: ['رُسِمَ', 'يُرْسَمُ'] },
  drive: { p: 'قُدتُ,قُدتَ,قاد,قادت,قُدنا,قُدتم,قادوا', r: 'قود', j: 'أقُد,تقُد,يقُد,تقُد,نقُد,تقودوا,يقودوا', ps: ['قِيدَ', 'يُقَادُ'] },
  park: { p: 'ركن', r: 'ركن', ps: ['رُكِنَ', 'يُرْكَنُ'] },
  bring: { p: 'أحضر', r: 'حضر', ps: ['أُحْضِرَ', 'يُحْضَرُ'] },
  pack: { p: 'جهّز', r: 'جهّز', ps: ['جُهِّزَ', 'يُجَهَّزُ'] },
  set: { p: 'جهّز', r: 'جهّز', ps: ['جُهِّزَ', 'يُجَهَّزُ'] },
  takephoto: { p: 'التقط', r: 'لتقط', ps: ['الْتُقِطَ', 'يُلْتَقَطُ'] },
  water: { p: 'سقيتُ,سقيتَ,سقى,سقت,سقينا,سقيتم,سقوا', r: 'أسقي,تسقي,يسقي,تسقي,نسقي,تسقون,يسقون', j: 'أسقِ,تسقِ,يسقِ,تسقِ,نسقِ,تسقوا,يسقوا', ps: ['سُقِيَ', 'يُسْقَى'] },
  mow: { p: 'قصصتُ,قصصتَ,قصّ,قصّت,قصصنا,قصصتم,قصّوا', r: 'قصّ', ps: ['قُصَّ', 'يُقَصُّ'] },
  fix: { p: 'أصلح', r: 'صلح', ps: ['أُصْلِحَ', 'يُصْلَحُ'] },
  sing: { p: 'غنّيتُ,غنّيتَ,غنّى,غنّت,غنّينا,غنّيتم,غنّوا', r: 'أغنّي,تغنّي,يغنّي,تغنّي,نغنّي,تغنّون,يغنّون', j: 'أغنِّ,تغنِّ,يغنِّ,تغنِّ,نغنِّ,تغنّوا,يغنّوا', ps: ['غُنِّيَ', 'يُغَنَّى'] },
  close: { p: 'أغلق', r: 'غلق', ps: ['أُغْلِقَ', 'يُغْلَقُ'] },
  fold: { p: 'طويتُ,طويتَ,طوى,طوت,طوينا,طويتم,طووا', r: 'أطوي,تطوي,يطوي,تطوي,نطوي,تطوون,يطوون', j: 'أطوِ,تطوِ,يطوِ,تطوِ,نطوِ,تطووا,يطووا', ps: ['طُوِيَ', 'يُطْوَى'] },
  heat: { p: 'سخّن', r: 'سخّن', ps: ['سُخِّنَ', 'يُسَخَّنُ'] },
  taste: { p: 'تذوّق', r: 'تذوّق', ps: ['تُذُوِّقَ', 'يُتَذَوَّقُ'] },
  serve: { p: 'قدّم', r: 'قدّم', ps: ['قُدِّمَ', 'يُقَدَّمُ'] },
  mix: { p: 'خلط', r: 'خلط', ps: ['خُلِطَ', 'يُخْلَطُ'] },
  fill: { p: 'ملأتُ,ملأتَ,ملأ,ملأت,ملأنا,ملأتم,ملؤوا', r: 'أملأ,تملأ,يملأ,تملأ,نملأ,تملؤون,يملؤون', ps: ['مُلِئَ', 'يُمْلَأُ'] },
  peel: { p: 'قشّر', r: 'قشّر', ps: ['قُشِّرَ', 'يُقَشَّرُ'] },
  count: { p: 'عددتُ,عددتَ,عدّ,عدّت,عددنا,عددتم,عدّوا', r: 'عدّ', ps: ['عُدَّ', 'يُعَدُّ'] },
  choose: { p: 'اخترتُ,اخترتَ,اختار,اختارت,اخترنا,اخترتم,اختاروا', r: 'ختار', j: 'أختر,تختر,يختر,تختر,نختر,تختاروا,يختاروا', ps: ['اخْتِيرَ', 'يُخْتَارُ'] },
  iron: { p: 'كويتُ,كويتَ,كوى,كوت,كوينا,كويتم,كووا', r: 'أكوي,تكوي,يكوي,تكوي,نكوي,تكوون,يكوون', j: 'أكوِ,تكوِ,يكوِ,تكوِ,نكوِ,تكووا,يكووا', ps: ['كُوِيَ', 'يُكْوَى'] },
  charge: { p: 'شحن', r: 'شحن', ps: ['شُحِنَ', 'يُشْحَنُ'] },
  sign: { p: 'وقّع', r: 'وقّع', ps: ['وُقِّعَ', 'يُوَقَّعُ'] },
  explain: { p: 'شرح', r: 'شرح', ps: ['شُرِحَ', 'يُشْرَحُ'] },
  teach: { p: 'درّس', r: 'درّس', ps: ['دُرِّسَ', 'يُدَرَّسُ'] },
  repeat: { p: 'كرّر', r: 'كرّر', ps: ['كُرِّرَ', 'يُكَرَّرُ'] },
  show: { p: 'عرض', r: 'عرض', ps: ['عُرِضَ', 'يُعْرَضُ'] },
  washcup: { p: 'غسل', r: 'غسل', ps: ['غُسِلَ', 'يُغْسَلُ'] },
  correct: { p: 'صحّح', r: 'صحّح', ps: ['صُحِّحَ', 'يُصَحَّحُ'] },
  dry: { p: 'جفّف', r: 'جفّف', ps: ['جُفِّفَ', 'يُجَفَّفُ'] },
  edit: { p: 'عدّل', r: 'عدّل', ps: ['عُدِّلَ', 'يُعَدَّلُ'] },
  wrap: { p: 'غلّف', r: 'غلّف', ps: ['غُلِّفَ', 'يُغَلَّفُ'] },
  sew: { p: 'خِطتُ,خِطتَ,خاط,خاطت,خِطنا,خِطتم,خاطوا', r: 'خيط', j: 'أخِط,تخِط,يخِط,تخِط,نخِط,تخيطوا,يخيطوا', ps: ['خِيطَ', 'يُخَاطُ'] },
  prepare: { p: 'جهّز', r: 'جهّز', ps: ['جُهِّزَ', 'يُجَهَّزُ'] },
  save: { p: 'حفظ', r: 'حفظ', ps: ['حُفِظَ', 'يُحْفَظُ'] },
};

/* الوحدات = خطوط القطار. كل جملة:
   [فعل، أيقونة، المعنى، en 'the X|X|pl?'، es 'np|pl?'، fr 'np|m/f|pl?'، it 'np|m/f|pl?'، pt 'np|pl?'،
    de 'm/f/n/p|Nomen'، ar 'المفعول|المضاف بلا أل|m/f'، مكان، سبب، كيفية، مالك، مجموعة الزمان (0 كل يوم، 1 كل صباح، 2 كل مساء، 3 العطلات)]
   قواعد اختيار الجمل حتى تصلح كل الصيغ منطقياً:
   - المفعول به شيء يملكه شخص ويمكن نقله (فيصلح سؤال «لِمَن؟»)، ولا يرتبط بمكان ثابت (فيصلح سؤال «أين؟»).
   - المكان لا يُفهم من الفعل أو المفعول (لا «ننظّف الغرفة في البيت» ولا «نرسل الطرد في البريد»).
   - السبب والكيفية والمالك متّسقة معاً، والفعل يصلح عادةً متكررة وفي المبني للمجهول. */
LT.UNITS = [
  {
    ar: 'الحياة اليومية', color: '#d62839', icon: '🏠', s: [
      ['read', '📖', 'قراءة الكتاب', 'the book|book', 'el libro', 'le livre|m', 'il libro|m', 'o livro', 'n|Buch', 'الكتاب|كتاب|m', 19, 0, 0, 0, 0],
      ['charge', '📱', 'شحن الهاتف', 'the phone|phone', 'el teléfono', 'le téléphone|m', 'il telefono|m', 'o celular', 'n|Handy', 'الهاتف|هاتف|m', 5, 18, 16, 1, 1],
      ['clean', '👓', 'تنظيف النظارة', 'the glasses|glasses|pl', 'los lentes|pl', 'les lunettes|f|pl', 'gli occhiali|m|pl', 'os óculos|pl', 'f|Brille', 'النظارة|نظارة|f', 14, 19, 18, 7, 1],
      ['iron', '👔', 'كيّ القميص', 'the shirt|shirt', 'la camisa', 'la chemise|f', 'la camicia|f', 'a camisa', 'n|Hemd', 'القميص|قميص|m', 16, 1, 2, 3, 1],
      ['carry', '👜', 'حمل الحقيبة', 'the bag|bag', 'la bolsa', 'le sac|m', 'la borsa|f', 'a bolsa', 'f|Tasche', 'الحقيبة|حقيبة|f', 13, 7, 4, 2, 3],
      ['wash', '🚗', 'غسل السيارة', 'the car|car', 'el carro', 'la voiture|f', 'la macchina|f', 'o carro', 'n|Auto', 'السيارة|سيارة|f', 23, 7, 9, 9, 3],
      ['fold', '👚', 'طيّ الملابس', 'the clothes|clothes|pl', 'la ropa', 'les vêtements|m|pl', 'i vestiti|m|pl', 'as roupas|pl', 'f|Wäsche', 'الملابس|ملابس|f', 24, 7, 2, 1, 3],
      ['read', '📰', 'قراءة الجريدة', 'the newspaper|newspaper', 'el periódico', 'le journal|m', 'il giornale|m', 'o jornal', 'f|Zeitung', 'الجريدة|جريدة|f', 20, 1, 1, 3, 1],
      ['use', '💻', 'استخدام الحاسوب', 'the computer|computer', 'la computadora', "l'ordinateur|m", 'il computer|m', 'o computador', 'm|Computer', 'الحاسوب|حاسوب|m', 6, 10, 6, 0, 0],
      ['water', '🪴', 'سقي النباتات', 'the plants|plants|pl', 'las plantas|pl', 'les plantes|f|pl', 'le piante|f|pl', 'as plantas|pl', 'p|Pflanzen', 'النباتات|نباتات|f', 25, 14, 2, 6, 2],
    ]
  },
  {
    ar: 'المال والتسوّق', color: '#1e6fd9', icon: '💳', s: [
      ['buy', '🎟️', 'شراء التذاكر', 'the tickets|tickets|pl', 'los boletos|pl', 'les billets|m|pl', 'i biglietti|m|pl', 'as passagens|pl', 'p|Tickets', 'التذاكر|تذاكر|f', 13, 7, 14, 4, 3],
      ['pay', '🧾', 'دفع الفاتورة', 'the bill|bill', 'la cuenta', "l'addition|f", 'il conto|m', 'a conta', 'f|Rechnung', 'الفاتورة|فاتورة|f', 5, 8, 14, 4, 3],
      ['count', '💵', 'عدّ النقود', 'the money|money', 'el dinero', "l'argent|m", 'i soldi|m|pl', 'o dinheiro', 'n|Geld', 'النقود|نقود|f', 9, 1, 2, 8, 2],
      ['order', '🍕', 'طلب البيتزا', 'the pizza|pizza', 'la pizza', 'la pizza|f', 'la pizza|f', 'a pizza', 'f|Pizza', 'البيتزا|بيتزا|f', 14, 17, 5, 0, 3],
      ['check', '🧾', 'مراجعة الإيصال', 'the receipt|receipt', 'el recibo', 'le ticket de caisse|m', 'lo scontrino|m', 'o recibo', 'm|Kassenbon', 'الإيصال|إيصال|m', 17, 3, 2, 2, 2],
      ['eat', '🍰', 'أكل الكعكة', 'the cake|cake', 'el pastel', 'le gâteau|m', 'la torta|f', 'o bolo', 'm|Kuchen', 'الكعكة|كعكة|f', 11, 11, 0, 4, 3],
      ['make', '☕', 'تحضير القهوة', 'the coffee|coffee', 'el café', 'le café|m', 'il caffè|m', 'o café', 'm|Kaffee', 'القهوة|قهوة|f', 9, 15, 1, 8, 1],
      ['washcup', '🍵', 'غسل الكوب', 'the cup|cup', 'la taza', 'la tasse|f', 'la tazza|f', 'a xícara', 'f|Tasse', 'الكوب|كوب|m', 26, 15, 9, 5, 1],
      ['buy', '💐', 'شراء الورود', 'the flowers|flowers|pl', 'las flores|pl', 'les fleurs|f|pl', 'i fiori|m|pl', 'as flores|pl', 'p|Blumen', 'الورود|ورود|f', 8, 11, 13, 2, 3],
      ['sign', '✍️', 'توقيع المستندات', 'the documents|documents|pl', 'los documentos|pl', 'les documents|m|pl', 'i documenti|m|pl', 'os documentos|pl', 'p|Dokumente', 'المستندات|مستندات|f', 28, 1, 7, 8, 1],
    ]
  },
  {
    ar: 'المدرسة والجامعة', color: '#1a936f', icon: '🎓', s: [
      ['copy', '🗒️', 'نسخ الملاحظات', 'the notes|notes|pl', 'los apuntes|pl', 'les notes|f|pl', 'gli appunti|m|pl', 'as anotações|pl', 'p|Notizen', 'الملاحظات|ملاحظات|f', 6, 0, 4, 4, 0],
      ['use', '📕', 'استخدام القاموس', 'the dictionary|dictionary', 'el diccionario', 'le dictionnaire|m', 'il dizionario|m', 'o dicionário', 'n|Wörterbuch', 'القاموس|قاموس|m', 12, 5, 6, 5, 0],
      ['check', '📝', 'مراجعة الواجب', 'the homework|homework', 'la tarea', 'les devoirs|m|pl', 'i compiti|m|pl', 'a lição de casa', 'p|Hausaufgaben', 'الواجب|واجب|m', 6, 16, 2, 0, 2],
      ['correct', '🖍️', 'تصحيح الامتحانات', 'the exams|exams|pl', 'los exámenes|pl', 'les examens|m|pl', 'gli esami|m|pl', 'as provas|pl', 'p|Prüfungen', 'الامتحانات|امتحانات|f', 26, 5, 7, 12, 2],
      ['print', '🖨️', 'طباعة المستندات', 'the documents|documents|pl', 'los documentos|pl', 'les documents|m|pl', 'i documenti|m|pl', 'os documentos|pl', 'p|Dokumente', 'المستندات|مستندات|f', 9, 10, 17, 4, 1],
      ['park', '🚲', 'ركن الدراجة', 'the bike|bike', 'la bicicleta', 'le vélo|m', 'la bicicletta|f', 'a bicicleta', 'n|Fahrrad', 'الدراجة|دراجة|f', 26, 5, 1, 10, 1],
      ['organize', '🗂️', 'تنظيم الملفات', 'the files|files|pl', 'los archivos|pl', 'les fichiers|m|pl', 'i file|m|pl', 'os arquivos|pl', 'p|Dateien', 'الملفات|ملفات|f', 20, 10, 2, 11, 3],
      ['carry', '🎒', 'حمل حقيبة الظهر', 'the backpack|backpack', 'la mochila', 'le sac à dos|m', 'lo zaino|m', 'a mochila', 'm|Rucksack', 'حقيبة الظهر|حقيبة ظهر|f', 19, 18, 22, 1, 1],
      ['check', '✅', 'مراجعة الإجابات', 'the answers|answers|pl', 'las respuestas|pl', 'les réponses|f|pl', 'le risposte|f|pl', 'as respostas|pl', 'p|Antworten', 'الإجابات|إجابات|f', 12, 0, 2, 4, 0],
      ['draw', '🐈', 'رسم القطة', 'the cat|cat', 'el gato', 'le chat|m', 'il gatto|m', 'o gato', 'f|Katze', 'القطة|قطة|f', 4, 4, 7, 6, 3],
    ]
  },
  {
    ar: 'السفر والمدينة', color: '#e07a12', icon: '✈️', s: [
      ['drive', '🚗', 'قيادة السيارة', 'the car|car', 'el carro', 'la voiture|f', 'la macchina|f', 'o carro', 'n|Auto', 'السيارة|سيارة|f', 10, 1, 0, 3, 0],
      ['park', '🅿️', 'ركن السيارة', 'the car|car', 'el carro', 'la voiture|f', 'la macchina|f', 'o carro', 'n|Auto', 'السيارة|سيارة|f', 13, 1, 2, 9, 1],
      ['carry', '🧳', 'حمل حقيبة السفر', 'the suitcase|suitcase', 'la maleta', 'la valise|f', 'la valigia|f', 'a mala', 'm|Koffer', 'حقيبة السفر|حقيبة سفر|f', 18, 7, 2, 7, 3],
      ['pack', '🎒', 'تجهيز حقيبة السفر', 'the suitcase|suitcase', 'la maleta', 'la valise|f', 'la valigia|f', 'a mala', 'm|Koffer', 'حقيبة السفر|حقيبة سفر|f', 16, 7, 1, 1, 3],
      ['check', '🛂', 'مراجعة جواز السفر', 'the passport|passport', 'el pasaporte', 'le passeport|m', 'il passaporto|m', 'o passaporte', 'm|Pass', 'جواز السفر|جواز سفر|m', 22, 7, 2, 3, 3],
      ['read', '🗺️', 'قراءة الخريطة', 'the map|map', 'el mapa', 'la carte|f', 'la mappa|f', 'o mapa', 'f|Karte', 'الخريطة|خريطة|f', 10, 7, 2, 4, 3],
      ['show', '🖼️', 'عرض الصور', 'the photos|photos|pl', 'las fotos|pl', 'les photos|f|pl', 'le foto|f|pl', 'as fotos|pl', 'p|Fotos', 'الصور|صور|f', 5, 4, 10, 10, 3],
      ['charge', '📷', 'شحن الكاميرا', 'the camera|camera', 'la cámara', "l'appareil photo|m", 'la macchina fotografica|f', 'a câmera', 'f|Kamera', 'الكاميرا|كاميرا|f', 20, 7, 16, 9, 2],
      ['wash', '👕', 'غسل الملابس', 'the clothes|clothes|pl', 'la ropa', 'les vêtements|m|pl', 'i vestiti|m|pl', 'as roupas|pl', 'f|Wäsche', 'الملابس|ملابس|f', 22, 7, 4, 0, 3],
      ['dry', '☀️', 'تجفيف الملابس', 'the clothes|clothes|pl', 'la ropa', 'les vêtements|m|pl', 'i vestiti|m|pl', 'as roupas|pl', 'f|Wäsche', 'الملابس|ملابس|f', 25, 7, 21, 0, 3],
    ]
  },
  {
    ar: 'العمل والمكتب', color: '#7b4fd6', icon: '💼', s: [
      ['write', '📄', 'كتابة التقرير', 'the report|report', 'el informe', 'le rapport|m', 'la relazione|f', 'o relatório', 'm|Bericht', 'التقرير|تقرير|m', 20, 15, 1, 11, 2],
      ['translate', '🌍', 'ترجمة المستندات', 'the documents|documents|pl', 'los documentos|pl', 'les documents|m|pl', 'i documenti|m|pl', 'os documentos|pl', 'p|Dokumente', 'المستندات|مستندات|f', 9, 1, 2, 11, 1],
      ['open', '✉️', 'فتح الرسائل', 'the letters|letters|pl', 'las cartas|pl', 'les lettres|f|pl', 'le lettere|f|pl', 'as cartas|pl', 'p|Briefe', 'الرسائل|رسائل|f', 9, 1, 8, 8, 1],
      ['show', '📋', 'عرض الخطة', 'the plan|plan', 'el plan', 'le plan|m', 'il piano|m', 'o plano', 'm|Plan', 'الخطة|خطة|f', 5, 15, 20, 8, 1],
      ['save', '💾', 'حفظ الملفات', 'the files|files|pl', 'los archivos|pl', 'les fichiers|m|pl', 'i file|m|pl', 'os arquivos|pl', 'p|Dateien', 'الملفات|ملفات|f', 20, 10, 1, 11, 2],
      ['charge', '🔋', 'شحن الحاسوب المحمول', 'the laptop|laptop', 'la laptop', "l'ordinateur portable|m", 'il portatile|m', 'o notebook', 'm|Laptop', 'الحاسوب المحمول|حاسوب|m', 22, 1, 16, 8, 2],
      ['prepare', '📊', 'تجهيز العرض التقديمي', 'the presentation|presentation', 'la presentación', 'la présentation|f', 'la presentazione|f', 'a apresentação', 'f|Präsentation', 'العرض التقديمي|عرض|m', 6, 15, 2, 11, 3],
      ['organize', '📁', 'تنظيم المستندات', 'the documents|documents|pl', 'los documentos|pl', 'les documents|m|pl', 'i documenti|m|pl', 'os documentos|pl', 'p|Dokumente', 'المستندات|مستندات|f', 9, 15, 2, 8, 1],
      ['teach', '🧑‍🏫', 'تدريس الفصل', 'the class|class', 'la clase', 'le cours|m', 'la lezione|f', 'a aula', 'f|Klasse', 'الفصل|فصل|m', 26, 8, 0, 4, 0],
      ['write', '👨‍💻', 'كتابة الكود', 'the code|code', 'el código', 'le code|m', 'il codice|m', 'o código', 'm|Code', 'الكود|كود|m', 0, 10, 2, 11, 0],
    ]
  },
  {
    ar: 'العائلة والمناسبات', color: '#0e8fa3', icon: '🎉', s: [
      ['iron', '👗', 'كيّ الفستان', 'the dress|dress', 'el vestido', 'la robe|f', 'il vestito|m', 'o vestido', 'n|Kleid', 'الفستان|فستان|m', 22, 2, 2, 1, 2],
      ['clean', '👞', 'تنظيف الحذاء', 'the shoes|shoes|pl', 'los zapatos|pl', 'les chaussures|f|pl', 'le scarpe|f|pl', 'os sapatos|pl', 'p|Schuhe', 'الحذاء|حذاء|m', 25, 2, 18, 0, 3],
      ['read', '💌', 'قراءة الرسالة', 'the letter|letter', 'la carta', 'la lettre|f', 'la lettera|f', 'a carta', 'm|Brief', 'الرسالة|رسالة|f', 14, 19, 11, 7, 2],
      ['edit', '🤳', 'تعديل الصور', 'the photos|photos|pl', 'las fotos|pl', 'les photos|f|pl', 'le foto|f|pl', 'as fotos|pl', 'p|Fotos', 'الصور|صور|f', 20, 2, 10, 10, 2],
      ['cut', '🎂', 'تقطيع الكعكة', 'the cake|cake', 'el pastel', 'le gâteau|m', 'la torta|f', 'o bolo', 'm|Kuchen', 'الكعكة|كعكة|f', 11, 11, 8, 1, 3],
      ['wrap', '🎁', 'تغليف الهدايا', 'the gifts|gifts|pl', 'los regalos|pl', 'les cadeaux|m|pl', 'i regali|m|pl', 'os presentes|pl', 'p|Geschenke', 'الهدايا|هدايا|f', 16, 11, 2, 10, 3],
      ['fix', '🧸', 'إصلاح الألعاب', 'the toys|toys|pl', 'los juguetes|pl', 'les jouets|m|pl', 'i giocattoli|m|pl', 'os brinquedos|pl', 'p|Spielsachen', 'الألعاب|ألعاب|f', 23, 13, 2, 6, 3],
      ['charge', '📲', 'شحن الجهاز اللوحي', 'the tablet|tablet', 'la tableta', 'la tablette|f', 'il tablet|m', 'o tablet', 'n|Tablet', 'الجهاز اللوحي|جهاز|m', 20, 16, 16, 0, 2],
      ['sew', '🧥', 'خياطة السترة', 'the jacket|jacket', 'la chaqueta', 'la veste|f', 'la giacca|f', 'a jaqueta', 'f|Jacke', 'السترة|سترة|f', 14, 2, 19, 9, 3],
      ['fill', '🍶', 'ملء القارورة', 'the bottle|bottle', 'la botella', 'la bouteille|f', 'la bottiglia|f', 'a garrafa', 'f|Flasche', 'القارورة|قارورة|f', 27, 6, 15, 4, 1],
    ]
  },
];
