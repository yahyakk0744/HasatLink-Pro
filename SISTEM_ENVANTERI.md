# HasatLink Pro V1.1 — Sistem Envanteri & Tanitim Rehberi

> Turkiye'nin ilk ve tek **tarim odakli dijital ticaret platformu**.
> 6 kategori, yapay zeka destekli hastalik teshisi, canli pazar fiyatlari, lojistik eslestirme, oyunlastirma ve gercek zamanli mesajlasma — hepsi tek bir platformda.

---

## 1. TECH STACK & TASARIM SISTEMI

### Mimari Yapi

| Katman | Teknoloji | Detay |
|--------|-----------|-------|
| **Frontend** | React 19 + TypeScript 5.9 + Vite 7 | SPA, code-splitting, lazy loading |
| **Styling** | Tailwind CSS 4 | Semantic CSS Variables, Dark Mode, responsive |
| **State** | React Context + Custom Hooks | AuthContext, LocationContext, SocketContext, MessageContext, NotificationContext, ThemeContext |
| **Backend** | Express 5 + TypeScript | REST API, rate limiting, sanitization, error handling |
| **Database** | MongoDB + Mongoose 9 | 19 model, compound indexes, aggregation pipelines |
| **Real-time** | Socket.IO 4.8 | Canli bildirim, mesaj, cevrimici kullanici takibi |
| **Auth** | Firebase Auth + JWT | Google OAuth, email/sifre, Firebase Admin SDK |
| **Mesajlasma** | Firebase Firestore | Canli sohbet, okundu bilgisi (read receipts) |
| **Harita** | Leaflet + React-Leaflet + OpenStreetMap | Dinamik pin'ler, kategori renkleri, reverse geocoding |
| **Hava Durumu** | OpenWeatherMap API | GPS/sehir bazli, don/sicaklik uyarilari |
| **Push** | Web Push (VAPID) | Service Worker, arka plan bildirimleri |
| **Grafikler** | Recharts 3.7 | Admin dashboard istatistikleri |
| **i18n** | i18next | Turkce/Ingilizce tam destek |
| **Mobile** | Capacitor 8 | Android native build, PWA |
| **Deployment** | Git + GitHub | Continuous integration |

### Apple Business Estetigi

HasatLink, **Apple'in Human Interface Guidelines**'indan ilham alan bir tasarim sistemi kullanir:

**Renk Paleti (Semantic Variables):**
```
Light Mode                          Dark Mode
--bg-page: #FAFAF8                  --bg-page: #0C0C0C
--bg-surface: #FFFFFF               --bg-surface: #1C1C1E
--accent-green: #2D6A4F             --accent-green: #40916C
--accent-orange: #A47148            --accent-orange: #C4863A
--accent-blue: #0077B6              --accent-blue: #4DA6D9
--accent-red: #C1341B               --accent-red: #E85D4A
```

**Glassmorphism Sistemi (4 Katman):**
```css
.glass           → backdrop-blur(20px) saturate(1.8) — Navbar, floating elements
.glass-card      → backdrop-blur(16px) saturate(1.6) + border(white/0.3) — Overlay kartlar
.glass-card-hover → Ayni + hover:translateY(-2px) + shadow transition — Interaktif kartlar
.surface-card    → Solid surface + 1px border + soft shadow — Standart kartlar
```

**Animasyon Kutuphanesi (Tamamen Custom CSS — Framer Motion YOK):**

| Animasyon | Kullanim | Fizik Modeli |
|-----------|----------|--------------|
| `animate-fade-in` | Sayfa gecisleri, form adimlari | ease-out 0.4s |
| `animate-slide-up` | Bottom sheet, toast bildirimleri | ease-out, translateY(12px→0) |
| `animate-haptic` | Favori kalp butonu | Apple Watch spring physics (0.6s, 7 keyframe) |
| `spring-tap` | Kart tiklama | spring-press 0.4s cubic-bezier |
| `animate-float-slow` | Hero sayfa dekoratif orblar | 15s infinite, translate + scale |
| `card-enter` | Listing kartlari giris | translateY(12px) + scale(0.97→1) |
| `reveal-section` | Scroll-triggered gorunum | opacity + translateY, Intersection Observer |
| `shimmer` | Skeleton loading | gradient sweep 1.5s infinite |
| `fab-pulse` | FAB dikkat cekme | box-shadow pulse 1.5s, 3 tekrar |
| `img-lazy` | Gorsel blur-up | filter: blur(8px→0) |

**Tipografi:**
- Font: Inter + Apple system font stack (SF Pro Display/Text fallback)
- Anti-aliasing: `-webkit-font-smoothing: antialiased`
- Letter spacing: `-0.011em` (Apple density)
- iOS-native deneyim: `overscroll-behavior: none`, pinch-zoom engeli, elastic bounce engeli

---

## 2. SMART COMMERCE — Ticaret Zekasi

### 2.1 Teklif (Offer) Sistemi

Tam dongu teklif-muzakere-onay akisi:

```
Alici "Pazarliga Acik" ilana teklif gonderir
  → createOffer: Fiyat + mesaj validasyonu
  → Saticinina anlik Socket.IO bildirimi
  → Web Push bildirim (arka plan)
  → Satici kabul/ret yapar
  → Kabul edilirse:
    ├── Her iki tarafa +50 Hasat Puan
    ├── Dijital Makbuz (Receipt) olusturulur
    ├── Apple Chime sesi calinir (E5→G5)
    └── Wallet Card toast gosterilir
```

