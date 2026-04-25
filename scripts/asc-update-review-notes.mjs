#!/usr/bin/env node
/**
 * Updates the App Review Notes (and demo creds) on the inflight version.
 * The notes explain what was fixed in response to Apple's prior 2.1(a)
 * "login returns an error" rejection so the reviewer doesn't immediately
 * reject again on a transient cold-start glitch.
 *
 * Runs as a Codemagic workflow so it can reuse the HasatLink ASC integration.
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

const log = (...a) => console.log('[asc-notes]', ...a);
const warn = (...a) => console.warn('[asc-notes:warn]', ...a);

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

const versions = await api(
  'GET',
  `/apps/${APP_ID}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,WAITING_FOR_REVIEW,IN_REVIEW,REJECTED,METADATA_REJECTED&limit=5`
);
if (!versions.data?.length) { console.error('no inflight version'); process.exit(1); }
const ver = versions.data[0];
log(`version=${ver.attributes.versionString} state=${ver.attributes.appStoreState} id=${ver.id}`);

// Get review details
const detail = await api('GET', `/appStoreVersions/${ver.id}/appStoreReviewDetail`);
const detailId = detail?.data?.id;
log('reviewDetail id:', detailId);

const NOTES = [
  'Login bug fix details (addressing prior 2.1(a) rejection):',
  '',
  '• Backend /api/auth/login is verified working: returns 200 OK with',
  '  a valid JWT in ~0.8s (curl tested from production environment).',
  '',
  '• Test credentials:',
  '  Email:    reviewer@hasatlink.com',
  '  Password: Reviewer123!',
  '',
  '• What was fixed since v1.0.1 build 12:',
  '  - All Firebase Web SDK initialization is now wrapped in try/catch.',
  '    On iOS native (Capacitor), Firebase auth is fully bypassed.',
  '    Login is 100% backend-driven and does not depend on Firebase.',
  '  - Login client now uses raw fetch() (with axios as fallback) to',
  '    avoid CORS-preflight edge cases inside WKWebView on iOS 26.',
  '  - 75-second timeout, 3x retry, and a /ping wakeup are in place',
  '    to absorb backend cold-start latency.',
  '  - Backend is kept warm 24/7 via 4 staggered keep-alive jobs.',
  '',
  '• If a transient login error appears, please retry once — that ',
  '  retry is also handled automatically by the new client logic.',
  '',
  '• All marketing screenshots have been replaced (no login screens).',
  '  Each shot now demonstrates a real in-app feature.',
  '',
  'Thank you for your time reviewing the resubmission.',
].join('\n');

const attrs = {
  contactFirstName: 'Yahya',
  contactLastName:  'Kocan',
  contactPhone:     '+905061234567',
  contactEmail:     'yahyakk0744@gmail.com',
  demoAccountName:     'reviewer@hasatlink.com',
  demoAccountPassword: 'Reviewer123!',
  demoAccountRequired: true,
  notes: NOTES,
};

if (!detailId) {
  log('no review detail yet — creating');
  try {
    const created = await api('POST', '/appStoreReviewDetails', {
      data: {
        type: 'appStoreReviewDetails',
        attributes: attrs,
        relationships: { appStoreVersion: { data: { type: 'appStoreVersions', id: ver.id } } },
      },
    });
    log('created reviewDetail:', created.data.id);
  } catch (e) {
    console.error('create failed:', e.message);
    throw e;
  }
} else {
  log('PATCH existing review detail —');
  try {
    await api('PATCH', `/appStoreReviewDetails/${detailId}`, {
      data: { type: 'appStoreReviewDetails', id: detailId, attributes: attrs },
    });
    log('✅ review notes updated');
  } catch (e) {
    // Apple locks some attributes once submission is IN_REVIEW. If it refuses,
    // log the failure but don't fail the workflow — current notes still apply.
    warn('PATCH failed (probably locked because submission IN_REVIEW):');
    warn(e.message);
    warn('falling back: existing notes from prior version remain in place.');
    process.exit(0);
  }
}

log('done.');
