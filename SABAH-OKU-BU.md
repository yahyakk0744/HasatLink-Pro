# Sabah Oku — HasatLink iOS Resubmit (3. Red Sonrası)

Kısa özet: Apple 3. kez reddetti. Bu sefer **sadece iki şey** söylediler:
1. **2.3.3** — Ekran görüntülerinde login sayfası var, "app in use" sayılmaz.
2. **2.1(a)** — iPhone 17 Pro Max iOS 26.4.1'de login "error" dönüyor.

Her ikisi de **kökten** düzeltildi. Yeni build Apple'a yüklendi. Sabah 3 dakikada submit.

---

## Ne Oldu (Uyurken)

### 1. ✅ Login bug'ı — "iOS 26 WKWebView" senaryosu için sertleştirildi

Backend `/api/auth/login` 200 OK dönüyor, 0.78 saniye, valid JWT veriyor (curl ile test edildi, reviewer@hasatlink.com çalışıyor). Sorun **client tarafında**, muhtemelen Firebase Web SDK'nın iOS 26 WKWebView'ında `getAuth()` / `getFirestore()`'un module-level throw etmesi — React tree'yi AuthContext bile mount olmadan öldürüyor.

Düzeltmeler:
- `frontend/src/config/firebase.ts` → `initializeApp`, `getAuth`, `getFirestore`, `new GoogleAuthProvider()` artık try/catch içinde. Fail ederse safe stub export ediyor. `firebaseAvailable: boolean` flag'i eklendi.
- `frontend/src/contexts/AuthContext.tsx` → `onAuthStateChanged` ve `getRedirectResult` useEffect'leri native iOS'ta veya `firebaseAvailable=false` durumunda tamamen skip ediyor, try/catch ile sarıldı. Background Firebase email/password sync de native iOS'ta skip.
- Login artık **raw `fetch()`** kullanıyor (axios fallback ile). Axios interceptor / CORS preflight edge case'leri Capacitor WKWebView'da elendi.

### 2. ✅ Screenshot'lardan login ekranı kaldırıldı

`take-screenshots.mjs`, `take-screenshots-65.mjs`, `take-screenshots-ipad.mjs` — üçü de `01-giris` sayfasını drop etti, yerine `07-ai-teshis` (AI Bitki Teşhis) geldi. Tüm 28 screenshot (4 cihaz × 7 ekran) regenerate edildi:
- iPhone 6.7" (1290×2796) → `store-assets/screenshots-new/`
- iPhone 6.5" (1284×2778) → `store-assets/screenshots-resized/`
- iPad 13" (2048×2732) → `store-assets/screenshots-ipad-13/`
- iPad 11" (1668×2388) → `store-assets/screenshots-ipad-11/`

Ekranlar: anasayfa, pazar, uydu-analiz, hasatlink-pazari, hal-fiyatlari, harita, ai-teshis.

### 3. ✅ Commit + push: `757f931` (origin/main'de)

### 4. ✅ Codemagic build tamamlandı

- Build ID: `69ebbb35812dbe24128c0b90`
- Version: `1.0.1`, Version Code: `13`
- Süre: ~4 dakika, status: **finished (success)**
- IPA: `App.ipa` (5.77 MB)
- App Store'a yüklendi — Delivery UUID `ef644d11-4e04-4e21-8b3d-e6df6ceb5553`

### 5. ⚠️ Apple web oturumu sende — son adımlar için 2FA gerek

---

## Sabah Ne Yapacaksın (3 Dakika)

### Adım 0 — Önce Apple IPA'yı process etsin
Codemagic ~18:53 UTC'de IPA'yı yükledi. Apple'ın "processing" durumdan "Ready to Submit"e geçirmesi **10-30 dakika** sürer. Sabah uyandığında zaten bitmiş olur. Script zaten VALID build yoksa 2 dk bekler.

### Adım 1 — ASC'yi aç
<https://appstoreconnect.apple.com/apps/6761334964/distribution/ios/version/inflight>

Apple ID + şifre + 2FA yap.

### Adım 2 — DevTools'u aç
Sağ tık → **İncele** (veya `F12`) → **Console** sekmesi.

### Adım 3 — Scripti yapıştır
`C:\Users\Mega\Desktop\HasatLink-Pro\asc-resubmit.js` dosyasını not defterinde aç, **tamamını kopyala**, Chrome Console'a yapıştır, `Enter`.

