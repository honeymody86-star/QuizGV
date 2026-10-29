"""يولّد ملفات صوتية بصوت فارسي/عربي طبيعي لكل الكلمات والجمل.

الاستخدام: node tools/texts.js > texts.json && python tools/tts.py texts.json audio
يعيد التوليد فقط للنصوص التي تغيّرت (حسب audio/index.json)، ويقصّ الصمت
من البداية والنهاية لتنطبق الكلمات على ضربات الإيقاع بدقة.
"""
import asyncio, json, os, subprocess, sys, tempfile

import edge_tts

VOICES = {'fa': 'fa-IR-DilaraNeural', 'ar': 'ar-SA-ZariyahNeural'}
RATE = {'w': '-8%', 's': '-5%'}
TRIM = ('silenceremove=start_periods=1:start_threshold=-45dB,areverse,'
        'silenceremove=start_periods=1:start_threshold=-45dB,areverse')


async def synth(item, out_dir, sem):
    path = os.path.join(out_dir, item['key'] + '.mp3')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    async with sem:
        for attempt in range(4):
            try:
                with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
                    raw = tmp.name
                kind = item['key'].split('/')[1][0]
                await edge_tts.Communicate(item['text'], VOICES[item['lang']], rate=RATE[kind]).save(raw)
                subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', raw, '-af', TRIM,
                                '-ac', '1', '-ar', '24000', '-b:a', '48k', path], check=True)
                os.remove(raw)
                return True
            except Exception as e:  # شبكة أو حدّ معدّل: أعد المحاولة
                print('retry', item['key'], e, file=sys.stderr)
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
    print(f'{len(todo)} of {len(items)} clips to generate')
    sem = asyncio.Semaphore(6)
    results = await asyncio.gather(*(synth(i, out_dir, sem) for i in todo))
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
