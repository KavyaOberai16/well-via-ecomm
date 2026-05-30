import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const SHOTS = 'verify-shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();

async function settle(page) {
  // Nudge lazy/whileInView sections into their final state, then return to top.
  await page.evaluate(async () => {
    await new Promise((r) => {
      let y = 0;
      const step = () => {
        window.scrollTo(0, y);
        y += window.innerHeight;
        if (y < document.body.scrollHeight) setTimeout(step, 60);
        else setTimeout(r, 200);
      };
      step();
    });
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
}

try {
  // 1) Public homepage — default (light) theme, redesigned hero + category circles
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: 'reduce',
    });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);
    const htmlClass = await page.evaluate(() => document.documentElement.className);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.screenshot({ path: `${SHOTS}/home-hero.png` });
    await settle(page);
    await page.screenshot({ path: `${SHOTS}/home-full.png`, fullPage: true });
    console.log(`HOME  htmlClass="${htmlClass}"  bodyBg=${bg}`);
    await ctx.close();
  }

  // 2) Admin — categories (image UI) and footer editor
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.getByLabel('Email', { exact: true }).fill('admin@lumen.store');
    await page.getByLabel('Password', { exact: true }).fill('Admin123!');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await page.waitForURL(BASE + '/admin', { timeout: 10000 }).catch(() => {});

    await page.goto(BASE + '/admin/categories', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SHOTS}/admin-categories.png`, fullPage: true });
    console.log(`CATEGORIES url=${page.url()}`);

    await page.goto(BASE + '/admin/footer', { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    await page.screenshot({ path: `${SHOTS}/admin-footer.png`, fullPage: true });
    console.log(`FOOTER url=${page.url()}`);

    await ctx.close();
  }
} finally {
  await browser.close();
}
console.log('done');
