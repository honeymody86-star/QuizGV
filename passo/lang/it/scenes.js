/*
 * Passo a Passo — "Alone in Italy": survival scenes.
 * The learner hears Italian only and must answer before the clock runs out.
 * Each "you" turn lists choices; the first is correct (choices are shuffled on screen).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ItScenes = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const npc = (it, ar, en) => ({ who: 'npc', it, m: { ar, en } });
  const you = (choices, ar, en) => ({ who: 'you', choices, m: { ar, en } });

  return [
    {
      id: 'bar', icon: '☕', place: { ar: 'المقهى', en: 'At the café' }, it: 'Al bar', level: 'A1',
      npcName: 'Giulia', npcIcon: '👩‍🍳', sky: ['#7c2d12', '#f59e0b'],
      intro: { ar: 'دخلت مقهى في روما الصبح. الباريستا تكلّمك بالإيطالي بس!', en: 'You walk into a café in Rome in the morning. The barista only speaks Italian!' },
      lines: [
        npc('Buongiorno! Cosa prende?', 'صباح الخير! وش تطلب؟', 'Good morning! What will you have?'),
        you(['Vorrei un cappuccino, per favore.', 'Ho un cappuccino ieri.', 'Sono un cappuccino.'], 'أبغى كابتشينو لو سمحت.', "I'd like a cappuccino, please."),
        npc("Certo. Qualcos'altro?", 'أكيد. تبغى شي ثاني؟', 'Sure. Anything else?'),
        you(['Sì, un cornetto alla crema.', 'Sì, ho mangiato domani.', 'No, sono stanco ieri.'], 'إيه، كرواسون بالكريمة.', 'Yes, a cream croissant.'),
        npc('Qui o da portare via?', 'هنا ولا سفري؟', 'For here or to take away?'),
        you(['Qui, grazie.', 'Domani, grazie.', 'Perché piove.'], 'هنا، شكرًا.', 'Here, thanks.'),
        npc('Sono quattro euro e cinquanta.', 'الحساب أربعة يورو ونص.', "That's four euros fifty."),
        you(['Ecco. Posso pagare con la carta?', 'Ecco. Ho pagato la carta domani?', 'La carta è stanca.'], 'تفضلي. أقدر أدفع بالبطاقة؟', 'Here you are. Can I pay by card?'),
        npc('Certo! Buona giornata!', 'أكيد! يومك سعيد!', 'Of course! Have a nice day!'),
        you(['Grazie, anche a lei!', 'Prego, sono andato!', 'Buonanotte, mangio!'], 'شكرًا، ولك بعد!', 'Thank you, you too!'),
      ],
    },
    {
      id: 'station', icon: '🚆', place: { ar: 'محطة القطار', en: 'At the station' }, it: 'In stazione', level: 'A1',
      npcName: 'Marco', npcIcon: '👨‍💼', sky: ['#1e3a8a', '#38bdf8'],
      intro: { ar: 'لازم توصل فلورنسا اليوم. موظف التذاكر ما يعرف إنجليزي.', en: 'You must get to Florence today. The ticket clerk speaks no English.' },
      lines: [
        npc('Buongiorno, dove deve andare?', 'صباح الخير، وين تبغى تروح؟', 'Good morning, where do you need to go?'),
        you(['Vorrei andare a Firenze.', 'Sono andato Firenze domani.', 'Firenze mangia la pasta.'], 'أبغى أروح فلورنسا.', "I'd like to go to Florence."),
        npc('Solo andata o andata e ritorno?', 'ذهاب بس ولا ذهاب وعودة؟', 'One way or return?'),
        you(['Andata e ritorno, per favore.', 'Ritorno ieri, grazie.', 'Andiamo e mangiamo.'], 'ذهاب وعودة لو سمحت.', 'Return, please.'),
        npc('Il treno parte alle dieci dal binario tre.', 'القطار يطلع الساعة عشر من الرصيف ثلاثة.', 'The train leaves at ten from platform three.'),
        you(['Scusi, a che ora arriva a Firenze?', 'Scusi, a che ora sei arrivato domani?', 'Il binario è stanco.'], 'لو سمحت، متى يوصل فلورنسا؟', 'Excuse me, what time does it arrive in Florence?'),
        npc('Arriva a mezzogiorno.', 'يوصل الساعة ١٢ الظهر.', 'It arrives at noon.'),
        you(['Perfetto, grazie mille!', 'Perfetto, ho mezzogiorno!', 'Non mangio il treno.'], 'تمام، شكرًا جزيلًا!', 'Perfect, thanks a lot!'),
      ],
    },
    {
      id: 'hotel', icon: '🏨', place: { ar: 'الفندق', en: 'At the hotel' }, it: 'In albergo', level: 'A2',
      npcName: 'Francesca', npcIcon: '👩‍💼', sky: ['#4c1d95', '#c084fc'],
      intro: { ar: 'وصلت الفندق بالليل وأنت تعبان. خلّص تسجيل الدخول بالإيطالي.', en: 'You reach the hotel late and tired. Check in — in Italian.' },
      lines: [
        npc('Buonasera! Ha una prenotazione?', 'مساء الخير! عندك حجز؟', 'Good evening! Do you have a reservation?'),
        you(['Sì, ho prenotato una camera.', 'Sì, prenoterò ieri.', 'No, sono una camera.'], 'إيه، حجزت غرفة.', 'Yes, I booked a room.'),
        npc('Per quante notti?', 'كم ليلة؟', 'For how many nights?'),
        you(['Per tre notti.', 'Per tre caffè.', 'Tre volte ieri.'], 'ثلاث ليالي.', 'For three nights.'),
        npc('Mi può dare un documento, per favore?', 'ممكن تعطيني إثبات هوية لو سمحت؟', 'Can you give me an ID, please?'),
        you(['Ecco il mio passaporto.', 'Ecco il mio treno.', 'Il passaporto mangia.'], 'تفضلي جوازي.', "Here's my passport."),
        npc('La colazione è dalle sette alle dieci.', 'الفطور من سبعة لعشرة.', 'Breakfast is from seven to ten.'),
        you(['A che ora devo lasciare la camera?', 'A che ora ho dovuto la colazione domani?', 'Sette dieci mangiare.'], 'متى لازم أطلع من الغرفة؟', 'What time do I have to leave the room?'),
        npc('Entro le undici. Buon soggiorno!', 'قبل الساعة ١١. إقامة سعيدة!', 'By eleven. Enjoy your stay!'),
        you(['Grazie, buonanotte!', 'Prego, buongiorno ieri!', 'Undici camere, grazie!'], 'شكرًا، تصبحين على خير!', 'Thanks, good night!'),
      ],
    },
    {
      id: 'street', icon: '🗺️', place: { ar: 'تايه في الشارع', en: 'Lost in the street' }, it: 'Chiedere la strada', level: 'A2',
      npcName: 'Signor Rossi', npcIcon: '👴', sky: ['#14532d', '#4ade80'],
      intro: { ar: 'جوالك فصل شحن وأنت تبغى الكولوسيوم. اسأل رجّال كبير في الشارع.', en: 'Your phone is dead and you need the Colosseum. Ask an old man in the street.' },
      lines: [
        you(['Scusi, dov\'è il Colosseo?', 'Scusi, chi è il Colosseo?', 'Il Colosseo è mangiato?'], 'لو سمحت، وين الكولوسيوم؟', 'Excuse me, where is the Colosseum?'),
        npc('Vada dritto e poi giri a destra.', 'امش على طول وبعدين لف يمين.', 'Go straight and then turn right.'),
        you(['È lontano?', 'È stanco?', 'Sono lontano ieri?'], 'بعيد؟', 'Is it far?'),
        npc('No, sono dieci minuti a piedi.', 'لا، عشر دقايق مشي.', "No, it's ten minutes on foot."),
        you(["Posso prendere l'autobus?", "Posso mangiare l'autobus?", "Ho preso domani l'autobus?"], 'أقدر آخذ الباص؟', 'Can I take the bus?'),
        npc('Sì, il settantacinque si ferma qui davanti.', 'إيه، باص ٧٥ يوقف هنا قدام.', 'Yes, the 75 stops right here.'),
        you(['Grazie mille, molto gentile!', 'Prego, molto lontano!', 'Grazie, sono un autobus!'], 'شكرًا جزيلًا، ما قصّرت!', 'Thanks a lot, very kind!'),
      ],
    },
    {
      id: 'restaurant', icon: '🍝', place: { ar: 'المطعم', en: 'At the restaurant' }, it: 'Al ristorante', level: 'B1',
      npcName: 'Luigi', npcIcon: '🧑‍🍳', sky: ['#7f1d1d', '#fb7185'],
      intro: { ar: 'عشاء في مطعم شعبي. الجرسون سريع، وأنت لازم تنتبه للأكل اللي فيه لحم خنزير.', en: 'Dinner at a local trattoria. The waiter is fast, and you need to avoid pork.' },
      lines: [
        npc('Buonasera, quanti siete?', 'مساء الخير، كم شخص أنتم؟', 'Good evening, how many are you?'),
        you(['Siamo in due.', 'Abbiamo due anni.', 'Sono due pizze.'], 'احنا اثنين.', 'There are two of us.'),
        npc('Prego, accomodatevi. Ecco il menù.', 'تفضلوا اجلسوا. هذا المنيو.', 'Please, have a seat. Here is the menu.'),
        you(['Cosa ci consiglia?', 'Cosa ha mangiato domani?', 'Il menù è stanco.'], 'وش تنصحنا؟', 'What do you recommend?'),
        npc('Oggi la carbonara è molto buona.', 'اليوم الكاربونارا لذيذة مرّة.', 'Today the carbonara is very good.'),
        you(['Non mangio carne di maiale. Avete un piatto vegetariano?', 'Mangerò il maiale ieri.', 'Vorrei la carbonara domani ieri.'], 'ما آكل لحم خنزير. عندكم طبق نباتي؟', "I don't eat pork. Do you have a vegetarian dish?"),
        npc("Certo, abbiamo le penne all'arrabbiata.", 'أكيد، عندنا بيني أرابياتا.', 'Of course, we have penne arrabbiata.'),
        you(["Perfetto, e un'acqua naturale, per favore.", "Perfetto, e un'acqua stanca.", "Ho bevuto un'acqua domani."], 'تمام، وموية عادية لو سمحت.', 'Perfect, and still water, please.'),
        npc('Ecco a voi. Buon appetito!', 'تفضلوا. بالعافية!', 'Here you are. Enjoy your meal!'),
        you(['Grazie! Il conto, per favore.', 'Grazie! Il conto è stanco.', 'Prego! Mangiamo il conto.'], 'شكرًا! الحساب لو سمحت.', 'Thanks! The bill, please.'),
      ],
    },
  ];
});
