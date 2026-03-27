# Kisisel Dijital Tarla - Teknik Mimari Dokumani

> CrowdFarming (Avrupa) + Cloud Farming (Asya) sentezi
> HasatLink platformuna entegre, B2C abonelik ve oyunlastirma modulu

---

## ADIM 1: VERITABANI SEMASI (MongoDB)

### 1.1 digital_farm_settings (Global Admin Ayarlari)

```javascript
{
  _id: ObjectId,
  key: "digital_farm",                        // tek kayit
  enabled: Boolean,                           // modul acik/kapali (feature flag)
  beta_mode: Boolean,                         // true = sadece whitelist erisir
  whitelist_user_ids: [String],               // beta'da erisebilen user_id'ler
  active_cities: [                            // il bazli aktivasyon
    {
      city_code: String,                      // "06" (Ankara), "34" (Istanbul)
      city_name: String,                      // "Ankara"
      activated_at: Date,
      max_regions: Number                     // bu ilde max kac bolge acilabilir
    }
  ],
  fomo_thresholds: {
    amber_percent: Number,                    // default: 20 (kalan alan < %20 = amber uyari)
    red_percent: Number,                      // default: 10 (kalan alan < %10 = kirmizi pulsing)
    zero_waitlist: Boolean                    // tukenince bekleme listesi aktif mi
  },
  pricing: {
    rent_per_m2_monthly: Number,              // TL/m2/ay (ornek: 5.0)
    water_per_action: Number,                 // TL/sulama (ornek: 2.5)
    fertilizer_per_action: Number,            // TL/gubreleme (ornek: 8.0)
    frost_protection_cost: Number,            // TL/don koruma (ornek: 15.0)
    heat_protection_cost: Number,             // TL/sicak koruma (ornek: 10.0)
    shipping_per_kg: Number                   // TL/kg kargo (ornek: 12.0)
  },
  crop_catalog: [                             // ekilebilinecek urunler
    {
      crop_type: String,                      // "kayisi", "domates", "biber"
      display_name: String,                   // "Kayisi (Cengelkoy)"
      seed_cost_per_m2: Number,               // TL/m2 tohum maliyeti
      min_area_m2: Number,                    // minimum kiralama alani
      growth_days: Number,                    // tahmini buyume suresi (gun)
      yield_per_m2_kg: Number,                // m2 basina tahmini verim (kg)
      season_start_month: Number,             // ekim sezonu baslangic (1-12)
      season_end_month: Number,               // ekim sezonu bitis
      water_frequency_hours: Number,          // ideal sulama sikligi (saat)
      fertilize_frequency_days: Number,       // ideal gubreleme sikligi (gun)
      icon_emoji: String                      // UI ikonu
    }
  ],
  updated_at: Date,
  updated_by: String                          // admin user_id
}
// Indexes: { key: 1 } (unique)
```

### 1.2 farm_regions (Fiziksel Tarla Bolgeleri)

```javascript
{
  _id: ObjectId,
  region_id: String,                          // "mut-kayisi-01"
  region_name: String,                        // "Mut Kayisi Bahcesi"
  city_code: String,                          // "33" (Mersin)
  city_name: String,                          // "Mersin"
  district: String,                           // "Mut"
  coordinates: {
    lat: Number,                              // 36.6485
    lng: Number                               // 33.4373
  },
  total_area_m2: Number,                      // 1000
  rented_area_m2: Number,                     // 750 (dinamik guncellenir)
  available_area_m2: Number,                  // 250 (total - rented)
  available_percent: Number,                  // 25.0 (FOMO hesabi icin)
  crop_types: [String],                       // ["kayisi", "zeytin"]
  weather_station_id: String,                 // OpenWeather city id veya koordinat
  soil_type: String,                          // "kumlu-tinli"
  water_source: String,                       // "damla sulama"
  photos: [String],                           // bolge fotograflari URL
  description: String,                        // "Mut'un verimli kayisi bahcelerinde..."
  is_active: Boolean,
  waitlist_count: Number,                     // tukenince bekleme listesi sayisi
  created_at: Date,
  updated_at: Date
}
// Indexes: { region_id: 1 } (unique), { city_code: 1, is_active: 1 }, { available_percent: 1 }
```

### 1.3 farm_plots (Kiralanan Parseller)

```javascript
{
  _id: ObjectId,
  plot_id: String,                            // "plot_1711234567890"
  user_id: String,                            // kiralayan kullanici
  region_id: String,                          // hangi bolge
  area_m2: Number,                            // kiralanan alan
  crop_type: String,                          // "kayisi"
  crop_display_name: String,                  // "Kayisi (Cengelkoy)"

  // Tarla Durumu
  health_score: Number,                       // 0-100 (100 = mukemmel)
  water_level: Number,                        // 0-100 (0 = kurak)
  fertilizer_level: Number,                   // 0-100 (0 = tukenmis)
  fire_rate: Number,                          // 0-100 (kayip orani, 0 = kayip yok)
  growth_stage: String,                       // "seed" | "sprout" | "growing" | "flowering" | "fruiting" | "harvest_ready"
  growth_percent: Number,                     // 0-100 buyume ilerlemesi

  // Tarihler
  seed_date: Date,                            // ekim tarihi
  estimated_harvest_date: Date,               // tahmini hasat tarihi
  actual_harvest_date: Date,                  // gercek hasat tarihi (null = hasat olmadi)

  // Maliyet Takibi
  total_spent: Number,                        // toplam harcama TL
  rent_cost_monthly: Number,                  // aylik kira
  next_rent_due: Date,                        // sonraki kira tarihi

  // Durum
  status: String,                             // "active" | "harvesting" | "completed" | "abandoned" | "paused"
  is_imece: Boolean,                          // ortak tarla mi?
  imece_group_id: String,                     // eger imece ise grup id

  // Son Islemler
  last_watered_at: Date,
  last_fertilized_at: Date,
  last_protected_at: Date,

  created_at: Date,
  updated_at: Date
}
// Indexes:
// { plot_id: 1 } (unique)
// { user_id: 1, status: 1 }
// { region_id: 1, status: 1 }
// { status: 1, estimated_harvest_date: 1 }
// { health_score: 1 } (decay sorgusu icin)
```

