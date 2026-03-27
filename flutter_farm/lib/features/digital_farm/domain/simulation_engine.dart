import 'dart:async';
import 'dart:math';

// ─── Bitki Evresi ───
enum GrowthStage {
  seed,       // Tohum (0-10%)
  sprout,     // Fide (10-25%)
  growing,    // Buyume (25-50%)
  flowering,  // Ciceklenme (50-70%)
  fruiting,   // Meyve (70-90%)
  harvestReady, // Hasat (90-100%)
}

extension GrowthStageX on GrowthStage {
  String get displayName {
    switch (this) {
      case GrowthStage.seed: return 'Tohum';
      case GrowthStage.sprout: return 'Fide';
      case GrowthStage.growing: return 'Buyume';
      case GrowthStage.flowering: return 'Ciceklenme';
      case GrowthStage.fruiting: return 'Meyve';
      case GrowthStage.harvestReady: return 'Hasat Hazir';
    }
  }

  String get emoji {
    switch (this) {
      case GrowthStage.seed: return '🌰';
      case GrowthStage.sprout: return '🌱';
      case GrowthStage.growing: return '🌿';
      case GrowthStage.flowering: return '🌸';
      case GrowthStage.fruiting: return '🍅';
      case GrowthStage.harvestReady: return '✨';
    }
  }

  double get minPercent {
    switch (this) {
      case GrowthStage.seed: return 0;
      case GrowthStage.sprout: return 10;
      case GrowthStage.growing: return 25;
      case GrowthStage.flowering: return 50;
      case GrowthStage.fruiting: return 70;
      case GrowthStage.harvestReady: return 90;
    }
  }
}

// ─── Hava Durumu Verisi ───
class WeatherData {
  final double temperature;     // Celsius
  final double humidity;        // %
  final double windSpeed;       // m/s
  final double rainMm;          // son 3h yagis
  final String description;    // "Gunesli", "Bulutlu"
  final String icon;           // OpenWeather icon code
  final bool frostRisk;
  final bool heatRisk;
  final bool droughtRisk;

  const WeatherData({
    required this.temperature,
    required this.humidity,
    required this.windSpeed,
    required this.rainMm,
    required this.description,
    required this.icon,
    required this.frostRisk,
    required this.heatRisk,
    required this.droughtRisk,
  });

  factory WeatherData.fromJson(Map<String, dynamic> json) {
    final temp = (json['temperature'] as num?)?.toDouble() ?? 20;
    return WeatherData(
      temperature: temp,
      humidity: (json['humidity'] as num?)?.toDouble() ?? 50,
      windSpeed: (json['wind_speed'] as num?)?.toDouble() ?? 0,
      rainMm: (json['rain_mm'] as num?)?.toDouble() ?? 0,
      description: json['description'] as String? ?? 'Bilinmiyor',
      icon: json['icon'] as String? ?? '01d',
      frostRisk: json['frost_risk'] as bool? ?? false,
      heatRisk: json['heat_risk'] as bool? ?? false,
      droughtRisk: json['drought_risk'] as bool? ?? false,
    );
  }

  /// Hava durumuna gore nem azalma katsayisi
  /// Sicak + kuru = hizli azalir, serin + nemli = yavas azalir
  double get moistureDecayMultiplier {
    double base = 1.0;
    // Sicaklik etkisi: 20C = normal, her 5C fazla = %30 hizli
    if (temperature > 20) {
      base += (temperature - 20) / 5 * 0.3;
    } else if (temperature < 10) {
      base *= 0.5; // sogukta yavas buharlasmaa
    }
    // Ruzgar etkisi
    if (windSpeed > 5) base += 0.2;
    if (windSpeed > 10) base += 0.3;
    // Nem etkisi (hava nemli = toprak yavas kurur)
    if (humidity > 70) base *= 0.6;
    else if (humidity < 30) base *= 1.4;
    // Yagis etkisi (yagmur varsa nem azalmaz)
    if (rainMm > 0) base *= 0.1;
    return base.clamp(0.1, 4.0);
  }

  /// Hava durumuna gore saglik etkisi (her tick'te)
  double get healthImpactPerTick {
    double impact = 0;
    if (frostRisk) impact -= 2.0;  // don hasari
    if (heatRisk) impact -= 1.0;   // sicak stresi
    if (droughtRisk) impact -= 0.5;
    if (temperature >= 20 && temperature <= 32 && !droughtRisk) {
      impact += 0.1; // ideal kosullar, yavas iyilesme
    }
    return impact;
  }
}

