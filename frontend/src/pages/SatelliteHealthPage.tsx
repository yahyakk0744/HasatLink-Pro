import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import {
  Satellite, MapPin, Scan, Loader2, Leaf, TrendingUp,
  AlertTriangle, CheckCircle, XCircle, Sun, Droplets,
  Crosshair, Search, LocateFixed, Minus, Plus,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from '../contexts/LocationContext';
import { useSatellite, getHealthLabel } from '../hooks/useSatellite';
import type { NDVIDataPoint } from '../hooks/useSatellite';
import SEO from '../components/ui/SEO';

// Custom pin icon for the marker
const pinIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

/* ─── Harita İçi Bileşenler ─── */

function MapClickHandler({ onSelect }: { onSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function FlyToPosition({ position, zoom }: { position: [number, number] | null; zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom || 15, { duration: 1.2 });
    }
  }, [map, position, zoom]);
  return null;
}

function MapZoomControls() {
  const map = useMap();
  return (
    <div className="absolute bottom-3 right-3 z-[1000] flex flex-col gap-1">
      <button
        onClick={() => map.zoomIn()}
        className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
      >
        <Plus size={16} className="text-gray-700" />
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-9 h-9 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
      >
        <Minus size={16} className="text-gray-700" />
      </button>
    </div>
  );
}

