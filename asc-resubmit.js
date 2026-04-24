// HasatLink-Pro — One-shot ASC resubmit script (v2 — all 4 device sets, auto-discovery)
// ------------------------------------------------------------------------------------
// USAGE:
//   1. Open https://appstoreconnect.apple.com/apps/6761334964/distribution/ios/version/inflight
//   2. Re-authenticate with 2FA if needed (Apple's web UI)
//   3. Open DevTools (F12) → Console
//   4. Paste THIS ENTIRE FILE into the console and press Enter
//   5. Watch the progress log; the script is idempotent — safe to re-run on failure
//
// WHAT IT DOES:
//   1. Auto-discovers the app's inflight version, localization, and screenshot sets
//   2. Cancels any pending/rejected/in-review submission
//   3. Attaches the latest processed build (Version Code 13) to the version
//   4. DELETES all existing screenshots on all 4 device sets
//   5. Uploads 28 fresh login-free screenshots (7 × iPhone 6.7", 6.5", iPad 13", 11")
//   6. Creates a new review submission and submits it
//
// SCREENSHOTS ARE FETCHED FROM GITHUB: commit 757f931 on main

(async () => {
  const APP_ID    = '6761334964';
  const RAW_BASE  = 'https://raw.githubusercontent.com/yahyakk0744/HasatLink-Pro/main/store-assets';

  // Screenshot manifests with on-disk sizes (from regen 2026-04-24)
  // iPhone 6.7" (1290×2796) — screenshots-new/
  const SS_67 = [
    { name: 'hasatlink-67-01-anasayfa.png',          size: 295963,  url: RAW_BASE + '/screenshots-new/01-anasayfa.png' },
    { name: 'hasatlink-67-02-pazar.png',             size: 1671931, url: RAW_BASE + '/screenshots-new/02-pazar.png' },
    { name: 'hasatlink-67-03-uydu-analiz.png',       size: 1120126, url: RAW_BASE + '/screenshots-new/03-uydu-analiz.png' },
    { name: 'hasatlink-67-04-hasatlink-pazari.png',  size: 305856,  url: RAW_BASE + '/screenshots-new/04-hasatlink-pazari.png' },
    { name: 'hasatlink-67-05-hal-fiyatlari.png',     size: 233322,  url: RAW_BASE + '/screenshots-new/05-hal-fiyatlari.png' },
    { name: 'hasatlink-67-06-harita.png',            size: 1450278, url: RAW_BASE + '/screenshots-new/06-harita.png' },
    { name: 'hasatlink-67-07-ai-teshis.png',         size: 145155,  url: RAW_BASE + '/screenshots-new/07-ai-teshis.png' },
  ];
  // iPhone 6.5" (1284×2778) — screenshots-resized/
  const SS_65 = [
    { name: 'hasatlink-65-01-anasayfa.png',          size: 298704,  url: RAW_BASE + '/screenshots-resized/01-anasayfa.png' },
    { name: 'hasatlink-65-02-pazar.png',             size: 1645656, url: RAW_BASE + '/screenshots-resized/02-pazar.png' },
    { name: 'hasatlink-65-03-uydu-analiz.png',       size: 1116748, url: RAW_BASE + '/screenshots-resized/03-uydu-analiz.png' },
    { name: 'hasatlink-65-04-hasatlink-pazari.png',  size: 294590,  url: RAW_BASE + '/screenshots-resized/04-hasatlink-pazari.png' },
    { name: 'hasatlink-65-05-hal-fiyatlari.png',     size: 235011,  url: RAW_BASE + '/screenshots-resized/05-hal-fiyatlari.png' },
    { name: 'hasatlink-65-06-harita.png',            size: 1435131, url: RAW_BASE + '/screenshots-resized/06-harita.png' },
    { name: 'hasatlink-65-07-ai-teshis.png',         size: 145510,  url: RAW_BASE + '/screenshots-resized/07-ai-teshis.png' },
  ];
  // iPad 13" (2048×2732) — screenshots-ipad-13/
  const SS_13 = [
    { name: 'hasatlink-ipad13-01-anasayfa.png',          size: 361609,  url: RAW_BASE + '/screenshots-ipad-13/01-anasayfa.png' },
    { name: 'hasatlink-ipad13-02-pazar.png',             size: 816367,  url: RAW_BASE + '/screenshots-ipad-13/02-pazar.png' },
    { name: 'hasatlink-ipad13-03-uydu-analiz.png',       size: 1168644, url: RAW_BASE + '/screenshots-ipad-13/03-uydu-analiz.png' },
    { name: 'hasatlink-ipad13-04-hasatlink-pazari.png',  size: 322175,  url: RAW_BASE + '/screenshots-ipad-13/04-hasatlink-pazari.png' },
    { name: 'hasatlink-ipad13-05-hal-fiyatlari.png',     size: 380374,  url: RAW_BASE + '/screenshots-ipad-13/05-hal-fiyatlari.png' },
    { name: 'hasatlink-ipad13-06-harita.png',            size: 2965642, url: RAW_BASE + '/screenshots-ipad-13/06-harita.png' },
    { name: 'hasatlink-ipad13-07-ai-teshis.png',         size: 138166,  url: RAW_BASE + '/screenshots-ipad-13/07-ai-teshis.png' },
  ];
  // iPad 11" (1668×2388) — screenshots-ipad-11/
  const SS_11 = [
    { name: 'hasatlink-ipad11-01-anasayfa.png',          size: 309521,  url: RAW_BASE + '/screenshots-ipad-11/01-anasayfa.png' },
    { name: 'hasatlink-ipad11-02-pazar.png',             size: 783837,  url: RAW_BASE + '/screenshots-ipad-11/02-pazar.png' },
    { name: 'hasatlink-ipad11-03-uydu-analiz.png',       size: 1064950, url: RAW_BASE + '/screenshots-ipad-11/03-uydu-analiz.png' },
    { name: 'hasatlink-ipad11-04-hasatlink-pazari.png',  size: 306425,  url: RAW_BASE + '/screenshots-ipad-11/04-hasatlink-pazari.png' },
    { name: 'hasatlink-ipad11-05-hal-fiyatlari.png',     size: 317218,  url: RAW_BASE + '/screenshots-ipad-11/05-hal-fiyatlari.png' },
    { name: 'hasatlink-ipad11-06-harita.png',            size: 2136807, url: RAW_BASE + '/screenshots-ipad-11/06-harita.png' },
    { name: 'hasatlink-ipad11-07-ai-teshis.png',         size: 120436,  url: RAW_BASE + '/screenshots-ipad-11/07-ai-teshis.png' },
  ];

  const DEVICES = [
    { label: 'iPhone 6.7"', type: 'APP_IPHONE_67',          files: SS_67 },
    { label: 'iPhone 6.5"', type: 'APP_IPHONE_65',          files: SS_65 },
    { label: 'iPad 13"',    type: 'APP_IPAD_PRO_129',       files: SS_13 },
    { label: 'iPad 11"',    type: 'APP_IPAD_PRO_3GEN_11',   files: SS_11 },
  ];

  const log = (...a) => console.log('%c[ASC]', 'color:#0a7;font-weight:bold', ...a);
  const warn = (...a) => console.warn('%c[ASC]', 'color:#c80;font-weight:bold', ...a);
  const err = (...a) => console.error('%c[ASC]', 'color:#c00;font-weight:bold', ...a);

  const j = (method, path, body) => fetch('https://appstoreconnect.apple.com' + path, {
    method, credentials: 'include',
    headers: { 'Content-Type': 'application/vnd.api+json', 'Accept': 'application/vnd.api+json' },
    body: body ? JSON.stringify(body) : undefined
  }).then(async r => {
    const text = await r.text();
    const data = text ? JSON.parse(text) : null;
    if (!r.ok) throw Object.assign(new Error(`${r.status} ${path}`), { status: r.status, data });
    return data;
  });

  // Minimal SparkMD5 — ASC requires MD5 hex checksum for sourceFileChecksum
  const md5 = (buf) => {
    const bytes = new Uint8Array(buf);
    function safeAdd(x,y){const l=(x&0xFFFF)+(y&0xFFFF);return (((x>>16)+(y>>16)+(l>>16))<<16)|(l&0xFFFF);}
    function rol(n,c){return (n<<c)|(n>>>(32-c));}
    function cmn(q,a,b,x,s,t){return safeAdd(rol(safeAdd(safeAdd(a,q),safeAdd(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|(~b&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&~d),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|~d),a,b,x,s,t);}
    function md5cycle(x,k){let a=x[0],b=x[1],c=x[2],d=x[3];
      a=ff(a,b,c,d,k[0],7,-680876936);d=ff(d,a,b,c,k[1],12,-389564586);c=ff(c,d,a,b,k[2],17,606105819);b=ff(b,c,d,a,k[3],22,-1044525330);
      a=ff(a,b,c,d,k[4],7,-176418897);d=ff(d,a,b,c,k[5],12,1200080426);c=ff(c,d,a,b,k[6],17,-1473231341);b=ff(b,c,d,a,k[7],22,-45705983);
      a=ff(a,b,c,d,k[8],7,1770035416);d=ff(d,a,b,c,k[9],12,-1958414417);c=ff(c,d,a,b,k[10],17,-42063);b=ff(b,c,d,a,k[11],22,-1990404162);
      a=ff(a,b,c,d,k[12],7,1804603682);d=ff(d,a,b,c,k[13],12,-40341101);c=ff(c,d,a,b,k[14],17,-1502002290);b=ff(b,c,d,a,k[15],22,1236535329);
      a=gg(a,b,c,d,k[1],5,-165796510);d=gg(d,a,b,c,k[6],9,-1069501632);c=gg(c,d,a,b,k[11],14,643717713);b=gg(b,c,d,a,k[0],20,-373897302);
      a=gg(a,b,c,d,k[5],5,-701558691);d=gg(d,a,b,c,k[10],9,38016083);c=gg(c,d,a,b,k[15],14,-660478335);b=gg(b,c,d,a,k[4],20,-405537848);
      a=gg(a,b,c,d,k[9],5,568446438);d=gg(d,a,b,c,k[14],9,-1019803690);c=gg(c,d,a,b,k[3],14,-187363961);b=gg(b,c,d,a,k[8],20,1163531501);
      a=gg(a,b,c,d,k[13],5,-1444681467);d=gg(d,a,b,c,k[2],9,-51403784);c=gg(c,d,a,b,k[7],14,1735328473);b=gg(b,c,d,a,k[12],20,-1926607734);
      a=hh(a,b,c,d,k[5],4,-378558);d=hh(d,a,b,c,k[8],11,-2022574463);c=hh(c,d,a,b,k[11],16,1839030562);b=hh(b,c,d,a,k[14],23,-35309556);
      a=hh(a,b,c,d,k[1],4,-1530992060);d=hh(d,a,b,c,k[4],11,1272893353);c=hh(c,d,a,b,k[7],16,-155497632);b=hh(b,c,d,a,k[10],23,-1094730640);
      a=hh(a,b,c,d,k[13],4,681279174);d=hh(d,a,b,c,k[0],11,-358537222);c=hh(c,d,a,b,k[3],16,-722521979);b=hh(b,c,d,a,k[6],23,76029189);
      a=hh(a,b,c,d,k[9],4,-640364487);d=hh(d,a,b,c,k[12],11,-421815835);c=hh(c,d,a,b,k[15],16,530742520);b=hh(b,c,d,a,k[2],23,-995338651);
      a=ii(a,b,c,d,k[0],6,-198630844);d=ii(d,a,b,c,k[7],10,1126891415);c=ii(c,d,a,b,k[14],15,-1416354905);b=ii(b,c,d,a,k[5],21,-57434055);
      a=ii(a,b,c,d,k[12],6,1700485571);d=ii(d,a,b,c,k[3],10,-1894986606);c=ii(c,d,a,b,k[10],15,-1051523);b=ii(b,c,d,a,k[1],21,-2054922799);
      a=ii(a,b,c,d,k[8],6,1873313359);d=ii(d,a,b,c,k[15],10,-30611744);c=ii(c,d,a,b,k[6],15,-1560198380);b=ii(b,c,d,a,k[13],21,1309151649);
      a=ii(a,b,c,d,k[4],6,-145523070);d=ii(d,a,b,c,k[11],10,-1120210379);c=ii(c,d,a,b,k[2],15,718787259);b=ii(b,c,d,a,k[9],21,-343485551);
      x[0]=safeAdd(a,x[0]);x[1]=safeAdd(b,x[1]);x[2]=safeAdd(c,x[2]);x[3]=safeAdd(d,x[3]);
    }
    function md5blk(s){const md5blks=[];for(let i=0;i<64;i+=4)md5blks[i>>2]=s[i]+(s[i+1]<<8)+(s[i+2]<<16)+(s[i+3]<<24);return md5blks;}
    const n=bytes.length, state=[1732584193,-271733879,-1732584194,271733878]; let i;
    for(i=64;i<=bytes.length;i+=64) md5cycle(state, md5blk(bytes.subarray(i-64,i)));
    const tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; const last=bytes.subarray(i-64); let k;
    for(k=0;k<last.length;k++) tail[k>>2] |= last[k]<<((k%4)<<3);
    tail[k>>2] |= 0x80<<((k%4)<<3);
    if(k>55){ md5cycle(state,tail); for(k=0;k<16;k++) tail[k]=0; }
    tail[14] = n*8; md5cycle(state,tail);
    const rhex = n => { const hex='0123456789abcdef'; let s=''; for(let j=0;j<4;j++) s += hex.charAt((n>>(j*8+4))&0x0F) + hex.charAt((n>>(j*8))&0x0F); return s; };
    return rhex(state[0]) + rhex(state[1]) + rhex(state[2]) + rhex(state[3]);
  };

  // ---------------- STEP 1: Auto-discover state ----------------
  log('STEP 1 — Discovering inflight version, localization, screenshot sets…');

  // Find the inflight (non-ready-for-sale) version
  const versions = await j('GET', `/iris/v1/apps/${APP_ID}/appStoreVersions?filter[appStoreState]=PREPARE_FOR_SUBMISSION,WAITING_FOR_REVIEW,IN_REVIEW,REJECTED,METADATA_REJECTED,DEVELOPER_REJECTED,INVALID_BINARY,DEVELOPER_REMOVED_FROM_SALE&limit=10`);
  if (!versions.data || !versions.data.length) throw new Error('No inflight version found');
  const version = versions.data[0];
  const APP_VERSION_ID = version.id;
  log(`  version ${version.attributes.versionString} (${version.attributes.appStoreState}) → ${APP_VERSION_ID}`);

  // Localization (tr-TR primary)
  const locs = await j('GET', `/iris/v1/appStoreVersions/${APP_VERSION_ID}/appStoreVersionLocalizations?limit=50`);
  if (!locs.data || !locs.data.length) throw new Error('No localization found');
  const loc = locs.data.find(l => l.attributes.locale === 'tr-TR') || locs.data[0];
  const LOCALIZATION_ID = loc.id;
  log(`  localization ${loc.attributes.locale} → ${LOCALIZATION_ID}`);

  // Screenshot sets
  const sets = await j('GET', `/iris/v1/appStoreVersionLocalizations/${LOCALIZATION_ID}/appScreenshotSets?limit=50`);
  const setByType = {};
  for (const s of (sets.data || [])) setByType[s.attributes.screenshotDisplayType] = s.id;
  log('  existing screenshot sets:', setByType);

  // Create missing sets
  for (const dev of DEVICES) {
    if (!setByType[dev.type]) {
      warn(`  set missing for ${dev.label} (${dev.type}) — creating`);
      const created = await j('POST', '/iris/v1/appScreenshotSets', {
        data: {
          type: 'appScreenshotSets',
          attributes: { screenshotDisplayType: dev.type },
          relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: LOCALIZATION_ID } } }
        }
      });
      setByType[dev.type] = created.data.id;
      log(`    created ${dev.type} → ${created.data.id}`);
    }
  }

  // ---------------- STEP 2: Cancel any pending submission ----------------
  log('STEP 2 — Cancelling any pending submissions…');
  try {
    const subs = await j('GET', `/iris/v1/apps/${APP_ID}/reviewSubmissions?filter[state]=READY_FOR_REVIEW,WAITING_FOR_REVIEW,IN_REVIEW,UNRESOLVED_ISSUES&limit=20`);
    for (const s of (subs.data || [])) {
      log(`  → canceling ${s.id} (${s.attributes.state})`);
      try {
        await j('PATCH', `/iris/v1/reviewSubmissions/${s.id}`, {
          data: { type: 'reviewSubmissions', id: s.id, attributes: { canceled: true } }
        });
        log(`    ✓ canceled ${s.id}`);
      } catch (e) { warn(`    could not cancel ${s.id}: ${e.message}`); }
    }
  } catch (e) { warn('  submission discovery failed:', e.message); }

  // ---------------- STEP 3: Attach latest processed build ----------------
  log('STEP 3 — Attaching latest processed build…');
  try {
    const builds = await j('GET', `/iris/v1/builds?filter[app]=${APP_ID}&filter[processingState]=VALID&sort=-uploadedDate&limit=5`);
    if (!builds.data || !builds.data.length) {
      warn('  no VALID builds yet — Codemagic build 69ebbb35 may still be processing on Apple side');
      warn('  waiting 2 min and retrying…');
      await new Promise(r => setTimeout(r, 120_000));
      const b2 = await j('GET', `/iris/v1/builds?filter[app]=${APP_ID}&filter[processingState]=VALID&sort=-uploadedDate&limit=5`);
      if (!b2.data || !b2.data.length) throw new Error('still no VALID builds — come back in 10 min');
      builds.data = b2.data;
    }
    const newest = builds.data[0];
    const NEW_BUILD_ID = newest.id;
    log(`  newest VALID build: version ${newest.attributes.version} (build ${newest.attributes.uploadedDate}) → ${NEW_BUILD_ID}`);

    await j('PATCH', `/iris/v1/appStoreVersions/${APP_VERSION_ID}/relationships/build`, {
      data: { type: 'builds', id: NEW_BUILD_ID }
    });
    log('  ✓ build attached to version');
  } catch (e) { err('  attach build failed:', e.message, e.data); throw e; }

  // ---------------- STEP 4: Delete all existing screenshots ----------------
  log('STEP 4 — Deleting existing screenshots on all 4 device sets…');
  for (const dev of DEVICES) {
    const setId = setByType[dev.type];
    if (!setId) continue;
    try {
      const existing = await j('GET', `/iris/v1/appScreenshotSets/${setId}/appScreenshots?limit=50`);
      if (existing.data && existing.data.length) {
        log(`  ${dev.label}: ${existing.data.length} existing — deleting…`);
        for (const s of existing.data) {
          try {
            await j('DELETE', `/iris/v1/appScreenshots/${s.id}`);
          } catch (e) { warn(`    delete ${s.id} failed: ${e.message}`); }
        }
        log(`    ✓ cleared ${dev.label}`);
      } else {
        log(`  ${dev.label}: empty (nothing to delete)`);
      }
    } catch (e) { warn(`  ${dev.label} list failed: ${e.message}`); }
  }

  // ---------------- STEP 5: Upload new screenshots ----------------
  log('STEP 5 — Uploading 28 fresh screenshots…');
  const uploadOne = async (setId, ss) => {
    const buf = await fetch(ss.url).then(r => {
      if (!r.ok) throw new Error(`fetch ${ss.url}: ${r.status}`);
      return r.arrayBuffer();
    });
    if (buf.byteLength !== ss.size) {
      warn(`  size mismatch ${ss.name}: expected ${ss.size} got ${buf.byteLength} — using actual size`);
      ss.size = buf.byteLength;
    }
    const hash = md5(buf);
    const reserved = await j('POST', '/iris/v1/appScreenshots', {
      data: {
        type: 'appScreenshots',
        attributes: { fileName: ss.name, fileSize: ss.size },
        relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } }
      }
    });
    const screenshotId = reserved.data.id;
    const ops = reserved.data.attributes.uploadOperations;
    for (const op of ops) {
      const headers = {};
      for (const h of op.requestHeaders) headers[h.name] = h.value;
      const chunk = buf.slice(op.offset, op.offset + op.length);
      const res = await fetch(op.url, { method: op.method, headers, body: chunk });
      if (!res.ok) throw new Error(`S3 PUT ${ss.name}: ${res.status}`);
    }
    await j('PATCH', `/iris/v1/appScreenshots/${screenshotId}`, {
      data: { type: 'appScreenshots', id: screenshotId, attributes: { uploaded: true, sourceFileChecksum: hash } }
    });
  };

  for (const dev of DEVICES) {
    const setId = setByType[dev.type];
    log(`  ${dev.label} → ${setId}`);
    for (const ss of dev.files) {
      try {
        await uploadOne(setId, ss);
        log(`    ✓ ${ss.name}`);
      } catch (e) {
        err(`    ✗ ${ss.name}: ${e.message}`);
      }
    }
  }

  // ---------------- STEP 6: Create & submit new review ----------------
  log('STEP 6 — Creating new review submission…');
  const newSub = await j('POST', '/iris/v1/reviewSubmissions', {
    data: {
      type: 'reviewSubmissions',
      attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: APP_ID } } }
    }
  });
  const subId = newSub.data.id;
  log(`  submission created → ${subId}`);

  await j('POST', '/iris/v1/reviewSubmissionItems', {
    data: {
      type: 'reviewSubmissionItems',
      relationships: {
        reviewSubmission: { data: { type: 'reviewSubmissions', id: subId } },
        appStoreVersion: { data: { type: 'appStoreVersions', id: APP_VERSION_ID } }
      }
    }
  });
  log('  version linked to submission');

  await j('PATCH', `/iris/v1/reviewSubmissions/${subId}`, {
    data: { type: 'reviewSubmissions', id: subId, attributes: { submitted: true } }
  });
  log('%c✅ SUBMITTED FOR REVIEW', 'color:#0a7;font-size:18px;font-weight:bold');
  log('Submission ID:', subId);
  log('View at: https://appstoreconnect.apple.com/apps/' + APP_ID + '/distribution/ios/version/inflight');
})().catch(e => {
  console.error('%cFATAL', 'color:#c00;font-size:16px;font-weight:bold', e);
  if (e.data) console.error('API response:', e.data);
});