// ─── Aksiyon Turleri ───
enum FarmActionType { water, fertilize, pestProtect, frostProtect, heatProtect }

class FarmAction {
  final FarmActionType type;
  final String displayName;
  final String emoji;
  final double cost;       // TL
  final double moistureImpact;
  final double healthImpact;
  final double fertilizerImpact;

  const FarmAction({
    required this.type,
    required this.displayName,
    required this.emoji,
    required this.cost,
    this.moistureImpact = 0,
    this.healthImpact = 0,
    this.fertilizerImpact = 0,
  });
}

// ─── Urun Tipleri ───
class CropDefinition {
  final String type;
  final String displayName;
  final String emoji;
  final int growthDays;
  final double yieldPerM2;
  final double idealTempMin;
  final double idealTempMax;
  final int waterFrequencyHours;
  final List<FarmAction> actions;

  const CropDefinition({
    required this.type,
    required this.displayName,
    required this.emoji,
    required this.growthDays,
    required this.yieldPerM2,
    required this.idealTempMin,
    required this.idealTempMax,
    required this.waterFrequencyHours,
    required this.actions,
  });
}

// ─── Onceden Tanimli Urunler ───
final cropDomates = CropDefinition(
  type: 'domates',
  displayName: 'Domates',
  emoji: '🍅',
  growthDays: 75,
  yieldPerM2: 3.5,
  idealTempMin: 18,
  idealTempMax: 30,
  waterFrequencyHours: 24,
  actions: const [
    FarmAction(type: FarmActionType.water, displayName: 'Sula', emoji: '💧', cost: 15, moistureImpact: 50, healthImpact: 3),
    FarmAction(type: FarmActionType.fertilize, displayName: 'Organik Gubre Ver', emoji: '🧪', cost: 50, healthImpact: 8, fertilizerImpact: 40),
    FarmAction(type: FarmActionType.pestProtect, displayName: 'Zararli Korumasi', emoji: '🛡️', cost: 35, healthImpact: 5),
    FarmAction(type: FarmActionType.frostProtect, displayName: 'Don Korumasi', emoji: '❄️', cost: 60, healthImpact: 10),
    FarmAction(type: FarmActionType.heatProtect, displayName: 'Sicak Korumasi', emoji: '☀️', cost: 40, healthImpact: 5, moistureImpact: 20),
  ],
);

final cropBiber = CropDefinition(
  type: 'biber',
  displayName: 'Biber',
  emoji: '🌶️',
  growthDays: 65,
  yieldPerM2: 2.8,
  idealTempMin: 20,
  idealTempMax: 32,
  waterFrequencyHours: 20,
  actions: const [
    FarmAction(type: FarmActionType.water, displayName: 'Sula', emoji: '💧', cost: 15, moistureImpact: 45, healthImpact: 3),
    FarmAction(type: FarmActionType.fertilize, displayName: 'Organik Gubre Ver', emoji: '🧪', cost: 50, healthImpact: 8, fertilizerImpact: 35),
    FarmAction(type: FarmActionType.pestProtect, displayName: 'Zararli Korumasi', emoji: '🛡️', cost: 35, healthImpact: 5),
    FarmAction(type: FarmActionType.frostProtect, displayName: 'Don Korumasi', emoji: '❄️', cost: 60, healthImpact: 10),
    FarmAction(type: FarmActionType.heatProtect, displayName: 'Sicak Korumasi', emoji: '☀️', cost: 40, healthImpact: 5, moistureImpact: 15),
  ],
);

final cropCatalog = <String, CropDefinition>{
  'domates': cropDomates,
  'biber': cropBiber,
};

// ─── Tarla Durumu (Canli State) ───
class PlotState {
  double moisture;          // 0-100 (toprak nemi)
  double health;            // 0-100 (bitki sagligi)
  double fertilizerLevel;   // 0-100 (gubre seviyesi)
  double fireRate;          // 0-100 (kayip orani)
  double growthPercent;     // 0-100 (buyume ilerlemesi)
  GrowthStage growthStage;
  DateTime lastWatered;
  DateTime lastFertilized;
  DateTime lastProtected;
  double totalSpent;        // toplam harcama TL
  double walletBalance;     // kullanici bakiyesi TL