**Guvenlik Katmanlari:**
- `is_negotiable` kontrolu — sadece acik ilanlar
- Kendi ilanina teklif engeli
- Fiyat > 0 validasyonu
- Rate limiting (middleware)

### 2.2 Apple Chime Sesli Bildirimler

Web Audio API ile sentezlenmis, sifir dosya boyutu:

| Ses | Nota | Kullanim | Suresi |
|-----|------|----------|--------|
| **Notification Ping** | D5 (587.33 Hz) | Yeni mesaj | 0.3s |
| **Transaction Chime** | E5 (659.25 Hz) → G5 (783.99 Hz) | Teklif kabul | 0.4s (two-tone) |

- Oscillator: sine wave
- Gain envelope: exponentialRampToValueAtTime
- Otomatik context olusturma (webkitAudioContext fallback)
- `playSound: true` flag'i ile Socket.IO event'inden tetiklenir

### 2.3 Dijital Makbuz (Wallet Card)

Teklif kabul edildiginde, **dark glassmorphism toast** olarak gosterilir:

```
┌─────────────────────────────┐
│     ISLEM ONAYLANDI         │ ← #2D6A4F uppercase tracking
│  "Organik Domates 5 Ton"   │ ← White, truncate
│─────────────────────────────│
│  Alici     Ahmet Yilmaz    │
│  Satici    Mehmet Kaya      │
│  ─────────────────────────  │
│  Tutar     ₺45,000         │ ← #2D6A4F bold
└─────────────────────────────┘
```

- Arka plan: `bg-gradient-to-br from-[#1A1A1A] to-[#2D2D2D]`
- Border: `border-white/10`
- Radius: `rounded-3xl`
- Sure: 5 saniye, tiklanabilir (ilan detayina yonlendirir)

### 2.4 Fiyat Uyari Sistemi (Price Alerts)

Kullanicilar belirli urunler icin fiyat esigi belirleyebilir:
- Kategori + alt kategori + anahtar kelime + hedef fiyat
- Aktif/pasif toggle
- Backend'de PriceAlert modeli, otomatik kontrol

---

## 3. LOGISTICS ENGINE — Lojistik Motoru

### 3.1 Nakliye Eslestirme Mantigi

HasatLink, Turkiye'deki tarim lojistigi sorununu cozmek icin iki yonlu eslestirme sunar:

**"Nakliye Ariyorum" (needsTransport):**
- Pazar, ekipman, arazi, depolama ilanlari icin
- Ilan kartinda mavi Truck ikonu + "Nakliye Ariyor" badge'i
- GPS bazli yakin sofor/nakliye eslestirmesi

**"Bos Kapasitem Var" (hasTransportCapacity):**
- Lojistik ilanlari icin
- Ilan kartinda yesil Truck ikonu + "Bos Kapasite" badge'i
- Bos donus/ekstra kapasite paylasimi

**Gorsel Gostergeler (ListingCard):**
```
needsTransport:
  → px-2.5 py-1 bg-[#0077B6]/10 rounded-lg
  → Truck icon (10px) + "Nakliye Ariyor" text (#0077B6)

hasTransportCapacity:
  → px-2.5 py-1 bg-[#2D6A4F]/10 rounded-lg
  → Truck icon (10px) + "Bos Kapasite" text (#2D6A4F)
```

### 3.2 Lojistik Ilan Detaylari

6 farkli arac tipi (TIR, Kamyon, Kamyonet, Frigo Kamyon, Tanker, Pickup), her biri icin:
- Kapasite (ton)
- Rota (routeFrom → routeTo): Gorsel dot-line-dot gosterim
- Frigo destegi (soguk zincir)
- Sigorta durumu
- Plaka numarasi
- Musaitlik tarihi

### 3.3 Kategori-Spesifik Rota Gosterimi

ListingCard'da lojistik ilanlari icin ozel gorsel:
```
● Adana ──── ● Istanbul     (yesil dot → kirmizi dot, cizgi arasi)
```

---

## 4. GAMIFICATION — Puan & Sadakat Sistemi

### 4.1 Puan Motoru (awardPoints)

Merkezi puan dagitim sistemi (`backend/src/utils/pointsService.ts`):

| Aksiyon | Puan | Trigger |
|---------|------|---------|
| Yeni ilan olusturma | +10 | `createListing` controller |
| Teklif kabul (iki taraf) | +50 | `updateOfferStatus` controller |
| 5 yildiz degerlendirme | +20 | `createRating` controller |
| Profil dogrulama | +100 | `toggleVerifyUser` admin controller |

- `$inc` operatoru ile atomic guncelleme
- Puan asla negatife dusmez (`Math.max(0, ...)`)
- Admin'den manuel ayarlama destegi (quick buttons: +/- 10, 50)

### 4.2 Sadakat Rutbeleri

