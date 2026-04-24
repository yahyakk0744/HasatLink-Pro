#!/usr/bin/env node
/**
 * HasatLink-Pro — App Store Connect resubmit script (runs on Codemagic)
 *
 * Reads ASC integration credentials from env (provided by the `HasatLink`
 * integration in codemagic.yaml), then:
 *   1. Finds inflight version + tr-TR localization + screenshot sets
 *   2. Cancels any pending/rejected review submissions
 *   3. Attaches the latest VALID build (Version Code 13+) — waits up to 30 min
 *   4. Deletes every existing screenshot on all 4 device families
 *   5. Uploads 28 fresh login-free screenshots from the repo itself
 *   6. Creates a new review submission and submits it
 *
 * No browser, no 2FA, fully autonomous.
 *
 * Env required:
 *   APP_STORE_CONNECT_PRIVATE_KEY   — PEM-encoded p8 key
 *   APP_STORE_CONNECT_KEY_IDENTIFIER — 10-char key ID
 *   APP_STORE_CONNECT_ISSUER_ID      — UUID issuer
 *   APP_STORE_APPLE_ID               — numeric Apple ID (6761334964)
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const APP_ID   = process.env.APP_STORE_APPLE_ID || '6761334964';
const KEY_ID   = process.env.APP_STORE_CONNECT_KEY_IDENTIFIER;
const ISSUER   = process.env.APP_STORE_CONNECT_ISSUER_ID;
const PRIV_KEY = process.env.APP_STORE_CONNECT_PRIVATE_KEY;

if (!KEY_ID || !ISSUER || !PRIV_KEY) {
  console.error('Missing ASC creds — KEY_IDENTIFIER=%s ISSUER=%s KEY=%s',
    KEY_ID ? 'set' : 'MISSING',
    ISSUER ? 'set' : 'MISSING',
    PRIV_KEY ? 'set' : 'MISSING');
  process.exit(1);
}

const repoRoot = path.resolve(process.cwd());
const SS = {
  APP_IPHONE_67: {
    dir: 'store-assets/screenshots-new',
    label: 'iPhone 6.7"',
    files: ['01-anasayfa','02-pazar','03-uydu-analiz','04-hasatlink-pazari','05-hal-fiyatlari','06-harita','07-ai-teshis'],
  },
  APP_IPHONE_65: {
    dir: 'store-assets/screenshots-resized',
    label: 'iPhone 6.5"',
    files: ['01-anasayfa','02-pazar','03-uydu-analiz','04-hasatlink-pazari','05-hal-fiyatlari','06-harita','07-ai-teshis'],
  },
  APP_IPAD_PRO_129: {
    dir: 'store-assets/screenshots-ipad-13',
    label: 'iPad 13"',
    files: ['01-anasayfa','02-pazar','03-uydu-analiz','04-hasatlink-pazari','05-hal-fiyatlari','06-harita','07-ai-teshis'],
  },
  APP_IPAD_PRO_3GEN_11: {
    dir: 'store-assets/screenshots-ipad-11',
    label: 'iPad 11"',
    files: ['01-anasayfa','02-pazar','03-uydu-analiz','04-hasatlink-pazari','05-hal-fiyatlari','06-harita','07-ai-teshis'],
  },
};

const log  = (...a) => console.log('[asc]', ...a);
const warn = (...a) => console.warn('[asc:warn]', ...a);
const err  = (...a) => console.error('[asc:err]', ...a);

// Diagnostic: log what shape the env var actually has (without leaking the key body)
function inspectKey(raw) {
  const len = raw.length;
  const head = raw.slice(0, 30).replace(/[^\x20-\x7e]/g, c => '\\x' + c.charCodeAt(0).toString(16).padStart(2,'0'));
  const tail = raw.slice(-30).replace(/[^\x20-\x7e]/g, c => '\\x' + c.charCodeAt(0).toString(16).padStart(2,'0'));
  const hasNL  = raw.includes('\n');
  const hasCR  = raw.includes('\r');
  const hasEsc = raw.includes('\\n');
  const hasBegin = raw.includes('BEGIN');
  const hasEC = raw.includes('BEGIN EC PRIVATE');
  console.log('[asc:key] len=%d head=%s tail=%s nl=%s cr=%s escNL=%s BEGIN=%s EC=%s',
    len, JSON.stringify(head), JSON.stringify(tail), hasNL, hasCR, hasEsc, hasBegin, hasEC);
}
inspectKey(PRIV_KEY);

// Build candidate forms in order of likelihood, try each one until one parses.
function buildCandidates(raw) {
  const cands = [];
  const noBom = raw.replace(/^\uFEFF/, '');
  // 1) raw as-is
  cands.push({ name: 'raw',                key: noBom });
  // 2) trimmed
  cands.push({ name: 'trimmed',            key: noBom.trim() });
  // 3) escaped \n -> real \n
  cands.push({ name: 'unescaped-nl',       key: noBom.replace(/\\n/g, '\n').trim() });
  // 4) CR stripped
  cands.push({ name: 'no-cr',              key: noBom.replace(/\r/g, '').trim() });
  // 5) Wrap raw base64 (strip whitespace) in PKCS#8 markers
  const body = noBom.replace(/-----BEGIN [A-Z ]+-----/g, '').replace(/-----END [A-Z ]+-----/g, '').replace(/\s+/g, '');
  if (body && /^[A-Za-z0-9+/=]+$/.test(body)) {
    const wrapped = body.match(/.{1,64}/g).join('\n');
    cands.push({ name: 'rewrapped-pkcs8',  key: `-----BEGIN PRIVATE KEY-----\n${wrapped}\n-----END PRIVATE KEY-----\n` });
    // 6) base64-decoded DER (binary), pass as Buffer with der format
    try {
      cands.push({ name: 'der-buffer',     keyObj: { key: Buffer.from(body, 'base64'), format: 'der', type: 'pkcs8' } });
    } catch {}
  }
  return cands;
}

function loadPrivateKey() {
  const cands = buildCandidates(PRIV_KEY);
  let lastErr;
  for (const c of cands) {
    try {
      const key = c.keyObj
        ? crypto.createPrivateKey(c.keyObj)
        : crypto.createPrivateKey({ key: c.key, format: 'pem' });
      console.log('[asc:key] loaded via candidate:', c.name);
      return key;
    } catch (e) {
      console.log('[asc:key] candidate failed: %s -> %s', c.name, e.message);
      lastErr = e;
    }
  }
  throw lastErr || new Error('no candidate succeeded');
}

const PRIV_KEY_OBJ = loadPrivateKey();

function signJwt() {
  const header = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const payload = { iss: ISSUER, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' };
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const signingInput = `${b64(header)}.${b64(payload)}`;
  const sig = crypto.sign('sha256', Buffer.from(signingInput), { key: PRIV_KEY_OBJ, dsaEncoding: 'ieee-p1363' });
  return `${signingInput}.${sig.toString('base64url')}`;
}

const BASE = 'https://api.appstoreconnect.apple.com/v1';
let token = signJwt();
let tokenIssuedAt = Date.now();

async function api(method, p, body) {
  if (Date.now() - tokenIssuedAt > 19 * 60 * 1000) { token = signJwt(); tokenIssuedAt = Date.now(); }
  const url = p.startsWith('http') ? p : BASE + p;
  const res = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!res.ok) {
    const e = new Error(`${res.status} ${method} ${p} — ${text.slice(0, 500)}`);
    e.status = res.status;
    e.data = data;
    throw e;
  }
  return data;
}

// ES256 JWT sanity
try {
  crypto.createPrivateKey({ key: PRIV_KEY, format: 'pem' });
  log('JWT key loaded, kid=%s, iss=%s', KEY_ID, ISSUER.slice(0, 8) + '…');
} catch (e) {
  err('cannot load p8 key:', e.message);
  process.exit(1);
}

// ---------- STEP 0: sanity ping ----------
log('ping /apps —');
const meApps = await api('GET', `/apps?filter[id]=${APP_ID}&limit=1`);
if (!meApps.data || !meApps.data.length) { err('app not found'); process.exit(1); }
log(`  app ok: ${meApps.data[0].attributes.name} (${meApps.data[0].attributes.bundleId})`);

// ---------- STEP 1: find inflight version ----------
log('discovering inflight version —');
const allowedStates = [
  'PREPARE_FOR_SUBMISSION', 'WAITING_FOR_REVIEW', 'IN_REVIEW',
  'REJECTED', 'METADATA_REJECTED', 'DEVELOPER_REJECTED', 'INVALID_BINARY',
  'WAITING_FOR_EXPORT_COMPLIANCE', 'DEVELOPER_REMOVED_FROM_SALE',
];
const versions = await api(
  'GET',
  `/apps/${APP_ID}/appStoreVersions?filter[appStoreState]=${allowedStates.join(',')}&limit=10`
);
if (!versions.data.length) throw new Error('no inflight version');
const version = versions.data[0];
const APP_VERSION_ID = version.id;
log(`  version=${version.attributes.versionString} state=${version.attributes.appStoreState} id=${APP_VERSION_ID}`);

// ---------- STEP 2: find tr localization ----------
const locs = await api('GET', `/appStoreVersions/${APP_VERSION_ID}/appStoreVersionLocalizations?limit=50`);
if (!locs.data.length) throw new Error('no localization');
const loc = locs.data.find(l => l.attributes.locale === 'tr-TR') || locs.data[0];
const LOCALIZATION_ID = loc.id;
log(`  localization=${loc.attributes.locale} id=${LOCALIZATION_ID}`);

// ---------- STEP 3: find/create screenshot sets ----------
const sets = await api('GET', `/appStoreVersionLocalizations/${LOCALIZATION_ID}/appScreenshotSets?limit=50`);
const setByType = {};
for (const s of (sets.data || [])) setByType[s.attributes.screenshotDisplayType] = s.id;
log('  existing sets:', setByType);
for (const type of Object.keys(SS)) {
  if (setByType[type]) continue;
  warn(`  creating missing set ${type}…`);
  const created = await api('POST', '/appScreenshotSets', {
    data: {
      type: 'appScreenshotSets',
      attributes: { screenshotDisplayType: type },
      relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: LOCALIZATION_ID } } },
    },
  });
  setByType[type] = created.data.id;
  log(`    created ${type} → ${created.data.id}`);
}

// ---------- STEP 4: cancel any pending submission ----------
log('cancelling pending submissions —');
try {
  const subs = await api(
    'GET',
    `/reviewSubmissions?filter[app]=${APP_ID}&filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW,UNRESOLVED_ISSUES&limit=20`
  );
  for (const s of (subs.data || [])) {
    try {
      await api('PATCH', `/reviewSubmissions/${s.id}`, {
        data: { type: 'reviewSubmissions', id: s.id, attributes: { canceled: true } },
      });
      log(`  canceled ${s.id} (was ${s.attributes.state})`);
    } catch (e) { warn(`  cancel ${s.id} failed: ${e.message}`); }
  }
} catch (e) { warn('  submission discovery failed:', e.message); }

// ---------- STEP 5: attach latest VALID build ----------
log('attaching latest VALID build —');
async function latestValidBuild() {
  const b = await api(
    'GET',
    `/builds?filter[app]=${APP_ID}&filter[processingState]=VALID&sort=-uploadedDate&limit=5`
  );
  return b.data && b.data.length ? b.data[0] : null;
}
let build = await latestValidBuild();
const startWait = Date.now();
while (!build && Date.now() - startWait < 30 * 60 * 1000) {
  log('  no VALID build yet — Apple still processing; retrying in 60s…');
  await new Promise(r => setTimeout(r, 60_000));
  build = await latestValidBuild();
}
if (!build) throw new Error('still no VALID build after 30min; Apple processing is slow today — re-run later');
const NEW_BUILD_ID = build.id;
log(`  newest VALID build: version=${build.attributes.version} buildVersion=${build.attributes.version} uploaded=${build.attributes.uploadedDate} id=${NEW_BUILD_ID}`);

await api('PATCH', `/appStoreVersions/${APP_VERSION_ID}/relationships/build`, {
  data: { type: 'builds', id: NEW_BUILD_ID },
});
log('  ✓ build attached');

// ---------- STEP 6: delete every existing screenshot on all 4 sets ----------
log('deleting existing screenshots on all 4 device families —');
for (const [type, meta] of Object.entries(SS)) {
  const setId = setByType[type];
  try {
    const existing = await api('GET', `/appScreenshotSets/${setId}/appScreenshots?limit=50`);
    const list = existing.data || [];
    if (!list.length) { log(`  ${meta.label}: empty`); continue; }
    log(`  ${meta.label}: deleting ${list.length}…`);
    for (const s of list) {
      try { await api('DELETE', `/appScreenshots/${s.id}`); }
      catch (e) { warn(`    delete ${s.id} failed: ${e.message}`); }
    }
    log(`    ✓ cleared ${meta.label}`);
  } catch (e) { warn(`  ${meta.label} list failed: ${e.message}`); }
}

// ---------- STEP 7: upload new screenshots ----------
log('uploading 28 fresh login-free screenshots —');
function md5File(buf) {
  return crypto.createHash('md5').update(buf).digest('hex');
}
async function uploadScreenshot(setId, fileName, absPath) {
  const buf = fs.readFileSync(absPath);
  const reserve = await api('POST', '/appScreenshots', {
    data: {
      type: 'appScreenshots',
      attributes: { fileName, fileSize: buf.byteLength },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } },
    },
  });
  const ssId = reserve.data.id;
  const ops = reserve.data.attributes.uploadOperations || [];
  for (const op of ops) {
    const headers = {};
    for (const h of op.requestHeaders) headers[h.name] = h.value;
    const chunk = buf.subarray(op.offset, op.offset + op.length);
    const res = await fetch(op.url, { method: op.method, headers, body: chunk });
    if (!res.ok) throw new Error(`S3 PUT ${fileName} → ${res.status}`);
  }
  await api('PATCH', `/appScreenshots/${ssId}`, {
    data: { type: 'appScreenshots', id: ssId, attributes: { uploaded: true, sourceFileChecksum: md5File(buf) } },
  });
}

let uploaded = 0;
let failed = 0;
for (const [type, meta] of Object.entries(SS)) {
  const setId = setByType[type];
  log(`  ${meta.label} → set ${setId}`);
  for (const base of meta.files) {
    const fileName = `hasatlink-${type.toLowerCase().replace(/_/g, '-')}-${base}.png`;
    const absPath  = path.join(repoRoot, meta.dir, `${base}.png`);
    if (!fs.existsSync(absPath)) { warn(`    MISSING ${absPath}`); failed++; continue; }
    try {
      await uploadScreenshot(setId, fileName, absPath);
      log(`    ✓ ${fileName} (${fs.statSync(absPath).size} bytes)`);
      uploaded++;
    } catch (e) {
      err(`    ✗ ${fileName}: ${e.message}`);
      failed++;
    }
  }
}
log(`uploaded ${uploaded}/${uploaded + failed} screenshots`);
if (failed > 0) throw new Error(`${failed} screenshots failed to upload`);

// ---------- STEP 8: create & submit review ----------
log('creating new review submission —');
const newSub = await api('POST', '/reviewSubmissions', {
  data: {
    type: 'reviewSubmissions',
    attributes: { platform: 'IOS' },
    relationships: { app: { data: { type: 'apps', id: APP_ID } } },
  },
});
const subId = newSub.data.id;
log(`  submission id: ${subId}`);

await api('POST', '/reviewSubmissionItems', {
  data: {
    type: 'reviewSubmissionItems',
    relationships: {
      reviewSubmission: { data: { type: 'reviewSubmissions', id: subId } },
      appStoreVersion: { data: { type: 'appStoreVersions', id: APP_VERSION_ID } },
    },
  },
});
log('  version linked');

await api('PATCH', `/reviewSubmissions/${subId}`, {
  data: { type: 'reviewSubmissions', id: subId, attributes: { submitted: true } },
});
log(`✅ SUBMITTED FOR REVIEW — submission=${subId}`);
