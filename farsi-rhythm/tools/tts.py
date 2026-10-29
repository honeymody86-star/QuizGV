"""يولّد ملفات صوتية بصوت فارسي/عربي طبيعي لكل الكلمات والجمل.

الاستخدام: node tools/texts.js > texts.json && python tools/tts.py texts.json audio
يعيد التوليد فقط للنصوص التي تغيّرت (حسب audio/index.json)، ويقصّ الصمت
من البداية والنهاية لتنطبق الكلمات على ضربات الإيقاع بدقة.
"""
import asyncio, json, os, subprocess, sys, threading, wave

import edge_tts

try:
    from gtts import gTTS
except ImportError:  # الاحتياط اختياري
    gTTS = None

try:
    from piper import PiperVoice
except ImportError:
    PiperVoice = None

# نماذج Piper مفتوحة المصدر (تعمل محلياً بلا خدمة خارجية): PIPER_DIR/<name>.onnx
PIPER_MODELS = {'fa': 'fa_IR-gyro-medium', 'ar': 'ar_JO-kareem-medium'}
PIPER_DIR = os.environ.get('PIPER_DIR', 'voices')
_piper, _piper_lock = {}, threading.Lock()

VOICES = {'fa': 'fa-IR-DilaraNeural', 'ar': 'ar-SA-ZariyahNeural'}
RATE = {'w': '-8%', 's': '-5%'}
TRIM = ('silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
        'silenceremove=start_periods=1:start_threshold=-45dB,areverse')


STATE = {'done': 0, 'edge_fail': 0}


async def edge(item, raw):
    kind = item['key'].split('/')[1][0]
    comm = edge_tts.Communicate(item['text'], VOICES[item['lang']], rate=RATE[kind])
    await asyncio.wait_for(comm.save(raw), timeout=25)


def _piper_save(item, raw):
    lang = item['lang']
    with _piper_lock:
        if lang not in _piper:
            _piper[lang] = PiperVoice.load(os.path.join(PIPER_DIR, PIPER_MODELS[lang] + '.onnx'))
        voice = _piper[lang]
        with wave.open(raw, 'wb') as wf:
            if hasattr(voice, 'synthesize_wav'):
                voice.synthesize_wav(item['text'], wf)
            else:
                voice.synthesize(item['text'], wf)


async def piper(item, raw):
    if PiperVoice is None:
        raise RuntimeError('piper-tts not installed')
    await asyncio.to_thread(_piper_save, item, raw)


async def google(item, raw):
    if gTTS is None:
        raise RuntimeError('gTTS not installed')
    await asyncio.to_thread(lambda: gTTS(item['text'], lang=item['lang']).save(raw))


async def synth(item, out_dir, sem, engines):
    path = os.path.join(out_dir, item['key'] + '.mp3')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    async with sem:
        for attempt in range(3):
            for engine in engines:
                raw = path + '.raw.mp3'
                try:
                    await engine(item, raw)
                    await asyncio.to_thread(subprocess.run, [
                        'ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', TRIM,
                        '-ac', '1', '-ar', '24000', '-b:a', '48k', path], check=True, timeout=30)
                    os.remove(raw)
                    STATE['done'] += 1
                    if STATE['done'] % 100 == 0:
                        print(f"  {STATE['done']} clips", flush=True)
                    return True
                except Exception as e:  # شبكة أو حدّ معدّل: جرّب المحرّك التالي ثم أعد المحاولة
                    print('retry', item['key'], engine.__name__, type(e).__name__, e, flush=True)
            await asyncio.sleep(2 * (attempt + 1))
    return False


async def main(texts_file, out_dir):
    items = json.load(open(texts_file, encoding='utf-8'))
    index_path = os.path.join(out_dir, 'index.json')
    old = {}
    if os.path.exists(index_path):
        old = json.load(open(index_path, encoding='utf-8')).get('texts', {})
    todo = [i for i in items
            if old.get(i['key']) != i['text'] or not os.path.exists(os.path.join(out_dir, i['key'] + '.mp3'))]
    print(f'{len(todo)} of {len(items)} clips to generate', flush=True)
    # فحص سريع لكل محرّك قبل البدء، حتى نفشل بسرعة برسالة واضحة
    engines = []
    for engine in (edge, piper, google):
        try:
            await asyncio.wait_for(engine({'key': 'fa/w0', 'lang': 'fa', 'text': 'سلام'}, '/tmp/probe.mp3'), 40)
            engines.append(engine)
            print('engine ok:', engine.__name__, flush=True)
        except Exception as e:
            print('engine unavailable:', engine.__name__, type(e).__name__, e, flush=True)
    if not engines:
        sys.exit('no TTS engine reachable')
    sem = asyncio.Semaphore(8)
    results = await asyncio.gather(*(synth(i, out_dir, sem, engines) for i in todo))
    failed = [i['key'] for i, ok in zip(todo, results) if not ok]
    texts = {i['key']: i['text'] for i in items
             if i['key'] not in failed and os.path.exists(os.path.join(out_dir, i['key'] + '.mp3'))}
    json.dump({'voices': VOICES, 'texts': texts}, open(index_path, 'w', encoding='utf-8'),
              ensure_ascii=False, separators=(',', ':'))
    print(f'done: {len(texts)} clips, {len(failed)} failed')
    if len(failed) > len(items) // 10:
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main(sys.argv[1], sys.argv[2]))
