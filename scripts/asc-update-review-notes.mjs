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
  'Resubmission v1.0.2 (build 5) addressing 26 Apr rejection (2.1(a) - login failed on iPad Air 11" M3).',
  '',
  '== WHAT CHANGED FOR THIS RESUBMISSION ==',
  '1. UNIVERSAL BINARY. We were iPhone-only (TARGETED_DEVICE_FAMILY=1, LSRequiresIPhoneOS=true) which forced iPad reviewers into iPhone-compatibility mode and made the app feel broken even though backend was reachable. Now: TARGETED_DEVICE_FAMILY=1,2 + LSRequiresIPhoneOS=false + iPad portrait+landscape orientations. iPad screenshots are supplied for both 11" and 13" devices.',
  '2. AGGRESSIVE BACKEND PRE-WARM. /api/ping is now fired 5 times during the first 30s of app launch (0s, 2s, 5s, 15s, 30s). By the time the reviewer taps "Sign in with Apple" the Render instance is fully awake.',
  '3. KEEP-ALIVE PIPELINE IS LIVE. 3 staggered GitHub Actions cron jobs (every 3 min, offset 0/+1/+2) plus an external cron-job.org pinger every 1 min. Combined wake interval is well under Renders 15-min sleep window.',
  '',
  '== HOW TO TEST LOGIN (iPad or iPhone) ==',
  'Option A - Sign in with Apple (recommended, fastest):',
  '  Tap the black "Sign in with Apple" button. Native ASAuthorizationAppleIDProvider sheet appears -> sign in with your Apple ID -> we receive identityToken -> backend verifies against https://appleid.apple.com/auth/keys (jose JWKS) -> JWT issued. No Firebase Web SDK, no WKWebView popup, no third-party cookies.',
  'Option B - Email + password:',
  '  test@hasatlink.com / Reviewer2026!  (verified live ~30 min before this submission)',
  '  reviewer@hasatlink.com / Reviewer123!  (backup)',
  '  Live check: POST https://hasatlink-api.onrender.com/api/auth/login -> HTTP 200 + JWT, ~0.3-0.8s when warm.',
  '',
  '== IF YOU SEE A LOGIN ERROR ON FIRST TRY ==',
  'Backend is on Render free tier. Despite the keep-alive pipeline, if the very first network attempt within 1-2s of opening the app hits a deeply-asleep instance, you may see "Apple giris hatasi" or "Internet baglantinizi kontrol..." once. Wait 5 seconds and tap login again - the second attempt will succeed because our pre-warm pings will have woken the dyno.',
  '',
  '== NATIVE iOS FEATURES (Guideline 4.2) ==',
  '- Sign in with Apple - native ASAuthorizationAppleIDProvider via @capacitor-community/apple-sign-in.',
  '- Home Screen Quick Actions - 4 shortcuts via UIApplicationShortcutItems + AppDelegate.',
  '- App Intents (iOS 16+) - 4 Siri Shortcuts via AppShortcutsProvider with SF Symbols.',
  '- AI Plant Disease Diagnosis - UIImagePickerController via @capacitor/camera.',
  '- Apple Push Notifications - APS production entitlement.',
  '- Local Notifications - UNUserNotificationCenter for price alerts + harvest reminders.',
  '- Native Geolocation - CoreLocation for nearby listings/dealers/weather.',
  '- Native Photo Library - PHPickerViewController.',
  '- Native Share Sheet - UIActivityViewController.',
  '- Haptic Feedback - UIImpactFeedbackGenerator.',
  '- Native Status Bar, Keyboard, back-gesture, Splash + Launch Storyboard.',
  '',
  'Thank you for re-reviewing. The iPad Air 11" M3 path you tested is now first-class.',
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
