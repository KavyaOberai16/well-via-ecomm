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

async function login(page, email, password) {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: /^sign in$/i }).click();
}

try {
  // --- Guard: anonymous is bounced to /login ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
    log('Anon /admin → /login', page.url().endsWith('/login'), `url=${page.url()}`);
    await ctx.close();
  }

  // --- Guard: non-admin is bounced to / ---
  {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await ctx.newPage();
    await login(page, 'demo2@example.com', 'DemoPass123!');
    await page.waitForURL(BASE + '/', { timeout: 8000 }).catch(() => {});
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
    log('Non-admin /admin → /', page.url() === BASE + '/', `url=${page.url()}`);
    await ctx.close();
  }

  // --- Admin: login lands on dashboard, CRUD works ---
  {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      colorScheme: 'dark',
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && !/401|favicon|fonts\./i.test(m.text())) {
        errors.push(m.text());
      }
    });

    await login(page, 'admin@lumen.store', 'Admin123!');
    await page.waitForURL(BASE + '/admin', { timeout: 8000 }).catch(() => {});
    await page.getByText('Inventory value').waitFor({ timeout: 8000 });
    await page.screenshot({ path: `${SHOTS}/admin-01-dashboard.png` });
    log('Admin login → dashboard', page.url() === BASE + '/admin' && errors.length === 0,
      `url=${page.url()} errors=${errors.length}`);

    // Products table
    await page.goto(BASE + '/admin/products', { waitUntil: 'networkidle' });
    await page.waitForSelector('table tbody tr');
    const rows0 = await page.locator('table tbody tr').count();
    await page.screenshot({ path: `${SHOTS}/admin-02-products.png` });
    log('Products table lists catalog', rows0 === 12, `rows=${rows0}`);

    // Create
    await page.goto(BASE + '/admin/products/new', { waitUntil: 'networkidle' });
    await page.getByLabel('SKU').fill('QA-VERIFY-01');
    await page.getByLabel('Name').fill('QA Verify Product');
    await page.getByLabel('Description').fill('Temporary product created by the admin verification.');
    await page.getByLabel('Price (USD)').fill('12.34');
    await page.getByLabel('Stock').fill('7');
    await page.screenshot({ path: `${SHOTS}/admin-03-form.png` });
    await page.getByRole('button', { name: /create product/i }).click();
    await page.waitForURL(BASE + '/admin/products', { timeout: 8000 }).catch(() => {});
    await page.waitForSelector('table tbody tr');
    const rows1 = await page.locator('table tbody tr').count();
    const created = await page.getByText('QA Verify Product').isVisible();
    log('Create product', rows1 === 13 && created, `rows=${rows1} visible=${created}`);

    // Edit
    await page.getByLabel('Edit QA Verify Product').click();
    await page.waitForURL(/\/admin\/products\/\d+\/edit/, { timeout: 8000 });
    await page.getByLabel('Name').fill('QA Verify Edited');
    await page.getByRole('button', { name: /save changes/i }).click();
    await page.waitForURL(BASE + '/admin/products', { timeout: 8000 }).catch(() => {});
    let edited = false;
    try {
      // Wait out the background refetch that follows the cache invalidation.
      await page.getByText('QA Verify Edited').waitFor({ state: 'visible', timeout: 8000 });
      edited = true;
    } catch {
      /* stays false */
    }
    log('Edit product', edited, `editedNameVisible=${edited}`);

    // Delete (inline confirm)
    await page.getByLabel('Delete QA Verify Edited').click();
    await page.getByRole('button', { name: /^confirm$/i }).click();
    let gone = false;
    try {
      await page.getByText('QA Verify Edited').waitFor({ state: 'detached', timeout: 8000 });
      gone = true;
    } catch {
      /* stays false */
    }
    const rows2 = await page.locator('table tbody tr').count();
    log('Delete product', rows2 === 12 && gone, `rows=${rows2} removed=${gone}`);

    // Light theme on admin
    await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /switch to light theme/i }).click();
    await page.waitForTimeout(400);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.screenshot({ path: `${SHOTS}/admin-04-light.png` });
    log('Admin light theme', bg === 'rgb(249, 250, 252)', `bodyBg=${bg}`);

    await ctx.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
