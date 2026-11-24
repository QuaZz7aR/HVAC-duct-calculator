/* eslint-disable */
// Records the «Довідка» clips (ADR 0097). Run a production build on port 3200 (npm run build && npx next start -p 3200), then
//   HELP_PDF=<a demo spec .pdf> node scripts/record-help.cjs <uk|en> <add|sizes|settings|results|price|import|all>
// and convert each .webm: ffmpeg -i add-uk.webm -vf "scale=960:-2,fps=24" -c:v libx264 -pix_fmt yuv420p -crf 30 -preset slow -movflags +faststart -an public/help/add-uk.mp4
// The demo PDF must hold made-up rows only (the clips are public).
const { chromium } = require('playwright');
const fs = require('fs');
const [lang = 'uk', only = 'all'] = process.argv.slice(2);
const T = {
  uk: { del: 'Видалити всі', yes: 'Так, видалити', tees: 'Трійники', elbows: 'Відводи', adv: 'Розширений', simple: 'Простий', mode: 'Режим', imp: /Імпорт з Excel/, choose: 'Обрати файл', results: 'Результати по позиціях', metal: 'Відомість металу за товщиною', settings: 'Параметри розрахунку', add: /^Додати \d+/ },
  en: { del: 'Delete all', yes: 'Yes, delete', tees: 'Tees', elbows: 'Elbows', adv: 'Advanced', simple: 'Simple', mode: 'Mode', imp: /Import Excel/, choose: 'Choose file', results: 'Results by item', metal: 'Sheet metal by thickness', settings: 'Calculation settings', add: /^Add \d+/ },
}[lang];
const W = 1280, H = 760;
const cursor = `(() => { const d = document.createElement('div'); d.id='fake-cursor';
  d.style.cssText='position:fixed;z-index:2147483647;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:rgba(37,99,235,.35);border:2px solid rgba(37,99,235,.9);pointer-events:none;left:-50px;top:-50px;transition:transform .12s';
  const add = () => document.body && !document.getElementById('fake-cursor') && document.body.appendChild(d);
  addEventListener('mousemove', e => { add(); d.style.left=e.clientX+'px'; d.style.top=e.clientY+'px'; }, true);
  addEventListener('mousedown', () => d.style.transform='scale(.7)', true); addEventListener('mouseup', () => d.style.transform='', true);
  // the dialog top layer covers fixed elements: move the cursor into an open dialog
  setInterval(() => { const dl = document.querySelector('dialog[open]'); const host = dl || document.body; if (d.parentElement !== host) host.appendChild(d); }, 50); })()`;

async function session(name, fn) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: W, height: H }, recordVideo: { dir: `raw-${name}`, size: { width: W, height: H } }, colorScheme: 'light' });
  await ctx.addInitScript((l) => { try { localStorage.setItem('lang', l); localStorage.setItem('theme', 'light'); } catch {} }, lang);
  await ctx.addInitScript(cursor);
  const p = await ctx.newPage();
  await p.goto('http://localhost:3200', { waitUntil: 'networkidle' });
  await p.waitForTimeout(800);
  let x = W / 2, y = H / 2;
  const move = async (loc, opt = {}) => { await loc.scrollIntoViewIfNeeded(); const bb = await loc.boundingBox(); const tx = bb.x + bb.width * (opt.fx ?? 0.5), ty = bb.y + bb.height * (opt.fy ?? 0.5); await p.mouse.move(tx, ty, { steps: 18 }); x = tx; y = ty; await p.waitForTimeout(250); };
  const click = async (loc, opt) => { await move(loc, opt); await p.mouse.down(); await p.waitForTimeout(90); await p.mouse.up(); await p.waitForTimeout(500); };
  const type = async (loc, text) => { await click(loc); await loc.selectText().catch(() => {}); await p.keyboard.type(text, { delay: 110 }); await p.waitForTimeout(500); };
  const vis = (l) => l.locator('visible=true').first();
  const start = Date.now();
  await p.mouse.move(x, y);
  await fn({ p, move, click, type, vis });
  await p.waitForTimeout(1200);
  const video = p.video();
  await ctx.close(); await b.close();
  fs.renameSync(await video.path(), `${name}-${lang}.webm`);
  console.log(name, ((Date.now() - start) / 1000).toFixed(1) + 's');
}

