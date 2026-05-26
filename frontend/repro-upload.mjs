import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const SHOTS = 'verify-shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });

const consoleErrors = [];
const pageErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => pageErrors.push(String(e)));

// Capture the image-upload request + response
const uploads = [];
page.on('requestfinished', async (req) => {
  if (/\/api\/v1\/products\/\d+\/images/.test(req.url())) {
    const res = await req.response();
    let body = '';
    try {
      body = (await res.text()).slice(0, 300);
    } catch {
      body = '(unreadable)';
    }
    uploads.push({ method: req.method(), url: req.url(), status: res.status(), body });
  }
});
page.on('requestfailed', (req) => {
  if (/\/images/.test(req.url())) {
    uploads.push({ method: req.method(), url: req.url(), failed: req.failure()?.errorText });
  }
});

try {
  // login
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('admin@lumen.store');
  await page.getByLabel('Password').fill('Admin123!');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(BASE + '/admin', { timeout: 8000 }).catch(() => {});

  // product 2 edit page
  await page.goto(BASE + '/admin/products/2/edit', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /add images/i }).waitFor({ timeout: 8000 });
  console.log('--- on /admin/products/2/edit ---');

  const before = await page.locator('img[alt=""]').count();
  console.log('thumbnails before upload:', before);

  // upload a JPEG
  await page.setInputFiles('input[type="file"]', '../_t-photo.jpg');
  await page.waitForTimeout(3000);

  const after = await page.locator('img[alt=""]').count();
  console.log('thumbnails after upload:', after);

  // is a thumbnail actually rendering (naturalWidth > 0)?
  const imgState = await page.evaluate(() => {
    const imgs = [...document.querySelectorAll('img[alt=""]')];
    return imgs.map((i) => ({ src: i.src, naturalWidth: i.naturalWidth, complete: i.complete }));
  });
  console.log('thumbnail img state:', JSON.stringify(imgState, null, 2));

  // any visible error text in the manager?
  const errText = await page
    .locator('p.text-danger')
    .allInnerTexts()
    .catch(() => []);
  console.log('error text on page:', JSON.stringify(errText));

  await page.screenshot({ path: `${SHOTS}/repro-upload.png` });

  console.log('\n--- upload network calls ---');
  console.log(JSON.stringify(uploads, null, 2));
  console.log('\n--- console errors ---');
  console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');
  console.log('--- page errors ---');
  console.log(pageErrors.length ? pageErrors.join('\n') : '(none)');
} finally {
  await browser.close();
}