### 1.4 farm_imece_groups (Ortak Tarla / Imece)

```javascript
{
  _id: ObjectId,
  group_id: String,                           // "imece_1711234567890"
  plot_id: String,                            // bagli parsel
  owner_id: String,                           // grubu olusturan
  members: [
    {
      user_id: String,
      name: String,
      share_percent: Number,                  // pay orani (toplam = 100)
      joined_at: Date,
      status: String,                         // "active" | "left" | "removed"
      total_paid: Number                      // bu uyenin toplam odemesi
    }
  ],
  invite_code: String,                        // davet kodu (6 haneli)
  expense_split_type: String,                 // "equal" | "proportional"
  max_members: Number,                        // max 5
  status: String,                             // "active" | "dissolved"
  created_at: Date
}
// Indexes: { group_id: 1 } (unique), { plot_id: 1 }, { invite_code: 1 }, { "members.user_id": 1 }
```

### 1.5 farm_transactions (Odemeler)

```javascript
{
  _id: ObjectId,
  transaction_id: String,
  user_id: String,                            // odeyen kullanici
  plot_id: String,
  group_id: String,                           // imece ise
  type: String,                               // "rent" | "seed" | "water" | "fertilizer" | "frost_protection" | "heat_protection" | "shipping"
  amount: Number,                             // TL
  description: String,                        // "Sulama - Kayisi tarlasi"
  payment_method: String,                     // "wallet" | "card"
  status: String,                             // "completed" | "pending" | "failed"
  imece_split: [                              // imece bolusmesi detayi
    { user_id: String, amount: Number, paid: Boolean }
  ],
  created_at: Date
}
// Indexes: { transaction_id: 1 } (unique), { user_id: 1, created_at: -1 }, { plot_id: 1 }, { type: 1 }
```

### 1.6 farm_diary (Tarla Gunlugu)

```javascript
{
  _id: ObjectId,
  diary_id: String,
  plot_id: String,                            // spesifik parsel (opsiyonel)
  region_id: String,                          // bolge geneli
  type: String,                               // "photo" | "video" | "note"
  media_url: String,                          // S3/upload URL
  thumbnail_url: String,                      // kucuk onizleme
  description: String,                        // "Bu hafta kayisi cicekleri acti"
  uploaded_by: String,                        // saha personeli user_id
  uploader_name: String,                      // "Ahmet - Saha Ekibi"
  week_number: Number,                        // ekim sonrasi kacinci hafta
  season_year: String,                        // "2026-ilkbahar"
  likes_count: Number,
  created_at: Date
}
// Indexes: { region_id: 1, created_at: -1 }, { plot_id: 1, week_number: 1 }
```

### 1.7 farm_weather_logs (Hava Durumu Cache)

```javascript
{
  _id: ObjectId,
  region_id: String,
  temperature: Number,                        // Celsius
  feels_like: Number,
  humidity: Number,                           // %
  wind_speed: Number,                         // m/s
  rain_mm: Number,                            // son 3 saatte yagis
  description: String,                        // "acik", "bulutlu", "yagmurlu"
  icon: String,                               // hava durumu ikonu kodu

  // Risk Degerlendirmesi
  frost_risk: Boolean,                        // sicaklik < 2C
  heat_risk: Boolean,                         // sicaklik > 40C
  drought_risk: Boolean,                      // nem < 20 ve yagis yok
  storm_risk: Boolean,                        // ruzgar > 60 km/h

  forecast_3day: [
    { date: String, temp_min: Number, temp_max: Number, rain_chance: Number, description: String }
  ],

  fetched_at: Date
}
// Indexes: { region_id: 1, fetched_at: -1 }
// TTL Index: { fetched_at: 1 }, expireAfterSeconds: 86400 (1 gun sonra otomatik sil)
```

### 1.8 farm_actions (Kullanici Aksiyonlari)

```javascript
{
  _id: ObjectId,
  plot_id: String,
  user_id: String,
  action_type: String,                        // "water" | "fertilize" | "protect_frost" | "protect_heat"
  cost: Number,                               // TL
  health_impact: Number,                      // +5, +10 gibi
  water_impact: Number,                       // +30 gibi
  fertilizer_impact: Number,                  // +25 gibi
  auto_triggered: Boolean,                    // sistem tarafindan mi tetiklendi
  created_at: Date
}
// Indexes: { plot_id: 1, created_at: -1 }, { user_id: 1, created_at: -1 }
```

### 1.9 farm_harvests (Hasat Sonuclari)

```javascript
{
  _id: ObjectId,
  harvest_id: String,
  plot_id: String,
  user_id: String,
  region_id: String,
  crop_type: String,

  // Verim
  base_yield_kg: Number,                      // area * yield_per_m2
  health_multiplier: Number,                  // health_score / 100
  fire_multiplier: Number,                    // 1 - (fire_rate / 100)
  actual_yield_kg: Number,                    // base * health * fire
  quality_score: Number,                      // 0-100

  // Kargo
  shipping_address: {
    full_name: String,
    phone: String,
    address_line: String,
    city: String,
    district: String,
    postal_code: String
  },
  shipping_status: String,                    // "pending" | "preparing" | "shipped" | "delivered"
  tracking_number: String,
  shipping_cost: Number,
  shipped_at: Date,
  delivered_at: Date,

  // Imece bolusmesi
  is_imece: Boolean,
  imece_shares: [
    {
      user_id: String,
      share_kg: Number,
      shipping_address: Object,               // her uyeye ayri kargo
      shipping_status: String,
      tracking_number: String
    }
  ],

  created_at: Date
}
// Indexes: { harvest_id: 1 } (unique), { user_id: 1 }, { plot_id: 1 }, { shipping_status: 1 }
```

### 1.10 farm_social (Sosyal Etkilesim)

```javascript
{
  _id: ObjectId,
  visitor_id: String,                         // ziyaretci user_id
  plot_id: String,                            // ziyaret edilen tarla
  plot_owner_id: String,                      // tarla sahibi
  rating: Number,                             // 1-5 yildiz
  comment: String,                            // max 200 karakter
  created_at: Date
}
// Indexes: { plot_id: 1, created_at: -1 }, { visitor_id: 1, plot_id: 1 } (unique - tek yorum)
```

