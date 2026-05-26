import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 1100 } });

const calls = [];
page.on('requestfinished', async (req) => {
  if (/\/products\/\d+\/images/.test(req.url())) {
    const res = await req.response();
    let body = '';
    try { body = (await res.text()).slice(0, 200); } catch { body = ''; }
    calls.push(`${req.method()} ${req.url().split('/api/v1')[1]} -> ${res.status()}  ${body}`);
  }
});
page.on('requestfailed', (req) => {
  if (/\/images/.test(req.url())) calls.push(`FAILED ${req.url()} :: ${req.failure()?.errorText}`);
});

async function login() {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('admin@lumen.store');
  await page.getByLabel('Password').fill('Admin123!');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(BASE + '/admin', { timeout: 8000 }).catch(() => {});
}

try {
  await login();
  await page.goto(BASE + '/admin/products/4/edit', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: /add images/i }).waitFor({ timeout: 8000 });

  // precise primary-badge count: exact text "Primary" (not "Set primary")
  async function exactPrimary() {
    return page.getByText('Primary', { exact: true }).count();
  }

  console.log('[A] mid-size photo (3.44 MB, within 5 MB limit)');
  await page.setInputFiles('input[type="file"]', ['../_t-mid.jpg']);
  await page.waitForTimeout(5000);
  console.log('    thumbnails:', await page.locator('img[alt=""]').count());
  console.log('    error:', JSON.stringify(await page.locator('p.text-danger').allInnerTexts().catch(() => [])));

  console.log('\n[B] large photo (13.79 MB, OVER the 5 MB limit)');
  await page.setInputFiles('input[type="file"]', ['../_t-big.jpg']);
  await page.waitForTimeout(8000);
  console.log('    thumbnails:', await page.locator('img[alt=""]').count());
  console.log('    error:', JSON.stringify(await page.locator('p.text-danger').allInnerTexts().catch(() => [])));

  console.log('\n[C] set-primary — exact "Primary" badge count');
  const imgs = await page.locator('img[alt=""]').count();
  if (imgs >= 2) {
    await page.locator('img[alt=""]').nth(1).hover();
    const sp = page.getByRole('button', { name: /set primary/i });
    if (await sp.count()) {
      await sp.first().click();
      await page.waitForTimeout(2500);
    }
  }
  console.log('    exact "Primary" badges:', await exactPrimary(), '(expect 1)');

  await page.screenshot({ path: 'verify-shots/repro-upload3.png' });
  console.log('\n--- network ---');
  console.log(calls.join('\n') || '(none)');
} finally {
  await browser.close();
}