/* ─── Alt Bileşenler ─── */

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
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${color}20`, color }}>
            {icon}
          </div>
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

/* ─── Ana Sayfa ─── */

export default function SatelliteHealthPage() {
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith('tr') ? 'tr' : 'en';
  const { user } = useAuth();
  const { location: geoLocation } = useLocation();
  const { analysis, loading, error, analyze, clear } = useSatellite();

  const [selectedPos, setSelectedPos] = useState<[number, number] | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [radius, setRadius] = useState('0.5');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const radiusMeters = parseFloat(radius) * 1000;

  if (!user) return <Navigate to="/giris" replace />;

  const handleMapSelect = useCallback((lat: number, lng: number) => {
    setSelectedPos([lat, lng]);
  }, []);

  const handleMyLocation = () => {
    if (geoLocation?.lat && geoLocation?.lng) {
      const pos: [number, number] = [geoLocation.lat, geoLocation.lng];
      setSelectedPos(pos);
      setFlyTarget(pos);
    } else {
      navigator.geolocation?.getCurrentPosition(
        (p) => {
          const pos: [number, number] = [p.coords.latitude, p.coords.longitude];
          setSelectedPos(pos);
          setFlyTarget(pos);
        },
        () => {}
      );
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      // Nominatim (OpenStreetMap) geocoding — free, no API key
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&countrycodes=tr`
      );
      const data = await res.json();
      if (data.length > 0) {
        const pos: [number, number] = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        setSelectedPos(pos);
        setFlyTarget(pos);
        setSearchQuery(data[0].display_name.split(',').slice(0, 2).join(', '));
      }
    } catch {
      // Geocoding failed silently
    } finally {
      setSearching(false);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleAnalyze = () => {
    if (!selectedPos) return;
    analyze(selectedPos[0], selectedPos[1], parseFloat(radius));
  };

  const defaultCenter: [number, number] = geoLocation?.lat && geoLocation?.lng
    ? [geoLocation.lat, geoLocation.lng]
    : [39.0, 35.0];

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 animate-fade-in">
      <SEO
        title={lang === 'tr' ? 'Uydu Tarla Analizi' : 'Satellite Field Analysis'}
        description="Sentinel-2 uydu verileriyle tarlanizin saglik durumunu analiz edin."
        keywords="uydu, NDVI, tarla sagligi, sentinel, tarim, bitki indeksi, parsel sorgulama"
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
            {lang === 'tr' ? 'Haritadan tarlanizi secin, uydu analizi baslat' : 'Select your field on the map, start satellite analysis'}
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
                onKeyDown={handleSearchKeyDown}
                placeholder={lang === 'tr' ? 'Sehir, ilce veya konum ara...' : 'Search city, district or location...'}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-[13px] font-medium flex items-center gap-1.5 hover:bg-indigo-600 transition-colors disabled:opacity-50"
            >
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              {lang === 'tr' ? 'Ara' : 'Search'}
            </button>
            <button
              onClick={handleMyLocation}
              className="px-3 py-2.5 rounded-xl bg-emerald-500 text-white flex items-center gap-1.5 hover:bg-emerald-600 transition-colors text-[13px] font-medium"
              title={lang === 'tr' ? 'Konumumu Kullan' : 'Use My Location'}
            >
              <LocateFixed size={16} />
              <span className="hidden sm:inline">{lang === 'tr' ? 'Konumum' : 'My Location'}</span>
            </button>
          </div>

          {/* Instructions */}
          <div className="flex items-center gap-2 px-1">
            <Crosshair size={14} className="text-indigo-500 shrink-0" />
            <p className="text-[11px] text-[var(--text-secondary)]">
              {lang === 'tr'
                ? 'Haritaya tiklayarak veya arama yaparak tarlanizin konumunu secin'
                : 'Click on the map or search to select your field location'}
            </p>
          </div>
        </div>

        {/* Interactive Map */}
        <div className="relative h-[350px] sm:h-[420px]">
          <MapContainer
            center={defaultCenter}
            zoom={geoLocation?.lat ? 12 : 6}
            className="w-full h-full z-0"
            scrollWheelZoom={true}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler onSelect={handleMapSelect} />
            <FlyToPosition position={flyTarget} zoom={15} />
            <MapZoomControls />
            {selectedPos && (
              <>
                <Marker position={selectedPos} icon={pinIcon} />
                <Circle
                  center={selectedPos}
                  radius={radiusMeters}
                  pathOptions={{
                    color: '#6366f1',
                    fillColor: '#6366f1',
                    fillOpacity: 0.1,
                    weight: 2,
                    dashArray: '8, 4',
                  }}
                />
              </>
            )}
          </MapContainer>

          {/* Selected Location Badge */}
          {selectedPos && (
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm rounded-xl px-3 py-2 shadow-lg border border-gray-200/50">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-indigo-500" />
                <span className="text-[12px] font-medium text-gray-700">
                  {selectedPos[0].toFixed(5)}, {selectedPos[1].toFixed(5)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Radius + Analyze Button */}
        <div className="p-4 pt-3 space-y-3 border-t border-[var(--border-default)]">
          {/* Radius Selector - Visual Chips */}
          <div>
            <label className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-2 block">
              {lang === 'tr' ? 'Tarama Yaricapi' : 'Scan Radius'}
            </label>
            <div className="flex gap-2">
              {[
                { value: '0.25', label: '250m', desc: lang === 'tr' ? 'Kucuk Tarla' : 'Small Field' },
                { value: '0.5', label: '500m', desc: lang === 'tr' ? 'Orta Tarla' : 'Medium Field' },
                { value: '1', label: '1 km', desc: lang === 'tr' ? 'Buyuk Tarla' : 'Large Field' },
                { value: '2', label: '2 km', desc: lang === 'tr' ? 'Ciftlik' : 'Farm' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRadius(opt.value)}
                  className={`flex-1 py-2 px-2 rounded-xl text-center transition-all ${
                    radius === opt.value
                      ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-[var(--bg-input)] border border-[var(--border-default)] text-[var(--text-secondary)] hover:border-indigo-300'
                  }`}
                >
                  <p className={`text-[13px] font-bold ${radius === opt.value ? 'text-white' : 'text-[var(--text-primary)]'}`}>
                    {opt.label}
                  </p>
                  <p className={`text-[9px] ${radius === opt.value ? 'text-indigo-100' : 'text-[var(--text-tertiary)]'}`}>
                    {opt.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedPos}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-600 text-white font-semibold text-[14px] flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {lang === 'tr' ? 'Uydu Verisi Aliniyor...' : 'Fetching Satellite Data...'}
              </>
            ) : !selectedPos ? (
              <>
                <MapPin size={18} />
                {lang === 'tr' ? 'Once haritadan konum secin' : 'First select a location on the map'}
              </>
            ) : (
              <>
                <Scan size={18} />
                {lang === 'tr' ? 'Tarlami Analiz Et' : 'Analyze My Field'}
              </>
            )}
          </button>

          {/* Info text */}
          <p className="text-[10px] text-[var(--text-tertiary)] text-center leading-relaxed">
            {lang === 'tr'
              ? 'Sentinel-2 uydu goruntuleri kullanilarak NDVI bitki sagligi indeksi hesaplanir. Son 30 gunluk veri analiz edilir.'
              : 'NDVI vegetation health index is calculated using Sentinel-2 satellite imagery. Last 30 days of data is analyzed.'}
          </p>
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
          {/* Health Card */}
          {analysis.latestNDVI && (
            <HealthCard
              status={analysis.healthStatus}
              color={analysis.healthColor}
              ndvi={analysis.latestNDVI}
            />
          )}

          {/* NDVI Trend Chart */}
          <NDVIChart history={analysis.ndviHistory} />

          {/* NDVI Color Legend */}
          <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4">
            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider mb-3">NDVI Renk Skalasi</p>
            <div className="flex rounded-xl overflow-hidden h-3">
              <div className="flex-1 bg-[#991B1B]" />
              <div className="flex-1 bg-[#DC2626]" />
              <div className="flex-1 bg-[#D97706]" />
              <div className="flex-1 bg-[#2D6A4F]" />
              <div className="flex-1 bg-[#059669]" />
            </div>
            <div className="flex justify-between mt-1.5 text-[9px] text-[var(--text-tertiary)]">
              <span>0% Kritik</span>
              <span>25% Zayif</span>
              <span>40% Orta</span>
              <span>60% Saglikli</span>
              <span>100% Mukemmel</span>
            </div>
          </div>

          {/* Satellite Images */}
          {analysis.images.length > 0 && (
            <div className="rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sun size={16} className="text-amber-500" />
                <h3 className="text-[13px] font-semibold">
                  {lang === 'tr' ? 'Uydu Goruntuleri' : 'Satellite Images'}
                </h3>
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

          {/* Quick Info Cards */}
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

          {/* Clear button */}
          <button
            onClick={clear}
            className="w-full py-2.5 rounded-xl border border-[var(--border-default)] text-[13px] font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            {lang === 'tr' ? 'Yeni Analiz' : 'New Analysis'}
          </button>
        </div>
      )}
    </div>
  );
}