| Rutbe | Aralik | Emoji | Renk | Gorsel Efekt |
|-------|--------|-------|------|--------------|
| **Bronz Uretici** | 0 — 500 | 🥉 | #A47148 | Standart isim |
| **Gumus Tuccar** | 501 — 2000 | 🥈 | #6B7280 | Standart isim |
| **Altin Hasat Ortagi** | 2001+ | 🥇 | #B8860B | **Gold Gradient isim** |

**Gold Gradient Efekti (ListingCard):**
```css
bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent font-semibold
```

### 4.3 Ilerleme Cubugu (ProfileCard)

```
┌──────────────────────────────────────┐
│  🥉  Bronz Uretici                  │
│  🏆  350 puan                       │
│  ████████████░░░░░░░░  350 / 501    │
│                              69%    │
└──────────────────────────────────────┘
```

- Gradient progress bar: `linear-gradient(90deg, badge.color, badge.color + 'cc')`
- Transition: `duration-700`
- Altin rutbe icin "MAX" badge'i

### 4.4 Admin Puan Yonetimi

- Kullanici kartlarinda puan + badge gosterimi
- Detay modalinda "Hasat Puan" karti
- "Duzenle" butonuyla acilan puan ayarlama modali
- Hizli butonlar: +10, +50, -10, -50
- Ozel miktar girisi

---

## 5. SOCIAL & INSIGHTS — Hikayeler

### 5.1 Hasat Stories

Instagram-ilhamli, yatay kaydirmali hikaye cerceveleri:

```
[ + Ilan Ver ]  [ 🟢 Story 1 ]  [ 🟢 Story 2 ]  [ 🟢 Story 3 ] ...
     ↑               ↑
  Dashed border    Gradient ring: from-[#2D6A4F] via-[#40916C] to-[#E76F00]
```