### 1.11 farm_badges (Rozetler / Oyunlastirma)

```javascript
{
  _id: ObjectId,
  user_id: String,
  badge_type: String,                         // asagidaki listeden
  badge_name: String,                         // goruntulenen isim
  badge_icon: String,                         // emoji veya icon kodu
  description: String,                        // nasil kazanildi
  earned_at: Date
}
// Badge Types:
// "ilk_tohum"         - Ilk tarlani ektin!
// "su_ustasi"         - 50 kez sulama yaptin
// "gubre_gurusu"      - 30 kez gubreleme yaptin
// "ilk_hasat"         - Ilk hasadini aldin!
// "bilinçli_uretici"  - 30 gun boyunca saglik 80+ tutuldun
// "imece_lideri"      - Ortak tarla olusturdun
// "sosyal_ciftci"     - 10 tarlaya yorum biraktin
// "hasat_kralı"       - 5 basarili hasat tamamladin
// "erken_kus"         - Don uyarisina 1 saat icinde mudahale ettin
// "yeşil_parmak"      - Saglik skoru hic 50 altina dusmedi
// "meteor_ciftci"     - Tum aksiyonlari zamaninda yaptin (0% fire)
// "topluluk_yildizi"  - Ortalama 4.5+ puan aldin
//
// Indexes: { user_id: 1, badge_type: 1 } (unique), { user_id: 1 }
```

### 1.12 farm_waitlist (Bekleme Listesi)

```javascript
{
  _id: ObjectId,
  user_id: String,
  region_id: String,
  requested_area_m2: Number,
  crop_type: String,
  notify_email: Boolean,
  notify_push: Boolean,
  status: String,                             // "waiting" | "notified" | "converted"
  created_at: Date
}
// Indexes: { region_id: 1, status: 1 }, { user_id: 1 }
```

---

## ADIM 2: FLUTTER MIMARISI

### 2.1 Dosya Yapisi

```
lib/
  features/
    digital_farm/
      data/
        models/
          farm_plot_model.dart
          farm_region_model.dart
          farm_weather_model.dart
          farm_diary_model.dart
          farm_imece_model.dart
          farm_transaction_model.dart
          farm_badge_model.dart
        repositories/
          farm_repository.dart
          weather_repository.dart
          imece_repository.dart
        datasources/
          farm_remote_datasource.dart
          farm_local_datasource.dart       # WatermelonDB offline
      domain/
        entities/
          plot.dart
          region.dart
          weather_alert.dart
        usecases/
          rent_plot_usecase.dart
          perform_action_usecase.dart
          calculate_imece_split_usecase.dart
          check_access_usecase.dart
      presentation/
        state/
          farm_store.dart                  # Legend State observable store
          fomo_state.dart
          access_control_state.dart
        screens/
          farm_discovery_screen.dart
          my_farm_screen.dart
          farm_map_screen.dart
          farm_diary_screen.dart
          imece_dashboard_screen.dart
          farm_social_screen.dart
          farm_shop_screen.dart
          harvest_tracking_screen.dart
        widgets/
          fomo_banner.dart
          health_gauge.dart
          weather_alert_card.dart
          plot_card.dart
          action_button.dart
          growth_timeline.dart
          imece_member_tile.dart
          badge_grid.dart
```

### 2.2 Erisim Kontrolu (Il Bazli + Whitelist)

```dart
// access_control_state.dart
import 'package:legend_state/legend_state.dart';

enum AccessStatus { loading, allowed, cityBlocked, betaOnly, disabled }

class AccessControlStore {
  final settings = Observable<DigitalFarmSettings?>(null);
  final userCity = Observable<String>('');
  final userId = Observable<String>('');

  late final accessStatus = Computed<AccessStatus>(() {
    final s = settings.value;
    if (s == null) return AccessStatus.loading;
    if (!s.enabled) return AccessStatus.disabled;

    // Beta modu: sadece whitelist
    if (s.betaMode) {
      if (s.whitelistUserIds.contains(userId.value)) return AccessStatus.allowed;
      return AccessStatus.betaOnly;
    }

    // Il bazli kontrol
    final activeCities = s.activeCities.map((c) => c.cityName.toLowerCase());
    if (activeCities.contains(userCity.value.toLowerCase())) {
      return AccessStatus.allowed;
    }

    // Whitelist kullanicilari il kontrolunu bypass eder
    if (s.whitelistUserIds.contains(userId.value)) return AccessStatus.allowed;

    return AccessStatus.cityBlocked;
  });

  String get blockedMessage {
    switch (accessStatus.value) {
      case AccessStatus.cityBlocked:
        return 'Dijital Tarla henuz ${userCity.value} ilinde aktif degil. '
               'Yakinda sizin sehrinizde de acilacak!';
      case AccessStatus.betaOnly:
        return 'Dijital Tarla su anda kapalı beta asamasindadir.';
      case AccessStatus.disabled:
        return 'Dijital Tarla modulu su anda aktif degildir.';
      default:
        return '';
    }
  }
}
```

### 2.3 FOMO (Kitlik) UI State

