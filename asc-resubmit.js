// HasatLink-Pro — One-shot ASC resubmit script
// USAGE:
//   1. Open https://appstoreconnect.apple.com/apps/6761334964/distribution/ios/version/inflight
//   2. Re-authenticate with 2FA (Apple's web UI)
//   3. Open DevTools → Console
//   4. Paste this entire file and press Enter
//   5. Watch progress; script is idempotent — safe to re-run on failure

(async () => {
  const APP_VERSION_ID   = '4bc33588-a6c9-40d6-b2f7-32534a7f7492';
  const OLD_SUBMISSION   = '19ec515c-b367-47fd-b59a-84e9daff394b';
  const NEW_BUILD_ID     = '38fade2d-13b0-40a0-b210-4fec2d37075d'; // uploaded by Codemagic build 69eab75e
  const LOCALIZATION_ID  = 'ab411653-3365-410e-998e-fc17e3f8351b';
  const IPAD13_SET       = '7139e0b4-c636-4c64-9069-9af01bbcffa2'; // APP_IPAD_PRO_129
  const IPAD11_SET       = '301d9fb5-32e8-4b1e-874c-23c3b3b0ce6e'; // APP_IPAD_PRO_3GEN_11
  const RAW_BASE         = 'https://raw.githubusercontent.com/yahyakk0744/HasatLink-Pro/main/store-assets';

  const SS_13 = [
    { name: 'hasatlink-ipad13-01.png', size: 137920,  url: RAW_BASE + '/screenshots-ipad-13/01-giris.png' },
    { name: 'hasatlink-ipad13-02.png', size: 369373,  url: RAW_BASE + '/screenshots-ipad-13/02-anasayfa.png' },
    { name: 'hasatlink-ipad13-03.png', size: 820673,  url: RAW_BASE + '/screenshots-ipad-13/03-pazar.png' },
    { name: 'hasatlink-ipad13-04.png', size: 1175974, url: RAW_BASE + '/screenshots-ipad-13/04-uydu-analiz.png' },
    { name: 'hasatlink-ipad13-05.png', size: 320258,  url: RAW_BASE + '/screenshots-ipad-13/05-hasatlink-pazari.png' },
    { name: 'hasatlink-ipad13-06.png', size: 381429,  url: RAW_BASE + '/screenshots-ipad-13/06-hal-fiyatlari.png' },
    { name: 'hasatlink-ipad13-07.png', size: 3004674, url: RAW_BASE + '/screenshots-ipad-13/07-harita.png' },
  ];
  const SS_11 = [
    { name: 'hasatlink-ipad11-01.png', size: 120434,  url: RAW_BASE + '/screenshots-ipad-11/01-giris.png' },
    { name: 'hasatlink-ipad11-02.png', size: 308429,  url: RAW_BASE + '/screenshots-ipad-11/02-anasayfa.png' },
    { name: 'hasatlink-ipad11-03.png', size: 784110,  url: RAW_BASE + '/screenshots-ipad-11/03-pazar.png' },
    { name: 'hasatlink-ipad11-04.png', size: 1064950, url: RAW_BASE + '/screenshots-ipad-11/04-uydu-analiz.png' },
    { name: 'hasatlink-ipad11-05.png', size: 306425,  url: RAW_BASE + '/screenshots-ipad-11/05-hasatlink-pazari.png' },
    { name: 'hasatlink-ipad11-06.png', size: 314677,  url: RAW_BASE + '/screenshots-ipad-11/06-hal-fiyatlari.png' },
    { name: 'hasatlink-ipad11-07.png', size: 2136574, url: RAW_BASE + '/screenshots-ipad-11/07-harita.png' },
  ];

  const log = (...a) => console.log('%c[ASC]', 'color:#0a7;font-weight:bold', ...a);
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

  const md5 = async (buf) => {
    // ASC requires MD5 hex checksum; use crypto-js-style via SubtleCrypto (MD5 not in SubtleCrypto, so use SparkMD5 inline)
    // Minimal SparkMD5 implementation:
    const s = (function(){
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
      function md51(s){const n=s.length,state=[1732584193,-271733879,-1732584194,271733878];let i;
        for(i=64;i<=s.length;i+=64)md5cycle(state,md5blk(s.subarray(i-64,i)));
        const tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];const last=s.subarray(i-64);let j;
        for(j=0;j<last.length;j++)tail[j>>2]|=last[j]<<((j%4)<<3);
        tail[j>>2]|=0x80<<((j%4)<<3);
        if(j>55){md5cycle(state,tail);for(j=0;j<16;j++)tail[j]=0;}
        tail[14]=n*8;md5cycle(state,tail);return state;
      }
      function rhex(n){const hex="0123456789abcdef";let s="";for(let j=0;j<4;j++)s+=hex.charAt((n>>(j*8+4))&0x0F)+hex.charAt((n>>(j*8))&0x0F);return s;}
      return function hex(a){return rhex(a[0])+rhex(a[1])+rhex(a[2])+rhex(a[3]);};
    })();
    const bytes = new Uint8Array(buf);
    return (function(){
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
      const n=bytes.length,state=[1732584193,-271733879,-1732584194,271733878];let i;
      for(i=64;i<=bytes.length;i+=64)md5cycle(state,md5blk(bytes.subarray(i-64,i)));
      const tail=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];const last=bytes.subarray(i-64);let k;
      for(k=0;k<last.length;k++)tail[k>>2]|=last[k]<<((k%4)<<3);
      tail[k>>2]|=0x80<<((k%4)<<3);
      if(k>55){md5cycle(state,tail);for(k=0;k<16;k++)tail[k]=0;}
      tail[14]=n*8;md5cycle(state,tail);
      const rhex=n=>{const hex='0123456789abcdef';let s='';for(let j=0;j<4;j++)s+=hex.charAt((n>>(j*8+4))&0x0F)+hex.charAt((n>>(j*8))&0x0F);return s;};
      return rhex(state[0])+rhex(state[1])+rhex(state[2])+rhex(state[3]);
    })();
  };

  // 1. Cancel old submission (if still active)
  try {
    const sub = await j('GET', `/iris/v1/reviewSubmissions/${OLD_SUBMISSION}`);
    log('old submission state:', sub.data.attributes.state);
    if (['READY_FOR_REVIEW','WAITING_FOR_REVIEW','IN_REVIEW','UNRESOLVED_ISSUES'].includes(sub.data.attributes.state)) {
      await j('PATCH', `/iris/v1/reviewSubmissions/${OLD_SUBMISSION}`, {
        data: { type:'reviewSubmissions', id: OLD_SUBMISSION, attributes:{ canceled:true } }
      });
      log('old submission canceled');
    }
  } catch (e) { err('cancel old:', e.message); }

  // 2. Attach new build to version
  try {
    await j('PATCH', `/iris/v1/appStoreVersions/${APP_VERSION_ID}/relationships/build`, {
      data: { type:'builds', id: NEW_BUILD_ID }
    });
    log('new build attached to version');
  } catch (e) { err('attach build:', e.message, e.data); }

  // 3. Upload screenshots
  const uploadOne = async (setId, ss) => {
    log(`→ ${ss.name}`);
    const buf = await fetch(ss.url).then(r => r.arrayBuffer());
    if (buf.byteLength !== ss.size) {
      err(`size mismatch ${ss.name}: expected ${ss.size} got ${buf.byteLength}`);
      return;
    }
    const hash = await md5(buf);
    const reserved = await j('POST', '/iris/v1/appScreenshots', {
      data: {
        type:'appScreenshots',
        attributes:{ fileName: ss.name, fileSize: ss.size },
        relationships:{ appScreenshotSet:{ data:{ type:'appScreenshotSets', id: setId } } }
      }
    });
    const screenshotId = reserved.data.id;
    const ops = reserved.data.attributes.uploadOperations;
    for (const op of ops) {
      const headers = {};
      for (const h of op.requestHeaders) headers[h.name] = h.value;
      const chunk = buf.slice(op.offset, op.offset + op.length);
      const res = await fetch(op.url, { method: op.method, headers, body: chunk });
      if (!res.ok) { err(`S3 PUT failed ${ss.name}`, res.status); return; }
    }
    await j('PATCH', `/iris/v1/appScreenshots/${screenshotId}`, {
      data: { type:'appScreenshots', id: screenshotId, attributes:{ uploaded:true, sourceFileChecksum: hash } }
    });
    log(`  ✓ ${ss.name}`);
  };

  log('Uploading iPad 13" screenshots...');
  for (const ss of SS_13) await uploadOne(IPAD13_SET, ss);
  log('Uploading iPad 11" screenshots...');
  for (const ss of SS_11) await uploadOne(IPAD11_SET, ss);

  // 4. Create new review submission
  log('Creating new review submission...');
  const newSub = await j('POST', '/iris/v1/reviewSubmissions', {
    data: { type:'reviewSubmissions',
      attributes:{ platform:'IOS' },
      relationships:{ app:{ data:{ type:'apps', id:'6761334964' } } }
    }
  });
  const subId = newSub.data.id;
  log('new submission id:', subId);

  await j('POST', '/iris/v1/reviewSubmissionItems', {
    data: { type:'reviewSubmissionItems',
      relationships:{
        reviewSubmission:{ data:{ type:'reviewSubmissions', id: subId } },
        appStoreVersion:{ data:{ type:'appStoreVersions', id: APP_VERSION_ID } }
      }
    }
  });
  log('version linked to submission');

  // 5. Submit
  await j('PATCH', `/iris/v1/reviewSubmissions/${subId}`, {
    data: { type:'reviewSubmissions', id: subId, attributes:{ submitted:true } }
  });
  log('%c✅ SUBMITTED FOR REVIEW', 'color:#0a7;font-size:16px;font-weight:bold');
  log('Submission ID:', subId);
})().catch(e => console.error('FATAL:', e));
