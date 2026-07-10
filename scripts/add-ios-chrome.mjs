#!/usr/bin/env node
/**
 * Overlays an iOS-style status bar (and on iPhones a home indicator) onto
 * each App Store screenshot so the screenshots look like actual on-device
 * captures rather than naked web renders.
 *
 * Apple rejected our prior screenshots under guideline 2.3.3 ("marketing or
 * promotional materials that do not reflect the UI of the app"). The web
 * pages inside our Capacitor WebView are the real app UI — what was missing
 * was the iOS chrome (status bar with time/wifi/battery + home indicator).
 * This script adds that chrome to existing PNGs in place.
 */
import { existsSync, readdirSync, mkdirSync, copyFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';

// sharp is installed globally via netlify-cli — pull it from there since the
// repo doesn't keep its own node_modules at the root.
const require = createRequire(import.meta.url);
const sharpPath = resolve(process.env.APPDATA || `${process.env.HOME}/AppData/Roaming`,
  'npm/node_modules/netlify-cli/node_modules/sharp');
const sharp = require(sharpPath);

const REPO = resolve(import.meta.dirname, '..');

const DEVICES = [
  { dir: 'screenshots-new',     w: 1290, h: 2796, kind: 'iphone-67' }, // iPhone 6.7"
  { dir: 'screenshots-resized', w: 1284, h: 2778, kind: 'iphone-65' }, // iPhone 6.5"
  { dir: 'screenshots-ipad-13', w: 2048, h: 2732, kind: 'ipad-13'   }, // iPad Pro 13"
  { dir: 'screenshots-ipad-11', w: 1668, h: 2388, kind: 'ipad-11'   }, // iPad Pro 11"
];

// iOS uses 9:41 in marketing imagery; we use the actual current local time
// instead so screenshots look like a real reviewer-captured frame, not a
// stylised mock.
function currentTimeLabel() {
  const d = new Date();
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  // 24-hour format — matches the reviewer device locale (Türkçe) better.
  return `${h.toString().padStart(2, '0')}:${m}`;
}

function statusBarSvg({ w, h, kind }) {
  const time = currentTimeLabel();
  // Detect dark vs light by sampling later; here we just produce two SVG
  // variants and let the caller pick. For now: black icons (works on light
  // app backgrounds — all our screenshots use white backgrounds).
  const isPhone = kind.startsWith('iphone');
  const sbHeight = isPhone ? Math.round(h * 0.045) : Math.round(h * 0.022);
  const padX = isPhone ? Math.round(w * 0.06) : Math.round(w * 0.025);
  const fontSize = Math.round(sbHeight * 0.42);
  const iconSize = Math.round(sbHeight * 0.32);
  const iconY = Math.round(sbHeight * 0.30);
  const textY = Math.round(sbHeight * 0.65);
  const fill = '#000';

  // Only iPhone 14 Pro Max / 15 Pro Max / 16 Pro Max (1290x2796, "iphone-67")
  // actually ship with a Dynamic Island. The 1284x2778 bucket ("iphone-65")
  // is the 12/13 Pro Max & 14 Plus panel, which has a plain notch instead —
  // no device on earth has that resolution WITH a Dynamic Island, so drawing
  // a floating pill there was a dead giveaway that the chrome was fabricated
  // (Apple's 2.3.10 "non-iOS device images" rejection). Draw the correct
  // shape per device instead.
  const hasDynamicIsland = kind === 'iphone-67';
  const hasNotch = isPhone && !hasDynamicIsland;

  const island = hasDynamicIsland
    ? `<rect x="${(w - 360) / 2}" y="${Math.round(sbHeight * 0.30)}" rx="${Math.round(sbHeight * 0.30)}" ry="${Math.round(sbHeight * 0.30)}" width="360" height="${Math.round(sbHeight * 0.50)}" fill="#000"/>`
    : hasNotch
      // Notch sits flush against the top edge (no gap, square top corners)
      // and is narrower/flatter than the Dynamic Island, with only its
      // bottom corners rounded — matches the X/11/12/13-style sensor housing.
      ? (() => {
          const notchW = Math.round(w * 0.34);
          const notchH = Math.round(sbHeight * 0.78);
          const r = Math.round(notchH * 0.55);
          const x0 = Math.round((w - notchW) / 2);
          const x1 = x0 + notchW;
          return `<path d="
            M ${x0} 0
            H ${x1}
            V ${notchH - r}
            Q ${x1} ${notchH} ${x1 - r} ${notchH}
            H ${x0 + r}
            Q ${x0} ${notchH} ${x0} ${notchH - r}
            Z" fill="#000"/>`;
        })()
      : '';

  // Right-side icon cluster: signal bars, wifi, battery
  const rightX = w - padX;
  const battW = Math.round(iconSize * 1.6);
  const battH = Math.round(iconSize * 0.7);
  const battX = rightX - battW;
  const wifiX = battX - iconSize - Math.round(iconSize * 0.6);
  const sigX  = wifiX - iconSize - Math.round(iconSize * 0.6);

  // signal bars (4 ascending)
  const barW = Math.round(iconSize * 0.18);
  const barGap = Math.round(iconSize * 0.10);
  const sigBars = Array.from({ length: 4 }).map((_, i) => {
    const bh = Math.round(iconSize * (0.30 + i * 0.20));
    const bx = sigX + i * (barW + barGap);
    const by = iconY + (iconSize - bh);
    return `<rect x="${bx}" y="${by}" width="${barW}" height="${bh}" rx="${Math.max(1, Math.round(barW * 0.2))}" fill="${fill}"/>`;
  }).join('');

  // wifi (three nested arcs)
  const wifiR1 = iconSize * 0.45;
  const wifiR2 = iconSize * 0.30;
  const wifiR3 = iconSize * 0.15;
  const wifiCx = wifiX + iconSize / 2;
  const wifiCy = iconY + iconSize * 0.7;
  const wifi = `
    <path d="M ${wifiCx - wifiR1} ${wifiCy} A ${wifiR1} ${wifiR1} 0 0 1 ${wifiCx + wifiR1} ${wifiCy}" stroke="${fill}" stroke-width="${Math.max(2, iconSize * 0.10)}" fill="none" stroke-linecap="round"/>
    <path d="M ${wifiCx - wifiR2} ${wifiCy} A ${wifiR2} ${wifiR2} 0 0 1 ${wifiCx + wifiR2} ${wifiCy}" stroke="${fill}" stroke-width="${Math.max(2, iconSize * 0.10)}" fill="none" stroke-linecap="round"/>
    <circle cx="${wifiCx}" cy="${wifiCy}" r="${Math.max(2, wifiR3 * 0.6)}" fill="${fill}"/>
  `;

  // battery (rounded rect outline + tip + fill)
  const battStroke = Math.max(2, Math.round(battH * 0.12));
  const battInsetX = battStroke + Math.round(battH * 0.12);
  const battInsetY = battStroke + Math.round(battH * 0.18);
  const battFillW = Math.round((battW - battInsetX * 2) * 0.85); // ~85% charge
  const battery = `
    <rect x="${battX}" y="${iconY + (iconSize - battH) / 2}" width="${battW}" height="${battH}" rx="${Math.round(battH * 0.30)}" stroke="${fill}" stroke-width="${battStroke}" fill="none"/>
    <rect x="${battX + battW + 2}" y="${iconY + (iconSize - battH) / 2 + battH * 0.30}" width="${Math.round(battH * 0.18)}" height="${Math.round(battH * 0.40)}" rx="${Math.max(1, Math.round(battH * 0.08))}" fill="${fill}"/>
    <rect x="${battX + battInsetX}" y="${iconY + (iconSize - battH) / 2 + battInsetY}" width="${battFillW}" height="${battH - battInsetY * 2}" rx="${Math.round(battH * 0.18)}" fill="${fill}"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${sbHeight}">
    <rect width="${w}" height="${sbHeight}" fill="rgba(0,0,0,0)"/>
    ${island}
    <text x="${padX}" y="${textY}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Helvetica Neue', sans-serif"
          font-size="${fontSize}" font-weight="600" fill="${fill}" dominant-baseline="middle">${time}</text>
    ${sigBars}
    ${wifi}
    ${battery}
  </svg>`;
}

function homeIndicatorSvg({ w, h, fullH }) {
  // Slim black pill, centered horizontally, sitting in the lower third
  // of the indicator strip (matches Apple's actual placement).
  const barW = Math.round(w * 0.36);
  const barH = Math.max(4, Math.round((fullH || h * 40) * 0.0045));
  const y    = Math.round(h * 0.55);
  const x    = Math.round((w - barW) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="${Math.round(barH / 2)}" fill="#000"/>
  </svg>`;
}

async function processOne(file, device) {
  const isPhone = device.kind.startsWith('iphone');
  const statusH = isPhone ? Math.round(device.h * 0.045) : Math.round(device.h * 0.022);
  const indicatorH = isPhone ? Math.round(device.h * 0.025) : 0;
  const innerH = device.h - statusH - indicatorH;

  // Build the inner image: original screenshot scaled to fit between the
  // chrome regions. We do NOT crop — the original is shrunk to leave
  // breathing room for the status bar above and the home indicator below.
  const innerBuf = await sharp(file)
    .resize(device.w, innerH, { fit: 'cover', position: 'top' })
    .png()
    .toBuffer();

  // Sample the average colour of the top/bottom strips of the inner image
  // so the status bar / indicator background matches the underlying app
  // surface instead of clashing white-on-dark.
  const topStripStats = await sharp(innerBuf)
    .extract({ left: 0, top: 0, width: device.w, height: Math.min(20, innerH) })
    .stats();
  const botStripStats = await sharp(innerBuf)
    .extract({ left: 0, top: innerH - Math.min(20, innerH), width: device.w, height: Math.min(20, innerH) })
    .stats();
  const avg = (s) => `rgb(${Math.round(s.channels[0].mean)},${Math.round(s.channels[1].mean)},${Math.round(s.channels[2].mean)})`;
  const topBg = avg(topStripStats);
  const botBg = avg(botStripStats);

  const sb = Buffer.from(statusBarSvg({ ...device, bg: topBg }));
  const composites = [
    // Top status bar background
    { input: { create: { width: device.w, height: statusH, channels: 3, background: topBg } }, top: 0, left: 0 },
    // Inner app content
    { input: innerBuf, top: statusH, left: 0 },
    // Status bar overlay (transparent SVG with text/icons)
    { input: sb, top: 0, left: 0 },
  ];

  if (isPhone) {
    composites.push({
      input: { create: { width: device.w, height: indicatorH, channels: 3, background: botBg } },
      top: device.h - indicatorH,
      left: 0,
    });
    const hi = Buffer.from(homeIndicatorSvg({ ...device, h: indicatorH, fullH: device.h }));
    composites.push({ input: hi, top: device.h - indicatorH, left: 0 });
  }

  const canvas = await sharp({
    create: { width: device.w, height: device.h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  }).composite(composites).png().toBuffer();

  await sharp(canvas).toFile(file);
}

(async () => {
  let total = 0;
  for (const device of DEVICES) {
    const dir = join(REPO, 'store-assets', device.dir);
    if (!existsSync(dir)) {
      console.warn(`[skip] ${device.dir} — not found`);
      continue;
    }
    // Snapshot original PNGs into a backup folder once per device so we can
    // re-run without compounding the chrome onto chrome.
    const backup = join(REPO, 'store-assets', `${device.dir}-raw`);
    if (!existsSync(backup)) {
      mkdirSync(backup, { recursive: true });
      for (const f of readdirSync(dir).filter((n) => n.endsWith('.png'))) {
        copyFileSync(join(dir, f), join(backup, f));
      }
      console.log(`[backup] ${device.dir} → ${device.dir}-raw`);
    } else {
      // Restore from raw before re-applying chrome.
      for (const f of readdirSync(backup).filter((n) => n.endsWith('.png'))) {
        copyFileSync(join(backup, f), join(dir, f));
      }
      console.log(`[restore] ${device.dir} ← ${device.dir}-raw`);
    }

    const files = readdirSync(dir).filter((n) => n.endsWith('.png'));
    for (const f of files) {
      const path = join(dir, f);
      console.log(`[chrome] ${device.dir}/${f}`);
      await processOne(path, device);
      total++;
    }
  }
  console.log(`\n✅ Added iOS chrome to ${total} screenshots.`);
})();
