import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const SHOTS = 'verify-shots';
mkdirSync(SHOTS, { recursive: true });

const results = [];
function log(step, ok, detail) {
  results.push({ step, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${step}  ::  ${detail}`);
}

// Environment noise, not app bugs.
// The anon /cart 401 is expected: an unauthenticated cart fetch is challenged.
function isNoise(text) {
  return (
    /favicon/i.test(text) ||
    /fonts\.(googleapis|gstatic)/i.test(text) ||
    /Download the React DevTools/i.test(text) ||
    /React Router Future Flag/i.test(text) ||
    /Failed to load resource.*\b401\b/i.test(text)
  );
}

async function visible(locator, timeout = 12000) {
  try {
    await locator.first().waitFor({ state: 'visible', timeout });
    return true;
  } catch {
    return false;
  }
}

const browser = await chromium.launch();

async function newPage() {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 860 },
    colorScheme: 'dark', // pin baseline; theme behavior is covered by verify-theme.mjs
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => {
    if (m.type() === 'error' && !isNoise(m.text())) errors.push(`console: ${m.text()}`);
  });
  page.on('pageerror', (e) => {
    if (!isNoise(String(e))) errors.push(`pageerror: ${e.message}`);
  });
  return { ctx, page, errors };
}

try {
  // ---- Home ----
  {
    const { ctx, page, errors } = await newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const heading = await page.locator('h1').first().innerText();
    const cards = await page.locator('a[href^="/products/"]').count();
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    await page.screenshot({ path: `${SHOTS}/01-home.png`, fullPage: true });
    log(
      'Home renders',
      /refined to a feeling/i.test(heading) && cards >= 8 && errors.length === 0,
      `h1="${heading}" featuredCards=${cards} bodyBg=${bg} errors=${errors.length}`,
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SHOTS}/02-home-mobile.png`, fullPage: true });
    log('Home mobile', errors.length === 0, `errors=${errors.length}`);
    await ctx.close();
  }

  // ---- Shop + search probes ----
  {
    const { ctx, page, errors } = await newPage();
    await page.goto(BASE + '/products', { waitUntil: 'networkidle' });
    await page.waitForSelector('a[href^="/products/"]');
    const cards = await page.locator('a[href^="/products/"]').count();
    const oos = await page.getByText('Out of stock').count();
    const low = await page.getByText(/Only \d+ left/).count();
    await page.screenshot({ path: `${SHOTS}/03-shop.png`, fullPage: true });
    log(
      'Shop lists products',
      cards === 12 && oos >= 1 && low >= 1 && errors.length === 0,
      `cards=${cards} outOfStock=${oos} lowStock=${low} errors=${errors.length}`,
    );

    await page.getByPlaceholder('Search products…').fill('Aura');
    // Wait for the debounce (300ms) + refetch to settle on the filtered result.
    let afterSearch = -1;
    try {
      await page.waitForFunction(
        () => document.querySelectorAll('a[href^="/products/"]').length === 1,
        { timeout: 10000 },
      );
      afterSearch = 1;
    } catch {
      afterSearch = await page.locator('a[href^="/products/"]').count();
    }
    await page.screenshot({ path: `${SHOTS}/04-shop-search.png`, fullPage: true });
    log('Shop search filters', afterSearch === 1, `"Aura" -> cards=${afterSearch}`);

    await page.getByPlaceholder('Search products…').fill('zzzznomatch');
    const emptyVisible = await visible(page.getByText('No products found'));
    log('Shop empty state', emptyVisible, `no-match -> emptyState=${emptyVisible}`);
    await ctx.close();
  }

  // ---- Product detail + bad-id probe ----
  {
    const { ctx, page, errors } = await newPage();
    await page.goto(BASE + '/products/1', { waitUntil: 'networkidle' });
    const name = await page.locator('h1').first().innerText();
    const addBtn = await page.getByRole('button', { name: /add to cart/i }).count();
    await page.screenshot({ path: `${SHOTS}/05-product-detail.png`, fullPage: true });
    log(
      'Product detail renders',
      name.length > 0 && addBtn >= 1 && errors.length === 0,
      `name="${name}" addToCartBtn=${addBtn} errors=${errors.length}`,
    );

    await page.goto(BASE + '/products/99999', { waitUntil: 'domcontentloaded' });
    const notFound = await visible(page.getByText('Product not found'));
    log('Product detail bad id', notFound, `id=99999 -> notFoundState=${notFound}`);
    await ctx.close();
  }

  // ---- Cart (anonymous) ----
  {
    const { ctx, page, errors } = await newPage();
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
    const signIn = await visible(page.getByText('Sign in to view your cart'));
    await page.screenshot({ path: `${SHOTS}/06-cart-anon.png`, fullPage: true });
    log(
      'Cart anon shows sign-in',
      signIn && errors.length === 0,
      `signInState=${signIn} errors=${errors.length}`,
    );
    await ctx.close();
  }

  // ---- Login (glass check) + authed flow ----
  {
    const { ctx, page, errors } = await newPage();
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
    await page.screenshot({ path: `${SHOTS}/07-login.png`, fullPage: true });
    const formOk = (await page.getByLabel('Email').count()) === 1;

    // Glassmorphism: the login card must apply a backdrop blur.
    const blur = await page.evaluate(() => {
      const el = document.querySelector('.glass');
      if (!el) return 'no .glass element';
      const s = getComputedStyle(el);
      return s.backdropFilter || s.webkitBackdropFilter || 'none';
    });
    log(
      'Login form + glassmorphism',
      formOk && /blur/.test(blur),
      `emailField=${formOk} backdropFilter="${blur}"`,
    );

    await page.getByLabel('Email').fill('admin@lumen.store');
    await page.getByLabel('Password').fill('Admin123!');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    // Admins land on /admin; other users land on /.
    await page.waitForURL(BASE + '/admin', { timeout: 8000 }).catch(() => {});
    const loggedIn = page.url() === BASE + '/admin';
    log(
      'Admin login (PASETO token)',
      loggedIn && errors.length === 0,
      `afterLogin url=${page.url()} errors=${errors.length}`,
    );

    await page.goto(BASE + '/cart', { waitUntil: 'networkidle' });
    const cartEmpty = await visible(page.getByText('Your cart is empty'));
    await page.screenshot({ path: `${SHOTS}/08-cart-authed.png`, fullPage: true });
    log(
      'Cart authed loads',
      cartEmpty && errors.length === 0,
      `authedCart emptyState=${cartEmpty} errors=${errors.length}`,
    );
    await ctx.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
