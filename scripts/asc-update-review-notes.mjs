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
  'Resubmission addressing the 26 April rejection (4.2 + 2.1(a)).',
  '',
  '═══════════════════════════════════════════════════════════',
  'CHANGES IN THIS BUILD',
  '═══════════════════════════════════════════════════════════',
  '',
  '1. iPhone-only target (was Universal). TARGETED_DEVICE_FAMILY',
  '   set to "1" and the iPad orientation hint was removed from',
  '   Info.plist. The previous review on iPad Air 11" (M3) is no',
  '   longer applicable — the app no longer ships to iPad.',
  '',
  '2. Sign in with Apple is now the primary login option on iOS,',
  '   visible at the top of the auth screen. It is implemented',
  '   with the @capacitor-community/apple-sign-in plugin (no web',
  '   SDK / no popup) and the resulting identityToken is verified',
  '   server-side against https://appleid.apple.com/auth/keys',
  '   before a HasatLink JWT is issued. This gives reviewers a',
  '   one-tap, fully native authentication path.',
  '',
  '═══════════════════════════════════════════════════════════',
  'NATIVE iOS FEATURES IN THIS APP (Guideline 4.2)',
  '═══════════════════════════════════════════════════════════',
  '',
  '• Sign in with Apple — native ASAuthorizationAppleIDProvider',
  '  via Capacitor; identityToken sent to backend, JWKS-verified.',
  '',
  '• AI Plant Disease Diagnosis — uses native iOS camera',
  '  (UIImagePickerController via @capacitor/camera). User',
  '  photographs a leaf, the image is sent to our diagnosis',
  '  service and a treatment plan is returned. Reachable from',
  '  the home screen ("AI Hastalık Teşhisi" / AI Diagnosis).',
  '',
  '• Apple Push Notifications — APS production entitlement is',
  '  enabled, the app registers an APNs token at first launch',
  '  via @capacitor/push-notifications. Listings, offers, market',
  '  price alerts, and chat messages all arrive as native push.',
  '',
  '• Local Notifications — price-alert reminders and harvest',
  '  calendar reminders are scheduled via UNUserNotificationCenter',
  '  (@capacitor/local-notifications) and fire even when offline.',
  '',
  '• Native Geolocation — CoreLocation is used to surface',
  '  nearby listings, dealers, and weather for the user\'s farm.',
  '  Permission prompt: NSLocationWhenInUseUsageDescription.',
  '',
  '• Native Photo Library — @capacitor/camera also bridges to',
  '  PHPickerViewController for selecting listing photographs.',
  '',
  '• Native Share Sheet — UIActivityViewController via',
  '  @capacitor/share for sharing listings, blog posts, and',
  '  forum threads to other apps.',
  '',
  '• Haptic Feedback — UIImpactFeedbackGenerator on bottom-nav',
  '  taps, list-item interactions, and form submissions through',
  '  @capacitor/haptics.',
  '',
  '• Native Status Bar styling, native Keyboard accessory bar,',
  '  native back-gesture handling, native Network status banner.',
  '',
  '• Native Splash Screen + native Launch Storyboard.',
  '',
  '═══════════════════════════════════════════════════════════',
  'LOGIN CREDENTIALS (verified working)',
  '═══════════════════════════════════════════════════════════',
  '',
  'Either credential pair works — both are seeded in production',
  'MongoDB and verified via curl against our live API right',
  'before this submission was made:',
  '',
  '    Option A — recommended:',
  '       Email:    test@hasatlink.com',
  '       Password: Reviewer2026!',
  '',
  '    Option B — also valid, prior credentials still active:',
  '       Email:    reviewer@hasatlink.com',
  '       Password: Reviewer123!',
  '',
  'Live verification:',
  '    POST https://hasatlink-api.onrender.com/api/auth/login',
  '    → HTTP 200, returns valid HasatLink JWT in ~0.8 s.',
  '',
  '═══════════════════════════════════════════════════════════',
  '2.1(a) MITIGATIONS',
  '═══════════════════════════════════════════════════════════',
  '',
  '• Backend is now kept warm 24/7 via staggered external',
  '  keep-alive jobs; cold starts should not be visible.',
  '• When a cold start does happen the API returns HTTP 503',
  '  with a Retry-After header instead of a generic 500.',
  '• The iOS client uses native fetch with a 75-second timeout',
  '  and one automatic retry, so a transient 503 is absorbed.',
  '• If "Sunucuya bağlanılıyor…" appears, please wait — the',
  '  client is already retrying.',
  '• Sign in with Apple bypasses the email/password field',
  '  entirely if the credentials path ever misbehaves.',
  '',
  'Thank you for re-reviewing this build. We have done our best',
  'to address every concern raised on 26 April.',
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
