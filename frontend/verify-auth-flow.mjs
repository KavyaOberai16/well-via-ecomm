import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const SHOTS = 'verify-shots';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
let pass = true;

// === 1. Does the login form data actually reach the backend? ===
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  let reqBody = null;
  let respStatus = null;
  let respBody = null;
  page.on('request', (r) => {
    if (r.url().includes('/api/v1/auth/login') && r.method() === 'POST') {
      reqBody = r.postData();
    }
  });
  page.on('response', async (r) => {
    if (r.url().includes('/api/v1/auth/login') && r.request().method() === 'POST') {
      respStatus = r.status();
      try {
        respBody = await r.json();
      } catch {
        /* ignore */
      }
    }
  });

  const EMAIL = 'admin@lumen.store';
  const PW = 'Admin123!';
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill(EMAIL);
  await page.getByLabel('Password').fill(PW);
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(BASE + '/admin', { timeout: 8000 }).catch(() => {});

  const parsed = reqBody ? JSON.parse(reqBody) : {};
  console.log('=== 1. Login form → backend ===');
  console.log('  typed into form :', EMAIL, '/', PW);
  console.log('  POST body sent  :', reqBody);
  console.log('  backend status  :', respStatus);
  console.log(
    '  backend returned:',
    respBody
      ? `${respBody.token_type} token (access starts "${String(respBody.access_token).slice(0, 12)}…")`
      : '(no body)',
  );
  const ok =
    parsed.email === EMAIL &&
    parsed.password === PW &&
    respStatus === 200 &&
    Boolean(respBody?.access_token);
  console.log(ok ? '  PASS — form data reached the backend and was accepted\n' : '  FAIL\n');
  pass = pass && ok;
  await ctx.close();
}

// === 2. Logout from the storefront ===
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.getByLabel('Email').fill('admin@lumen.store');
  await page.getByLabel('Password').fill('Admin123!');
  await page.getByRole('button', { name: /^sign in$/i }).click();
  await page.waitForURL(BASE + '/admin', { timeout: 8000 }).catch(() => {});

  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  const avatarBefore = await page.getByLabel('Account menu').count();

  await page.getByLabel('Account menu').click();
  await page.getByRole('menuitem', { name: /sign out/i }).waitFor({ timeout: 4000 });
  await page.screenshot({ path: `${SHOTS}/auth-account-menu.png` });
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  await page.waitForTimeout(500);

  const signInVisible = await page
    .getByRole('link', { name: /^sign in$/i })
    .isVisible()
    .catch(() => false);
  const token = await page.evaluate(() => {
    try {
      return JSON.parse(localStorage.getItem('auth'))?.state?.accessToken;
    } catch {
      return undefined;
    }
  });
  await page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
  const bounced = page.url().endsWith('/login');

  console.log('=== 2. Logout ===');
  console.log('  account avatar shown when logged in :', avatarBefore === 1);
  console.log('  "Sign in" link shown after logout   :', signInVisible);
  console.log('  stored token cleared                :', !token);
  console.log('  /admin bounces to /login after out  :', bounced);
  const ok = avatarBefore === 1 && signInVisible && !token && bounced;
  console.log(ok ? '  PASS — logout works\n' : '  FAIL\n');
  pass = pass && ok;
  await ctx.close();
}

await browser.close();
console.log(pass ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED');
process.exit(pass ? 0 : 1);
