import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });

const consoleErrors = [];
page.on('console', (m) => {
  if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e));

const calls = [];
page.on('requestfinished', async (req) => {
  if (/\/products\/\d+\/images/.test(req.url())) {
    const res = await req.response();
    calls.push(`${req.method()} ${req.url().split('/api/v1')[1]} -> ${res.status()}`);
  }
});

function thumbs() {
  return page.locator('img[alt=""]').count();
}

try {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('admin@lumen.store');
  await page.getByLabel('Password').fill('Admin123!');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(BASE + '/admin', { timeout: 8000 }).catch(() => {});

  await page.goto(BASE + '/admin/products/3/edit', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /add images/i }).waitFor({ timeout: 8000 });
  console.log('product 3 — thumbnails at start:', await thumbs());

  // 1. Upload MULTIPLE files at once
  console.log('\n[1] upload 3 files at once...');
  await page.setInputFiles('input[type="file"]', [
    '../_t-photo.jpg',
    '../_t-2.jpg',
    '../_t-3.png',
  ]);
  await page.waitForTimeout(4000);
  console.log('    thumbnails after multi-upload:', await thumbs(), '(expect 3)');

  // 2. Add ONE more to the existing set
  console.log('\n[2] add one more...');
  await page.setInputFiles('input[type="file"]', ['../_t-shot.png']);
  await page.waitForTimeout(3000);
  console.log('    thumbnails after add-more:', await thumbs(), '(expect 4)');

  // 3. Set primary on the 3rd thumbnail
  console.log('\n[3] set-primary on a non-primary image...');
  await page.locator('img[alt=""]').nth(2).hover();
  const setPrimaryBtns = page.getByRole('button', { name: /set primary/i });
  const spCount = await setPrimaryBtns.count();
  if (spCount > 0) {
    await setPrimaryBtns.first().click();
    await page.waitForTimeout(2500);
    const primaryBadges = await page.getByText('Primary').count();
    console.log('    primary badges after set-primary:', primaryBadges, '(expect 1)');
  } else {
    console.log('    NO "Set primary" button found');
  }

  // 4. Delete one image
  console.log('\n[4] delete one image...');
  const tBefore = await thumbs();
  await page.locator('img[alt=""]').first().hover();
  await page.getByLabel('Delete image').first().click();
  await page.waitForTimeout(2500);
  console.log(`    thumbnails ${tBefore} -> ${await thumbs()} (expect -1)`);

  // 5. Upload a NON-image file
  console.log('\n[5] upload a .txt (non-image)...');
  await page.setInputFiles('input[type="file"]', ['../_t-bad.txt']);
  await page.waitForTimeout(2500);
  const errs = await page.locator('p.text-danger').allInnerTexts().catch(() => []);
  console.log('    error message shown:', JSON.stringify(errs));

  await page.screenshot({ path: 'verify-shots/repro-upload2.png' });

  console.log('\n--- upload network calls ---');
  console.log(calls.join('\n') || '(none)');
  console.log('\n--- console / page errors ---');
  console.log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');
} finally {
  await browser.close();
}
