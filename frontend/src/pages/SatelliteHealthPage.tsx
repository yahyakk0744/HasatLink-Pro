import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Satellite, MapPin, Scan, Loader2, Leaf, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, Sun, Droplets,
  Search, LocateFixed, Minus, Plus, Pencil, Trash2, RotateCcw,
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon as LeafletPolygon, Polyline, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import { useLocation } from '../contexts/LocationContext';
import { useSatellite, getHealthLabel } from '../hooks/useSatellite';
import type { NDVIDataPoint } from '../hooks/useSatellite';
import SEO from '../components/ui/SEO';

/* ─── Map Sub-components ─── */

function MapClickHandler({ onSelect, drawMode }: { onSelect: (lat: number, lng: number) => void; drawMode: boolean }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  // Change cursor in draw mode
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    container.style.cursor = drawMode ? 'crosshair' : '';
    return () => { container.style.cursor = ''; };
  }, [map, drawMode]);

  return null;
}

function FlyToPosition({ position, zoom }: { position: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, zoom || 15, { duration: 1.2 });
  }, [map, position, zoom]);
  return null;
}

function MapZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1">
      <button onClick={() => map.zoomIn()} className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
        <Plus size={16} className="text-gray-700" />
      </button>
      <button onClick={() => map.zoomOut()} className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all">
        <Minus size={16} className="text-gray-700" />
      </button>
    </div>
  );
}

/* ─── Result Sub-components ─── */

function NDVIBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value * 100));
  const color = value >= 0.6 ? '#059669' : value >= 0.4 ? '#2D6A4F' : value >= 0.25 ? '#D97706' : '#DC2626';
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[var(--text-secondary)] font-medium">{label}</span>
        <span className="font-bold" style={{ color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-[var(--bg-input)] rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function NDVIChart({ history }: { history: NDVIDataPoint[] }) {
  if (history.length < 2) return null;
  const maxVal = Math.max(...history.map(h => h.max), 1);
  const w = 100 / history.length;
  return (
    <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-[var(--accent-green)]" />
        <h3 className="text-[13px] font-semibold">NDVI Trend (30 Gun)</h3>
      </div>
      <div className="relative h-32">
        <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
          {[0.2, 0.4, 0.6, 0.8].map(v => (
            <line key={v} x1="0" x2="100" y1={40 - (v / maxVal) * 40} y2={40 - (v / maxVal) * 40} stroke="var(--border-default)" strokeWidth="0.3" strokeDasharray="2,2" />
          ))}
          <path
            d={`M0,40 ${history.map((h, i) => `L${i * w + w / 2},${40 - (h.mean / maxVal) * 38}`).join(' ')} L100,40 Z`}
            fill="url(#ndviGrad)" opacity="0.3"
          />
          <polyline
            points={history.map((h, i) => `${i * w + w / 2},${40 - (h.mean / maxVal) * 38}`).join(' ')}
            fill="none" stroke="#2D6A4F" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"
          />
          {history.map((h, i) => (
            <circle key={i} cx={i * w + w / 2} cy={40 - (h.mean / maxVal) * 38} r="1" fill="#2D6A4F" />
          ))}
          <defs>
            <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2D6A4F" />
              <stop offset="100%" stopColor="#2D6A4F" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex justify-between mt-1 text-[9px] text-[var(--text-tertiary)]">
        <span>{history[0]?.date}</span>
        <span>{history[history.length - 1]?.date}</span>
      </div>
    </div>
  );
}

function HealthCard({ status, color, ndvi }: { status: string; color: string; ndvi: NDVIDataPoint }) {
  const icon = status === 'excellent' || status === 'good'
    ? <CheckCircle size={28} />
    : status === 'moderate'
      ? <AlertTriangle size={28} />
      : <XCircle size={28} />;
  const recommendations: Record<string, string[]> = {
    excellent: ['Mevcut bakimi surdur', 'Hasat zamanlamas1 icin takip et'],
    good: ['Duzeni sulama devam etsin', 'Hafif gubre takviyesi dusun'],
    moderate: ['Sulama programini kontrol et', 'Toprak analizi yaptir', 'Gubre eksikligi olabilir'],
    poor: ['Acil sulama gerekli', 'Hastalik kontrolu yap', 'Ziraat muhendisine danisin'],
    critical: ['Acil mudahale gerekli', 'Hastalik veya kuraklik riski', 'Profesyonel destek al'],
  };
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: `${color}40` }}>
      <div className="p-5" style={{ background: `linear-gradient(135deg, ${color}08, ${color}15)` }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>{icon}</div>
          <div className="flex-1">
            <p className="text-[11px] text-[var(--text-secondary)] uppercase font-semibold tracking-wider">Tarla Sagligi</p>
            <p className="text-[22px] font-bold tracking-tight" style={{ color }}>{getHealthLabel(status)}</p>
            <p className="text-[12px] text-[var(--text-secondary)]">NDVI Ortalama: <span className="font-bold">{(ndvi.mean * 100).toFixed(1)}%</span></p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-2.5 bg-[var(--bg-surface)]">
        <NDVIBar value={ndvi.mean} label="Ortalama" />
        <NDVIBar value={ndvi.max} label="Maksimum" />
        <NDVIBar value={ndvi.min} label="Minimum" />
      </div>
      {recommendations[status] && (
        <div className="px-4 pb-4 bg-[var(--bg-surface)]">
          <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Oneriler</p>
          <div className="space-y-1.5">
            {recommendations[status].map((r, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-[12px] text-[var(--text-primary)]">{r}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Main Page ─── */

export default function SatelliteHealthPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const { location: geoLocation } = useLocation();
  const { analysis, loading, error, analyze, clear } = useSatellite();

  // Drawing state
  const [drawMode, setDrawMode] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [isPolygonClosed, setIsPolygonClosed] = useState(false);

  // Map state
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapType, setMapType] = useState<'satellite' | 'street'>('satellite');

  // Auth not required — anyone can analyze fields

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (!drawMode || isPolygonClosed) return;

    // If clicking near first point and have 3+ points, close the polygon
    if (polygonPoints.length >= 3) {
      const first = polygonPoints[0];
      const dist = Math.sqrt((lat - first[0]) ** 2 + (lng - first[1]) ** 2);
      if (dist < 0.0005) { // ~50m threshold
        setIsPolygonClosed(true);
        setDrawMode(false);
        return;
      }
    }

    setPolygonPoints(prev => [...prev, [lat, lng]]);
  }, [drawMode, isPolygonClosed, polygonPoints]);

  const handleStartDraw = () => {
    setDrawMode(true);
    setPolygonPoints([]);
    setIsPolygonClosed(false);
    clear();
  };

  const handleUndoPoint = () => {
    if (polygonPoints.length > 0) {
      setPolygonPoints(prev => prev.slice(0, -1));
      setIsPolygonClosed(false);
    }
  };

  const handleCloseDraw = () => {
    if (polygonPoints.length >= 3) {
      setIsPolygonClosed(true);
      setDrawMode(false);
    }
  };

  const handleClearDraw = () => {
    setPolygonPoints([]);
    setIsPolygonClosed(false);
    setDrawMode(false);
    clear();
  };

  const handleMyLocation = () => {
    if (geoLocation?.lat && geoLocation?.lng) {
      setFlyTarget([geoLocation.lat, geoLocation.lng]);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (p) => setFlyTarget([p.coords.latitude, p.coords.longitude]),
        () => {}
      );
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=tr`
      );
      const data = await res.json();
      if (data.length > 0) {
        setFlyTarget([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setSearchQuery(data[0].display_name.split(',').slice(0, 2).join(', '));
      }
    } catch {} finally { setSearching(false); }
  };

  const handleAnalyze = () => {
    if (!isPolygonClosed || polygonPoints.length < 3) return;
    // Convert [lat, lng] to [lng, lat] for GeoJSON/Agromonitoring
    const geoJsonCoords = polygonPoints.map(p => [p[1], p[0]]);
    // Center point
    const avgLat = polygonPoints.reduce((s, p) => s + p[0], 0) / polygonPoints.length;
    const avgLng = polygonPoints.reduce((s, p) => s + p[1], 0) / polygonPoints.length;
    analyze(avgLat, avgLng, 0.5, geoJsonCoords);
  };

  // Calculate polygon area in hectares (Shoelace formula)
  const calcArea = (): number => {
    if (polygonPoints.length < 3) return 0;
    const R = 6371000; // Earth radius in meters
    const toRad = (d: number) => d * Math.PI / 180;
    let area = 0;
    for (let i = 0; i < polygonPoints.length; i++) {
      const j = (i + 1) % polygonPoints.length;
      const lat1 = toRad(polygonPoints[i][0]);
      const lat2 = toRad(polygonPoints[j][0]);
      const dLng = toRad(polygonPoints[j][1] - polygonPoints[i][1]);
      area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    area = Math.abs(area * R * R / 2);
    return area / 10000; // hectares
  };

  const defaultCenter: [number, number] = geoLocation?.lat && geoLocation?.lng
    ? [geoLocation.lat, geoLocation.lng]
    : [39.0, 35.0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <SEO
        title={lang === 'tr' ? 'Uydu Tarla Analizi' : 'Satellite Field Analysis'}
        description="Sentinel-2 uydu verileriyle tarlanizin saglik durumunu analiz edin."
        keywords="uydu, NDVI, tarla sagligi, sentinel, tarim, parsel"
      />

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Satellite size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {lang === 'tr' ? 'Uydu Tarla Analizi' : 'Satellite Field Analysis'}
          </h1>
          <p className="text-[13px] text-[var(--text-secondary)]">
            {lang === 'tr' ? 'Tarlanizi haritada cizin, uydu analizi baslasin' : 'Draw your field on the map to start analysis'}
          </p>
        </div>
      </div>

      {/* Map Section */}
      <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] overflow-hidden mb-6">
        {/* Search Bar */}
        <div className="p-4 pb-3 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder={lang === 'tr' ? 'Sehir, ilce veya konum ara...' : 'Search location...'}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
              />
            </div>
            <button onClick={handleSearch} disabled={searching || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-[13px] font-medium flex items-center gap-1.5 hover:bg-indigo-600 transition-colors disabled:opacity-50">
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {lang === 'tr' ? 'Ara' : 'Search'}
            </button>
            <button onClick={handleMyLocation}
              className="px-3 py-2.5 rounded-xl bg-emerald-500 text-white flex items-center gap-1.5 hover:bg-emerald-600 transition-colors text-[13px] font-medium"
              title={lang === 'tr' ? 'Konumumu Kullan' : 'Use My Location'}>
              <LocateFixed size={16} />
              <span className="hidden sm:inline">{lang === 'tr' ? 'Konumum' : 'My Loc'}</span>
            </button>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="relative h-[400px] sm:h-[480px]">
          <MapContainer center={defaultCenter} zoom={geoLocation?.lat ? 14 : 6} className="w-full h-full z-0" scrollWheelZoom={true} zoomControl={false}>
            {mapType === 'satellite' ? (
              <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" maxZoom={19} />
            ) : (
              <TileLayer attribution='&copy; OpenStreetMap' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            )}
            {mapType === 'satellite' && (
              <TileLayer url="https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png" opacity={0.7} />
            )}
            <MapClickHandler onSelect={handleMapClick} drawMode={drawMode} />
            <FlyToPosition position={flyTarget} zoom={16} />
            <MapZoomControls />

            {/* Drawing points */}
            {polygonPoints.map((p, i) => (
              <CircleMarker key={i} center={p} radius={6}
                pathOptions={{
                  color: '#fff',
                  fillColor: i === 0 ? '#f59e0b' : '#6366f1',
                  fillOpacity: 1,
                  weight: 2,
                }}
              />
            ))}

            {/* Drawing line (while drawing) */}
            {polygonPoints.length >= 2 && !isPolygonClosed && (
              <Polyline positions={polygonPoints} pathOptions={{ color: '#f59e0b', weight: 2, dashArray: '6, 4' }} />
            )}

            {/* Completed polygon */}
            {isPolygonClosed && polygonPoints.length >= 3 && (
              <LeafletPolygon
                positions={polygonPoints}
                pathOptions={{ color: '#f59e0b', fillColor: '#f59e0b', fillOpacity: 0.2, weight: 3 }}
              />
            )}
          </MapContainer>

          {/* Map Type Toggle */}
          <div className="absolute top-3 right-3 z-[1000]">
            <button onClick={() => setMapType(t => t === 'satellite' ? 'street' : 'satellite')}
              className="bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-gray-200/50 text-[11px] font-semibold text-gray-700 hover:bg-white transition-colors flex items-center gap-1.5">
              {mapType === 'satellite' ? <><MapPin size={12} /> Harita</> : <><Satellite size={12} /> Uydu</>}
            </button>
          </div>

          {/* Drawing Status Badge */}
          <div className="absolute top-3 left-3 z-[1000]">
            {drawMode ? (
              <div className="bg-amber-500/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg text-white">
                <div className="flex items-center gap-2">
                  <Pencil size={14} className="animate-pulse" />
                  <span className="text-[12px] font-semibold">
                    {polygonPoints.length === 0
                      ? (lang === 'tr' ? 'Tarlanizin kosesine tiklayin' : 'Click a corner of your field')
                      : polygonPoints.length < 3
                        ? (lang === 'tr' ? `${polygonPoints.length} nokta — en az 3 gerekli` : `${polygonPoints.length} points — min 3 needed`)
                        : (lang === 'tr' ? `${polygonPoints.length} nokta — ilk noktaya tikla veya tamamla` : `${polygonPoints.length} pts — click first point or finish`)}
                  </span>
                </div>
              </div>
            ) : isPolygonClosed ? (
              <div className="bg-emerald-500/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg text-white">
                <div className="flex items-center gap-2">
                  <CheckCircle size={14} />
                  <span className="text-[12px] font-semibold">
                    {lang === 'tr' ? `Parsel secildi — ${calcArea().toFixed(2)} hektar` : `Parcel selected — ${calcArea().toFixed(2)} ha`}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Draw Controls + Analyze */}
        <div className="p-4 pt-3 space-y-3 border-t border-[var(--border-default)]">
          {/* Draw Toolbar */}
          <div className="flex gap-2">
            {!drawMode && !isPolygonClosed && (
              <button onClick={handleStartDraw}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors">
                <Pencil size={16} />
                {lang === 'tr' ? 'Tarlami Ciz' : 'Draw My Field'}
              </button>
            )}
            {drawMode && (
              <>
                <button onClick={handleCloseDraw} disabled={polygonPoints.length < 3}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-[13px] flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50">
                  <CheckCircle size={16} />
                  {lang === 'tr' ? 'Cizimi Tamamla' : 'Finish Drawing'}
                </button>
                <button onClick={handleUndoPoint} disabled={polygonPoints.length === 0}
                  className="px-4 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-medium text-[13px] flex items-center gap-1.5 hover:bg-gray-300 transition-colors disabled:opacity-50">
                  <RotateCcw size={14} />
                </button>
                <button onClick={handleClearDraw}
                  className="px-4 py-2.5 rounded-xl bg-red-100 text-red-600 font-medium text-[13px] flex items-center gap-1.5 hover:bg-red-200 transition-colors">
                  <Trash2 size={14} />
                </button>
              </>
            )}
            {isPolygonClosed && (
              <>
                <button onClick={handleAnalyze} disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50">
                  {loading ? (
                    <><Loader2 size={18} className="animate-spin" /> {lang === 'tr' ? 'Analiz Ediliyor...' : 'Analyzing...'}</>
                  ) : (
                    <><Scan size={18} /> {lang === 'tr' ? 'Tarlami Analiz Et' : 'Analyze My Field'}</>
                  )}
                </button>
                <button onClick={handleClearDraw}
                  className="px-4 py-2.5 rounded-xl bg-gray-200 text-gray-700 font-medium text-[13px] flex items-center gap-1.5 hover:bg-gray-300 transition-colors">
                  <Trash2 size={14} />
                  <span className="hidden sm:inline">{lang === 'tr' ? 'Sil' : 'Clear'}</span>
                </button>
              </>
            )}
          </div>

          {!drawMode && !isPolygonClosed && (
            <p className="text-[10px] text-[var(--text-tertiary)] text-center leading-relaxed">
              {lang === 'tr'
                ? 'Uydu goruntusu uzerinde tarlanizi gorun, "Tarlami Ciz" ile koselere tiklayarak sinirlarini belirleyin.'
                : 'See your field on satellite imagery, click "Draw My Field" and click the corners to define boundaries.'}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-2xl bg-red-50 border border-red-200/50 p-4 mb-6 flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <p className="text-[13px] text-red-700">{error}</p>
        </div>
      )}

      {/* Results */}
      {analysis && (
        <div className="space-y-4 animate-fade-in">
          {analysis.latestNDVI && (
            <HealthCard status={analysis.healthStatus} color={analysis.healthColor} ndvi={analysis.latestNDVI} />
          )}
          <NDVIChart history={analysis.ndviHistory} />

          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4">
            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">NDVI Renk Skalasi</p>
            <div className="flex rounded-xl overflow-hidden h-3">
              <div className="flex-1 bg-[#991B1B]" /><div className="flex-1 bg-[#DC2626]" /><div className="flex-1 bg-[#D97706]" /><div className="flex-1 bg-[#2D6A4F]" /><div className="flex-1 bg-[#059669]" />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] text-[var(--text-tertiary)]">
              <span>0% Kritik</span><span>25% Zayif</span><span>40% Orta</span><span>60% Saglikli</span><span>100% Mukemmel</span>
            </div>
          </div>

          {analysis.images.length > 0 && (
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sun size={16} className="text-amber-500" />
                <h3 className="text-[13px] font-semibold">{lang === 'tr' ? 'Uydu Goruntuleri' : 'Satellite Images'}</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {analysis.images.map((img, i) => (
                  <div key={i} className="space-y-2">
                    {img.trueColor && (
                      <div className="rounded-xl overflow-hidden border border-[var(--border-default)]">
                        <img src={img.trueColor} alt={`True Color ${img.date}`} className="w-full aspect-square object-cover" loading="lazy" />
                        <div className="px-2.5 py-1.5 bg-[var(--bg-input)]">
                          <p className="text-[10px] font-medium text-[var(--text-secondary)]">{img.date} - Gercek Renk</p>
                          <p className="text-[9px] text-[var(--text-tertiary)]">Bulut: %{(img.cloudCoverage * 100).toFixed(0)}</p>
                        </div>
                      </div>
                    )}
                    {img.ndvi && (
                      <div className="rounded-xl overflow-hidden border border-[var(--border-default)]">
                        <img src={img.ndvi} alt={`NDVI ${img.date}`} className="w-full aspect-square object-cover" loading="lazy" />
                        <div className="px-2.5 py-1.5 bg-[var(--bg-input)]">
                          <p className="text-[10px] font-medium text-[var(--text-secondary)]">{img.date} - NDVI</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200/50 p-3 text-center">
              <Leaf size={16} className="text-emerald-600 mx-auto mb-1" />
              <p className="text-[18px] font-bold text-emerald-700">{(analysis.area / 10000).toFixed(2)}</p>
              <p className="text-[9px] text-emerald-600 font-medium uppercase">Hektar</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-blue-200/50 p-3 text-center">
              <Droplets size={16} className="text-blue-600 mx-auto mb-1" />
              <p className="text-[18px] font-bold text-blue-700">{analysis.ndviHistory.length}</p>
              <p className="text-[9px] text-blue-600 font-medium uppercase">Veri Noktasi</p>
            </div>
            <div className="rounded-xl bg-violet-50 border border-violet-200/50 p-3 text-center">
              <Satellite size={16} className="text-violet-600 mx-auto mb-1" />
              <p className="text-[18px] font-bold text-violet-700">{analysis.images.length}</p>
              <p className="text-[9px] text-violet-600 font-medium uppercase">Goruntu</p>
            </div>
          </div>

          <button onClick={handleClearDraw}
            className="w-full py-2.5 rounded-xl border border-[var(--border-default)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors">
            {lang === 'tr' ? 'Yeni Analiz' : 'New Analysis'}
          </button>
        </div>
      )}
    </div>
  );
}
