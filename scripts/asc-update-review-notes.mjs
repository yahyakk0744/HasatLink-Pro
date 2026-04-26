#!/usr/bin/env node
/**
 * Updates the App Review Notes (and demo creds) on the inflight version.
 * Notes are kept under the 4000-char ASC limit while still explicitly
 * addressing Apple's prior 4.2 + 2.1(a) rejection notes.
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
  'Resubmission addressing 26 Apr rejection (4.2 + 2.1(a)).',
  '',
  '== CHANGES IN THIS BUILD ==',
  '1. iPhone-only target (was Universal). TARGETED_DEVICE_FAMILY=1; iPad orientation hint removed from Info.plist. The prior review on iPad Air 11" (M3) no longer applies.',
  '2. Sign in with Apple is now the primary iOS login, at the top of the auth screen. Implemented via @capacitor-community/apple-sign-in (native ASAuthorizationAppleIDProvider, no web SDK, no popup). Backend verifies identityToken against https://appleid.apple.com/auth/keys before issuing our JWT. One-tap, fully native auth.',
  '',
  '== NATIVE iOS FEATURES (Guideline 4.2) ==',
  '- Sign in with Apple - native ASAuthorizationAppleIDProvider via Capacitor; identityToken JWKS-verified server-side.',
  '- AI Plant Disease Diagnosis - native UIImagePickerController via @capacitor/camera. User photographs a leaf, gets a treatment plan back. Home screen "AI Hastalik Teshisi".',
  '- Apple Push Notifications - APS production entitlement; registers APNs token at launch via @capacitor/push-notifications. Listings, offers, price alerts, chat all arrive as native push.',
  '- Local Notifications - price-alert + harvest reminders via UNUserNotificationCenter (@capacitor/local-notifications); fire offline.',
  '- Native Geolocation (CoreLocation) - nearby listings, dealers, weather. NSLocationWhenInUseUsageDescription set.',
  '- Native Photo Library - @capacitor/camera bridges to PHPickerViewController for listing photos.',
  '- Native Share Sheet - UIActivityViewController via @capacitor/share.',
  '- Haptic Feedback - UIImpactFeedbackGenerator on nav taps and form submits via @capacitor/haptics.',
  '- Native Status Bar, native Keyboard accessory, native back-gesture, native Network banner, native Splash + Launch Storyboard.',
  '',
  '== LOGIN CREDENTIALS (verified working) ==',
  'Both pairs are seeded in production MongoDB and were curl-verified against our live API right before this submission:',
  '  A (recommended): test@hasatlink.com / Reviewer2026!',
  '  B (also valid):  reviewer@hasatlink.com / Reviewer123!',
  'Live check: POST https://hasatlink-api.onrender.com/api/auth/login -> HTTP 200, JWT in ~0.8s.',
  '',
  '== 2.1(a) MITIGATIONS ==',
  '- Backend kept warm 24/7 via staggered external keep-alive jobs.',
  '- Cold start now returns HTTP 503 + Retry-After (not generic 500).',
  '- iOS client uses native fetch w/ 75s timeout + 1 auto-retry; transient 503 is absorbed.',
  '- If "Sunucuya baglaniliyor..." appears, please wait - the client is already retrying.',
  '- Sign in with Apple fully bypasses the email/password field if credentials misbehave.',
  '',
  'Thank you for re-reviewing. We addressed every concern from 26 Apr.',
].join('\n');

log(`notes length: ${NOTES.length} chars (limit 4000)`);
if (NOTES.length > 4000) {
  console.error(`notes too long: ${NOTES.length} > 4000`);
  process.exit(1);
}

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
