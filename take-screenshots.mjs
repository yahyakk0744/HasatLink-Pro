import { chromium, devices } from 'playwright';
import { resolve } from 'path';

// iPhone 15 Pro Max but override viewport to get exact App Store dimensions
const iPhone = {
  ...devices['iPhone 15 Pro Max'],
  viewport: { width: 430, height: 932 },
  deviceScaleFactor: 3,
};
const outDir = resolve('store-assets/screenshots-new');

const pages = [
  { name: '01-giris', url: '/giris', wait: 2000 },
  { name: '02-anasayfa', url: '/', wait: 2000 },
  { name: '03-pazar', url: '/pazar', wait: 2000 },
  { name: '04-uydu-analiz', url: '/uydu-analiz', wait: 3000 },
  { name: '05-hasatlink-pazari', url: '/hasatlink-pazari', wait: 2000 },
  { name: '06-hal-fiyatlari', url: '/hal-fiyatlari', wait: 2000 },
  { name: '07-harita', url: '/harita', wait: 3000 },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ...iPhone,
    locale: 'tr-TR',
  });

  // Set cookie consent to avoid banner
  await context.addCookies([{
    name: 'hasatlink_cookie_consent',
    value: 'rejected',
    domain: 'hasatlink.com',
    path: '/',
  }]);

  const page = await context.newPage();

  // Inject localStorage before navigating
  await page.addInitScript(() => {
    localStorage.setItem('hasatlink_cookie_consent', 'rejected');
  });

  for (const p of pages) {
    console.log(`Taking screenshot: ${p.name}...`);
    await page.goto(`https://hasatlink.com${p.url}`, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(p.wait || 2000);

    // Hide cookie consent if visible
    await page.evaluate(() => {
      document.querySelectorAll('.animate-slide-up, [class*="cookie"]').forEach(el => el.remove());
      // Also hide PWA install prompt
      document.querySelectorAll('[class*="pwa"], [class*="install"]').forEach(el => el.remove());
      // Hide floating action buttons
      document.querySelectorAll('.fixed.bottom-0.left-0:not(nav)').forEach(el => {
        if (!el.querySelector('a[href]')) el.remove();
      });
    });

    if (p.scroll) {
      await page.evaluate((scrollY) => window.scrollTo(0, scrollY), p.scroll);
      await page.waitForTimeout(500);
    }

    await page.screenshot({
      path: `${outDir}/${p.name}.png`,
      type: 'png',
    });
    console.log(`  Saved: ${p.name}.png`);
  }

  await browser.close();
  console.log(`\nAll screenshots saved to ${outDir}`);
})();