```dart
// fomo_state.dart
import 'package:legend_state/legend_state.dart';

enum FomoLevel { none, amber, red, soldOut }

class FomoStore {
  final regions = ObservableList<FarmRegion>([]);

  FomoLevel getFomoLevel(FarmRegion region) {
    if (region.availableAreaM2 <= 0) return FomoLevel.soldOut;
    final percent = region.availablePercent;
    if (percent < 10) return FomoLevel.red;
    if (percent < 20) return FomoLevel.amber;
    return FomoLevel.none;
  }

  String getFomoText(FarmRegion region, {String lang = 'tr'}) {
    final level = getFomoLevel(region);
    final remaining = region.availableAreaM2.toStringAsFixed(0);
    switch (level) {
      case FomoLevel.soldOut:
        return lang == 'tr' ? 'Tukenmistir! Bekleme listesine katil.' : 'Sold out!';
      case FomoLevel.red:
        return lang == 'tr' ? 'Acele Et! Son $remaining m² kaldi!' : 'Hurry! Only $remaining m² left!';
      case FomoLevel.amber:
        return lang == 'tr' ? 'Sinirli alan: $remaining m² kaldi' : 'Limited: $remaining m² left';
      case FomoLevel.none:
        return '';
    }
  }

  Color getFomoColor(FomoLevel level) {
    switch (level) {
      case FomoLevel.soldOut: return Colors.grey;
      case FomoLevel.red: return Colors.red;
      case FomoLevel.amber: return Colors.amber;
      case FomoLevel.none: return Colors.transparent;
    }
  }
}

// fomo_banner.dart — Widget
class FomoBanner extends StatelessWidget {
  final FarmRegion region;
  const FomoBanner({required this.region});

  @override
  Widget build(BuildContext context) {
    final store = context.read<FomoStore>();
    final level = store.getFomoLevel(region);
    if (level == FomoLevel.none) return SizedBox.shrink();

    return AnimatedContainer(
      duration: Duration(milliseconds: 300),
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: store.getFomoColor(level).withOpacity(0.1),
        border: Border.all(color: store.getFomoColor(level), width: 1.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          if (level == FomoLevel.red)
            _PulsingDot(color: Colors.red),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              store.getFomoText(region),
              style: TextStyle(
                color: store.getFomoColor(level),
                fontWeight: FontWeight.w700,
                fontSize: 13,
              ),
            ),
          ),
          if (level == FomoLevel.soldOut)
            TextButton(
              onPressed: () => _joinWaitlist(context, region),
              child: Text('Bekleme Listesi'),
            ),
        ],
      ),
    );
  }
}

class _PulsingDot extends StatefulWidget {
  final Color color;
  const _PulsingDot({required this.color});

  @override
  State<_PulsingDot> createState() => _PulsingDotState();
}

class _PulsingDotState extends State<_PulsingDot>
    with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(
      vsync: this, duration: Duration(milliseconds: 800),
    )..repeat(reverse: true);
  }
  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }
  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _ctrl,
      child: Container(
        width: 10, height: 10,
        decoration: BoxDecoration(
          color: widget.color, shape: BoxShape.circle,
        ),
      ),
    );
  }
}
```

### 2.4 Imece Masraf Bolusmesi Algoritmasi

```dart
// calculate_imece_split_usecase.dart

class ImeceSplitResult {
  final List<MemberShare> shares;
  final bool hasUnpaidMember;
  final String? unpaidMemberId;
  ImeceSplitResult({required this.shares, this.hasUnpaidMember = false, this.unpaidMemberId});
}

class MemberShare {
  final String userId;
  final double amount;
  final bool canPay;
  MemberShare({required this.userId, required this.amount, required this.canPay});
}

class CalculateImeceSplitUsecase {
  /// Masrafi ortaklara bolustur
  /// [totalCost] toplam masraf TL
  /// [members] grup uyeleri
  /// [splitType] "equal" veya "proportional"
  /// [memberWallets] her uyenin bakiyesi {userId: balance}
  ImeceSplitResult execute({
    required double totalCost,
    required List<ImeceMember> members,
    required String splitType,
    required Map<String, double> memberWallets,
  }) {
    final activeMembers = members.where((m) => m.status == 'active').toList();
    if (activeMembers.isEmpty) throw Exception('Aktif uye yok');

    List<MemberShare> shares = [];
    bool hasUnpaid = false;
    String? unpaidId;

    if (splitType == 'equal') {
      // Esit bolustir
      final perPerson = totalCost / activeMembers.length;
      for (final m in activeMembers) {
        final balance = memberWallets[m.userId] ?? 0;
        final canPay = balance >= perPerson;
        if (!canPay) { hasUnpaid = true; unpaidId = m.userId; }
        shares.add(MemberShare(userId: m.userId, amount: perPerson, canPay: canPay));
      }
    } else {
      // Pay oranina gore bolustir
      final totalShare = activeMembers.fold<double>(0, (s, m) => s + m.sharePercent);
      for (final m in activeMembers) {
        final ratio = m.sharePercent / totalShare;
        final amount = totalCost * ratio;
        final balance = memberWallets[m.userId] ?? 0;
        final canPay = balance >= amount;
        if (!canPay) { hasUnpaid = true; unpaidId = m.userId; }
        shares.add(MemberShare(userId: m.userId, amount: amount, canPay: canPay));
      }
    }

    return ImeceSplitResult(
      shares: shares,
      hasUnpaidMember: hasUnpaid,
      unpaidMemberId: unpaidId,
    );
  }
}
```

### 2.5 Offline-First (WatermelonDB)

```dart
// WatermelonDB React Native icin, Flutter'da Drift/Isar kullanilir
// Asagida Drift (SQLite) ile offline-first pattern:

// farm_local_datasource.dart
@DriftDatabase(tables: [LocalPlots, LocalWeather, LocalActions])
class FarmLocalDB extends _$FarmLocalDB {
  FarmLocalDB() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  // Offline'da yapilan aksiyonlari kaydet, online olunca sync et
  Future<void> queueAction(FarmAction action) async {
    await into(localActions).insert(LocalActionsCompanion(
      plotId: Value(action.plotId),
      actionType: Value(action.actionType),
      cost: Value(action.cost),
      syncStatus: Value('pending'),
      createdAt: Value(DateTime.now()),
    ));
  }

  // Online olunca bekleyen aksiyonlari gonder
  Future<List<LocalAction>> getPendingActions() async {
    return (select(localActions)
      ..where((t) => t.syncStatus.equals('pending')))
      .get();
  }

  Future<void> markSynced(int id) async {
    (update(localActions)..where((t) => t.id.equals(id)))
      .write(LocalActionsCompanion(syncStatus: Value('synced')));
  }
}
```

### 2.6 MMKV Kullanimi