  PlotState({
    this.moisture = 80,
    this.health = 100,
    this.fertilizerLevel = 60,
    this.fireRate = 0,
    this.growthPercent = 0,
    this.growthStage = GrowthStage.seed,
    DateTime? lastWatered,
    DateTime? lastFertilized,
    DateTime? lastProtected,
    this.totalSpent = 0,
    this.walletBalance = 500,
  })  : lastWatered = lastWatered ?? DateTime.now(),
        lastFertilized = lastFertilized ?? DateTime.now(),
        lastProtected = lastProtected ?? DateTime.now();

  PlotState copyWith({
    double? moisture,
    double? health,
    double? fertilizerLevel,
    double? fireRate,
    double? growthPercent,
    GrowthStage? growthStage,
    DateTime? lastWatered,
    DateTime? lastFertilized,
    DateTime? lastProtected,
    double? totalSpent,
    double? walletBalance,
  }) {
    return PlotState(
      moisture: moisture ?? this.moisture,
      health: health ?? this.health,
      fertilizerLevel: fertilizerLevel ?? this.fertilizerLevel,
      fireRate: fireRate ?? this.fireRate,
      growthPercent: growthPercent ?? this.growthPercent,
      growthStage: growthStage ?? this.growthStage,
      lastWatered: lastWatered ?? this.lastWatered,
      lastFertilized: lastFertilized ?? this.lastFertilized,
      lastProtected: lastProtected ?? this.lastProtected,
      totalSpent: totalSpent ?? this.totalSpent,
      walletBalance: walletBalance ?? this.walletBalance,
    );
  }
}

// ═══════════════════════════════════════════════════════════
// SIMULASYON MOTORU
// Gercek zamanli tarla simulasyonu: nem azalmasi, saglik
// bozulmasi, buyume ilerlemesi, hava durumu etkileri
// ═══════════════════════════════════════════════════════════

class SimulationEngine {
  final CropDefinition crop;
  final double areaM2;
  final String regionName;

  PlotState _state;
  WeatherData _weather;
  Timer? _tickTimer;
  final _stateController = StreamController<PlotState>.broadcast();
  final _alertController = StreamController<SimulationAlert>.broadcast();

  // Tick suresi (gercek uretim: 6 saat = 1 tick, demo: 5 saniye = 1 tick)
  static const tickIntervalSeconds = 5; // Demo: 5sn = ~6 saat simulasyon
  static const hoursPerTick = 6.0;      // Her tick 6 saatlik decay simule eder

  SimulationEngine({
    required this.crop,
    required this.areaM2,
    required this.regionName,
    PlotState? initialState,
    WeatherData? initialWeather,
  })  : _state = initialState ?? PlotState(),
        _weather = initialWeather ?? const WeatherData(
          temperature: 28, humidity: 45, windSpeed: 3, rainMm: 0,
          description: 'Gunesli', icon: '01d',
          frostRisk: false, heatRisk: false, droughtRisk: false,
        );

  /// Canli state stream'i — UI buna abone olur
  Stream<PlotState> get stateStream => _stateController.stream;

  /// Alert stream'i — uyarilar (don, kuraklik, vb.)
  Stream<SimulationAlert> get alertStream => _alertController.stream;

  /// Anlik state
  PlotState get state => _state;

  /// Anlik hava durumu
  WeatherData get weather => _weather;

  /// Simulasyonu baslat
  void start() {
    _tickTimer?.cancel();
    _tickTimer = Timer.periodic(
      Duration(seconds: tickIntervalSeconds),
      (_) => _tick(),
    );
    _stateController.add(_state);
  }

  /// Simulasyonu durdur
  void stop() {
    _tickTimer?.cancel();
  }

  /// Hava durumunu guncelle (API'den gelen veri)
  void updateWeather(WeatherData newWeather) {
    _weather = newWeather;
  }

