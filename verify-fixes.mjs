import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch();

// Fix 1: anonymous /cart must fire ZERO requests to the cart API.
{
  const page = await browser.newPage();
  let cartCalls = 0;
  page.on('request', (r) => {
    if (/\/api\/v1\/cart\b/.test(r.url())) cartCalls += 1;
  });
  await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  console.log(`Fix 1 — anon /cart API calls: ${cartCalls} (expect 0) -> ${cartCalls === 0 ? 'PASS' : 'FAIL'}`);
  await page.close();
}

// Fix 2: a 404 product must be requested exactly ONCE (no retry).
{
  const page = await browser.newPage();
  let detailCalls = 0;
  page.on('request', (r) => {
    if (/\/api\/v1\/products\/99999\b/.test(r.url())) detailCalls += 1;
  });
  await page.goto(BASE + '/products/99999', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000); // long enough for a retry-backoff, if any
  console.log(`Fix 2 — 404 product API calls: ${detailCalls} (expect 1) -> ${detailCalls === 1 ? 'PASS' : 'FAIL'}`);
  await page.close();
}

await browser.close();