```dart
// MMKV ile hizli key-value storage (Flutter'da flutter_mmkv)
import 'package:mmkv/mmkv.dart';

class FarmPreferences {
  static late MMKV _mmkv;

  static Future<void> init() async {
    _mmkv = MMKV.defaultMMKV();
  }

  // Son secilen bolge
  static String? get lastRegionId => _mmkv.decodeString('farm_last_region');
  static set lastRegionId(String? v) => _mmkv.encodeString('farm_last_region', v ?? '');

  // FOMO goruldu mu (ayni oturumda tekrar gosterme)
  static bool get fomoSeen => _mmkv.decodeBool('farm_fomo_seen');
  static set fomoSeen(bool v) => _mmkv.encodeBool('farm_fomo_seen', v);

  // Son hava durumu kontrolu
  static int get lastWeatherCheck => _mmkv.decodeInt('farm_last_weather');
  static set lastWeatherCheck(int v) => _mmkv.encodeInt('farm_last_weather', v);

  // Bildirim tercihleri
  static bool get weatherAlerts => _mmkv.decodeBool('farm_weather_alerts', defaultValue: true);
  static set weatherAlerts(bool v) => _mmkv.encodeBool('farm_weather_alerts', v);
}
```

---

## ADIM 3: ARKA PLAN GOREVLERI (Cron Jobs — Node.js/Express)

### 3.1 weatherSync (Her 30 dakikada)

```typescript
// backend/src/cron/farmWeatherSync.ts
import axios from 'axios';
import FarmRegion from '../models/FarmRegion';
import FarmWeatherLog from '../models/FarmWeatherLog';
import FarmPlot from '../models/FarmPlot';
import { sendPushToUser } from '../utils/pushNotification';
import Notification from '../models/Notification';

const OW_API_KEY = process.env.OPENWEATHER_API_KEY || '';
const OW_BASE = 'https://api.openweathermap.org/data/2.5';

export async function weatherSync(): Promise<void> {
  const regions = await FarmRegion.find({ is_active: true });

  for (const region of regions) {
    try {
      // Anlik hava durumu
      const { data: current } = await axios.get(`${OW_BASE}/weather`, {
        params: {
          lat: region.coordinates.lat,
          lon: region.coordinates.lng,
          appid: OW_API_KEY,
          units: 'metric',
          lang: 'tr',
        },
      });

      // 3 gunluk tahmin
      const { data: forecast } = await axios.get(`${OW_BASE}/forecast`, {
        params: {
          lat: region.coordinates.lat,
          lon: region.coordinates.lng,
          appid: OW_API_KEY,
          units: 'metric',
          lang: 'tr',
          cnt: 24, // 3 gun x 8 (3 saatlik)
        },
      });

      const temp = current.main?.temp ?? 20;
      const humidity = current.main?.humidity ?? 50;
      const windSpeed = current.wind?.speed ?? 0;
      const rain = current.rain?.['3h'] ?? 0;

      // Risk hesapla
      const frost_risk = temp < 2;
      const heat_risk = temp > 40;
      const drought_risk = humidity < 20 && rain === 0;
      const storm_risk = windSpeed > 16.7; // 60 km/h

      // Kaydet
      await FarmWeatherLog.create({
        region_id: region.region_id,
        temperature: temp,
        feels_like: current.main?.feels_like ?? temp,
        humidity,
        wind_speed: windSpeed,
        rain_mm: rain,
        description: current.weather?.[0]?.description || '',
        icon: current.weather?.[0]?.icon || '',
        frost_risk,
        heat_risk,
        drought_risk,
        storm_risk,
        forecast_3day: processForecast(forecast),
        fetched_at: new Date(),
      });

      // Risk varsa bildirimleri gonder
      if (frost_risk || heat_risk) {
        const plots = await FarmPlot.find({
          region_id: region.region_id,
          status: 'active',
        });

        for (const plot of plots) {
          const title = frost_risk
            ? 'Don Tehlikesi! Tarlani Koru!'
            : 'Asiri Sicak! Tarlani Koru!';
          const body = frost_risk
            ? `${region.region_name} bolgesinde sicaklik ${temp}°C. Don koruma aksiyonu al!`
            : `${region.region_name} bolgesinde sicaklik ${temp}°C. Sulama ve golgeleme yap!`;

          await Notification.create({
            userId: plot.user_id,
            type: 'sistem',
            title,
            message: body,
            relatedId: plot.plot_id,
          });
          sendPushToUser(plot.user_id, { title, body, url: '/dijital-tarla' }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(`[WeatherSync] ${region.region_id} hatasi:`, err);
    }
  }
}

function processForecast(data: any): any[] {
  const daily: Record<string, any> = {};
  for (const item of data.list || []) {
    const date = item.dt_txt?.split(' ')[0];
    if (!date) continue;
    if (!daily[date]) {
      daily[date] = { date, temp_min: 100, temp_max: -100, rain_chance: 0, description: '' };
    }
    daily[date].temp_min = Math.min(daily[date].temp_min, item.main?.temp_min ?? 100);
    daily[date].temp_max = Math.max(daily[date].temp_max, item.main?.temp_max ?? -100);
    daily[date].rain_chance = Math.max(daily[date].rain_chance, (item.pop ?? 0) * 100);
    if (!daily[date].description) daily[date].description = item.weather?.[0]?.description || '';
  }
  return Object.values(daily).slice(0, 3);
}
```

### 3.2 healthDecay (Her 6 saatte)