  /// Kullanici aksiyonu calistir
  ActionResult performAction(FarmAction action) {
    // Bakiye kontrolu
    if (_state.walletBalance < action.cost) {
      return ActionResult(
        success: false,
        message: 'Yetersiz bakiye! Gereken: ${action.cost.toStringAsFixed(0)} TL',
      );
    }

    // Aksiyonu uygula
    double newMoisture = (_state.moisture + action.moistureImpact).clamp(0, 100);
    double newHealth = (_state.health + action.healthImpact).clamp(0, 100);
    double newFertilizer = (_state.fertilizerLevel + action.fertilizerImpact).clamp(0, 100);
    double newBalance = _state.walletBalance - action.cost;
    double newSpent = _state.totalSpent + action.cost;
    DateTime? newLastWatered = _state.lastWatered;
    DateTime? newLastFertilized = _state.lastFertilized;
    DateTime? newLastProtected = _state.lastProtected;

    switch (action.type) {
      case FarmActionType.water:
        newLastWatered = DateTime.now();
        break;
      case FarmActionType.fertilize:
        newLastFertilized = DateTime.now();
        break;
      case FarmActionType.pestProtect:
      case FarmActionType.frostProtect:
      case FarmActionType.heatProtect:
        newLastProtected = DateTime.now();
        // Koruma: fire rate dusur
        final newFire = (_state.fireRate - 5).clamp(0.0, 100.0);
        _state = _state.copyWith(fireRate: newFire);
        break;
    }

    _state = _state.copyWith(
      moisture: newMoisture,
      health: newHealth,
      fertilizerLevel: newFertilizer,
      walletBalance: newBalance,
      totalSpent: newSpent,
      lastWatered: newLastWatered,
      lastFertilized: newLastFertilized,
      lastProtected: newLastProtected,
    );

    _stateController.add(_state);

    return ActionResult(
      success: true,
      message: '${action.emoji} ${action.displayName} yapildi! (-${action.cost.toStringAsFixed(0)} TL)',
    );
  }

  // ─── Dahili Tick (Her 5 saniyede = 6 saat simulasyon) ───
  void _tick() {
    final now = DateTime.now();
    double moistureDelta = 0;
    double healthDelta = 0;
    double fertDelta = 0;
    double fireDelta = 0;
    double growthDelta = 0;

    // ── 1. Nem Azalmasi (Hava durumuna bagli) ──
    // Baz azalma: saatte %0.8, tick basina = 0.8 * 6 = 4.8
    final baseMoistureDecay = 0.8 * hoursPerTick;
    moistureDelta -= baseMoistureDecay * _weather.moistureDecayMultiplier;

    // Yagmur varsa nem ekle
    if (_weather.rainMm > 0) {
      moistureDelta += min(_weather.rainMm * 5, 30); // max +30
    }

    // ── 2. Gubre Azalmasi ──
    fertDelta -= 1.5; // tick basina %1.5 azalir

    // ── 3. Saglik Etkisi ──
    // Nem cok dusukse saglik duser
    if (_state.moisture < 20) {
      healthDelta -= 3.0; // kritik kuraklik
      fireDelta += 1.5;
      _alertController.add(SimulationAlert(
        type: AlertType.drought,
        title: 'Kuraklik Tehlikesi!',
        message: 'Toprak nemi %${_state.moisture.toStringAsFixed(0)}. Hemen sula!',
        severity: AlertSeverity.critical,
      ));
    } else if (_state.moisture < 40) {
      healthDelta -= 1.0; // dusuk nem stresi
    }

    // Gubre dusukse buyume yavaslar
    if (_state.fertilizerLevel < 15) {
      healthDelta -= 1.0;
      growthDelta -= 0.3; // buyume yavaslamasi
    }

    // Hava durumu etkileri
    healthDelta += _weather.healthImpactPerTick;

    // Don uyarisi
    if (_weather.frostRisk) {
      final hoursSinceProtection = now.difference(_state.lastProtected).inHours;
      if (hoursSinceProtection > 12) {
        fireDelta += 3.0;
        _alertController.add(SimulationAlert(
          type: AlertType.frost,
          title: 'Don Tehlikesi!',
          message: '${_weather.temperature.toStringAsFixed(0)}°C! Don korumasi yap yoksa urun zarar gorur.',
          severity: AlertSeverity.critical,
        ));
      }
    }

    // Sicak uyarisi
    if (_weather.heatRisk) {
      final hoursSinceProtection = now.difference(_state.lastProtected).inHours;
      if (hoursSinceProtection > 12) {
        fireDelta += 1.5;
        moistureDelta -= 5; // ekstra nem kaybi
        _alertController.add(SimulationAlert(
          type: AlertType.heat,
          title: 'Asiri Sicak!',
          message: '${_weather.temperature.toStringAsFixed(0)}°C! Sulama ve golgeleme gerekli.',
          severity: AlertSeverity.warning,
        ));
      }
    }

    // ── 4. Buyume Ilerlemesi ──
    // Saglik iyi + nem iyi = normal buyume
    if (_state.health > 30 && _state.moisture > 20) {
      final healthFactor = _state.health / 100;
      final moistureFactor = min(_state.moisture / 60, 1.0);
      final fertFactor = max(_state.fertilizerLevel / 50, 0.3);
      // Tick basina buyume: (100% / growthDays / 4tick_per_day)
      final baseGrowth = 100.0 / crop.growthDays / 4;
      growthDelta += baseGrowth * healthFactor * moistureFactor * fertFactor;
    }

    // ── 5. State Guncelle ──
    final newMoisture = (_state.moisture + moistureDelta).clamp(0.0, 100.0);
    final newHealth = (_state.health + healthDelta).clamp(0.0, 100.0);
    final newFert = (_state.fertilizerLevel + fertDelta).clamp(0.0, 100.0);
    final newFire = (_state.fireRate + fireDelta).clamp(0.0, 100.0);
    final newGrowth = (_state.growthPercent + growthDelta).clamp(0.0, 100.0);

    // Buyume asamasini belirle
    GrowthStage newStage = GrowthStage.seed;
    if (newGrowth >= 90) newStage = GrowthStage.harvestReady;
    else if (newGrowth >= 70) newStage = GrowthStage.fruiting;
    else if (newGrowth >= 50) newStage = GrowthStage.flowering;
    else if (newGrowth >= 25) newStage = GrowthStage.growing;
    else if (newGrowth >= 10) newStage = GrowthStage.sprout;

    // Asama degistiyse bildir
    if (newStage != _state.growthStage) {
      _alertController.add(SimulationAlert(
        type: AlertType.growth,
        title: 'Yeni Asama: ${newStage.displayName}!',
        message: '${crop.emoji} Bitkiniz ${newStage.displayName} asamasina gecti!',
        severity: AlertSeverity.info,
      ));
    }

    _state = _state.copyWith(
      moisture: newMoisture,
      health: newHealth,
      fertilizerLevel: newFert,
      fireRate: newFire,
      growthPercent: newGrowth,
      growthStage: newStage,
    );

    _stateController.add(_state);
  }

