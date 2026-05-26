import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
const page = await ctx.newPage();

await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
await page.getByLabel('Email').fill('admin@lumen.store');
await page.getByLabel('Password').fill('Admin123!');
await page.getByRole('button', { name: /^sign in$/i }).click();
await page.waitForURL(BASE + '/admin', { timeout: 8000 });

// Wait until the stat cards show real values (not the loading dash).
await page.getByText('Needs attention').waitFor();
await page.waitForFunction(() => {
  const el = [...document.querySelectorAll('p')].find((p) =>
    /^\d/.test(p.textContent.trim()),
  );
  return Boolean(el);
}, { timeout: 8000 });
await page.waitForTimeout(400);
await page.screenshot({ path: 'verify-shots/admin-01-dashboard.png' });
console.log('dashboard (dark) re-captured');

await page.getByRole('button', { name: /switch to light theme/i }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: 'verify-shots/admin-04-light.png' });
console.log('dashboard (light) re-captured');

await browser.close();