```typescript
// backend/src/cron/farmHealthDecay.ts
import FarmPlot from '../models/FarmPlot';
import FarmWeatherLog from '../models/FarmWeatherLog';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

export async function healthDecay(): Promise<void> {
  const activePlots = await FarmPlot.find({ status: 'active' });
  const now = new Date();

  for (const plot of activePlots) {
    let healthDelta = 0;
    let fireDelta = 0;
    let waterDelta = 0;
    let fertDelta = 0;
    const warnings: string[] = [];

    // ── Sulama kontrolu ──
    const hoursSinceWater = plot.last_watered_at
      ? (now.getTime() - new Date(plot.last_watered_at).getTime()) / (1000 * 60 * 60)
      : 999;

    if (hoursSinceWater > 48) {
      healthDelta -= 5;
      waterDelta -= 10;
      warnings.push('Tarlan 48 saattir sulanmadi!');
    } else if (hoursSinceWater > 24) {
      waterDelta -= 5;
    }

    // ── Gubreleme kontrolu ──
    const daysSinceFertilize = plot.last_fertilized_at
      ? (now.getTime() - new Date(plot.last_fertilized_at).getTime()) / (1000 * 60 * 60 * 24)
      : 999;

    if (daysSinceFertilize > 7) {
      healthDelta -= 3;
      fertDelta -= 8;
      warnings.push('Gubreleme 7 gunu gecti.');
    }

    // ── Hava durumu risk kontrolu ──
    const latestWeather = await FarmWeatherLog.findOne({
      region_id: plot.region_id,
    }).sort({ fetched_at: -1 });

    if (latestWeather) {
      // Don riski + koruma yapilmamis
      if (latestWeather.frost_risk) {
        const hoursSinceProtection = plot.last_protected_at
          ? (now.getTime() - new Date(plot.last_protected_at).getTime()) / (1000 * 60 * 60)
          : 999;

        if (hoursSinceProtection > 12) {
          healthDelta -= 15;
          fireDelta += 10;
          warnings.push('Don hasari! Koruma yapilmadigi icin verim dustu.');
        }
      }

      // Asiri sicak + koruma yapilmamis
      if (latestWeather.heat_risk) {
        const hoursSinceProtection = plot.last_protected_at
          ? (now.getTime() - new Date(plot.last_protected_at).getTime()) / (1000 * 60 * 60)
          : 999;

        if (hoursSinceProtection > 12) {
          healthDelta -= 10;
          fireDelta += 5;
          warnings.push('Sicak stresi! Sulama ve golgeleme gerekli.');
        }
      }
    }

    // ── Degerleri guncelle ──
    const newHealth = Math.max(0, Math.min(100, plot.health_score + healthDelta));
    const newFire = Math.max(0, Math.min(100, plot.fire_rate + fireDelta));
    const newWater = Math.max(0, Math.min(100, plot.water_level + waterDelta));
    const newFert = Math.max(0, Math.min(100, plot.fertilizer_level + fertDelta));

    // Buyume ilerlemesini guncelle
    const totalDays = (new Date(plot.estimated_harvest_date).getTime() - new Date(plot.seed_date).getTime()) / (1000 * 60 * 60 * 24);
    const elapsedDays = (now.getTime() - new Date(plot.seed_date).getTime()) / (1000 * 60 * 60 * 24);
    const growthPercent = Math.min(100, (elapsedDays / totalDays) * 100);

    // Buyume asamasini belirle
    let growthStage = 'seed';
    if (growthPercent >= 90) growthStage = 'harvest_ready';
    else if (growthPercent >= 70) growthStage = 'fruiting';
    else if (growthPercent >= 50) growthStage = 'flowering';
    else if (growthPercent >= 25) growthStage = 'growing';
    else if (growthPercent >= 10) growthStage = 'sprout';

    await FarmPlot.findByIdAndUpdate(plot._id, {
      $set: {
        health_score: newHealth,
        fire_rate: newFire,
        water_level: newWater,
        fertilizer_level: newFert,
        growth_percent: Math.round(growthPercent),
        growth_stage: growthStage,
        updated_at: now,
      },
    });

    // Kritik uyari gonder
    if (warnings.length > 0 && newHealth < 50) {
      const title = 'Tarlan Tehlikede!';
      const body = warnings.join(' ') + ` Saglik: %${newHealth}`;
      await Notification.create({
        userId: plot.user_id,
        type: 'sistem',
        title,
        message: body,
        relatedId: plot.plot_id,
      });
      sendPushToUser(plot.user_id, { title, body, url: '/dijital-tarla' }).catch(() => {});
    }

    // Terk edilmis tarla kontrolu (saglik 0 ve 7 gun aksiyon yok)
    if (newHealth === 0 && hoursSinceWater > 168) {
      await FarmPlot.findByIdAndUpdate(plot._id, {
        $set: { status: 'abandoned', updated_at: now },
      });
      // Alani serbest birak
      await FarmRegion.findOneAndUpdate(
        { region_id: plot.region_id },
        { $inc: { rented_area_m2: -plot.area_m2, available_area_m2: plot.area_m2 } },
      );
    }
  }
}
```

### 3.3 harvestCheck (Gunluk)

