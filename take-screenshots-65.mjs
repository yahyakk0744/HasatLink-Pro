import { chromium, devices } from 'playwright';
import { resolve } from 'path';

// iPhone 13 Pro Max: 428x926 @3x = 1284x2778 → fits Apple 6.5" Display slot
const iPhone = {
  ...devices['iPhone 13 Pro Max'],
  viewport: { width: 428, height: 926 },
  deviceScaleFactor: 3,
};
const outDir = resolve('store-assets/screenshots-resized');

// Apple Guideline 2.3.3 — login/splash screens do not count as "app in use",
// so the login page has been dropped. Every slot now shows a feature.
const pages = [
  { name: '01-anasayfa', url: '/', wait: 2000 },
  { name: '02-pazar', url: '/pazar', wait: 2000 },
  { name: '03-uydu-analiz', url: '/uydu-analiz', wait: 3000 },
  { name: '04-hasatlink-pazari', url: '/hasatlink-pazari', wait: 2000 },
  { name: '05-hal-fiyatlari', url: '/hal-fiyatlari', wait: 2000 },
  { name: '06-harita', url: '/harita', wait: 3000 },
  { name: '07-ai-teshis', url: '/ai-teshis', wait: 3000 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone,
    locale: 'tr-TR',
  });

  await context.addCookies([{
    name: 'hasatlink_cookie_consent',
    value: 'rejected',
    domain: 'hasatlink.com',
    path: '/',
  }]);

  const page = await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('hasatlink_cookie_consent', 'rejected');
  });

  for (const p of pages) {
    console.log(`Taking screenshot: ${p.name}...`);
    await page.goto(`https://hasatlink.com${p.url}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(p.wait || 2000);

    await page.evaluate(() => {
      document.querySelectorAll('.animate-slide-up, [class*="cookie"]').forEach(el => el.remove());
      document.querySelectorAll('[class*="pwa"], [class*="install"]').forEach(el => el.remove());
      document.querySelectorAll('.fixed.bottom-0.left-0:not(nav)').forEach(el => {
        if (!el.querySelector('a[href]')) el.remove();
      });
    });

    await page.screenshot({
      path: `${outDir}/${p.name}.png`,
      type: 'png',
    });
    console.log(`  Saved: ${p.name}.png`);
  }

  await browser.close();
  console.log(`\nAll screenshots saved to ${outDir}`);
})();
