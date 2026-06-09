import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });

await page.goto(BASE + '/', { waitUntil: 'networkidle' });

// Scroll through the page so IntersectionObserver-driven reveals fire.
await page.evaluate(async () => {
  for (let y = 0; y <= document.body.scrollHeight; y += 400) {
    window.scrollTo(0, y);
    await new Promise((r) => setTimeout(r, 120));
  }
});
await page.waitForTimeout(800);

// Measure opacity of the featured product cards after scrolling.
const opacities = await page.$$eval('a[href^="/products/"]', (els) =>
  els.slice(0, 8).map((el) => {
    // climb to the motion wrapper that carries the fade
    let n = el;
    let min = 1;
    for (let i = 0; i < 4 && n; i++) {
      min = Math.min(min, parseFloat(getComputedStyle(n).opacity));
      n = n.parentElement;
    }
    return min;
  }),
);
const perksVisible = await page
  .getByText('Free, fast delivery')
  .isVisible()
  .catch(() => false);

console.log('featured card opacities after scroll:', JSON.stringify(opacities));
console.log('perks band visible:', perksVisible);

await page.screenshot({ path: 'verify-shots/09-home-scrolled.png' });
const allVisible = opacities.length === 8 && opacities.every((o) => o > 0.95);
console.log(allVisible && perksVisible ? 'REVEAL OK' : 'REVEAL FAILED');

await browser.close();
process.exit(allVisible && perksVisible ? 0 : 1);