```typescript
// backend/src/cron/farmHarvestCheck.ts
import FarmPlot from '../models/FarmPlot';
import FarmHarvest from '../models/FarmHarvest';
import FarmImeceGroup from '../models/FarmImeceGroup';
import FarmRegion from '../models/FarmRegion';
import DigitalFarmSettings from '../models/DigitalFarmSettings';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

export async function harvestCheck(): Promise<void> {
  const now = new Date();
  const readyPlots = await FarmPlot.find({
    status: 'active',
    estimated_harvest_date: { $lte: now },
  });

  const settings = await DigitalFarmSettings.findOne({ key: 'digital_farm' });
  const cropCatalog = settings?.crop_catalog || [];

  for (const plot of readyPlots) {
    // Verim hesabi
    const cropInfo = cropCatalog.find((c: any) => c.crop_type === plot.crop_type);
    const yieldPerM2 = cropInfo?.yield_per_m2_kg || 0.5;

    const base_yield_kg = plot.area_m2 * yieldPerM2;
    const health_multiplier = plot.health_score / 100;
    const fire_multiplier = 1 - (plot.fire_rate / 100);
    const actual_yield_kg = Math.round(base_yield_kg * health_multiplier * fire_multiplier * 100) / 100;

    // Kalite skoru
    const quality_score = Math.round(
      (plot.health_score * 0.6) + ((100 - plot.fire_rate) * 0.4)
    );

    // Hasat kaydi olustur
    const harvest: any = {
      harvest_id: `harvest_${Date.now()}_${plot.plot_id}`,
      plot_id: plot.plot_id,
      user_id: plot.user_id,
      region_id: plot.region_id,
      crop_type: plot.crop_type,
      base_yield_kg,
      health_multiplier,
      fire_multiplier,
      actual_yield_kg,
      quality_score,
      shipping_status: 'pending',
      is_imece: plot.is_imece,
      created_at: now,
    };

    // Imece bolusmesi
    if (plot.is_imece && plot.imece_group_id) {
      const group = await FarmImeceGroup.findOne({ group_id: plot.imece_group_id });
      if (group) {
        const activeMembers = group.members.filter((m: any) => m.status === 'active');
        harvest.imece_shares = activeMembers.map((m: any) => ({
          user_id: m.user_id,
          share_kg: Math.round((actual_yield_kg * m.share_percent / 100) * 100) / 100,
          shipping_status: 'pending',
        }));

        // Her uye icin bildirim
        for (const m of activeMembers) {
          const shareKg = (actual_yield_kg * m.share_percent / 100).toFixed(1);
          await Notification.create({
            userId: m.user_id,
            type: 'sistem',
            title: 'Hasat Zamani Geldi!',
            message: `${plot.crop_display_name} hasadiniz hazir! Payiniz: ${shareKg} kg. Kargo adresinizi girin.`,
            relatedId: plot.plot_id,
          });
          sendPushToUser(m.user_id, {
            title: 'Hasat Zamani!',
            body: `${shareKg} kg ${plot.crop_display_name} payiniz hazir!`,
            url: '/dijital-tarla',
          }).catch(() => {});
        }
      }
    } else {
      // Tekil kullanici bildirimi
      await Notification.create({
        userId: plot.user_id,
        type: 'sistem',
        title: 'Hasat Zamani Geldi!',
        message: `${plot.crop_display_name} hasadiniz hazir! Toplam: ${actual_yield_kg.toFixed(1)} kg. Kargo adresinizi girin.`,
        relatedId: plot.plot_id,
      });
      sendPushToUser(plot.user_id, {
        title: 'Hasat Zamani!',
        body: `${actual_yield_kg.toFixed(1)} kg ${plot.crop_display_name} hasadiniz hazir!`,
        url: '/dijital-tarla',
      }).catch(() => {});
    }

    await FarmHarvest.create(harvest);

    // Plot durumunu guncelle
    await FarmPlot.findByIdAndUpdate(plot._id, {
      $set: {
        status: 'harvesting',
        actual_harvest_date: now,
        growth_stage: 'harvest_ready',
        growth_percent: 100,
        updated_at: now,
      },
    });

    // Alani serbest birak
    await FarmRegion.findOneAndUpdate(
      { region_id: plot.region_id },
      { $inc: { rented_area_m2: -plot.area_m2, available_area_m2: plot.area_m2 } },
    );
  }
}
```

### 3.4 fomoUpdate (Her 5 dakikada)

```typescript
// backend/src/cron/farmFomoUpdate.ts
import FarmRegion from '../models/FarmRegion';
import FarmWaitlist from '../models/FarmWaitlist';
import Notification from '../models/Notification';
import { sendPushToUser } from '../utils/pushNotification';

export async function fomoUpdate(): Promise<void> {
  const regions = await FarmRegion.find({ is_active: true });

  for (const region of regions) {
    const prevPercent = region.available_percent;
    const newPercent = (region.available_area_m2 / region.total_area_m2) * 100;

    // Yuzdeyi guncelle
    await FarmRegion.findByIdAndUpdate(region._id, {
      $set: {
        available_percent: Math.round(newPercent * 10) / 10,
        updated_at: new Date(),
      },
    });

    // Esik gecisleri kontrol et
    // %20 altina dustuyse
    if (prevPercent >= 20 && newPercent < 20) {
      console.log(`[FOMO] ${region.region_name}: Amber esigi gecildi (%${newPercent.toFixed(1)})`);
    }

    // %10 altina dustuyse
    if (prevPercent >= 10 && newPercent < 10) {
      console.log(`[FOMO] ${region.region_name}: Kirmizi esik! (%${newPercent.toFixed(1)})`);
    }

    // Alan acildiysa bekleme listesini bilgilendir
    if (prevPercent <= 0 && newPercent > 0) {
      const waiters = await FarmWaitlist.find({
        region_id: region.region_id,
        status: 'waiting',
      }).limit(20);

      for (const w of waiters) {
        await Notification.create({
          userId: w.user_id,
          type: 'sistem',
          title: 'Alan Acildi!',
          message: `${region.region_name} bolgesinde ${region.available_area_m2} m² alan acildi! Hemen kirala.`,
          relatedId: region.region_id,
        });
        sendPushToUser(w.user_id, {
          title: 'Alan Acildi!',
          body: `${region.region_name} bolgesinde alan musait!`,
          url: '/dijital-tarla',
        }).catch(() => {});
        await FarmWaitlist.findByIdAndUpdate(w._id, { $set: { status: 'notified' } });
      }
    }
  }
}
```

### 3.5 badgeAwarder (Gunluk)

