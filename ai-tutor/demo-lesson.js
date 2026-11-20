// درس تجريبي جاهز يعمل بلا أي مفتاح (بصوت المتصفح المجاني)
export const DEMO_LESSONS = [
  {
    question: "كيف قسّم العلماء الكائنات الحية إلى ست ممالك؟",
    lesson: {
      title: "الممالك الست للكائنات الحية",
      scenes: [
        {
          narration: "طيّب، تخيّل معي أن كل الكائنات الحية على الأرض موجودة في صندوق واحد كبير. العلماء قسّموها إلى ست ممالك، حسب نوع الخلية وطريقة التغذية.",
          actions: [
            { type: "node", cue: "صندوق واحد كبير", id: "all", text: "الكائنات الحية", x: 500, y: 120, color: "ink" },
            { type: "counter", cue: "ست ممالك", id: "six", text: "ممالك", values: [6], x: 150, y: 130, color: "red" },
          ],
        },
        {
          narration: "نبدأ بالأبسط: البكتيريا والبدائيات. خلاياها بدائية النواة، يعني ما عندها نواة حقيقية.",
          actions: [
            { type: "node", cue: "البكتيريا", id: "bac", text: "البكتيريا", x: 890, y: 290, color: "blue" },
            { type: "arrow", cue: "البكتيريا", from: "all", to: "bac" },
            { type: "node", cue: "البدائيات", id: "arc", text: "البدائيات", x: 730, y: 290, color: "blue" },
            { type: "arrow", cue: "البدائيات", from: "all", to: "arc" },
            { type: "text", cue: "بدائية النواة", id: "pro", text: "بلا نواة حقيقية", x: 810, y: 400, color: "red" },
          ],
        },
        {
          narration: "بعدها الطلائعيات، مثل الأميبا، وهي غالباً خلية واحدة لكن لها نواة حقيقية. ثم الفطريات، وهي تتغذى بامتصاص الغذاء من حولها.",
          actions: [
            { type: "node", cue: "الطلائعيات", id: "pst", text: "الطلائعيات", x: 565, y: 290, color: "purple" },
            { type: "arrow", cue: "الطلائعيات", from: "all", to: "pst" },
            { type: "emoji", cue: "الأميبا", text: "🦠", x: 565, y: 380 },
            { type: "node", cue: "الفطريات", id: "fun", text: "الفطريات", x: 405, y: 290, color: "orange" },
            { type: "arrow", cue: "الفطريات", from: "all", to: "fun" },
            { type: "emoji", cue: "بامتصاص", text: "🍄", x: 405, y: 380 },
          ],
        },
        {
          narration: "وأخيراً المملكتان اللتان نعرفهما جيداً: النباتات، تصنع غذاءها بنفسها بالبناء الضوئي، والحيوانات، تتغذى على غيرها.",
          actions: [
            { type: "node", cue: "النباتات", id: "pla", text: "النباتات", x: 250, y: 290, color: "green" },
            { type: "arrow", cue: "النباتات", from: "all", to: "pla" },
            { type: "emoji", cue: "البناء الضوئي", text: "🌿", x: 250, y: 380 },
            { type: "node", cue: "الحيوانات", id: "ani", text: "الحيوانات", x: 100, y: 290, color: "red" },
            { type: "arrow", cue: "الحيوانات", from: "all", to: "ani" },
            { type: "emoji", cue: "على غيرها", text: "🦁", x: 100, y: 380 },
          ],
        },
        {
          narration: "لاحظ الفرق المهم: أول مملكتين بلا نواة حقيقية، أما الأربع الباقية فخلاياها حقيقية النواة.",
          actions: [
            { type: "highlight", cue: "أول مملكتين", to: "pro" },
            { type: "underline", cue: "الأربع الباقية", to: "pst", color: "green" },
            { type: "underline", cue: "الأربع الباقية", to: "fun", color: "green" },
            { type: "underline", cue: "حقيقية النواة", to: "pla", color: "green" },
            { type: "underline", cue: "حقيقية النواة", to: "ani", color: "green" },
          ],
        },
        {
          narration: "ولو قارنّا عدد الأنواع المعروفة تقريباً، ستجد أن الحيوانات تتصدّر بفارق كبير، ثم النباتات، ثم الفطريات.",
          actions: [
            { type: "clear", cue: "ولو قارنّا" },
            { type: "heading", cue: "ولو قارنّا", text: "الأنواع الموصوفة (بالآلاف تقريباً)" },
            { type: "bar_chart", cue: "عدد الأنواع", id: "ch", labels: ["الحيوانات", "النباتات", "الفطريات", "الطلائعيات"], values: [1500, 390, 150, 70], x: 500, y: 360, w: 700, h: 400 },
            { type: "highlight", cue: "تتصدّر", to: "ch", color: "orange" },
          ],
        },
        {
          narration: "الخلاصة: ست ممالك، اثنتان بلا نواة حقيقية، وأربع حقيقية النواة. سؤال لك: الخميرة، في أي مملكة تتوقعها؟",
          actions: [
            { type: "clear", cue: "الخلاصة" },
            { type: "heading", cue: "الخلاصة", text: "الخلاصة" },
            { type: "list", cue: "ست ممالك", id: "sum", x: 760, y: 170, items: ["٢ بلا نواة: البكتيريا، البدائيات", "٤ حقيقية النواة: الطلائعيات، الفطريات، النباتات، الحيوانات"] },
            { type: "emoji", cue: "الخميرة", text: "🤔", x: 500, y: 420 },
            { type: "text", cue: "في أي مملكة", text: "الخميرة ← ؟", x: 500, y: 520, color: "purple" },
          ],
        },
      ],
    },
  },
  {
    question: "اشرح لي قانون نيوتن الثاني",
    lesson: {
      title: "قانون نيوتن الثاني",
      scenes: [
        {
          narration: "قانون نيوتن الثاني يقول ببساطة: القوة تساوي الكتلة مضروبة في التسارع.",
          actions: [
            { type: "formula", cue: "القوة تساوي", id: "f", text: "F = m × a", x: 500, y: 200 },
          ],
        },
        {
          narration: "يعني لو دفعت عربة فارغة، تتحرك بسرعة. لكن لو كانت محمّلة، نفس الدفعة تعطيها تسارعاً أقل.",
          actions: [
            { type: "node", cue: "عربة فارغة", id: "e", text: "عربة فارغة", x: 750, y: 360, color: "green" },
            { type: "emoji", cue: "بسرعة", text: "🛒💨", x: 750, y: 470 },
            { type: "node", cue: "محمّلة", id: "l", text: "عربة محمّلة", x: 250, y: 360, color: "orange" },
            { type: "emoji", cue: "تسارعاً أقل", text: "🛒🐢", x: 250, y: 470 },
            { type: "arrow", cue: "نفس الدفعة", from: "e", to: "l", text: "نفس القوة" },
          ],
        },
        {
          narration: "مثال سريع: قوة عشرين نيوتن على كتلة أربعة كيلوغرامات، تعطي تسارعاً قدره خمسة أمتار لكل ثانية مربعة.",
          actions: [
            { type: "clear", cue: "مثال سريع" },
            { type: "formula", cue: "عشرين نيوتن", id: "x1", text: "a = F ÷ m", x: 500, y: 180 },
            { type: "formula", cue: "أربعة كيلوغرامات", id: "x2", text: "a = 20 ÷ 4", x: 500, y: 290, color: "blue" },
            { type: "formula", cue: "خمسة أمتار", id: "x3", text: "a = 5 m/s²", x: 500, y: 400, color: "green" },
            { type: "highlight", cue: "ثانية مربعة", to: "x3", color: "green" },
          ],
        },
      ],
    },
  },
];
