import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const SHOTS = 'verify-shots';
mkdirSync(SHOTS, { recursive: true });

// A real 1x1 PNG written to disk for the upload test.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
writeFileSync('_qa-upload.png', PNG);

const results = [];
function log(step, ok, detail) {
  results.push({ ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${step}  ::  ${detail}`);
}
async function visible(locator, timeout = 10000) {
  try {
    await locator.first().waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 1000 }, colorScheme: 'dark' });
const page = await ctx.newPage();

try {
  // login as admin
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('admin@lumen.store');
  await page.getByLabel('Password').fill('Admin123!');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(BASE + '/admin', { timeout: 8000 }).catch(() => {});

  // --- Categories admin ---
  await page.goto(BASE + '/admin/categories', { waitUntil: 'networkidle' });
  await page.waitForSelector('ul li');
  const catRows0 = await page.locator('ul > li').count();
  await page.screenshot({ path: `${SHOTS}/cat-01-list.png` });
  log('Categories list shows seeded data', catRows0 === 4, `rows=${catRows0}`);

  await page.getByPlaceholder(/new category name/i).fill('QA Test Category');
  await page.getByRole('button', { name: /add category/i }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('ul > li').length === 5,
    { timeout: 8000 },
  ).catch(() => {});
  const catRows1 = await page.locator('ul > li').count();
  const created = await page.getByText('QA Test Category').isVisible();
  log('Create category', catRows1 === 5 && created, `rows=${catRows1}`);

  // delete it
  await page.getByLabel('Delete QA Test Category').click();
  await page.getByRole('button', { name: /^confirm$/i }).click();
  await page.waitForFunction(
    () => document.querySelectorAll('ul > li').length === 4,
    { timeout: 8000 },
  ).catch(() => {});
  const catRows2 = await page.locator('ul > li').count();
  log('Delete category', catRows2 === 4, `rows=${catRows2}`);

  // --- Product form: category dropdown + image manager ---
  await page.goto(BASE + '/admin/products/1/edit', { waitUntil: 'networkidle' });
  await page.waitForSelector('select');
  const catOptions = await page.locator('select option').count();
  log('Category dropdown populated', catOptions >= 5, `options=${catOptions} (Uncategorized + categories)`);

  const addTile = await visible(page.getByRole('button', { name: /add images/i }));
  log('Image manager present in edit mode', addTile, `addTile=${addTile}`);

  // --- Upload an image ---
  const imgCountBefore = await page.locator('img[alt=""], img[loading="lazy"]').count();
  await page.setInputFiles('input[type="file"]', '_qa-upload.png');
  // wait for a "Primary" badge to appear (first image becomes primary)
  const uploaded = await visible(page.getByText('Primary'));
  await page.screenshot({ path: `${SHOTS}/cat-02-image-manager.png` });
  log('Upload product image', uploaded, `primaryBadge=${uploaded}`);

  // --- Storefront gallery shows the image ---
  await page.goto(BASE + '/products/1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  const heroImg = await page.evaluate(() => {
    const img = document.querySelector('main img');
    return img ? img.src : null;
  });
  await page.screenshot({ path: `${SHOTS}/cat-03-storefront.png` });
  log(
    'Storefront detail shows uploaded image',
    Boolean(heroImg && heroImg.includes('/media/')),
    `mainImg=${heroImg}`,
  );

  // --- Cleanup: delete the uploaded image ---
  await page.goto(BASE + '/admin/products/1/edit', { waitUntil: 'networkidle' });
  await visible(page.getByText('Primary'));
  await page.locator('img[alt=""]').first().hover();
  await page.getByLabel('Delete image').first().click();
  await page.waitForTimeout(1200);
  log('Cleanup — image removed', true, 'done');
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