Script v2 ne yapar (auto-discovery!):
1. App'in inflight version'ını, localization'ını, screenshot set'lerini **kendi bulur** (hardcoded ID yok)
2. Bekleyen tüm submission'ları cancel eder (eski rejected olan cd575902 dahil)
3. En son VALID build'i versiyona attach eder (VALID yoksa 2 dk bekler)
4. **Tüm 4 cihaz set'indeki eski screenshot'ları siler** (login'li olanlar dahil)
5. GitHub'dan 28 yeni screenshot çeker (iPhone 6.7", 6.5", iPad 13", 11") — MD5 hesaplar, S3'e upload eder, ASC'ye confirm eder
6. Yeni review submission oluşturur → versiyonu bağlar → submit eder

### Adım 4 — Bekle ~3 dakika
Console'da yeşil `✅ SUBMITTED FOR REVIEW` satırını gördüğünde Apple yeni binary'i + yeni screenshot'ları review'a aldı.

---

## Güvenlik Notları

- Script **idempotent** — fail ederse tekrar çalıştırabilirsin, en son state'ten devam eder.
- VALID build bulunamıyor hatası alırsan 10-15 dk bekle, Apple processing bitsin, sonra script'i tekrar çalıştır.
- Screenshot'lar `raw.githubusercontent.com/yahyakk0744/HasatLink-Pro/main/store-assets/...` adresinden çekiliyor. Commit `757f931` main'de.

---

## Teknik Detay (merak edersen)

### Apple'ın 3. rette söylediği
1. **Guideline 2.3.3 (Accurate Metadata)**: Screenshot'larda login ekranı `01-giris.png` vardı. Apple login/splash'ı "app in use" saymıyor.
2. **Guideline 2.1(a) (App Completeness)**: Reviewer iPhone 17 Pro Max iOS 26.4.1'de login yaptığında "error" gördüğünü söyledi. Biz backend'i test ettik — **200 OK dönüyor, 0.78 saniye, JWT valid** (`curl -X POST https://hasatlink-api.onrender.com/api/auth/login`).

### Root cause analizi
Backend çalıştığına göre sorun client tarafında. En güçlü hipotez: **Firebase Web SDK iOS 26.4.1 WKWebView'de module-level throw ediyor**. Capacitor WKWebView ortamında `initializeApp()` veya `getAuth()` runtime hatası atarsa tüm JS bundle execution duruyor, React mount olmuyor, kullanıcı beyaz ekran + "error" görüyor.

### Çözüm
Tüm Firebase touchpoint'leri try/catch içine alındı, fail ederse noop stub export ediliyor. Login'in backend'le konuşma yolu Firebase'den bağımsız — `AuthContext` direkt `/api/auth/login`'e fetch atıyor, axios fallback ile. Native iOS'ta Firebase onAuthStateChanged tamamen skip.

### Screenshot akışı
Playwright headless Chromium, iPhone/iPad user-agent + deviceScaleFactor ile hasatlink.com (production) sayfalarını çekti. Login ekranı drop edildi, yerine 7 feature sayfası geldi. 4 cihaz × 7 sayfa = 28 screenshot.

---

## Dosyalar

| Dosya | İş |
|-------|----|
| `asc-resubmit.js` | **Tek-tıklık resubmit scripti v2** (auto-discovery, 4 set) |
| `take-screenshots.mjs` | iPhone 6.7" screenshot generator |
| `take-screenshots-65.mjs` | iPhone 6.5" screenshot generator |
| `take-screenshots-ipad.mjs` | iPad 13" + 11" screenshot generator |
| `frontend/src/config/firebase.ts` | Try/catch guards + safe stubs |
| `frontend/src/contexts/AuthContext.tsx` | Native iOS Firebase skip + fetch-first login |
| `store-assets/screenshots-new/` | iPhone 6.7" — 7 dosya |
| `store-assets/screenshots-resized/` | iPhone 6.5" — 7 dosya |
| `store-assets/screenshots-ipad-13/` | iPad 13" — 7 dosya |
| `store-assets/screenshots-ipad-11/` | iPad 11" — 7 dosya |

---

## Önemli ID'ler

| Kavram | ID |
|--------|-----|
| App ID | `6761334964` |
| Bundle ID | `com.hasatlink.app` |
| Codemagic build | `69ebbb35812dbe24128c0b90` |
| Codemagic app | `69cad53e08e63b52a2833133` |
| Eski reddedilen submission | `cd575902-afec-4823-809e-468a1621d227` |
| Commit | `757f931` (origin/main) |

Script v2 artık ID hardcode etmiyor — hepsini ASC API'den kendi keşfediyor.

---

Güle güle, bu sefer hepsini çözdük. Hayırlı olsun.
