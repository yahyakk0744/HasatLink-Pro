import { chromium, devices } from 'playwright';
import { resolve } from 'path';

// iPad screenshot generator — produces BOTH 13-inch (2064×2752) and 11-inch
// (1640×2360) slots in one run. Apple's review device is iPad Air 11-inch M3,
// so the 11-inch set is the critical one, but Apple also requires 13-inch.
const variants = [
  {
    label: '13',
    outDir: resolve('store-assets/screenshots-ipad-13'),
    viewport: { width: 1032, height: 1376 }, // @2x = 2064×2752
    deviceScaleFactor: 2,
  },
  {
    label: '11',
    outDir: resolve('store-assets/screenshots-ipad-11'),
    viewport: { width: 834, height: 1194 }, // @2x = 1668×2388 (APP_IPAD_PRO_3GEN_11)
    deviceScaleFactor: 2,
  },
];

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

  for (const v of variants) {
    console.log(`\n=== iPad ${v.label}-inch (${v.viewport.width * v.deviceScaleFactor}×${v.viewport.height * v.deviceScaleFactor}) ===`);

    const context = await browser.newContext({
      ...devices['iPad Pro 11'],
      viewport: v.viewport,
      deviceScaleFactor: v.deviceScaleFactor,
      locale: 'tr-TR',
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
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
      await page.goto(`https://hasatlink.com${p.url}`, { waitUntil: 'networkidle', timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(p.wait || 2000);

      await page.evaluate(() => {
        document.querySelectorAll('.animate-slide-up, [class*="cookie"]').forEach(el => el.remove());
        document.querySelectorAll('[class*="pwa"], [class*="install"]').forEach(el => el.remove());
        document.querySelectorAll('.fixed.bottom-0.left-0:not(nav)').forEach(el => {
          if (!el.querySelector('a[href]')) el.remove();
        });
      });

      await page.screenshot({
        path: `${v.outDir}/${p.name}.png`,
        type: 'png',
      });
      console.log(`  Saved: ${p.name}.png`);
    }

    await context.close();
  }

  await browser.close();
  console.log('\nAll iPad screenshots saved.');
})();
