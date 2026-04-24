# Sabah Oku — HasatLink iOS Resubmit Durumu

Kısa özet: Apple'ın 2. rette bize söylediği **"iPad'de çalışmıyor, eksik"** problemini kökten çözdük. Şu an **build Apple'a yüklendi**, ama Apple web oturumun uyurken doğal olarak bitti (2FA gerek). Son iki butona basmak için aşağıdaki tek tıklık scripti kopyala-yapıştır.

---

## Ne Oldu (Uyurken)

1. ✅ **App universal yapıldı** (iPhone + iPad)
   - `TARGETED_DEVICE_FAMILY: 1` → `1,2`
   - `UISupportedInterfaceOrientations~ipad` eklendi
   - `UIRequiredDeviceCapabilities` → `arm64`
   - Commit: `a8ab966` · Push: ✅
2. ✅ **iPad ekran görüntüleri üretildi** (Playwright, 14 adet)
   - 13" iPad Pro M4 (2064×2752) → `store-assets/screenshots-ipad-13/`
   - 11" iPad Pro 3. nesil (1668×2388) → `store-assets/screenshots-ipad-11/`
   - Commit: `a9e9f83` · Push: ✅ · GitHub raw'dan erişilebilir
3. ✅ **Codemagic build başarılı** (`69eab75e11752595b84b1c91`)
   - Süre: 2 dk 43 sn
   - IPA: `App.ipa` (5.7 MB, universal)
   - App Store Connect'e yüklendi — Build ID: **`38fade2d-13b0-40a0-b210-4fec2d37075d`**
4. ✅ **ASC'de iki yeni ekran görüntü seti oluşturuldu**
   - 13" set: `7139e0b4-c636-4c64-9069-9af01bbcffa2`
   - 11" set: `301d9fb5-32e8-4b1e-874c-23c3b3b0ce6e`
5. ⚠️ **Apple web oturumu bitti** — son adımlar için oturum lazım

---

## Sabah Ne Yapacaksın (3 Dakika)

### Adım 1 — ASC'yi aç
<https://appstoreconnect.apple.com/apps/6761334964/distribution/ios/version/inflight>

Apple ID + şifre + 2FA yap.

### Adım 2 — DevTools'u aç
Sağ tık → **İncele** (veya `F12`) → **Console** sekmesi.

### Adım 3 — Scripti yapıştır
`C:\Users\Mega\Desktop\HasatLink-Pro\asc-resubmit.js` dosyasını not defterinde aç, **tamamını kopyala**, Chrome Console'a yapıştır, `Enter`.

Script otomatik:
- Eski red edilmiş submission'ı iptal eder
- Yeni universal build'i (#38fade2d) versiyona bağlar
- 14 iPad screenshot'u yükler (GitHub raw'dan çeker, MD5 hesaplar, S3'e atar)
- Yeni review submission oluşturur, versiyonu bağlar, submit eder

### Adım 4 — Bekle ~2 dakika
Console'da yeşil `✅ SUBMITTED FOR REVIEW` satırını gördün mü, tamam. Submission ID'yi not al, istersen ASC UI'da doğrula.

---

## Güvenlik Notları

- Script **idempotent** — fail ederse tekrar çalıştırabilirsin, baştan başlar.
- "old submission state" yazısında `CANCELED` veya `REJECTED` görürsen zaten hallolmuş demektir, geçer.
- Eğer bir ekranı atlamak istersen `SS_13` veya `SS_11` listesinden çıkart ve tekrar çalıştır.
- Screenshots `raw.githubusercontent.com/yahyakk0744/HasatLink-Pro/main/store-assets/...` adresinden çekiliyor, public yani git'ten silme ki çalışsın.

---

## Teknik Detay (merak edersen)

**Apple'ın 2. rette söylediği:** App Store Connect'te iPad ekran görüntüsü listeliyordun ama IPA iPhone-only idi (TARGETED_DEVICE_FAMILY=1). İnceleyicinin iPad Air 11" M3'ünde Launch sonrası donmuş ekran / bozuk görünüm rapor etmesinin nedeni bu.

**Çözüm:** App universal yapıldı (1,2). Bundle içindeki storyboard'lar, orientation desteği, arm64 capabilities zaten iPad'i destekleyecek şekilde ayarlandı. iPad'de web view (Capacitor WKWebView) viewport'u doğru doldurur, aynı React app iPhone'da çalıştığı gibi iPad'de de çalışır.

**Rebuild neden kısa sürdü:** Codemagic cache hit + increment build number + Capacitor sync idempotent.

**Neden iPad screenshot'lar public repo'da:** Tarayıcı HTTPS page'inden HTTP localhost'u fetch edemiyor (mixed content blocked). En hızlı çözüm GitHub raw. Alternatif: deploy'un sonunda `store-assets/` silinebilir, artık Codemagic build lazım değil çünkü build zaten yüklendi.

---

## Dosyalar

| Dosya | İş |
|-------|----|
| `asc-resubmit.js` | Tek-tıklık resubmit scripti (yukarıda kullanım) |
| `take-screenshots-ipad.mjs` | iPad screenshot generator (Playwright) |
| `ss-server.mjs` | Lokal screenshot sunucu (şu an lazım değil, ileride kullanılabilir) |
| `frontend/ios/App/App.xcodeproj/project.pbxproj` | TARGETED_DEVICE_FAMILY universal |
| `frontend/ios/App/App/Info.plist` | iPad orientation + arm64 |
| `store-assets/screenshots-ipad-13/` | 13" iPad screenshots |
| `store-assets/screenshots-ipad-11/` | 11" iPad screenshots |

---

## Önemli ID'ler (script içinde var, referans için)

| Kavram | ID |
|--------|-----|
| App ID | `6761334964` |
| App Version (1.0.1) | `4bc33588-a6c9-40d6-b2f7-32534a7f7492` |
| TR Localization | `ab411653-3365-410e-998e-fc17e3f8351b` |
| Eski submission (reddedilen) | `19ec515c-b367-47fd-b59a-84e9daff394b` |
| **Yeni build (universal)** | **`38fade2d-13b0-40a0-b210-4fec2d37075d`** |
| 13" screenshot set | `7139e0b4-c636-4c64-9069-9af01bbcffa2` |
| 11" screenshot set | `301d9fb5-32e8-4b1e-874c-23c3b3b0ce6e` |
| Codemagic build | `69eab75e11752595b84b1c91` |
| Bundle ID | `com.hasatlink.app` |

Güle güle, hayırlı olsun.
