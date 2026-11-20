// مزوّدو الصوت. كل مزوّد يعيد أحد شكلين:
//  { kind: "audio", url, charTimes? }  ← ملف صوتي (charTimes: زمن بداية كل حرف بالثواني إن توفّر)
//  { kind: "speech", text }             ← نطق المتصفح المجاني (Web Speech API)

const b64ToBlobUrl = (b64, mime = "audio/mpeg") => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return URL.createObjectURL(new Blob([bytes], { type: mime }));
};

const xmlEscape = (s) => s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]));

// يحوّل محاذاة ElevenLabs (حرفاً بحرف) إلى أزمنة على فهارس النص الأصلي
function alignToText(text, alignment) {
  if (!alignment) return null;
  const chars = alignment.characters, starts = alignment.character_start_times_seconds;
  const out = new Array(text.length).fill(null);
  let j = 0;
  for (let i = 0; i < text.length && j < chars.length; i++) {
    // نتسامح مع اختلافات التطبيع البسيطة
    let k = j;
    while (k < chars.length && k < j + 4 && chars[k] !== text[i]) k++;
    if (k < chars.length && chars[k] === text[i]) { out[i] = starts[k]; j = k + 1; }
  }
  let last = 0;
  for (let i = 0; i < out.length; i++) { if (out[i] == null) out[i] = last; else last = out[i]; }
  return out;
}

export const PROVIDERS = {
  browser: {
    label: "صوت المتصفح (مجاني)",
    async synth(text) { return { kind: "speech", text }; },
  },

  elevenlabs: {
    label: "ElevenLabs (الأكثر بشرية)",
    async synth(text, s) {
      if (!s.elevenKey) throw new Error("أدخل مفتاح ElevenLabs");
      const voice = s.elevenVoice || "JBFqnCBsd6RMkjVDRZzb";
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/with-timestamps?output_format=mp3_44100_128`, {
        method: "POST",
        headers: { "xi-api-key": s.elevenKey, "content-type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: s.elevenModel || "eleven_multilingual_v2",
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
        }),
      });
      if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
      const j = await res.json();
      return { kind: "audio", url: b64ToBlobUrl(j.audio_base64), charTimes: alignToText(text, j.alignment) };
    },
  },

  azure: {
    label: "Azure Neural (أفضل سعر/جودة)",
    async synth(text, s) {
      if (!s.azureKey || !s.azureRegion) throw new Error("أدخل مفتاح Azure Speech والمنطقة");
      const voice = s.azureVoice || "ar-SA-HamedNeural";
      const lang = voice.split("-").slice(0, 2).join("-");
      const ssml = `<speak version="1.0" xml:lang="${lang}" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="${voice}"><prosody rate="-4%">${xmlEscape(text)}</prosody></voice></speak>`;
      const res = await fetch(`https://${s.azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": s.azureKey,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-96kbitrate-mono-mp3",
        },
        body: ssml,
      });
      if (!res.ok) throw new Error(`Azure ${res.status}: ${await res.text()}`);
      return { kind: "audio", url: URL.createObjectURL(await res.blob()) };
    },
  },

  openai: {
    label: "OpenAI gpt-4o-mini-tts",
    async synth(text, s) {
      if (!s.openaiKey) throw new Error("أدخل مفتاح OpenAI");
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${s.openaiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          voice: s.openaiVoice || "coral",
          input: text,
          instructions: "تحدّث كمعلّم عربي ودود ومتحمّس يشرح لطالب، بإيقاع طبيعي ووقفات قصيرة، وليس كقارئ أخبار.",
          response_format: "mp3",
        }),
      });
      if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
      return { kind: "audio", url: URL.createObjectURL(await res.blob()) };
    },
  },

  server: {
    label: "عبر الخادم الوسيط",
    async synth(text, s) {
      const res = await fetch(`${s.serverUrl.replace(/\/$/, "")}/tts`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`TTS server ${res.status}`);
      const j = await res.json();
      return { kind: "audio", url: b64ToBlobUrl(j.audio_base64, j.mime), charTimes: alignToText(text, j.alignment) };
    },
  },
};

export class TTSCache {
  constructor(getSettings) { this.getSettings = getSettings; this.map = new Map(); }
  get(text) {
    const s = this.getSettings();
    const key = `${s.tts}|${text}`;
    if (!this.map.has(key)) {
      const p = (PROVIDERS[s.tts] || PROVIDERS.browser).synth(text, s).catch((e) => {
        console.warn("TTS failed, falling back to browser voice", e);
        this.onError?.(e);
        return { kind: "speech", text };
      });
      this.map.set(key, p);
    }
    return this.map.get(key);
  }
}

// اختيار أفضل صوت عربي متاح في المتصفح (أصوات Edge "Online (Natural)" عصبية ومجانية)
export function pickBrowserVoice(lang = "ar", preferred) {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith(lang));
  if (preferred) { const v = voices.find((v) => v.name === preferred); if (v) return v; }
  const score = (v) => (/natural|neural|online/i.test(v.name) ? 3 : 0) + (/premium|enhanced/i.test(v.name) ? 2 : 0) + (/ar-SA/i.test(v.lang) ? 1 : 0);
  return voices.sort((a, b) => score(b) - score(a))[0] || null;
}
