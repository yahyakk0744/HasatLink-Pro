#!/usr/bin/env node
/**
 * HasatLink-Pro — Genuine iOS Simulator screenshot capture (runs on Codemagic mac_mini_m2)
 *
 * Apple rejected our App Store screenshots twice under Guideline 2.3.10
 * ("non-iOS status bar images") because scripts/add-ios-chrome.mjs composited
 * a hand-drawn SVG status bar onto raw web-page captures — close, but never
 * pixel-accurate to real iOS chrome.
 *
 * This script replaces that entirely: it boots a real iOS Simulator per
 * required App Store device bucket, installs the just-built `.app` (no code
 * signing needed for -sdk iphonesimulator), and captures each of the 7
 * in-app routes through the simulator's genuine OS chrome. `simctl status_bar
 * override` gives a clean, deterministic status bar rendered by the real
 * status-bar code — the same mechanism Apple's own screenshot tooling uses —
 * so there is nothing fabricated left for a reviewer to flag.
 *
 * Requires: the app already built for the simulator at APP_PATH
 * (see codemagic.yaml `ios-screenshots` workflow, CONFIGURATION_BUILD_DIR).
 *
 * Output: store-assets-screenshots-out/{iphone-67,iphone-65,ipad-13,ipad-11}/NN-name.png
 */
import { execFileSync, execSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
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

// Candidate simulator device names per required App Store screenshot bucket.
// Exact generation availability drifts between Xcode versions, so we match
// by name pattern and pick the newest available iOS runtime rather than
// hardcoding one generation.
const DEVICES = [
  { bucket: 'iphone-67', candidates: [/^iPhone 16 Pro Max$/, /^iPhone 15 Pro Max$/] },
  { bucket: 'iphone-65', candidates: [/^iPhone 14 Plus$/, /^iPhone 13 Pro Max$/, /^iPhone 12 Pro Max$/] },
  { bucket: 'ipad-13', candidates: [/^iPad Pro \(12\.9-inch\)/] },
  { bucket: 'ipad-11', candidates: [/^iPad Pro \(11-inch\)/] },
];

function sh(cmd, args) {
  return execFileSync(cmd, args, { encoding: 'utf8' });
}

function resolveDevice(candidates) {
  const data = JSON.parse(sh('xcrun', ['simctl', 'list', 'devices', 'available', '-j']));
  let best = null;
  for (const [runtime, list] of Object.entries(data.devices)) {
    const m = runtime.match(/iOS-(\d+)-(\d+)/);
    const version = m ? parseFloat(`${m[1]}.${m[2]}`) : 0;
    for (const dev of list) {
      if (!dev.isAvailable) continue;
      if (candidates.some((re) => re.test(dev.name))) {
        if (!best || version > best.version) best = { udid: dev.udid, name: dev.name, version };
      }
    }
  }
  if (!best) {
    throw new Error(`No matching simulator found for candidates: ${candidates.map(String).join(', ')}`);
  }
  return best;
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
}

async function warmBackend() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    await fetch(API_PING_URL, { signal: controller.signal }).catch(() => {});
    clearTimeout(timeout);
  } catch {
    // best-effort only — cold Render.com free tier can take 30-50s to wake,
    // the per-route wait below (with extra time on the first route) covers it
  }
}

function launchAndCapture(udid, route, outFile, extraWaitMs) {
  execFileSync('xcrun', ['simctl', 'launch', '--terminate-running-process', udid, BUNDLE_ID], {
    env: { ...process.env, SIMCTL_CHILD_SCREENSHOT_ROUTE: route },
  });
  execSync(`sleep ${(3500 + extraWaitMs) / 1000}`);
  sh('xcrun', ['simctl', 'io', udid, 'screenshot', outFile]);
}

async function processDevice({ bucket, candidates }) {
  console.log(`\n=== ${bucket} ===`);
  const device = resolveDevice(candidates);
  console.log(`[device] ${bucket} → ${device.name} (iOS ${device.version})`);

  bootDevice(device.udid);
  sh('xcrun', ['simctl', 'install', device.udid, APP_PATH]);

  const outDir = join(OUT_ROOT, bucket);
  mkdirSync(outDir, { recursive: true });

  await warmBackend();

  for (let i = 0; i < ROUTES.length; i++) {
    const [name, route] = ROUTES[i];
    const outFile = join(outDir, `${name}.png`);
    console.log(`[capture] ${bucket}/${name}.png ← ${route}`);
    launchAndCapture(device.udid, route, outFile, i === 0 ? 6000 : 0);
  }

  sh('xcrun', ['simctl', 'shutdown', device.udid]);
}

(async () => {
  if (!existsSync(APP_PATH)) {
    console.error(`Built app not found at ${APP_PATH}`);
    process.exit(1);
  }
  mkdirSync(OUT_ROOT, { recursive: true });

  for (const device of DEVICES) {
    await processDevice(device);
  }

  console.log(`\n✅ Captured ${DEVICES.length * ROUTES.length} genuine simulator screenshots → ${OUT_ROOT}`);
})();
