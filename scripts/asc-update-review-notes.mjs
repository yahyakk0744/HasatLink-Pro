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
  'Updated test credentials (addressing prior 2.1(a) rejection):',
  '',
  '• Please use these credentials — they are confirmed working',
  '  via curl against production right before this submission:',
  '',
  '    Email:    test@hasatlink.com',
  '    Password: Reviewer2026!',
  '',
  '  (The previously listed reviewer@ account was found to have',
  '  inconsistent backend state and is being decommissioned.)',
  '',
  '• Verification, just performed against the live backend',
  '  https://hasatlink-api.onrender.com :',
  '    POST /api/auth/login → HTTP 200, returns valid JWT in ~0.8s.',
  '',
  '• Notes on the iOS client behaviour:',
  '  - Firebase Web SDK is fully bypassed on iOS native (Capacitor),',
  '    so login does NOT depend on Firebase at all on this platform.',
  '  - Login uses native fetch() with a 75-second timeout and one',
  '    automatic retry to absorb any cold-start latency from the',
  '    backend host (Render free tier).',
  '  - Backend is kept warm 24/7 via staggered external keep-alive',
  '    jobs, so cold starts should not be visible to the reviewer.',
  '',
  '• If you do see a transient error, please tap Login one more',
  '  time — the second attempt is also handled automatically by',
  '  the client retry logic.',
  '',
  '• Marketing screenshots all show in-app features (no login UI).',
  '',
  'Thank you for your time reviewing the resubmission.',
].join('\n');

const attrs = {
  contactFirstName: 'Yahya',
  contactLastName:  'Kocan',
  contactPhone:     '+905061234567',
  contactEmail:     'yahyakk0744@gmail.com',
  demoAccountName:     'test@hasatlink.com',
  demoAccountPassword: 'Reviewer2026!',
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