const steps = {
  async add({ p, click, vis }) {
    await click(vis(p.getByRole('button', { name: T.del, exact: true })));
    await click(vis(p.getByRole('button', { name: T.yes })));
    await click(vis(p.getByRole('button', { name: T.elbows })));
    await click(vis(p.getByRole('button', { name: /КВд|CE/ }).first()));
    await click(vis(p.getByRole('button', { name: T.tees })));
    await click(vis(p.getByRole('button', { name: /^КТ|^CT/ }).first()));
    await p.mouse.move(700, 300, { steps: 15 });
  },
  async sizes({ p, click, type, vis, move }) {
    await type(vis(p.locator('label', { hasText: /Діаметр d|Diameter d/ }).locator('input')), '315');
    await type(vis(p.locator('label', { hasText: /Довжина L|Length L/ }).locator('input')), '2500');
    await click(vis(p.getByRole('button', { name: /Показати схему|Show sketch/ }).first()));
    await p.waitForTimeout(900);
    await click(vis(p.getByRole('button', { name: /Пояснення|Explanation/ }).nth(1)));
    await p.waitForTimeout(1500);
    await p.mouse.click(1200, 100); await p.waitForTimeout(300);
  },
  async settings({ p, click, type, vis }) {
    await click(vis(p.getByRole('button', { name: T.mode })));
    await click(vis(p.getByRole('menuitemradio', { name: T.adv }).or(p.getByRole('button', { name: T.adv }))));
    await p.waitForTimeout(500);
    const sec = vis(p.getByRole('heading', { name: T.settings }));
    await sec.scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
    await type(vis(p.locator('label', { hasText: /Запас на замовлення|order margin/i }).locator('input')), '15');
    await p.mouse.move(640, 380, { steps: 15 }); await p.waitForTimeout(600);
  },
  async results({ p, click, vis }) {
    const h = vis(p.getByRole('heading', { name: T.results }));
    await p.evaluate(() => window.scrollTo({ top: document.body.scrollHeight * 0.55, behavior: 'smooth' })); await p.waitForTimeout(900);
    await h.scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
    await click(vis(p.locator('table').first().locator('tbody tr').nth(3).locator('button, a').first()));
    await p.waitForTimeout(1800);
    const m = vis(p.getByRole('heading', { name: T.metal }));
    await m.scrollIntoViewIfNeeded(); await p.waitForTimeout(1500);
  },
  async price({ p, click, type, vis }) {
    await click(vis(p.getByRole('button', { name: T.mode })));
    await click(vis(p.getByRole('menuitemradio', { name: T.adv }).or(p.getByRole('button', { name: T.adv }))));
    const m = vis(p.getByRole('heading', { name: T.metal }));
    await m.scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
    const prices = p.locator('input[inputmode=decimal][aria-label]').locator('visible=true');
    await type(prices.nth(0), '520');
    await type(prices.nth(1), '610');
    await p.waitForTimeout(800);
  },
  async import({ p, click, vis }) {
    await click(vis(p.getByRole('button', { name: T.imp })));
    await move0(p);
    await p.locator('dialog[open] input[type=file]').setInputFiles(process.env.HELP_PDF);
    await p.waitForTimeout(1200);
    const dl = p.locator('dialog[open]');
    await dl.evaluate((d) => d.querySelector('div')?.scrollBy?.({ top: 0 }));
    await p.mouse.wheel(0, 500); await p.waitForTimeout(1200);
    await click(vis(dl.getByRole('button', { name: T.add })));
    await p.waitForTimeout(1500);
  },
};
async function move0(p) { await p.waitForTimeout(400); }

(async () => {
  for (const [name, fn] of Object.entries(steps)) if (only === 'all' || only === name) await session(name, fn);
})();