- En son 15 ilan, gorsel olanlar filtrelenir
- 64x64 (mobile) / 72x72 (desktop) cerceveler
- Satici mini avatari: sag alt, 20x20, border
- Fiyat etiketi: yesil, bold
- Snap scrolling + ok butonlari (hover'da gorunur)

### 5.2 Goruntuleyen Takibi (Story Viewers)

**Gorsel Overlay:**
```
Hikaye cercevesi
  └─ Alt orta: [👁 42] — bg-black/60 backdrop-blur-md rounded-full
```

**"Kimler Gordu?" Butonu** (sadece kendi hikayeleri):
- Eye ikonu + yesil text
- Tiklandiginda bottom sheet acar

**Bottom Sheet (Viewer List):**
```
┌──────────────── handle bar ────────────────┐
│  Goruntuleyenler           [X]             │
│  "Organik Domates 5 Ton"                   │
│────────────────────────────────────────────│
│  [Avatar] Ahmet Yilmaz                     │
│  [Avatar] Fatma Demir                      │
│  [Avatar] Ali Kara                         │
│  ...                                       │
└────────────────────────────────────────────┘
```

**Backend Endpoint:**
```
GET /listings/:id/viewers (auth required)
  → ListingView collection'dan identifier'lari ceker
  → User collection'dan userId eslestirmesi
  → { viewers: [{ userId, name, profileImage }] } doner
```

---

## 6. LISTING WIZARD — 3 Adimli Ilan Sihirbazi

### 6.1 Stepper Yapisi

```
  ① ─────── ② ─────── ③
Gorseller   Detaylar   Konum & Yayinla
```

- **Adim Gostergesi:** Numarali daireler, tamamlanan adimlarda yesil check
- Aktif adimda `ring-4 ring-[var(--accent-green)]/20` vurgu efekti
- Tamamlanan adimlar arasi yesil cizgi
- Geri/Ileri navigasyon butonlari

### 6.2 Adim 1: Gorseller

**Glassmorphism Yukleme Alani:**
```css
p-5 rounded-3xl bg-white/50 backdrop-blur-xl border border-white/20 shadow-lg
```

- Drag & drop gorsel ekleme
- Ilk gorsel "Kapak" badge'i alir (yesil, 8px, uppercase)
- Hover'da overlay + silme butonu (backdrop-blur)
- 8 gorsel limiti
- Kategori + Ilan Modu secimi de bu adimda

### 6.3 Adim 2: Detaylar

6 kategorinin her biri icin ozel form alanlari:

| Kategori | Ozel Alanlar |
|----------|-------------|
| **Pazar** | Alt kategori, urun secimi, fiyat/birim, miktar, kalite, depolama, hasat tarihi, organik toggle |
| **Lojistik** | Arac tipi (6 tip), kapasite, rota (nereden→nereye), frigo, sigorta, plaka |
| **Isgucu** | Gunluk ucret, takim toggle, isci sayisi, deneyim, beceriler (multi-select) |
| **Ekipman** | Satis tipi, marka (9+), model, yil, HP, durum, kiralama tipi |
| **Arazi** | Alan (donum/hektar/m2), toprak tipi, tapu, imar, su, elektrik |
| **Depolama** | Kapasite (ton/m3/palet), sicaklik araligi, guvenlik, 7/24 erisim |

**Apple-Style Toggle Switch (CheckboxField yerine):**
```
[ ● ─────── ]  Su Mevcut      → ON  (bg-green, translate-x-5)
[ ─────── ● ]  Elektrik       → OFF (bg-gray/30, translate-x-0)
```
- 44x24px, rounded-full
- 300ms transition
- Hover'da label renk degisimi

### 6.4 Adim 3: Konum & Yayinla

- Pazarliga Acik toggle (turuncu vurgu alani)
- Nakliye opsiyonlari (mavi vurgu alani)
- Sehir secimi (81 il dropdown)
- Telefon girisi
- Harita uzerinde konum secme (LocationPicker)

**"+10 Hasat Puan" Motivasyon Karti:**
```
┌────────────────────────────────────────────┐
│  🏆  +10 Hasat Puan kazanacaksin!          │
│      Bu ilani yayinlayarak sadakat         │
│      puani kazan                           │
└────────────────────────────────────────────┘
bg-gradient-to-r from-[#2D6A4F]/10 via-[#40916C]/5 to-[#E76F00]/10
```

### 6.5 Canli Onizleme (Live Preview)

**Desktop (lg+):** Sag sidebar, sticky, 288px genislik
```
┌──────────────────┬──────────┐
│                  │ 👁 Canli  │
│   Form Alani     │ Onizleme │
│                  │ ┌──────┐ │
│                  │ │ Kart │ │
│                  │ └──────┘ │
└──────────────────┴──────────┘
```

**Mobile:** Collapsible `<details>` elementi, "Onizlemeyi Gor" summary
- Gercek zamanli guncellenen ListingCard benzeri preview
- Kategori badge'i, fiyat, baslik, konum gosterimi
- `useMemo` ile performans optimizasyonu

---

## 7. LOCATION & MAPS — Konum Sistemi

### 7.1 GPS Tabanli Konum Algilama

**LocationContext** — 3 katmanli konum stratejisi:

```
1. navigator.geolocation (enableHighAccuracy: true)
   ↓ Basarisizsa
2. IP-based fallback (ipapi.co/json)
   ↓ Her durumda
3. localStorage cache (hasatlink_location)
```

- Reverse geocoding: Nominatim (OpenStreetMap) API
- Il + Ilce cozunurlugu
- Auto-request: Sayfa yuklendiginde cache yoksa otomatik ister

### 7.2 Harita Gorunumu (MapPage)

Tam ekran interaktif harita:

- **Leaflet + OpenStreetMap** (ucretsiz, lisans uyumlu)
- **Kategori bazli renkli pin'ler:**

| Kategori | Pin Rengi |
|----------|-----------|
| Pazar | #2D6A4F (Yesil) |
| Lojistik | #0077B6 (Mavi) |
| Is Gucu | #E76F51 (Turuncu) |
| Ekipman | #C1341B (Kirmizi) |
| Arazi | #A47148 (Kahve) |
| Depolama | #7B2CBF (Mor) |

- **SVG Pin Olusturma:** Dinamik renk ile `createColoredIcon()`, icon cache sistemi
- **Popup:** Gorsel + kategori badge + baslik + fiyat + konum + detay linki
- **Kategori Filtreleme:** Toggle butonlari ile haritada gosterilecek kategoriler
- **200 ilan** limiti ile performans optimizasyonu
- **Dark Mode:** Tile invert filtresi (`hue-rotate(180deg) brightness(1.2)`)

### 7.3 Konum Secici (LocationPicker)

Ilan olusturma formunda kullanilir:
- Harita uzerinde tikla-sec
- Koordinat (lat, lng) yakalama
- Leaflet entegrasyonu

### 7.4 GPS Bazli Dinamik Filtreleme

- Bayi (Dealer) arama: Haversine formulu ile mesafe hesaplama
- En yakin bayiler siralamasI
- Mesafe + eslesme skoru

---

## 8. ADMIN COMMAND CENTER

### 8.1 Dashboard (AdminDashboardPage)

```
┌────────┬────────┬────────┬────────┐
│ Toplam │ Aktif  │  Yeni  │Gorunum │ ← Stat kartlari
│ Ilan   │ Ilan   │Kullan. │ Sayisi │
└────────┴────────┴────────┴────────┘
```

- 6+ istatistik karti
- Zaman bazli grafikler (Recharts)
- Kategori dagilimlari
- Trend analizi

### 8.2 Kullanici Yonetimi (AdminUsersPage)

**Kullanici Kartlari:**
- Profil gorseli, isim, konum, rutbe badge'i (🥉🥈🥇)
- Puan gosterimi
- Dogrulama durumu (ShieldCheck)
- Ortalama puan (Star)

**Islem Butonlari:**
- **Profil Koprusu (Eye Icon):** `/profil/:userId` — Force-open user profile
- **Dogrula/Kaldir** (ShieldCheck toggle)
- **Engelle/Kaldir** (Ban toggle)
- **Askiya Al/Kaldir** (Suspend toggle)
- **Sil** (Copluk ikonu, onay gerektirir)

**Detay Modali:**
- Tam profil bilgileri
- Ilan istatistikleri
- Degerlendirme ortalamasi
- Hasat Puan karti + "Duzenle" butonu
- Trust Score gosterimi

**Puan Ayarlama Modali:**
```
┌──────────────────────────────┐
│  Hasat Puan Duzenle          │
│  [Mevcut: 🥈 1,250 puan]    │
│                              │
│  [-50] [-10]   [+10] [+50]  │
│                              │
│  [_____ Ozel Miktar _____]  │
│                              │
│  [Iptal]        [Kaydet]    │
└──────────────────────────────┘
```

### 8.3 Ilan Yonetimi (AdminListingsPage)

- Liste/Grid gorunum
- Durum guncelleme (active/pending/sold/expired)
- Ozeliklestirme toggle (isFeatured)
- Toplu silme (checkbox + bulk delete)
- Arama + filtre (kategori, durum, sehir)

### 8.4 Moderasyon Sistemi (AdminModerationPage)

**Kufur Filtresi:**
- `containsProfanity()` — Baslik ve aciklama kontrolu
- `ProfanityLog` modeli — Tum tespit edilen icerikler loglanir
- Admin panelinde kufur log listesi

**Raporlama:**
- `Report` modeli — Kullanici raporlari
- Durum takibi (pending/resolved/dismissed)
- Admin cozum notlari

### 8.5 Finansal Yonetim

- **Pazar Fiyatlari (AdminHalPricesPage):** Hal fiyatlari CRUD
- **HasatLink Pazari (AdminPazarPricesPage):** Platform ici fiyat endeksi
- **Gelir (AdminRevenuePage):** Gelir takibi

### 8.6 Icerik Yonetimi

- **Blog (AdminBlogPage):** Blog yazilarI CRUD, slug, kapak gorseli
- **Reklamlar (AdminAdsPage):** 4 slot (header, sidebar, footer, between-listings), goruntuleme/tiklama takibi
- **Bildirimler (AdminNotificationsPage):** Toplu bildirim gonderme, gecmis
- **Bayiler (AdminDealersPage):** Bayi yonetimi, premium partner, komisyon
- **Iletisim (AdminContactsPage):** Iletisim formu mesajlari

### 8.7 Site Ayarlari (AdminSettingsPage)

- Site basligi, aciklama, logo
- Sosyal medya linkleri
- One cikarilan ilan fiyatlandirmasi
- Premium uyelik paketleri
- Komisyon orani
- AI kullanim limiti (gunluk ucretsiz)
- Bakim modu toggle

---

## 9. YAPAY ZEKA — AI Hastalik Teshisi

### 9.1 AIDiagnosisPanel

Kamera/galeri'den gorsel yukleme → AI analiz → detayli sonuc:

**Teshis Sonucu:**
```
┌──────────────────────────────────────┐
│  Hastalik: Zeytin Halkali Leke       │
│  Guven: %92   Asama: Orta            │
│  Yayilma Riski: ●● Orta              │
│  Aciliyet: ●● Orta                   │
│                                       │
│  Tedavi Onerisi:                      │
│  Bakirli fungisit (Bordo bulamaci %1) │
│  uygulayin. Enfekte yapraklari        │
│  toplayip imha edin...                │
└──────────────────────────────────────┘
```

**Hastalik Veritabani (25+ hastalik):**
- Zeytin (Halkali Leke, Sinek)
- Narenciye (Karaleke, Tristeza)
- Pamuk (Solgunluk, Yaprak Kurdu)
- Tahil/Bugday
- Domates, Biber, Patates
- Uzum, Findik, Cay
- Misir, Seker Pancari

**Ozellikler:**
- Teshis gecmisi (DiagnosisHistory)
- Gunluk ucretsiz kullanim limiti (admin ayarlanabilir)
- Progress bar animasyonu
- Stage (early/mid/advanced), urgency (low/medium/critical), spread risk

---

## 10. MESAJLASMA SISTEMI

### 10.1 Gercek Zamanli Chat

**Firebase Firestore** tabanli, Socket.IO destekli:

- **ConversationList:** Sohbet listesi, son mesaj, zaman
- **ChatView:** Mesaj akisi, otomatik scroll, okundu takibi
- **MessageBubble:** iMessage tarzi balonlar
  - Giden: `bg-[#2D6A4F] text-white rounded-2xl rounded-br-md`
  - Gelen: `bg-[var(--bg-input)] rounded-2xl rounded-bl-md`
- **Read Receipts:** Cift tik SVG (mavi = okundu)
- **MessageInput:** Mesaj girisi + gonder butonu

### 10.2 Bildirim Akisi

```
Socket.IO Event: notification:new
  ↓
NotificationContext handler
  ↓
├── type === 'mesaj' → D5 ping + toast (eger /mesajlar'da degilse)
├── type === 'teklif' → Apple Chime + Wallet Card toast
└── Diger → Bildirim sayaci guncelle
```

---

## 11. DIGER OZELLIKLER

### 11.1 Favori Sistemi

- Kalp butonu (ListingCard) — `animate-haptic` spring animasyonu
- `useFavorites` hook — localStorage + API sync
- `toggleFavorite` API endpoint
- Favori sayfasi

### 11.2 Degerlendirme Sistemi

- 5 yildiz puanlama (RatingStars)
- Yorum yazma (ReviewForm)
- Satici yaniti (seller_reply)
- Guncelleme/silme
- Ortalama puan otomatik hesaplama
- Trust Score: `(rating/5)*40 + min(listings,20)*2 + min(reviews,50)*0.4`
- Auto-verify: Rating >= 4.5 && listings >= 10

### 11.3 Yorum Sistemi

- Ilan altinda yorum yazma
- Yanit (reply) destegi (parentId)
- Silme

### 11.4 Hava Durumu

- WeatherWidget: Gradient kart, sicaklik, nem, ruzgar
- GPS bazli otomatik sehir
- 10 dakika cache
- Don/sicaklik uyarilari → Bildirim olarak gonderilir

### 11.5 Hal Fiyatlari

- HalFiyatlariPage: Guncel hal fiyatlari
- HasatlinkPazariPage: Platform ici fiyat endeksi
- Saatlik/haftalik grafik gorunumleri (HasatlinkHourlyChart, WeeklyChart)

### 11.6 PWA & Mobile

- Service Worker + PWA manifest
- `usePWAInstall` hook — iOS/Android kurulum rehberi
- `IOSInstallGuide` — iOS ozel popup
- `MobileBottomNav` — 5 sekmeli alt navigasyon
- `MobileAppDownload` — Uygulama indirme banner'i
- Capacitor 8 — Android native build

### 11.7 SEO & Paylasim

- `SEO` component — Dynamic meta tags
- `ShareCard` — Sosyal medya paylasim karti
- `useShare` hook — Web Share API

### 11.8 Dark Mode

- `ThemeContext` — Sistem tercihi + manuel toggle
- `theme-transition` — 300ms smooth gecis
- Tum CSS variable'lari `html.dark` altinda override
- Leaflet tile dark mode filtresi

### 11.9 Coklu Dil (i18n)

- Turkce (varsayilan) + Ingilizce
- `LanguageSwitcher` component
- Tum UI metinleri ceviri anahtarlariyla

---

## 12. BACKEND ALTYAPI DETAYI

### 12.1 Veritabani Modelleri (19 Model)

| Model | Tablo | Anahtar Alanlar |
|-------|-------|-----------------|
| User | users | userId, name, email, points, trust_score, isVerified, isBanned |
| Listing | listings | type (6), listingMode, title, price, images, coordinates, stats |
| Offer | offers | fromUserId, toUserId, offerPrice, status (pending/accepted/rejected) |
| Rating | ratings | fromUserId, toUserId, score (1-5), comment, seller_reply |
| Comment | comments | listingId, userId, text, parentId (threaded) |
| Notification | notifications | type (8 tip), title, message, isRead |
| MarketPrice | marketprices | name, price, previousPrice, change, category |
| AIDiagnosis | aidiagnoses | disease, confidence, treatment, stage, urgency |
| ListingView | listingviews | listingId, identifier (unique compound index) |
| ListingShare | listingshares | listingId, userId |
| PriceAlert | pricealerts | userId, category, targetPrice, keyword |
| Report | reports | reporterId, targetId, reason, status |
| ProfanityLog | profanitylogs | userId, field, original, detected |
| Blog | blogs | title, slug, content, coverImage, published |
| Ad | ads | slot (4), imageUrl, clickUrl, start/endDate, impressions |
| Dealer | dealers | companyName, coordinates, specialization_tags, commission_rate |
| ContactMessage | contactmessages | name, email, message |
| SiteSettings | sitesettings | Tum platform ayarlari (singleton) |
| PushSubscription | pushsubscriptions | userId, endpoint, keys |

### 12.2 API Endpoint Sayisi

| Route Dosyasi | Endpoint Sayisi | Ornekler |
|---------------|----------------|----------|
| listingRoutes | 9 | GET/POST/PUT/DELETE /listings, viewers, wa-click, share, stats |
| adminRoutes | 25+ | Dashboard, users, listings, market, notifications, reports, moderation |
| userRoutes | 8 | register, login, google, me, update, stats, favorites |
| offerRoutes | 4 | create, list, my-offers, update-status |
| ratingRoutes | 4 | create, get-user, get-listing, delete |
| commentRoutes | 3 | list, create, delete |
| aiRoutes | 2 | diagnose, history |
| weatherRoutes | 2 | weather, alerts |
| dealerRoutes | 8 | nearby, click, contact, CRUD, toggle |
| blogRoutes | 4 | list, detail, create, update |
| adRoutes | 5 | active, CRUD, click-track |
| marketPriceRoutes | 4 | list, hal, create, update |
| hasatlinkPazarRoutes | 3 | prices, hourly, weekly |
| notificationRoutes | 3 | list, read, read-all |
| priceAlertRoutes | 4 | list, create, update, delete |
| contactRoutes | 2 | submit, list |
| uploadRoutes | 1 | image upload (multer) |
| shareRoutes | 2 | share, sharecard |
| settingsRoutes | 2 | get, update |
| **TOPLAM** | **~90+ endpoint** | |

### 12.3 Middleware Katmani (7 Middleware)

| Middleware | Gorev |
|------------|-------|
| `auth` | JWT token dogrulama, userId extraction |
| `optionalAuth` | Opsiyonel auth (goruntuleme sayaci icin) |
| `admin` | Admin rol kontrolu |
| `rateLimit` | Istek hizi sinirlandirma |
| `sanitize` | XSS/injection onleme |
| `upload` | Multer gorsel yukleme (boyut/tip kontrolu) |
| `errorHandler` | Merkezi hata yakalama |

### 12.4 Utility Servisleri

| Utility | Gorev |
|---------|-------|
| `pointsService` | Puan dagitim motoru (awardPoints + POINT_VALUES) |
| `profanityFilter` | Turkce kufur/uygunsuz icerik tespiti |
| `pushNotification` | Web Push VAPID bildirim gonderimi |
| `haversine` | GPS mesafe hesaplama (bayi yakinlik) |

---

## 13. FRONTEND BILEŞEN ENVANTERI

### 13.1 Sayfa Sayisi: 32 Sayfa

**Kullanici Sayfalari (17):**
HomePage, ListingsPage, ListingDetailPage, MapPage, MessagesPage, ProfilePage, AccountSettingsPage, NotificationsPage, AIDiagnosisPage, HalFiyatlariPage, HasatlinkPazariPage, BlogPage, BlogDetailPage, ContactPage, AuthPage, TermsPage, PrivacyPage, CookiePolicyPage, NotFoundPage

**Admin Sayfalari (13):**
AdminDashboardPage, AdminListingsPage, AdminUsersPage, AdminHalPricesPage, AdminPazarPricesPage, AdminBlogPage, AdminAdsPage, AdminDealersPage, AdminNotificationsPage, AdminModerationPage, AdminSettingsPage, AdminRevenuePage, AdminContactsPage

### 13.2 Bilesen Sayisi: 45+ Bilesen

**UI Kit (16):** Badge, Button, CookieConsent, EmptyState, FAB, IOSInstallGuide, Input, LanguageSwitcher, LazyImage, LoadingSpinner, Modal, PWAInstallPrompt, SEO, ScrollToTop, Toggle, WeatherWidget

**Layout (6):** Header, Footer, CategoryNav, SubCategoryBar, MobileBottomNav, MobileAppDownload

**Listings (6):** ListingCard, ListingDetailView, ListingForm, ListingGrid, ImageGallery, ShareCard

**Messages (5):** ChatView, ConversationItem, ConversationList, MessageBubble, MessageInput

**Map (3):** ListingMap, LocationPicker, MapMarker

**AI (3):** AIDiagnosisPanel, DiagnosisResult, DiagnosisHistory

**Social (1):** StoriesSection

**Profile (4):** ProfileCard, ProfileEditForm, MyListings, AnalyticsCards

**Ratings (3):** RatingStars, ReviewCard, ReviewForm

**Comments (1):** CommentSection

**Ads (4):** BannerAd, BannerCarousel, DealerCard, DealerList

**Hal (3):** HasatlinkHourlyChart, HasatlinkWeeklyChart, WeeklyChart

**Notifications (2):** NotificationDropdown, NotificationItem

**Admin (1):** AdminLayout

### 13.3 Custom Hook Sayisi: 20 Hook

useAIDiagnosis, useAds, useComments, useCountUp, useFavorites, useHalPrices, useHasatlinkPazar, useInView, useListings, useMessages, useNotificationSound, useNotifications, usePWAInstall, usePriceAlerts, usePushNotifications, useRatings, useSettings, useShare, useUser, useWeather

---

## 14. REAL-TIME ENGINE — Socket.IO Altyapisi

### 14.1 Baglanti Yonetimi

- HTTP Server uzerinde Socket.IO v4.8
- CORS whitelist (production + localhost)
- Kullanici bazli oda sistemi: `user:{userId}`
- Cevrimici kullanici takibi: `onlineUsers Map<string, Set<string>>`

### 14.2 Event Haritasi

| Event | Yon | Aciklama |
|-------|-----|----------|
| `user:online` | Server → Client | Kullanici cevrimici oldu |
| `user:offline` | Server → Client | Kullanici cevrimdisi oldu |
| `typing:start` | Client → Server | Yazma baslatildi |
| `typing:stop` | Client → Server | Yazma durduruldu |
| `message:new` | Bidirectional | Yeni mesaj |
| `message:read` | Client → Server | Mesaj okundu (read receipt) |
| `favorite:new` | Server → Client | Yeni favori bildirimi |
| `rating:new` | Server → Client | Yeni degerlendirme |
| `listing:view` | Client → Server | Ilan goruntulendi |
| `notification:new` | Server → Client | Genel bildirim |
| `notification:favorite` | Server → Client | Favori bildirimi |
| `notification:rating` | Server → Client | Rating bildirimi |
| `notification:weather` | Server → Client | Hava durumu uyarisi |

### 14.3 Bildirim Dagitimi

```typescript
sendSocketNotification(userId, { ...notification, receipt?, playSound: true })
  → io.to(`user:${userId}`).emit('notification:new', notification)
```

- Kullanici cevrimiciyse anlik teslim
- Cevrimdisiyse Web Push fallback (VAPID)

---

## 15. GUVENLIK ALTYAPISI

### 15.1 Authentication Katmanlari

| Katman | Mekanizma |
|--------|-----------|
| **Firebase Auth** | Google OAuth, Email/Sifre girisi |
| **JWT** | 30 gun gecerlilik, Bearer token, her istekte dogrulama |
| **bcrypt** | Sifre hash'leme |
| **optionalAuth** | Goruntuleme sayaci icin opsiyonel kimlik |
| **Admin Guard** | `role === 'admin'` kontrolu |

### 15.2 Koruma Katmanlari

| Middleware | Koruma |
|------------|--------|
| **CORS** | Domain whitelist (production + localhost) |
| **Rate Limit** | Genel: 100 istek/dakika, Auth: 10 istek/15 dakika |
| **Sanitize** | HTML tag temizleme, MongoDB `$` operator engelleme |
| **Profanity Filter** | Turkce kufur/uygunsuz icerik tespiti + log |
| **Security Headers** | X-Content-Type-Options, X-Frame-Options, X-XSS-Protection |
| **Upload Validation** | Multer: dosya tipi + boyut kontrolu |

### 15.3 Trust Score Algoritmasi

```
trust_score = min(100,
  (averageRating / 5) * 40 +
  min(listingCount, 20) * 2 +
  min(totalRatings, 50) * 0.4
)
```

- Auto-verify: `averageRating >= 4.5 && listingCount >= 10` → otomatik dogrulama
- Her rating isleminde yeniden hesaplanir

---

## 16. BACKEND SERVISLERI

### 16.1 Pazar Fiyat Servisleri

| Servis | Gorev |
|--------|-------|
| `halPriceService.ts` | Turkiye Hal fiyatlarini ceker (dis kaynak) |
| `hasatlinkPazarService.ts` | Platform ici fiyat endeksi hesaplar |
| `ogImageService.ts` | Sosyal medya paylasim icin OG gorsel uretir |

### 16.2 Zamanlanmis Gorevler

- **Bayi Suresi Kontrolu:** Her saat, suresi gecen bayileri otomatik pasiflestirir (`expireOutdatedDealers`)
- **Hava Durumu Uyarisi:** Don/sicaklik tespit edildiginde ilgili kullanicilara bildirim

---

## 17. PROJE METRIKLERI

| Metrik | Deger |
|--------|-------|
| **Frontend Dosya** | 128 TypeScript/React dosyasi |
| **Toplam Sayfa** | 33 (20 kullanici + 13 admin) |
| **Toplam Bilesen** | 57 bilesen (15 alt klasor) |
| **Custom Hook** | 19 |
| **Context Provider** | 6 |
| **Backend Model** | 18 Mongoose model |
| **API Endpoint** | ~95+ REST endpoint |
| **Backend Controller** | 17 controller |
| **Socket.IO Event** | 13 event tipi |
| **Middleware** | 7 |
| **Backend Servis** | 3 harici servis |
| **Desteklenen Dil** | 2 (Turkce / Ingilizce) |
| **Ilan Kategorisi** | 6 (Pazar, Lojistik, Isgucu, Ekipman, Arazi, Depolama) |
| **AI Hastalik DB** | 25+ Turkiye tarimina ozel hastalik |
| **Animasyon Tipi** | 12+ custom CSS (spring physics, haptic, glassmorphism) |
| **Dark Mode** | Tam destek (30+ CSS variable) |
| **PWA + Native** | Service Worker + Capacitor Android |
| **Guvenlik Katmani** | 6 middleware + VAPID push |

---

## 18. TEKNIK MIMARI DIYAGRAMI

```
┌─────────────────────────────────────────────────────────────────┐
│                        KULLANICI                                │
│              (Browser / PWA / Capacitor Android)                │
└──────────────────────────┬──────────────────────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
┌──────────────────┐ ┌──────────┐ ┌──────────────┐
│   React 19 SPA   │ │Socket.IO │ │  Firebase    │
│   Vite + TS      │ │ Client   │ │  Firestore   │
│   Tailwind CSS 4 │ │          │ │  (Chat)      │
│   Leaflet Maps   │ │          │ │  Auth        │
│   Recharts       │ │          │ │              │
└────────┬─────────┘ └────┬─────┘ └──────────────┘
         │                │
         ▼                ▼
┌─────────────────────────────────────────────────┐
│              EXPRESS 5 API SERVER                │
│  ┌─────────┐ ┌──────────┐ ┌──────────────────┐  │
│  │  CORS   │ │Rate Limit│ │    Sanitize      │  │
│  │  Guard  │ │ 100/min  │ │  XSS + Injection │  │
│  └─────────┘ └──────────┘ └──────────────────┘  │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │           17 CONTROLLER                  │    │
│  │  user · listing · offer · rating         │    │
│  │  admin · ai · weather · dealer           │    │
│  │  blog · comment · notification           │    │
│  │  marketPrice · hasatlinkPazar             │    │
│  │  priceAlert · ad · contact · settings    │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│  ┌──────────────┐  ┌───────────────────────┐     │
│  │  Socket.IO   │  │   Web Push (VAPID)    │     │
│  │  Server      │  │   Bildirim Servisi    │     │
│  │  13 Event    │  │                       │     │
│  └──────────────┘  └───────────────────────┘     │
└──────────────────────────┬───────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────┐
│              MONGODB (Mongoose 9)               │
│  18 Model · Compound Index · Text Search        │
│  Aggregation Pipeline · GeoSpatial Query        │
└─────────────────────────────────────────────────┘
```

---

> **HasatLink Pro V1.1** — Turkiye'nin tarim sektorunu dijitallestiren, yapay zeka destekli, gercek zamanli, oyunlastirilmis bir ticaret platformu.
>
> 128+ frontend dosyasi, 95+ API endpoint, 18 veritabani modeli, 13 Socket.IO event tipi, 6 guvenlik katmani — **tek bir gelistirici tarafindan, sifirdan, production-ready olarak insa edilmistir.**
