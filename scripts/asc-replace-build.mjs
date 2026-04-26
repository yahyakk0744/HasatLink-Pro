#!/usr/bin/env node
/**
 * Hot-replace the build attached to the inflight appStoreVersion WITHOUT
 * touching the existing reviewSubmission. Apple allows this while the
 * submission is in WAITING_FOR_REVIEW: queue position is preserved, the
 * reviewer just opens the newer binary when the slot comes up.
 *
 * What it does NOT do: delete/cancel reviewSubmissions, recreate
 * submissions, re-upload screenshots. (See asc-resubmit.mjs for that.)
 *
 * Workflow:
 *   1. Resolve inflight appStoreVersion (PREPARE_FOR_SUBMISSION,
 *      WAITING_FOR_REVIEW, REJECTED, etc.)
 *   2. Poll /builds for latest processingState=VALID build (up to 30 min)
 *   3. Skip if it's already the attached build (idempotent)
 *   4. PATCH /appStoreVersions/{verId}/relationships/build → new build
 *   5. Log the reviewSubmission state so we can confirm Waiting for Review
 *      survived the swap
 *
 * Env (provided by Codemagic ASC integration "HasatLink"):
 *   APP_STORE_CONNECT_KEY_IDENTIFIER
 *   APP_STORE_CONNECT_ISSUER_ID
 *   APP_STORE_CONNECT_PRIVATE_KEY     (raw PEM or @file:/path indirection)
 *   APP_STORE_APPLE_ID                (numeric, defaults to 6761334964)
 */
import crypto from 'node:crypto';
import fs from 'node:fs';

const APP_ID = process.env.APP_STORE_APPLE_ID || '6761334964';
const KEY_ID = process.env.APP_STORE_CONNECT_KEY_IDENTIFIER;
const ISSUER = process.env.APP_STORE_CONNECT_ISSUER_ID;
let   PRIV   = process.env.APP_STORE_CONNECT_PRIVATE_KEY;

function dereferenceKey(val) {
  if (!val) return val;
  let v = val.trim();
  if (v.startsWith('@file:')) v = v.slice('@file:'.length);
  else if (v.startsWith('file://')) v = v.slice('file://'.length);
  if (v.startsWith('/') && !v.includes('\n') && v.length < 4096 && fs.existsSync(v)) {
    return fs.readFileSync(v, 'utf8');
  }
  return val;
}
PRIV = dereferenceKey(PRIV);
if (!KEY_ID || !ISSUER || !PRIV) { console.error('missing ASC creds'); process.exit(1); }

const log  = (...a) => console.log('[asc-replace]', ...a);
const warn = (...a) => console.warn('[asc-replace:warn]', ...a);

function jwt() {
  const now = Math.floor(Date.now() / 1000);
  const header  = { alg: 'ES256', kid: KEY_ID, typ: 'JWT' };
  const payload = { iss: ISSUER, exp: now + 1200, aud: 'appstoreconnect-v1' };
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  const data = `${b64(header)}.${b64(payload)}`;
  const sig = crypto.sign(null, Buffer.from(data), { key: PRIV, dsaEncoding: 'ieee-p1363' }).toString('base64url');
  return `${data}.${sig}`;
}

async function api(method, p, body) {
  const res = await fetch(`https://api.appstoreconnect.apple.com/v1${p}`, {
    method,
    headers: {
      Authorization: `Bearer ${jwt()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) {
    const e = new Error(`${res.status} ${method} ${p} — ${text.slice(0, 1500)}`);
    e.status = res.status;
    throw e;
  }
  return text ? JSON.parse(text) : null;
}

// ---------- 1. inflight version ----------
const allowedStates = [
  'PREPARE_FOR_SUBMISSION', 'WAITING_FOR_REVIEW', 'IN_REVIEW',
  'REJECTED', 'METADATA_REJECTED', 'DEVELOPER_REJECTED', 'INVALID_BINARY',
  'WAITING_FOR_EXPORT_COMPLIANCE',
].join(',');
const versions = await api(
  'GET',
  `/apps/${APP_ID}/appStoreVersions?filter[appStoreState]=${allowedStates}&include=build&limit=5`,
);
if (!versions.data?.length) { console.error('no inflight version'); process.exit(1); }
const ver = versions.data[0];
const VER_ID = ver.id;
const oldBuildRel = ver.relationships?.build?.data;
log(`inflight: v=${ver.attributes.versionString} state=${ver.attributes.appStoreState} id=${VER_ID}`);
log(`current build attached: ${oldBuildRel ? oldBuildRel.id : '(none)'}`);

// ---------- 2. wait for VALID build ----------
async function latestValidBuild() {
  const r = await api(
    'GET',
    `/builds?filter[app]=${APP_ID}&filter[processingState]=VALID&sort=-uploadedDate&limit=5`,
  );
  return r.data?.[0] || null;
}

// Also surface any in-flight processing builds for visibility.
async function pendingBuildsSummary() {
  try {
    const r = await api(
      'GET',
      `/builds?filter[app]=${APP_ID}&sort=-uploadedDate&limit=5`,
    );
    return (r.data || []).map(b => ({
      id: b.id,
      v: b.attributes.version,
      state: b.attributes.processingState,
      uploaded: b.attributes.uploadedDate,
    }));
  } catch { return []; }
}

let build = await latestValidBuild();
const startWait = Date.now();
while (!build && Date.now() - startWait < 30 * 60 * 1000) {
  const recent = await pendingBuildsSummary();
  log(`no VALID build yet — recent: ${JSON.stringify(recent)}`);
  await new Promise(r => setTimeout(r, 60_000));
  build = await latestValidBuild();
}
if (!build) { console.error('still no VALID build after 30min'); process.exit(1); }

const NEW_BUILD_ID = build.id;
log(`latest VALID build: v=${build.attributes.version} id=${NEW_BUILD_ID} uploaded=${build.attributes.uploadedDate}`);

// ---------- 3. idempotency ----------
if (oldBuildRel?.id === NEW_BUILD_ID) {
  log('build already attached — nothing to do');
} else {
  // ---------- 4. PATCH build relationship ----------
  log(`PATCH /appStoreVersions/${VER_ID}/relationships/build → ${NEW_BUILD_ID}`);
  await api('PATCH', `/appStoreVersions/${VER_ID}/relationships/build`, {
    data: { type: 'builds', id: NEW_BUILD_ID },
  });
  log('build attached');
}

// ---------- 5. reviewSubmission state check ----------
try {
  const subs = await api(
    'GET',
    `/reviewSubmissions?filter[app]=${APP_ID}&limit=10`,
  );
  for (const s of subs.data || []) {
    log(`reviewSubmission ${s.id} state=${s.attributes.state} platform=${s.attributes.platform}`);
  }
} catch (e) {
  warn('submissions probe failed:', e.message.slice(0, 200));
}

log('done.');
