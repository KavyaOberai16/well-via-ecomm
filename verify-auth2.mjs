import { chromium } from 'playwright';
import { execSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:5173';
const SHOTS = 'verify-shots';
mkdirSync(SHOTS, { recursive: true });

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
function readOtp() {
  const logs = execSync('docker logs ecom-backend-test --tail 40 2>&1').toString();
  const matches = [...logs.matchAll(/reset code is: (\d{6})/g)];
  return matches.length ? matches[matches.length - 1][1] : null;
}

const browser = await chromium.launch();

try {
  // --- Forgot password: link from /login ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/login', { waitUntil: 'networkidle' });

    const forgotLink = await visible(page.getByRole('link', { name: /forgot password/i }));
    log('Login page shows "Forgot password?" link', forgotLink, `link=${forgotLink}`);

    // Google button must be ABSENT (Google not configured on this backend)
    const googleBtn = await page
      .getByRole('link', { name: /continue with google/i })
      .count();
    log('Google button hidden when not configured', googleBtn === 0, `googleButtons=${googleBtn}`);

    await page.getByRole('link', { name: /forgot password/i }).click();
    await page.waitForURL(BASE + '/forgot-password', { timeout: 8000 });
    log('Navigates to /forgot-password', page.url().endsWith('/forgot-password'), page.url());

    // Step 1 — request the code
    await page.getByLabel('Email').fill('admin@lumen.store');
    await page.getByRole('button', { name: /send reset code/i }).click();
    const reachedReset = await visible(page.getByText(/we sent a code to/i));
    await page.screenshot({ path: `${SHOTS}/auth-forgot-step2.png` });
    log('Step 1 → code requested', reachedReset, `resetStep=${reachedReset}`);

    // Step 2 — read the OTP from the emailed message (console backend) and reset
    await page.waitForTimeout(800);
    const otp = readOtp();
    log('OTP delivered (console email)', Boolean(otp), `otp=${otp}`);

    await page.getByLabel('6-digit code').fill(otp || '000000');
    await page.getByLabel('New password').fill('Admin123!'); // reset to the same — no cleanup needed
    await page.getByRole('button', { name: /reset password/i }).click();
    const done = await visible(page.getByText(/password reset/i));
    await page.screenshot({ path: `${SHOTS}/auth-forgot-done.png` });
    log('Step 2 → password reset complete', done, `doneScreen=${done}`);

    await page.close();
  }

  // --- Auth callback error handling (Google) ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/auth/callback#error=google', { waitUntil: 'networkidle' });
    const errShown = await visible(page.getByText(/sign-in failed/i));
    log('Auth callback handles error fragment', errShown, `errorShown=${errShown}`);
    await page.close();
  }

  // --- Wrong OTP rejected in the UI ---
  {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    await page.goto(BASE + '/forgot-password', { waitUntil: 'networkidle' });
    await page.getByLabel('Email').fill('admin@lumen.store');
    await page.getByRole('button', { name: /send reset code/i }).click();
    await visible(page.getByText(/we sent a code to/i));
    await page.getByLabel('6-digit code').fill('000000');
    await page.getByLabel('New password').fill('whatever123');
    await page.getByRole('button', { name: /reset password/i }).click();
    const rejected = await visible(page.getByText(/invalid or expired/i));
    log('Wrong OTP shows an error', rejected, `errorShown=${rejected}`);
    await page.close();
  }
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed}/${results.length} checks passed`);
process.exit(failed ? 1 : 0);
