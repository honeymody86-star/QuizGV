// End-to-end smoke test: plays lessons start to finish in a real browser.
// Run: node tests/e2e.mjs   (needs Playwright; serves the app itself)
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node-tools/node_modules/playwright')); }

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => {
  try {
    const p = join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/\/$/, '/index.html'));
    res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' });
    res.end(await readFile(p));
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}/index.html?fast`;

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM || undefined });
const errors = [];
let failed = false;

async function playLesson(page, id, lang, shot) {
  await page.goto(base);
  await page.evaluate((l) => { localStorage.setItem('passo.v1', JSON.stringify({ settings: { lang: l, mic: false } })); }, lang);
  await page.reload();
  await page.click(`.lesson[data-lesson="${id}"]`);
  let shots = 0;
  const deadline = Date.now() + 90000;
  while (Date.now() < deadline) {
    if (await page.isVisible('#summary:not([hidden]) .summary')) return true;
    // Answer whatever the quiz asks (not necessarily correctly)
    const choice = await page.$('.q-body:not(.locked) .choice');
    if (choice) await choice.click().catch(() => {});
    const tile = await page.$('.q-body:not(.locked) .tiles .tile');
    if (tile) await tile.click().catch(() => {});
    if (shot && shots < 3 && await page.isVisible('.grid .tok:not(.hid)')) {
      const n = await page.$$eval('.grid .tok:not(.hid)', (els) => els.length);
      if (n >= 6) { await page.screenshot({ path: `${shot}-${shots}.png` }); shots++; }
    }
    await page.waitForTimeout(40);
  }
  return false;
}

try {
  for (const [vw, vh, tag] of [[1280, 900, 'desktop'], [390, 844, 'phone']]) {
    const page = await browser.newPage({ viewport: { width: vw, height: vh } });
    page.on('pageerror', (e) => errors.push(`${tag}: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g/.test(m.text())) errors.push(`${tag}: ${m.text()}`); });
    for (const [id, lang] of tag === 'desktop' ? [['overview', 'ar'], ['u1l1', 'ar'], ['u2l1', 'en'], ['u5l1', 'en'], ['u7l1', 'ar']] : [['u1l4', 'ar']]) {
      const ok = await playLesson(page, id, lang, process.env.SHOTS ? `${process.env.SHOTS}/${tag}-${id}` : null);
      console.log(`${ok ? 'PASS' : 'FAIL'} ${tag} ${id} (${lang})`);
      if (!ok) failed = true;
    }
    // The summary must have stored progress
    const progress = await page.evaluate(() => JSON.parse(localStorage.getItem('passo.v1')).progress);
    if (!Object.keys(progress).length) { console.log('FAIL progress not saved'); failed = true; }
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
}
if (errors.length) { console.log('Errors:\n' + errors.join('\n')); failed = true; }
process.exit(failed ? 1 : 0);
