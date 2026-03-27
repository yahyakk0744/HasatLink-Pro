import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../domain/simulation_engine.dart';

// ═══════════════════════════════════════════════════════════
// TARLA SIMULASYON EKRANI
// Farming Simulator / Stardew Valley kalitesinde interaktif
// oyun paneli. Gercek zamanli bitki durumu, hava etkisi,
// stratejik aksiyonlar.
// ═══════════════════════════════════════════════════════════

class FarmSimulationScreen extends StatefulWidget {
  final String plotId;
  final String cropType;
  final double areaM2;
  final String regionName;
  final double walletBalance;

  const FarmSimulationScreen({
    super.key,
    required this.plotId,
    this.cropType = 'domates',
    this.areaM2 = 25,
    this.regionName = 'Mut',
    this.walletBalance = 500,
  });

  @override
  State<FarmSimulationScreen> createState() => _FarmSimulationScreenState();
}

class _FarmSimulationScreenState extends State<FarmSimulationScreen>
    with TickerProviderStateMixin {
  late SimulationEngine _engine;
  late StreamSubscription<PlotState> _stateSub;
  late StreamSubscription<SimulationAlert> _alertSub;
  late AnimationController _pulseCtrl;
  late AnimationController _growCtrl;

  PlotState _plotState = PlotState();
  final List<SimulationAlert> _alerts = [];
  bool _showAlertBanner = false;
  SimulationAlert? _currentAlert;

  @override
  void initState() {
    super.initState();

    final crop = cropCatalog[widget.cropType] ?? cropDomates;
    _engine = SimulationEngine(
      crop: crop,
      areaM2: widget.areaM2,
      regionName: widget.regionName,
      initialState: PlotState(walletBalance: widget.walletBalance),
    );

    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat(reverse: true);

    _growCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    _stateSub = _engine.stateStream.listen((state) {
      setState(() => _plotState = state);
    });

    _alertSub = _engine.alertStream.listen((alert) {
      setState(() {
        _alerts.insert(0, alert);
        if (_alerts.length > 20) _alerts.removeLast();
        _currentAlert = alert;
        _showAlertBanner = true;
      });
      HapticFeedback.heavyImpact();
      Future.delayed(const Duration(seconds: 4), () {
        if (mounted) setState(() => _showAlertBanner = false);
      });
    });

    _engine.start();
  }

  @override
  void dispose() {
    _stateSub.cancel();
    _alertSub.cancel();
    _engine.dispose();
    _pulseCtrl.dispose();
    _growCtrl.dispose();
    super.dispose();
  }

  CropDefinition get _crop => cropCatalog[widget.cropType] ?? cropDomates;
  WeatherData get _weather => _engine.weather;

  void _performAction(FarmAction action) {
    final result = _engine.performAction(action);
    HapticFeedback.mediumImpact();
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(result.message, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      backgroundColor: result.success ? const Color(0xFF2D6A4F) : const Color(0xFFDC2626),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      duration: const Duration(seconds: 2),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A1628),
      body: SafeArea(
        child: Stack(
          children: [
            // ── Ana Icerik ──
            CustomScrollView(
              slivers: [
                // Header
                SliverToBoxAdapter(child: _buildHeader()),
                // Bitki Gorseli
                SliverToBoxAdapter(child: _buildPlantVisual()),
                // Hava Durumu
                SliverToBoxAdapter(child: _buildWeatherCard()),
                // Stratejik Barlar
                SliverToBoxAdapter(child: _buildStatusBars()),
                // Buyume Zaman Cizelgesi
                SliverToBoxAdapter(child: _buildGrowthTimeline()),
                // Hasat Tahmini
                SliverToBoxAdapter(child: _buildHarvestPreview()),
                // Alt bosluk (butonlar icin)
                const SliverToBoxAdapter(child: SizedBox(height: 120)),
              ],
            ),

            // ── Alert Banner (Ust) ──
            if (_showAlertBanner && _currentAlert != null)
              Positioned(
                top: 0, left: 16, right: 16,
                child: _buildAlertBanner(_currentAlert!),
              ),

            // ── Aksiyon Butonlari (Alt) ──
            Positioned(
              bottom: 0, left: 0, right: 0,
              child: _buildActionBar(),
            ),
          ],
        ),
      ),
    );
  }

  // ─── HEADER ───
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
      child: Row(
        children: [
          // Geri butonu
          GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.arrow_back_ios_new, color: Colors.white70, size: 18),
            ),
          ),
          const SizedBox(width: 12),
          // Baslik
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${_crop.emoji} ${_crop.displayName} Tarlam',
                  style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800, letterSpacing: -0.5),
                ),
                Text(
                  '${widget.regionName} | ${widget.areaM2.toStringAsFixed(0)} m²',
                  style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12, fontWeight: FontWeight.w500),
                ),
              ],
            ),
          ),
          // Bakiye
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFF1A2940),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFF2D6A4F).withOpacity(0.3)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('💰', style: TextStyle(fontSize: 14)),
                const SizedBox(width: 4),
                Text(
                  '${_plotState.walletBalance.toStringAsFixed(0)} TL',
                  style: TextStyle(
                    color: _plotState.walletBalance < 50 ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                    fontSize: 13, fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── BITKI GORSELI (Evre Animasyonu) ───
  Widget _buildPlantVisual() {
    final stage = _plotState.growthStage;
    final healthColor = _plotState.health > 70
        ? const Color(0xFF10B981)
        : _plotState.health > 40
            ? const Color(0xFFF59E0B)
            : const Color(0xFFEF4444);

    return Container(
      margin: const EdgeInsets.fromLTRB(20, 8, 20, 12),
      height: 220,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(24),
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            const Color(0xFF1E3A5F).withOpacity(0.6),
            const Color(0xFF0D1B2A),
          ],
        ),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Stack(
        children: [
          // Arka plan toprak
          Positioned(
            bottom: 0, left: 0, right: 0,
            child: Container(
              height: 60,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(bottom: Radius.circular(24)),
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color.lerp(const Color(0xFF5C4033), const Color(0xFF8B6914),
                        (_plotState.moisture / 100).clamp(0, 1))!.withOpacity(0.6),
                    const Color(0xFF3E2723).withOpacity(0.8),
                  ],
                ),
              ),
            ),
          ),

          // Bitki emoji (buyuk, ortada)
          Center(
            child: AnimatedBuilder(
              animation: _pulseCtrl,
              builder: (_, __) {
                final scale = 1.0 + (_pulseCtrl.value * 0.05);
                return Transform.scale(
                  scale: scale,
                  child: Text(
                    stage.emoji,
                    style: TextStyle(
                      fontSize: 72 + (_plotState.growthPercent / 100 * 20),
                    ),
                  ),
                );
              },
            ),
          ),

          // Buyume yuzdesi badge
          Positioned(
            top: 16, right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: healthColor.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: healthColor.withOpacity(0.3)),
              ),
              child: Text(
                '%${_plotState.growthPercent.toStringAsFixed(1)}',
                style: TextStyle(color: healthColor, fontSize: 14, fontWeight: FontWeight.w800),
              ),
            ),
          ),

          // Asama etiketi
          Positioned(
            top: 16, left: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                stage.displayName,
                style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600),
              ),
            ),
          ),

          // Nem gostergesi (toprak rengi)
          Positioned(
            bottom: 8, left: 16,
            child: Row(
              children: [
                const Text('💧', style: TextStyle(fontSize: 12)),
                const SizedBox(width: 4),
                Text(
                  'Nem: %${_plotState.moisture.toStringAsFixed(0)}',
                  style: TextStyle(
                    color: _plotState.moisture < 20 ? const Color(0xFFEF4444) : Colors.white54,
                    fontSize: 11, fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),

          // Fire rate badge
          if (_plotState.fireRate > 0)
            Positioned(
              bottom: 8, right: 16,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: const Color(0xFFEF4444).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '🔥 Fire: %${_plotState.fireRate.toStringAsFixed(0)}',
                  style: const TextStyle(color: Color(0xFFEF4444), fontSize: 10, fontWeight: FontWeight.w700),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ─── HAVA DURUMU KARTI ───
  Widget _buildWeatherCard() {
    final isRisky = _weather.frostRisk || _weather.heatRisk || _weather.droughtRisk;
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        color: isRisky
            ? const Color(0xFFEF4444).withOpacity(0.08)
            : const Color(0xFF1A2940),
        border: Border.all(
          color: isRisky
              ? const Color(0xFFEF4444).withOpacity(0.3)
              : Colors.white.withOpacity(0.06),
        ),
      ),
      child: Row(
        children: [
          // Sicaklik
          Text(
            _getWeatherEmoji(),
            style: const TextStyle(fontSize: 32),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${widget.regionName} - ${_weather.temperature.toStringAsFixed(0)}°C',
                  style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                Text(
                  _weather.description,
                  style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12),
                ),
              ],
            ),
          ),
          // Mini barlar
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              _miniStat('💧', '${_weather.humidity.toStringAsFixed(0)}%'),
              const SizedBox(height: 4),
              _miniStat('🌬️', '${_weather.windSpeed.toStringAsFixed(0)} m/s'),
              if (_weather.rainMm > 0) ...[
                const SizedBox(height: 4),
                _miniStat('🌧️', '${_weather.rainMm.toStringAsFixed(1)} mm'),
              ],
            ],
          ),
          // Risk ikonu
          if (isRisky) ...[
            const SizedBox(width: 8),
            AnimatedBuilder(
              animation: _pulseCtrl,
              builder: (_, __) => Opacity(
                opacity: 0.5 + _pulseCtrl.value * 0.5,
                child: const Text('⚠️', style: TextStyle(fontSize: 24)),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _miniStat(String emoji, String value) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(emoji, style: const TextStyle(fontSize: 10)),
        const SizedBox(width: 3),
        Text(value, style: const TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.w600)),
      ],
    );
  }

  String _getWeatherEmoji() {
    if (_weather.frostRisk) return '🥶';
    if (_weather.heatRisk) return '🔥';
    if (_weather.rainMm > 5) return '🌧️';
    if (_weather.rainMm > 0) return '🌦️';
    if (_weather.temperature > 30) return '☀️';
    if (_weather.humidity > 80) return '🌫️';
    return '⛅';
  }

  // ─── STRATEJIK BARLAR ───
  Widget _buildStatusBars() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      child: Column(
        children: [
          _buildBar(
            label: 'Bitki Sagligi',
            value: _plotState.health,
            emoji: '❤️',
            color: _plotState.health > 70
                ? const Color(0xFF10B981)
                : _plotState.health > 40
                    ? const Color(0xFFF59E0B)
                    : const Color(0xFFEF4444),
          ),
          const SizedBox(height: 8),
          _buildBar(
            label: 'Toprak Nemi',
            value: _plotState.moisture,
            emoji: '💧',
            color: _plotState.moisture > 50
                ? const Color(0xFF3B82F6)
                : _plotState.moisture > 20
                    ? const Color(0xFFF59E0B)
                    : const Color(0xFFEF4444),
          ),
          const SizedBox(height: 8),
          _buildBar(
            label: 'Gubre Seviyesi',
            value: _plotState.fertilizerLevel,
            emoji: '🧪',
            color: _plotState.fertilizerLevel > 40
                ? const Color(0xFF8B5CF6)
                : _plotState.fertilizerLevel > 15
                    ? const Color(0xFFF59E0B)
                    : const Color(0xFFEF4444),
          ),
        ],
      ),
    );
  }

  Widget _buildBar({required String label, required double value, required String emoji, required Color color}) {
    final isCritical = value < 20;
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isCritical ? color.withOpacity(0.08) : const Color(0xFF1A2940),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: isCritical ? color.withOpacity(0.3) : Colors.white.withOpacity(0.04)),
      ),
      child: Row(
        children: [
          Text(emoji, style: const TextStyle(fontSize: 18)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(label, style: const TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w600)),
                    AnimatedBuilder(
                      animation: _pulseCtrl,
                      builder: (_, __) => Text(
                        '%${value.toStringAsFixed(0)}',
                        style: TextStyle(
                          color: isCritical
                              ? Color.lerp(color, Colors.white, _pulseCtrl.value * 0.3)
                              : color,
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                ClipRRect(
                  borderRadius: BorderRadius.circular(6),
                  child: LinearProgressIndicator(
                    value: (value / 100).clamp(0, 1),
                    backgroundColor: Colors.white.withOpacity(0.06),
                    valueColor: AlwaysStoppedAnimation(color),
                    minHeight: 8,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ─── BUYUME ZAMAN CIZELGESI ───
  Widget _buildGrowthTimeline() {
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A2940),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.04)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Buyume Asamalari', style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1)),
          const SizedBox(height: 12),
          Row(
            children: GrowthStage.values.map((stage) {
              final isActive = stage.index <= _plotState.growthStage.index;
              final isCurrent = stage == _plotState.growthStage;
              return Expanded(
                child: Column(
                  children: [
                    AnimatedContainer(
                      duration: const Duration(milliseconds: 400),
                      width: 36, height: 36,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: isCurrent
                            ? const Color(0xFF10B981).withOpacity(0.2)
                            : isActive
                                ? const Color(0xFF10B981).withOpacity(0.08)
                                : Colors.white.withOpacity(0.03),
                        border: Border.all(
                          color: isCurrent
                              ? const Color(0xFF10B981)
                              : isActive
                                  ? const Color(0xFF10B981).withOpacity(0.3)
                                  : Colors.white.withOpacity(0.08),
                          width: isCurrent ? 2 : 1,
                        ),
                      ),
                      child: Center(
                        child: Text(
                          stage.emoji,
                          style: TextStyle(fontSize: isActive ? 16 : 12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      stage.displayName,
                      style: TextStyle(
                        color: isCurrent ? const Color(0xFF10B981) : Colors.white30,
                        fontSize: 7,
                        fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  // ─── HASAT TAHMINI ───
  Widget _buildHarvestPreview() {
    final harvest = _engine.calculateHarvest();
    return Container(
      margin: const EdgeInsets.fromLTRB(20, 0, 20, 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFF1A2940),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.04)),
      ),
      child: Row(
        children: [
          const Text('🎯', style: TextStyle(fontSize: 28)),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Tahmini Hasat', style: TextStyle(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  '${harvest.actualYieldKg.toStringAsFixed(1)} kg ${_crop.displayName}',
                  style: const TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: harvest.qualityScore >= 80
                  ? const Color(0xFF10B981).withOpacity(0.15)
                  : harvest.qualityScore >= 50
                      ? const Color(0xFFF59E0B).withOpacity(0.15)
                      : const Color(0xFFEF4444).withOpacity(0.15),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              harvest.qualityLabel,
              style: TextStyle(
                color: harvest.qualityScore >= 80
                    ? const Color(0xFF10B981)
                    : harvest.qualityScore >= 50
                        ? const Color(0xFFF59E0B)
                        : const Color(0xFFEF4444),
                fontSize: 11, fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── ALERT BANNER ───
  Widget _buildAlertBanner(SimulationAlert alert) {
    final color = alert.severity == AlertSeverity.critical
        ? const Color(0xFFEF4444)
        : alert.severity == AlertSeverity.warning
            ? const Color(0xFFF59E0B)
            : const Color(0xFF10B981);
    return AnimatedSlide(
      offset: _showAlertBanner ? Offset.zero : const Offset(0, -1),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.95),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [BoxShadow(color: color.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 4))],
        ),
        child: Row(
          children: [
            Text(
              alert.type == AlertType.frost ? '❄️' :
              alert.type == AlertType.heat ? '🔥' :
              alert.type == AlertType.drought ? '🏜️' :
              alert.type == AlertType.growth ? '🌱' : '⚠️',
              style: const TextStyle(fontSize: 22),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(alert.title, style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800)),
                  Text(alert.message, style: const TextStyle(color: Colors.white70, fontSize: 11), maxLines: 2),
                ],
              ),
            ),
            GestureDetector(
              onTap: () => setState(() => _showAlertBanner = false),
              child: const Icon(Icons.close, color: Colors.white54, size: 18),
            ),
          ],
        ),
      ),
    );
  }

  // ─── AKSIYON BUTONLARI (Alt Bar) ───
  Widget _buildActionBar() {
    final actions = _crop.actions;
    return Container(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 16),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1B2A),
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.06))),
      ),
      child: Row(
        children: actions.map((action) {
          final canAfford = _plotState.walletBalance >= action.cost;
          return Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 3),
              child: GestureDetector(
                onTap: canAfford ? () => _performAction(action) : null,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    color: canAfford
                        ? _actionColor(action.type).withOpacity(0.12)
                        : Colors.white.withOpacity(0.03),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: canAfford
                          ? _actionColor(action.type).withOpacity(0.3)
                          : Colors.white.withOpacity(0.05),
                    ),
                  ),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(action.emoji, style: TextStyle(fontSize: 20, color: canAfford ? null : Colors.white24)),
                      const SizedBox(height: 3),
                      Text(
                        action.displayName.split(' ').first, // ilk kelime
                        style: TextStyle(
                          color: canAfford ? Colors.white70 : Colors.white24,
                          fontSize: 9, fontWeight: FontWeight.w700,
                        ),
                        maxLines: 1,
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${action.cost.toStringAsFixed(0)} TL',
                        style: TextStyle(
                          color: canAfford
                              ? _actionColor(action.type)
                              : Colors.white20,
                          fontSize: 10, fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Color _actionColor(FarmActionType type) {
    switch (type) {
      case FarmActionType.water: return const Color(0xFF3B82F6);
      case FarmActionType.fertilize: return const Color(0xFF8B5CF6);
      case FarmActionType.pestProtect: return const Color(0xFF10B981);
      case FarmActionType.frostProtect: return const Color(0xFF06B6D4);
      case FarmActionType.heatProtect: return const Color(0xFFF59E0B);
    }
  }
}