  /// Hasat verim hesabi
  HarvestResult calculateHarvest() {
    final baseYield = areaM2 * crop.yieldPerM2;
    final healthMultiplier = _state.health / 100;
    final fireMultiplier = 1 - (_state.fireRate / 100);
    final actualYield = baseYield * healthMultiplier * fireMultiplier;
    final quality = ((_state.health * 0.6) + ((100 - _state.fireRate) * 0.4)).clamp(0.0, 100.0);

    return HarvestResult(
      baseYieldKg: baseYield,
      healthMultiplier: healthMultiplier,
      fireMultiplier: fireMultiplier,
      actualYieldKg: actualYield,
      qualityScore: quality,
      qualityLabel: quality >= 80 ? 'Yuksek' : quality >= 50 ? 'Orta' : 'Dusuk',
    );
  }

  void dispose() {
    _tickTimer?.cancel();
    _stateController.close();
    _alertController.close();
  }
}

// ─── Sonuc Siniflari ───

class ActionResult {
  final bool success;
  final String message;
  const ActionResult({required this.success, required this.message});
}

class HarvestResult {
  final double baseYieldKg;
  final double healthMultiplier;
  final double fireMultiplier;
  final double actualYieldKg;
  final double qualityScore;
  final String qualityLabel;
  const HarvestResult({
    required this.baseYieldKg,
    required this.healthMultiplier,
    required this.fireMultiplier,
    required this.actualYieldKg,
    required this.qualityScore,
    required this.qualityLabel,
  });
}

enum AlertType { frost, heat, drought, pest, growth, harvest }
enum AlertSeverity { info, warning, critical }

class SimulationAlert {
  final AlertType type;
  final String title;
  final String message;
  final AlertSeverity severity;
  final DateTime timestamp;
  SimulationAlert({
    required this.type,
    required this.title,
    required this.message,
    required this.severity,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}
