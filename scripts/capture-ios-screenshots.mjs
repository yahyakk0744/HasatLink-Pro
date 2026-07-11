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
import { existsSync, mkdirSync, readFileSync, unlinkSync } from 'node:fs';
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

// Required App Store screenshot buckets, by exact target pixel resolution.
// Simulator device *names* drift across Xcode versions (this is what broke
// the first version of this script — "iPhone 16 Pro Max" didn't exist on the
// build image), so instead of hardcoding names we boot whatever's available
// and measure a real screenshot's pixel size. That's Apple's own ground
// truth for "does this count as a 6.7-inch screenshot" and never goes stale.
const DEVICES = [
  { bucket: 'iphone-67', width: 1290, height: 2796, isPad: false },
  { bucket: 'iphone-65', width: 1284, height: 2778, isPad: false },
  { bucket: 'ipad-13', width: 2048, height: 2732, isPad: true },
  { bucket: 'ipad-11', width: 1668, height: 2388, isPad: true },
];

// Devices likely to have a large-enough panel get probed first, to keep the
// number of throwaway boots small — this is just an ordering hint, not a
// hard requirement (any available device gets tried if bigger ones miss).
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

function resolveDeviceByResolution(width, height, isPad) {
  const candidates = listAvailableDevices(isPad);
  const tried = [];
  for (const dev of candidates) {
    tried.push(`${dev.name} (iOS ${dev.version})`);
    try {
      bootDevice(dev.udid);
    } catch (err) {
      console.log(`[probe] boot failed for ${dev.name}: ${err.message}`);
      continue;
    }
    const probe = join(OUT_ROOT, `.probe-${dev.udid}.png`);
    try {
      sh('xcrun', ['simctl', 'io', dev.udid, 'screenshot', probe]);
      const size = pngSize(probe);
      unlinkSync(probe);
      if (size.width === width && size.height === height) {
        console.log(`[probe] ${dev.name} (iOS ${dev.version}) → ${size.width}x${size.height} ✓ match`);
        return dev;
      }
      console.log(`[probe] ${dev.name} → ${size.width}x${size.height}, want ${width}x${height} — skipping`);
      sh('xcrun', ['simctl', 'shutdown', dev.udid]);
    } catch (err) {
      console.log(`[probe] screenshot probe failed for ${dev.name}: ${err.message}`);
    }
  }
  console.error('All available devices tried:', tried.join(', ') || '(none)');
  throw new Error(`No simulator with resolution ${width}x${height} found among available devices.`);
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

async function processDevice({ bucket, width, height, isPad }) {
  console.log(`\n=== ${bucket} (${width}x${height}) ===`);
  const device = resolveDeviceByResolution(width, height, isPad);
  console.log(`[device] ${bucket} → ${device.name} (iOS ${device.version})`);

  // resolveDeviceByResolution already booted + status-bar-overrode this device
  // while probing its resolution — just install onto it.
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
