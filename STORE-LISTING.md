# HasatLink - Store Listing Bilgileri

## Uygulama Adı
HasatLink - Tarım Pazarı

## Kısa Açıklama (80 karakter)
Türkiye'nin dijital tarım pazarı. Al, sat, takas et, fiyat takip et.

## Uzun Açıklama (4000 karakter)

HasatLink, Türkiye'nin çiftçileri, toptancıları ve tarım sektörü profesyonellerini bir araya getiren dijital tarım pazarıdır.

### Ne Yapabilirsiniz?

**Pazar & Ticaret**
- Tarım ürünlerini ilan vererek satın veya alın
- Ekipman, arazi, lojistik ve işgücü ilanları
- Güvenli teklif sistemiyle anlaşma yapın
- Anlık mesajlaşma ile alıcı-satıcı iletişimi

**Hal Fiyatları**
- Günlük güncel hal fiyatlarını takip edin
- Şehir ve ürün bazlı fiyat karşılaştırması
- Haftalık fiyat grafikleri ve trendler
- Fiyat alarmı kurarak anlık bildirim alın

**HasatLink Pazarı**
- Toptancı ve perakende fiyatlarını karşılaştırın
- Bölgesel pazar verileri
- Trend analizi

**Harita**
- Yakınındaki ilanları haritada gör
- Bölgesel ürün yoğunluğu
- Konum bazlı arama

**AI Teşhis**
- Bitki hastalıklarını fotoğrafla teşhis edin
- Yapay zeka destekli tedavi önerileri
- Tarım ansiklopedisi

**Uydu Analiz**
- Arazinizin uydu görüntülerini inceleyin
- Bitki sağlığı analizi (NDVI)
- Toprak nem ve sıcaklık verileri

**Güvenlik & Güven**
- Kullanıcı puanlama ve yorum sistemi
- Güven skoru ile güvenilir alıcı/satıcı tespiti
- Doğrulanmış üretici rozetleri

**Bildirimler**
- Anlık mesaj ve teklif bildirimleri
- Hava durumu uyarıları
- Fiyat değişikliği bildirimleri

HasatLink ile tarımı dijitalleştirin, kazancınızı artırın!

## Kategoriler
- Google Play: İş (Business)
- App Store: İş (Business) / Alışveriş (Shopping)

## Anahtar Kelimeler
tarım, çiftçi, pazar, hal fiyatları, ürün, lojistik, ekipman, arazi, toptancı, hasatlink, agriculture, farmer

## Gizlilik Politikası URL
https://hasatlink.com/gizlilik

## Kullanım Şartları URL
https://hasatlink.com/kullanim-sartlari

## Destek E-posta
destek@hasatlink.com

## Web Sitesi
https://hasatlink.com

## İletişim
https://hasatlink.com/iletisim

---

## Google Play Console Yükleme Adımları

1. https://play.google.com/console adresine git
2. "Yeni uygulama oluştur" tıkla
3. Uygulama adı: "HasatLink - Tarım Pazarı"
4. Varsayılan dil: Türkçe
5. Uygulama türü: Uygulama (App)
6. Ücretsiz

### Store listing doldurmak:
- Yukarıdaki kısa ve uzun açıklamaları yapıştır
- Ekran görüntüleri: hasatlink.com'dan al (telefon + tablet)
- Uygulama ikonu: 512x512 PNG (frontend/public/icons/icon-512x512.png)
- Öne çıkan grafik: 1024x500 PNG oluştur

### AAB Yükleme:
- Production > "Yeni sürüm oluştur"
- `HasatLink-release.aab` dosyasını yükle (Masaüstünde)
- Sürüm notu: "HasatLink v1.0 — Tarım pazarı, hal fiyatları, AI teşhis, anlık mesajlaşma"

### İçerik Derecelendirmesi:
- IARC anketini doldur
- Şiddet: Yok, Cinsel: Yok → PEGI 3 / Everyone

### Veri güvenliği:
- Kişisel veri toplama: Evet (ad, e-posta, konum)
- Veri şifreleme: Evet (HTTPS)
- Veri silme talebi: Evet (hesap silme özelliği var)

---

## App Store Connect Yükleme Adımları

**ÖNEMLİ:** iOS build için macOS + Xcode gerekli. Windows'ta build alınamaz.

1. https://appstoreconnect.apple.com adresine git
2. "My Apps" > "+" > "New App"
3. Platform: iOS
4. Adı: HasatLink - Tarım Pazarı
5. Birincil dil: Turkish
6. Bundle ID: com.hasatlink.app
7. SKU: hasatlink-app

### Build almak (macOS'ta):
```bash
cd frontend
npm run build
npx cap sync ios
npx cap open ios  # Xcode açılır
# Xcode'da: Product > Archive > Distribute App
```

### Store listing:
- Yukarıdaki açıklamaları kullan
- Ekran görüntüleri: 6.7" (1290x2796), 5.5" (1242x2208)
- Uygulama ikonu: 1024x1024 PNG

---

## Dosya Konumları

| Dosya | Konum |
|-------|-------|
| Release AAB | `~/Desktop/HasatLink-release.aab` |
| Release APK | `~/Desktop/HasatLink-release.apk` |
| Keystore | `frontend/android/hasatlink-release.keystore` |
| Keystore şifre | `HasatLink2026!` |
| Keystore alias | `hasatlink` |
| App icon 512 | `frontend/public/icons/icon-512x512.png` |
| iOS projesi | `frontend/ios/` |
