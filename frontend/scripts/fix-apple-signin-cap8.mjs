// Postinstall patch: make @capacitor-community/apple-sign-in compatible with Capacitor 8.
//
// WHY: apple-sign-in@7.1.0 is the latest release and pins capacitor-swift-pm to 7.x
// (`from: "7.0.0"`), which conflicts with the rest of our Capacitor-8 plugins and
// breaks SPM resolution on iOS builds. Until an official Cap-8 release ships, we
// rewrite the upstream Package.swift to accept the 7.x..<9.x range at install time.
//
// Idempotent: re-running is safe. Exits 0 if file is missing (e.g. android-only env).

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkgPath = resolve(
  __dirname,
  '..',
  'node_modules',
  '@capacitor-community',
  'apple-sign-in',
  'Package.swift'
);

if (!existsSync(pkgPath)) {
  console.log('[apple-signin-patch] Package.swift not found — skipping.');
  process.exit(0);
}

const original = readFileSync(pkgPath, 'utf8');

// The upstream line we need to replace.
const target = /\.package\(url: "https:\/\/github\.com\/ionic-team\/capacitor-swift-pm\.git", from: "7\.0\.0"\)/;

// Widened range — accept any 7.x–8.x Capacitor swift-pm.
const patched =
  '.package(url: "https://github.com/ionic-team/capacitor-swift-pm.git", "7.0.0"..<"9.0.0")';

if (original.includes(patched)) {
  console.log('[apple-signin-patch] Already patched — nothing to do.');
  process.exit(0);
}

if (!target.test(original)) {
  console.warn(
    '[apple-signin-patch] Unexpected Package.swift contents — upstream may have changed. Skipping patch.'
  );
  process.exit(0);
}

const next = original.replace(target, patched);
writeFileSync(pkgPath, next, 'utf8');
console.log('[apple-signin-patch] Patched Package.swift to accept capacitor-swift-pm 7.x–8.x.');
