import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const SHOTS = 'verify-shots';
mkdirSync(SHOTS, { recursive: true });

const results = [];
function log(step, ok, detail) {
  results.push({ ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${step}  ::  ${detail}`);
}

const browser = await chromium.launch();
const bodyBg = (page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const htmlClass = (page) =>
  page.evaluate(() => document.documentElement.className);

// --- Dark theme + toggle to light ---
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });

  const c1 = await htmlClass(page);
  const bg1 = await bodyBg(page);
  await page.screenshot({ path: `${SHOTS}/theme-01-dark.png` });
  log('Dark theme', c1 === 'dark' && bg1 === 'rgb(11, 11, 15)', `html="${c1}" bodyBg=${bg1}`);

  // Toggle → light
  await page.getByRole('button', { name: /switch to light theme/i }).click();
  await page.waitForTimeout(400);
  const c2 = await htmlClass(page);
  const bg2 = await bodyBg(page);
  const stored = await page.evaluate(() => localStorage.getItem('lumen-theme'));
  await page.screenshot({ path: `${SHOTS}/theme-02-light.png` });
  log(
    'Toggle → light',
    c2 === 'light' && bg2 === 'rgb(249, 250, 252)' && stored === 'light',
    `html="${c2}" bodyBg=${bg2} stored=${stored}`,
  );

  // Toggle back → dark
  await page.getByRole('button', { name: /switch to dark theme/i }).click();
  await page.waitForTimeout(400);
  const c3 = await htmlClass(page);
  log('Toggle → dark again', c3 === 'dark', `html="${c3}"`);
  await ctx.close();
}

// --- Light theme: glass + cards adapt ---
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    colorScheme: 'light',
  });
  const page = await ctx.newPage();

  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  const glassBg = await page.evaluate(() =>
    getComputedStyle(document.querySelector('.glass')).backgroundColor,
  );
  await page.screenshot({ path: `${SHOTS}/theme-03-light-login.png` });
  log('Glass adapts to light', /^rgba?\(255, 255, 255/.test(glassBg), `glassBg=${glassBg}`);

  await page.goto(BASE + '/products', { waitUntil: 'networkidle' });
  await page.waitForSelector('a[href^="/products/"]');
  const cardBg = await page.evaluate(() =>
    getComputedStyle(document.querySelector('a[href^="/products/"]')).backgroundColor,
  );
  await page.screenshot({ path: `${SHOTS}/theme-04-light-shop.png`, fullPage: true });
  log('Light shop cards are white', cardBg === 'rgb(255, 255, 255)', `cardBg=${cardBg}`);

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.evaluate(async () => {
    for (let y = 0; y <= document.body.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
  });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${SHOTS}/theme-05-light-home.png` });
  log('Light home renders', true, 'captured');
  await ctx.close();
}

// --- Stored preference beats OS, applied pre-paint (no flash) ---
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    colorScheme: 'dark',
  });
  const page = await ctx.newPage();
  await page.addInitScript(() => localStorage.setItem('lumen-theme', 'light'));
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const c = await htmlClass(page);
  log('Stored "light" beats OS dark, no flash', c === 'light', `html="${c}"`);
  await ctx.close();
}

// --- OS preference honored when nothing stored ---
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    colorScheme: 'light',
  });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'domcontentloaded' });
  const c = await htmlClass(page);
  log('OS light preference honored', c === 'light', `html="${c}"`);
  await ctx.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