```typescript
// backend/src/cron/farmBadgeAwarder.ts
import FarmPlot from '../models/FarmPlot';
import FarmAction from '../models/FarmAction';
import FarmHarvest from '../models/FarmHarvest';
import FarmSocial from '../models/FarmSocial';
import FarmImeceGroup from '../models/FarmImeceGroup';
import FarmBadge from '../models/FarmBadge';
import Notification from '../models/Notification';

const BADGES = [
  {
    type: 'ilk_tohum',
    name: 'Ilk Tohum',
    icon: '🌱',
    desc: 'Ilk tarlani ektin!',
    check: async (userId: string) => {
      const count = await FarmPlot.countDocuments({ user_id: userId });
      return count >= 1;
    },
  },
  {
    type: 'su_ustasi',
    name: 'Su Ustasi',
    icon: '💧',
    desc: '50 kez sulama yaptin!',
    check: async (userId: string) => {
      const count = await FarmAction.countDocuments({ user_id: userId, action_type: 'water' });
      return count >= 50;
    },
  },
  {
    type: 'gubre_gurusu',
    name: 'Gubre Gurusu',
    icon: '🧪',
    desc: '30 kez gubreleme yaptin!',
    check: async (userId: string) => {
      const count = await FarmAction.countDocuments({ user_id: userId, action_type: 'fertilize' });
      return count >= 30;
    },
  },
  {
    type: 'ilk_hasat',
    name: 'Ilk Hasat',
    icon: '🎉',
    desc: 'Ilk hasadini aldin!',
    check: async (userId: string) => {
      const count = await FarmHarvest.countDocuments({ user_id: userId });
      return count >= 1;
    },
  },
  {
    type: 'bilinçli_uretici',
    name: 'Bilincli Uretici',
    icon: '🏆',
    desc: '30 gun boyunca saglik 80+ tutuldun',
    check: async (userId: string) => {
      const plots = await FarmPlot.find({ user_id: userId, status: 'active', health_score: { $gte: 80 } });
      for (const p of plots) {
        const days = (Date.now() - new Date(p.seed_date).getTime()) / (1000 * 60 * 60 * 24);
        if (days >= 30) return true;
      }
      return false;
    },
  },
  {
    type: 'imece_lideri',
    name: 'Imece Lideri',
    icon: '🤝',
    desc: 'Ortak tarla olusturdun',
    check: async (userId: string) => {
      const count = await FarmImeceGroup.countDocuments({ owner_id: userId });
      return count >= 1;
    },
  },
  {
    type: 'sosyal_ciftci',
    name: 'Sosyal Ciftci',
    icon: '⭐',
    desc: '10 tarlaya yorum biraktin',
    check: async (userId: string) => {
      const count = await FarmSocial.countDocuments({ visitor_id: userId });
      return count >= 10;
    },
  },
  {
    type: 'hasat_krali',
    name: 'Hasat Krali',
    icon: '👑',
    desc: '5 basarili hasat tamamladin',
    check: async (userId: string) => {
      const count = await FarmHarvest.countDocuments({ user_id: userId, shipping_status: 'delivered' });
      return count >= 5;
    },
  },
  {
    type: 'meteor_ciftci',
    name: 'Meteor Ciftci',
    icon: '☄️',
    desc: 'Sifir fire ile hasat tamamladin!',
    check: async (userId: string) => {
      const harvest = await FarmHarvest.findOne({ user_id: userId, fire_multiplier: 1.0 });
      return !!harvest;
    },
  },
];

export async function badgeAwarder(): Promise<void> {
  // Tum aktif kullanicilari bul
  const users = await FarmPlot.distinct('user_id');

  for (const userId of users) {
    for (const badge of BADGES) {
      // Zaten kazanilmis mi?
      const existing = await FarmBadge.findOne({ user_id: userId, badge_type: badge.type });
      if (existing) continue;

      const earned = await badge.check(userId);
      if (earned) {
        await FarmBadge.create({
          user_id: userId,
          badge_type: badge.type,
          badge_name: badge.name,
          badge_icon: badge.icon,
          description: badge.desc,
          earned_at: new Date(),
        });
        await Notification.create({
          userId,
          type: 'sistem',
          title: `Yeni Rozet: ${badge.icon} ${badge.name}`,
          message: badge.desc,
        });
      }
    }
  }
}
```

### 3.6 Cron Kayit (index.ts'e ekle)

```typescript
// backend/src/index.ts icine eklenecek kisim:
import { weatherSync } from './cron/farmWeatherSync';
import { healthDecay } from './cron/farmHealthDecay';
import { harvestCheck } from './cron/farmHarvestCheck';
import { fomoUpdate } from './cron/farmFomoUpdate';
import { badgeAwarder } from './cron/farmBadgeAwarder';

// Dijital Tarla Cron Jobs
setInterval(() => weatherSync().catch(e => console.error('[CRON] weatherSync:', e)), 30 * 60 * 1000);     // 30 dk
setInterval(() => healthDecay().catch(e => console.error('[CRON] healthDecay:', e)), 6 * 60 * 60 * 1000);  // 6 saat
setInterval(() => harvestCheck().catch(e => console.error('[CRON] harvestCheck:', e)), 24 * 60 * 60 * 1000); // gunluk
setInterval(() => fomoUpdate().catch(e => console.error('[CRON] fomoUpdate:', e)), 5 * 60 * 1000);         // 5 dk
setInterval(() => badgeAwarder().catch(e => console.error('[CRON] badgeAwarder:', e)), 24 * 60 * 60 * 1000); // gunluk

// Weekly digest (her Pazartesi 09:00)
setInterval(async () => {
  const now = new Date();
  if (now.getDay() === 1 && now.getHours() === 9 && now.getMinutes() < 10) {
    // weeklyDigest().catch(e => console.error('[CRON] weeklyDigest:', e));
  }
}, 10 * 60 * 1000);
```

---

## VERIM FORMULU

```
base_yield_kg = area_m2 * crop_yield_per_m2
health_multiplier = health_score / 100        // 0.0 - 1.0
fire_multiplier = 1 - (fire_rate / 100)       // 0.0 - 1.0
actual_yield = base_yield_kg * health_multiplier * fire_multiplier

Ornek:
  50 m2 kayisi tarlasi, yield_per_m2 = 2.0 kg
  health_score = 85, fire_rate = 10
  base = 50 * 2.0 = 100 kg
  health = 85/100 = 0.85
  fire = 1 - (10/100) = 0.90
  actual = 100 * 0.85 * 0.90 = 76.5 kg
```

## SAGLIK BOZULMA TABLOSU

| Durum | Saglik Etkisi | Fire Etkisi | Tetik |
|-------|--------------|-------------|-------|
| 48+ saat sulama yok | -5 | - | Her 6 saatte |
| 7+ gun gubreleme yok | -3 | - | Her 6 saatte |
| Don riski + koruma yok | -15 | +10 | Her 6 saatte |
| Sicak riski + koruma yok | -10 | +5 | Her 6 saatte |
| Firtina hasari | -8 | +3 | Hava durumu tetikler |
| Sulama aksiyonu | +10 | - | Kullanici aksiyonu |
| Gubreleme aksiyonu | +8 | - | Kullanici aksiyonu |
| Don koruma aksiyonu | +5 | -5 | Kullanici aksiyonu |

---

> Dokuman: HasatLink Dijital Tarla Modulu Teknik Mimarisi
> Tarih: 2026-03-26
> Versiyon: 1.0
