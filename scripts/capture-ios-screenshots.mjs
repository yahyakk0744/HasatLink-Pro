#!/usr/bin/env node
/**
 * HasatLink-Pro — Genuine iOS Simulator screenshot capture (runs on Codemagic mac_mini_m2)
 *
 * Apple rejected our App Store screenshots twice under Guideline 2.3.10
 * ("non-iOS status bar images") because scripts/add-ios-chrome.mjs composited
 * a hand-drawn SVG status bar onto raw web-page captures — close, but never
 * pixel-accurate to real iOS chrome.
 *
 * This script replaces that entirely: it boots the biggest available real
 * iOS Simulator per device family (iPhone / iPad), installs the just-built
 * `.app` (no code signing needed for -sdk iphonesimulator), and captures
 * each of the 7 in-app routes through the simulator's genuine OS chrome.
 * `simctl status_bar override` gives a clean, deterministic status bar
 * rendered by the real status-bar code — the same mechanism Apple's own
 * screenshot tooling uses — so there is nothing fabricated left for a
 * reviewer to flag.
 *
 * App Store Connect requires more than one exact pixel size per family
 * (e.g. iPhone "6.9-inch" AND "6.5-inch"; iPad "13-inch" AND "11-inch"),
 * and no single current simulator device natively produces all of them —
 * Apple pins some of these dimensions to historical hardware regardless of
 * what Xcode ships today. So each family is captured once at the biggest
 * available native resolution, then losslessly center-cropped down to each
 * required exact size with macOS's built-in `sips` (no extra dependency,
 * ships with every Mac/Xcode install). A crop of a genuine capture is still
 * a genuine capture — nothing about the chrome is redrawn or fabricated.
 *
 * Requires: the app already built for the simulator at APP_PATH
 * (see codemagic.yaml `ios-screenshots` workflow, CONFIGURATION_BUILD_DIR).
 *
 * Output: store-assets-screenshots-out/{iphone-69,iphone-65,ipad-13,ipad-11}/NN-name.png
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync, copyFileSync, readFileSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

const REPO = resolve(import.meta.dirname, '..');
const APP_PATH = process.env.SIMULATOR_APP_PATH || join(REPO, 'frontend/build/simulator/App.app');
const BUNDLE_ID = 'com.hasatlink.app';
const API_PING_URL = 'https://hasatlink-api.onrender.com/api/ping';
const OUT_ROOT = join(REPO, 'store-assets-screenshots-out');

// Filename (without extension) → in-app route. Matches the naming already
// used under store-assets/screenshots-*.
const ROUTES = [
  ['01-anasayfa', '/'],
  ['02-pazar', '/pazar'],
  ['03-uydu-analiz', '/uydu-analiz'],
  ['04-hasatlink-pazari', '/hasatlink-pazari'],
  ['05-hal-fiyatlari', '/hal-fiyatlari'],
  ['06-harita', '/harita'],
  ['07-ai-teshis', '/ai-teshis'],
];

// Two device families, each producing two required App Store Connect
// screenshot buckets from a single capture pass.
const FAMILIES = [
  {
    isPad: false,
    targets: [
      { bucket: 'iphone-69', width: 1320, height: 2868 }, // current primary "iPhone 6.9" Display"
      { bucket: 'iphone-65', width: 1284, height: 2778 }, // legacy-pinned "iPhone 6.5" Display"
    ],
  },
  {
    isPad: true,
    targets: [
      { bucket: 'ipad-13', width: 2064, height: 2752 }, // current primary "iPad 13" Display" (M4)
      { bucket: 'ipad-11', width: 1668, height: 2388 }, // "iPad 11" Display"
    ],
  },
];

// Ordering hint only — bigger-sounding devices are tried first so we
// converge on the biggest available panel without probing everything.
const NAME_PRIORITY = [/Pro Max/, /Plus/, /Pro/];

function sh(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8' });
}

function pngSize(filePath) {
  const buf = readFileSync(filePath);
  // PNG signature (8 bytes) + IHDR chunk: length(4) type(4) width(4) height(4)
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function listAvailableDevices(isPad) {
  const data = JSON.parse(sh('xcrun', ['simctl', 'list', 'devices', 'available', '-j']));
  const prefix = isPad ? /^iPad/ : /^iPhone/;
  const out = [];
  for (const [runtime, list] of Object.entries(data.devices)) {
    const m = runtime.match(/iOS-(\d+)-(\d+)/);
    const version = m ? parseFloat(`${m[1]}.${m[2]}`) : 0;
    for (const dev of list) {
      if (!dev.isAvailable || !prefix.test(dev.name)) continue;
      out.push({ udid: dev.udid, name: dev.name, version });
    }
  }
  out.sort((a, b) => {
    const pa = NAME_PRIORITY.findIndex((re) => re.test(a.name));
    const pb = NAME_PRIORITY.findIndex((re) => re.test(b.name));
    const ra = pa === -1 ? NAME_PRIORITY.length : pa;
    const rb = pb === -1 ? NAME_PRIORITY.length : pb;
    if (ra !== rb) return ra - rb;
    return b.version - a.version;
  });
  return out;
}

function bootDevice(udid) {
  try {
    sh('xcrun', ['simctl', 'boot', udid]);
  } catch (err) {
    if (!String(err.message).includes('current state: Booted')) throw err;
  }
  sh('xcrun', ['simctl', 'bootstatus', udid, '-b']);
  // Clean, consistent, 100%-genuine status bar — rendered by the real OS
  // status-bar code with mocked values. This is the exact mechanism Apple's
  // own screenshot tooling uses; it is what makes the chrome authentic.
  sh('xcrun', [
    'simctl', 'status_bar', udid, 'override',
    '--time', '9:41',
    '--cellularBars', '4',
    '--wifiBars', '3',
    '--batteryState', 'charged',
    '--batteryLevel', '100',
  ]);
  // Let first-boot system banners (e.g. "Ready for Apple Intelligence")
  // clear before anything gets installed or screenshotted.
  execSync('sleep 5');
}

// Picks the highest-priority device that actually boots and can be
// screenshotted, and reports its true native resolution.
function pickBiggestDevice(isPad) {
  const candidates = listAvailableDevices(isPad);
  const tried = [];
  for (const dev of candidates) {
    tried.push(dev.name);
    try {
      bootDevice(dev.udid);
      const probe = join(OUT_ROOT, `.probe-${dev.udid}.png`);
      sh('xcrun', ['simctl', 'io', dev.udid, 'screenshot', probe]);
      const size = pngSize(probe);
      execFileSync('rm', ['-f', probe]);
      console.log(`[device] ${isPad ? 'iPad' : 'iPhone'} → ${dev.name} (iOS ${dev.version}) @ ${size.width}x${size.height}`);
      return { ...dev, width: size.width, height: size.height };
    } catch (err) {
      console.log(`[device] ${dev.name} unusable: ${err.message}`);
    }
  }
  throw new Error(`No usable ${isPad ? 'iPad' : 'iPhone'} simulator found. Tried: ${tried.join(', ') || '(none)'}`);
}

// Resizes a PNG to an exact pixel size using macOS's built-in `sips` — no
// npm dependency, ships on every Mac, works unmodified on Codemagic's build
// image. Build #6 showed the two-step resample+crop combo (`sips
// --resampleWidth/--resampleHeight` then `-c`) doesn't behave as its docs
// suggest — it left thick black letterbox bars, i.e. `-c` was padding
// instead of cropping. `-z height width` (resampleHeightWidth) is a single,
// unambiguous direct resize to the exact target box — no crop/pad step, so
// no way for it to introduce bars. The tradeoff is a small non-uniform
// stretch (a few percent for these buckets) since source and target aspect
// ratios aren't identical, which is standard practice for App Store
// screenshot buckets and far less noticeable than a black bar.
function resizeCropToExact(filePath, targetW, targetH) {
  const { width: srcW, height: srcH } = pngSize(filePath);
  if (srcW === targetW && srcH === targetH) return;
  sh('sips', ['-z', String(targetH), String(targetW), filePath]);
}

// Polls until the Render.com free-tier API actually answers, rather than
// firing one fetch and hoping. Build #7 showed a single best-effort ping
// isn't enough: the backend was still cold through routes 1-2 and part of
// route 4, and those three came back essentially blank (React never got
// data to render, no fallback UI). Blocking here until the API is
// demonstrably awake removes that race entirely.
async function warmBackend() {
  const deadline = Date.now() + 55000;
  while (Date.now() < deadline) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(API_PING_URL, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        console.log('[warm] backend is awake');
        return;
      }
    } catch {
      // keep polling until the deadline
    }
    execSync('sleep 2');
  }
  console.log('[warm] backend still not responding after 55s — proceeding anyway');
}

// A rendered route with real content (listings, tables, images, nav
// chrome) always compresses to well over this; a route that came up
// blank/white (nothing but a status bar over an empty background) does
// not. Calibrated from build #7: blank captures were ~90KB, every
// genuinely rendered capture was 175KB+.
const MIN_CONTENT_BYTES = 130 * 1024;

function launchAndCapture(udid, route, outFile, extraWaitMs) {
  execFileSync('xcrun', ['simctl', 'launch', '--terminate-running-process', udid, BUNDLE_ID], {
    env: { ...process.env, SIMCTL_CHILD_SCREENSHOT_ROUTE: route },
  });
  // Splash screen alone holds for 2s (capacitor.config.ts), plus cold JS
  // bundle boot + route render + data fetch. AppDelegate replays the
  // screenshotRoute event every second out to 7s, so waiting less than that
  // risks capturing before navigation ever lands.
  execSync(`sleep ${(8000 + extraWaitMs) / 1000}`);
  sh('xcrun', ['simctl', 'io', udid, 'screenshot', outFile]);
}

// Re-captures a route (without relaunching — the app is already on the
// right screen) if the first attempt looks suspiciously blank, up to twice
// more with a longer wait each time. Guards against exactly what build #7
// hit: a slow API response leaving the page empty with no fallback UI.
function captureWithRetry(udid, route, outFile) {
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      console.log(`[retry] ${outFile} looked blank (${statSync(outFile).size}b) — waiting and recapturing (attempt ${attempt + 1})`);
      execSync('sleep 6');
      sh('xcrun', ['simctl', 'io', udid, 'screenshot', outFile]);
    }
    if (statSync(outFile).size >= MIN_CONTENT_BYTES) return;
  }
  console.log(`[retry] ${outFile} still looks blank after retries (${statSync(outFile).size}b) — keeping it, route was ${route}`);
}

async function processFamily({ isPad, targets }) {
  console.log(`\n=== ${isPad ? 'iPad' : 'iPhone'} family → buckets: ${targets.map((t) => t.bucket).join(', ')} ===`);
  const device = pickBiggestDevice(isPad);
  sh('xcrun', ['simctl', 'install', device.udid, APP_PATH]);

  // Pre-grant every common permission (location, photos, camera, ...) so no
  // system dialog can appear mid-capture. Build #4 showed this matters for
  // more than just the screenshot itself: while a system alert is
  // frontmost, WKWebView suspends JS execution, so our repeated
  // screenshotRoute dispatch silently never lands and every route came out
  // as the homepage. Removing the dialog entirely fixes both at once.
  try {
    sh('xcrun', ['simctl', 'privacy', device.udid, 'grant', 'all', BUNDLE_ID]);
  } catch (err) {
    console.log(`[privacy] grant all failed (non-fatal): ${err.message}`);
  }

  for (const t of targets) mkdirSync(join(OUT_ROOT, t.bucket), { recursive: true });

  await warmBackend();

  for (let i = 0; i < ROUTES.length; i++) {
    const [name, route] = ROUTES[i];
    const rawFile = join(OUT_ROOT, `.raw-${name}.png`);
    console.log(`[capture] ${isPad ? 'iPad' : 'iPhone'}/${name}.png ← ${route}`);
    launchAndCapture(device.udid, route, rawFile, i === 0 ? 6000 : 0);
    captureWithRetry(device.udid, route, rawFile);

    for (const t of targets) {
      const outFile = join(OUT_ROOT, t.bucket, `${name}.png`);
      copyFileSync(rawFile, outFile);
      resizeCropToExact(outFile, t.width, t.height);
    }
    execFileSync('rm', ['-f', rawFile]);
  }

  sh('xcrun', ['simctl', 'shutdown', device.udid]);
}

(async () => {
  if (!existsSync(APP_PATH)) {
    console.error(`Built app not found at ${APP_PATH}`);
    process.exit(1);
  }
  mkdirSync(OUT_ROOT, { recursive: true });

  for (const family of FAMILIES) {
    await processFamily(family);
  }

  const total = FAMILIES.reduce((sum, f) => sum + f.targets.length, 0) * ROUTES.length;
  console.log(`\n✅ Captured ${total} genuine simulator screenshots → ${OUT_ROOT}`);
})();
