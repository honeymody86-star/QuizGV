/* الاتصال بمزودي الذكاء الاصطناعي مباشرة من المتصفح.
   المفاتيح تُحفظ في جهاز المعلم فقط (localStorage) ولا تُرسل إلا لمزودها. */

window.PROVIDERS = {
  gemini: {
    label: 'Google Gemini (مجاني بمفتاح من AI Studio)',
    models: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
    keyUrl: 'https://aistudio.google.com/apikey',
    free: true
  },
  openrouter: {
    label: 'OpenRouter (نماذج مجانية متعددة)',
    models: ['google/gemma-3-27b-it:free', 'meta-llama/llama-4-maverick:free', 'qwen/qwen2.5-vl-72b-instruct:free'],
    keyUrl: 'https://openrouter.ai/keys',
    free: true
  },
  openai: {
    label: 'OpenAI ChatGPT (مدفوع عبر API)',
    models: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini'],
    keyUrl: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    label: 'Anthropic Claude (مدفوع عبر API)',
    models: ['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-haiku-5-5'],
    keyUrl: 'https://console.anthropic.com/settings/keys'
  }
};

/* تصغير الصورة وتحويلها إلى JPEG base64 */
window.prepareImage = function (file, maxSide) {
  maxSide = maxSide || 1600;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('تعذرت قراءة الصورة'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('صيغة الصورة غير مدعومة'));
      img.onload = () => {
        const s = Math.min(1, maxSide / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        const g = c.getContext('2d');
        g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
        const dataUrl = c.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl, base64: dataUrl.split(',')[1], mime: 'image/jpeg', name: file.name });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

async function httpJSON(url, opts) {
  let res;
  try { res = await fetch(url, opts); }
  catch (e) { throw new Error('تعذر الاتصال بالخدمة (تحقق من الإنترنت): ' + e.message); }
  const txt = await res.text();
  let data; try { data = JSON.parse(txt); } catch (e) { data = null; }
  if (!res.ok) {
    const msg = (data && (data.error && (data.error.message || data.error))) || txt.slice(0, 300);
    if (res.status === 401 || res.status === 403) throw new Error('المفتاح غير صحيح أو لا يملك صلاحية: ' + msg);
    if (res.status === 429) throw new Error('تجاوزت حد الاستخدام المجاني مؤقتًا — انتظر دقيقة أو جرّب مزودًا آخر: ' + msg);
    throw new Error('خطأ من الخدمة (' + res.status + '): ' + msg);
  }
  return data;
}

window.callAI = async function ({ provider, model, key, prompt, images }) {
  images = images || [];
  if (!key) throw new Error('أدخل مفتاح API أولًا، أو استخدم وضع "النسخ واللصق" المجاني.');
  if (provider === 'gemini') {
    const parts = images.map(im => ({ inline_data: { mime_type: im.mime, data: im.base64 } }));
    parts.push({ text: prompt });
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model) + ':generateContent';
    const data = await httpJSON(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 32768 }
      })
    });
    const cand = data.candidates && data.candidates[0];
    if (!cand) throw new Error('لم يُرجع Gemini إجابة: ' + JSON.stringify(data.promptFeedback || data).slice(0, 200));
    return (cand.content.parts || []).map(p => p.text || '').join('');
  }
  if (provider === 'openai' || provider === 'openrouter') {
    const content = [{ type: 'text', text: prompt }].concat(
      images.map(im => ({ type: 'image_url', image_url: { url: im.dataUrl } })));
    const url = provider === 'openai'
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';
    const headers = { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key };
    if (provider === 'openrouter') { headers['X-Title'] = 'Lesson Engine'; }
    const body = { model, messages: [{ role: 'user', content }], max_tokens: 16000 };
    if (provider === 'openai') body.response_format = { type: 'json_object' };
    const data = await httpJSON(url, { method: 'POST', headers, body: JSON.stringify(body) });
    const ch = data.choices && data.choices[0];
    if (!ch) throw new Error('لم تُرجع الخدمة إجابة');
    return ch.message.content;
  }
  if (provider === 'anthropic') {
    const content = images.map(im => ({ type: 'image', source: { type: 'base64', media_type: im.mime, data: im.base64 } }));
    content.push({ type: 'text', text: prompt });
    const data = await httpJSON('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model, max_tokens: 32000,
        thinking: { type: 'adaptive' },
        output_config: { effort: 'medium' },
        messages: [{ role: 'user', content }]
      })
    });
    if (data.stop_reason === 'refusal') throw new Error('رفض النموذج الطلب — جرّب صياغة أخرى أو مزودًا آخر.');
    return (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  }
  throw new Error('مزود غير معروف');
};
