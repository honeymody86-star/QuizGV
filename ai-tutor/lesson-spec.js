// مواصفات "سيناريو الدرس" الذي يكتبه النموذج: نص الشرح الصوتي + أوامر الرسم المتزامنة معه.
// يُستورد هذا الملف من الواجهة (المتصفح) ومن الخادم الوسيط (worker) معاً.

export const COLORS = ["ink", "blue", "red", "green", "orange", "purple"];

export const ACTION_TYPES = [
  "heading",   // عنوان أعلى اللوح
  "node",      // صندوق مرسوم باليد بداخله نص (مفهوم)
  "circle",    // دائرة بداخلها نص
  "arrow",     // سهم من عنصر (from) إلى عنصر (to) مع تسمية اختيارية (text)
  "text",      // نص حر
  "list",      // قائمة نقاط تظهر واحدة تلو الأخرى (items)
  "formula",   // معادلة أو رمز رياضي/كيميائي (يُكتب من اليسار لليمين)
  "bar_chart", // رسم بياني بالأعمدة (labels, values)
  "pie_chart", // رسم دائري (labels, values)
  "counter",   // رقم كبير يعدّ تصاعدياً حتى values[0] مع تسمية text
  "emoji",     // رمز تعبيري كبير يظهر بحركة (text)
  "highlight", // دائرة حمراء حول عنصر موجود (to = id العنصر)
  "underline", // خط تحت عنصر موجود (to)
  "remove",    // إزالة عنصر (to)
  "clear",     // مسح اللوح بالكامل
];

const action = {
  type: "object",
  additionalProperties: false,
  required: ["type", "cue"],
  properties: {
    type: { type: "string", enum: ACTION_TYPES },
    cue: { type: "string", description: "كلمة أو عبارة قصيرة منسوخة حرفياً من narration، يظهر العنصر لحظة نطقها" },
    id: { type: "string" },
    text: { type: "string" },
    x: { type: "number" },
    y: { type: "number" },
    w: { type: "number" },
    h: { type: "number" },
    from: { type: "string" },
    to: { type: "string" },
    color: { type: "string", enum: COLORS },
    items: { type: "array", items: { type: "string" } },
    labels: { type: "array", items: { type: "string" } },
    values: { type: "array", items: { type: "number" } },
  },
};

export const LESSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["title", "scenes"],
  properties: {
    title: { type: "string" },
    scenes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["narration", "actions"],
        properties: {
          narration: { type: "string" },
          actions: { type: "array", items: action },
        },
      },
    },
  },
};

export const SYSTEM_PROMPT = `أنت معلّم خصوصي ماهر يشرح على سبورة بيضاء، مثل فيديوهات الشرح القصيرة.
مهمتك: تحويل سؤال الطالب إلى "سيناريو درس" قصير يُعرض كصوت بشري طبيعي وفي الوقت نفسه رسوم تُرسم على السبورة بالتزامن مع الكلام.

## الصوت (narration)
- اكتب بلغة سؤال الطالب. إن كان بالعربية فاستخدم فصحى مبسّطة دافئة بنبرة معلّم ودود يتكلم لا يقرأ: جمل قصيرة، علامات ترقيم طبيعية، وعبارات وصل مثل: "طيّب،" "لاحظ معي،" "يعني ببساطة،".
- لا تكتب رموزاً أو اختصارات لا تُنطق جيداً (اكتب "يساوي" بدل "="، و"ثاني أكسيد الكربون" بدل CO2 في الصوت، ويمكن كتابة الرمز على السبورة).
- من ٤ إلى ٨ مشاهد. كل مشهد ١ إلى ٣ جمل (حتى ٢٥٠ حرفاً تقريباً). المشهد الأخير خلاصة سريعة أو سؤال تحفيزي.

## السبورة (actions)
- السبورة إحداثياتها: العرض ١٠٠٠ والارتفاع ٦٢٠، و(x,y) هو مركز العنصر. اترك هامشاً ٦٠ من الحواف. العنوان heading يأخذ أعلى السبورة (y≈45) فابدأ المحتوى من y≈120.
- كل عنصر يحتاج id فريداً قصيراً بالإنجليزية (مثل n1, n2, chart1) حتى تشير إليه الأسهم والتظليل.
- cue إجباري: كلمة أو عبارة قصيرة منسوخة حرفياً كما هي من narration الخاصة بالمشهد نفسه، ويظهر العنصر لحظة نطقها. رتّب actions بترتيب ظهور الـ cue في الجملة.
- نص الصناديق قصير (١ إلى ٤ كلمات). لا تكتب الجمل الطويلة على السبورة؛ السبورة للكلمات المفتاحية والعلاقات والأرقام.
- استخدم المخططات الانسيابية (node + arrow) للتسلسل والتصنيف، وbar_chart/pie_chart فقط مع أرقام صحيحة معروفة، وcounter لرقم مهم واحد، وformula للمعادلات، وhighlight للتأكيد على عنصر عند ذكره مرة ثانية.
- لا تجعل العناصر تتداخل: وزّعها بمسافات ≥ ١٥٠ أفقياً و≥ ٩٠ عمودياً. اتجاه القراءة من اليمين لليسار أو من أعلى لأسفل للعربية.
- استخدم clear عندما تنتقل لفكرة جديدة والسبورة ممتلئة (أكثر من ٨ عناصر تقريباً).
- الألوان: ink للأساسي، blue للمفاهيم، green للنتائج الصحيحة، red للتحذير أو التأكيد، orange و purple للتمييز بين المجموعات.

أعد JSON فقط حسب المخطط.`;
