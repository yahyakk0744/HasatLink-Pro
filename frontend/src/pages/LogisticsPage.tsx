import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Truck, MapPin, Calculator, Search, Clock, Tag,
  Navigation, MousePointerClick, Route as RouteIcon, Fuel, AlertCircle, Gauge, TrendingUp,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline as LeafletPolyline, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import api from '../config/api';
import SEO from '../components/ui/SEO';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import type { Listing } from '../types';

import 'leaflet/dist/leaflet.css';

// Fix default marker icon
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

const greenIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const redIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export default function LogisticsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCalc, setShowCalc] = useState(false);

  const fetchListings = () => {
    setLoading(true);
    const params: any = { type: 'lojistik' };
    if (search) params.search = search;
    api.get('/listings', { params })
      .then(({ data }) => setListings(data.listings || []))
      .catch(() => setListings([]))
      .finally(() => setLoading(false));
  };

  useEffect(fetchListings, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      <SEO
        title="Nakliyeci Rehberi - HasatLink"
        description="Tarım nakliyecileri, mesafe ve maliyet hesaplayıcı."
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Truck size={28} className="text-[#2D6A4F]" />
            Nakliyeci Rehberi
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Nakliyeci ilanları + mesafe/maliyet hesaplayıcı
          </p>
        </div>
        <button
          onClick={() => setShowCalc(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-2xl font-semibold text-sm hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Calculator size={16} />
          Mesafe Hesapla
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          type="text"
          placeholder="Nakliyeci veya ilan ara..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && fetchListings()}
          className="w-full pl-11 pr-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl text-sm focus:outline-none focus:border-[#2D6A4F]"
        />
      </div>

      {/* Listings */}
      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : listings.length === 0 ? (
        <div className="text-center py-16 bg-[var(--bg-surface)] rounded-2xl border border-[var(--border-default)]">
          <Truck size={40} className="mx-auto text-[var(--text-secondary)] mb-3 opacity-50" />
          <p className="font-semibold mb-1">Henüz nakliyeci ilanı yok</p>
          <p className="text-sm text-[var(--text-secondary)]">
            Lojistik kategorisinden ilan vererek burada görünebilirsiniz
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listings.map(l => (
            <a
              key={l._id}
              href={`/ilan/${l._id}`}
              className="block bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5 hover:border-[#2D6A4F]/30 hover:shadow-sm transition-all"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-base font-bold line-clamp-1">{l.title}</h3>
                {l.price > 0 && (
                  <span className="text-sm font-bold text-[#2D6A4F] whitespace-nowrap">
                    {l.price.toLocaleString('tr-TR')} ₺
                  </span>
                )}
              </div>
              {l.description && (
                <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3">{l.description}</p>
              )}
              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {l.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {new Date(l.createdAt).toLocaleDateString('tr-TR')}
                </span>
                {l.subCategory && (
                  <span className="flex items-center gap-1">
                    <Tag size={12} />
                    {l.subCategory}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Distance Calculator */}
      {showCalc && <DistanceCalcModal onClose={() => setShowCalc(false)} />}
    </div>
  );
}

/* ── Address Input with Nominatim autocomplete ── */
function AddressInput({ label, value, onChange, placeholder }: {
  label: string;
  value: string;
  onChange: (val: string, lat: number, lng: number) => void;
  placeholder: string;
}) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<{ display_name: string; lat: string; lon: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const searchAddress = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 3) { setSuggestions([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=tr&accept-language=tr`
        );
        const data = await res.json();
        setSuggestions(data);
        setOpen(data.length > 0);
      } catch { setSuggestions([]); }
      setSearching(false);
    }, 400);
  };

  // Allow external update (from map click)
  useEffect(() => { setQuery(value); }, [value]);

  return (
    <div className="relative">
      <p className="text-xs text-[var(--text-secondary)] mb-1">{label}</p>
      <div className="relative">
        <Navigation size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); searchAddress(e.target.value); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
        />
        {searching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[var(--text-tertiary)] border-t-transparent rounded-full animate-spin" />}
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-[1000] top-full mt-1 left-0 right-0 bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onMouseDown={() => {
                const name = s.display_name.split(',').slice(0, 3).join(',');
                setQuery(name);
                onChange(name, parseFloat(s.lat), parseFloat(s.lon));
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 text-[13px] hover:bg-[var(--bg-surface-hover)] transition-colors flex items-start gap-2 border-b border-[var(--border-default)] last:border-0"
            >
              <MapPin size={12} className="text-[var(--text-tertiary)] mt-0.5 shrink-0" />
              <span className="line-clamp-2">{s.display_name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Map click handler ── */
function MapClickHandler({ selecting, onSelect }: {
  selecting: 'from' | 'to' | null;
  onSelect: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      if (selecting) {
        onSelect(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

/* ── Real routing via OSRM (Open Source Routing Machine) ── */

type VehicleClass = 1 | 2 | 3;
// HGS tahmini (TL/km) — Turkiye otoyol ortalama tarife (2026 civari)
const TOLL_RATES: Record<VehicleClass, number> = {
  1: 0.55, // Binek otomobil
  2: 0.95, // Kamyonet / pikap
  3: 1.45, // Kamyon / tarim araci (2 dingil ustu)
};
const VEHICLE_LABELS: Record<VehicleClass, string> = {
  1: 'Otomobil',
  2: 'Kamyonet',
  3: 'Kamyon',
};

// Yakıt tüketimi tahmini (litre/100km)
const FUEL_CONSUMPTION: Record<VehicleClass, number> = {
  1: 7,
  2: 12,
  3: 28,
};
const DEFAULT_DIESEL_PRICE = 42; // TL/litre (kullanici degistirebilir)

// Turkiye otoyol referanslari (OSRM step.ref alaninda gelir: "O-1", "O 21", "TEM" vb.)
const TR_TOLL_REF_RE = /^\s*(O[-\s]?\d+|TEM|AOYM)\b/i;

interface RouteOption {
  idx: number;
  distanceKm: number;      // Gerçek yol km
  durationMin: number;     // Dakika
  tollKm: number;          // Otoyol üzerinde geçilen km
  estimatedToll: number;   // TL
  geometry: [number, number][]; // Leaflet [lat,lng] polyline
  label: string;           // "En hızlı", "Alternatif 1" vb.
}

async function fetchRoutes(from: [number, number], to: [number, number]): Promise<RouteOption[]> {
  // OSRM public API — ucretsiz, auth yok
  const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?alternatives=3&overview=full&steps=true&geometries=geojson&annotations=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Rota servisi yanit vermedi');
  const data = await res.json();
  if (data.code !== 'Ok' || !Array.isArray(data.routes) || data.routes.length === 0) {
    throw new Error(data.message || 'Bu noktalar arasinda rota bulunamadi');
  }
  return data.routes.map((route: any, idx: number): RouteOption => {
    // Otoban km'sini adim adim hesapla
    let tollMeters = 0;
    for (const leg of route.legs || []) {
      for (const step of leg.steps || []) {
        const ref = step.ref || '';
        if (TR_TOLL_REF_RE.test(ref)) {
          tollMeters += step.distance || 0;
        }
      }
    }
    const geometry: [number, number][] = (route.geometry?.coordinates || []).map(
      (c: [number, number]) => [c[1], c[0]]
    );
    return {
      idx,
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
      tollKm: tollMeters / 1000,
      estimatedToll: 0, // aşağıda hesaplanir
      geometry,
      label: idx === 0 ? 'En Hizli' : `Alternatif ${idx}`,
    };
  });
}

function formatDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  if (h === 0) return `${m} dk`;
  return `${h} sa ${m} dk`;
}

/* ── Rota cizimi: harita bounds'i otomatik ayarla ── */
function FitBoundsToRoute({ geometry }: { geometry: [number, number][] | null }) {
  const map = useMap();
  useEffect(() => {
    if (!geometry || geometry.length < 2) return;
    const bounds = L.latLngBounds(geometry.map(([lat, lng]) => [lat, lng] as [number, number]));
    map.fitBounds(bounds, { padding: [30, 30] });
  }, [map, geometry]);
  return null;
}

/* ── Distance Calculator Modal ── */
function DistanceCalcModal({ onClose }: { onClose: () => void }) {
  const [coords, setCoords] = useState({ fromLat: 0, fromLng: 0, toLat: 0, toLng: 0 });
  const [fromLabel, setFromLabel] = useState('');
  const [toLabel, setToLabel] = useState('');
  const [pricePerKm, setPricePerKm] = useState('25');
  const [dieselPrice, setDieselPrice] = useState(String(DEFAULT_DIESEL_PRICE));
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>(3); // Varsayılan: kamyon (tarım)
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [selectedRouteIdx, setSelectedRouteIdx] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'search' | 'map'>('search');
  const [selecting, setSelecting] = useState<'from' | 'to' | null>(null);
  const [geocoding, setGeocoding] = useState(false);

  const canCalc = coords.fromLat !== 0 && coords.toLat !== 0;

  const fromPos = useMemo(
    () => (coords.fromLat ? [coords.fromLat, coords.fromLng] as [number, number] : null),
    [coords.fromLat, coords.fromLng]
  );
  const toPos = useMemo(
    () => (coords.toLat ? [coords.toLat, coords.toLng] as [number, number] : null),
    [coords.toLat, coords.toLng]
  );

  // Secili rota + HGS + yakit hesaplari (vehicleClass / dieselPrice / pricePerKm'ye reaktif)
  const routesWithCosts = useMemo(() => {
    const tollRate = TOLL_RATES[vehicleClass];
    const fuelPerKm = (FUEL_CONSUMPTION[vehicleClass] / 100) * (parseFloat(dieselPrice) || DEFAULT_DIESEL_PRICE);
    const laborPerKm = parseFloat(pricePerKm) || 0;
    return routes.map(r => {
      const toll = Math.round(r.tollKm * tollRate);
      const fuel = Math.round(r.distanceKm * fuelPerKm);
      const labor = Math.round(r.distanceKm * laborPerKm);
      return { ...r, estimatedToll: toll, fuelCost: fuel, laborCost: labor, totalCost: toll + fuel + labor };
    });
  }, [routes, vehicleClass, dieselPrice, pricePerKm]);

  const selectedRoute = routesWithCosts[selectedRouteIdx] || null;

  // Reverse geocode a latlng to address name
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=tr`
      );
      const data = await res.json();
      if (data.display_name) {
        return data.display_name.split(',').slice(0, 3).join(',');
      }
    } catch {}
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  };

  const handleMapClick = async (lat: number, lng: number) => {
    setGeocoding(true);
    const name = await reverseGeocode(lat, lng);
    if (selecting === 'from') {
      setCoords(c => ({ ...c, fromLat: lat, fromLng: lng }));
      setFromLabel(name);
      setSelecting('to');
    } else if (selecting === 'to') {
      setCoords(c => ({ ...c, toLat: lat, toLng: lng }));
      setToLabel(name);
      setSelecting(null);
    }
    setGeocoding(false);
  };

  // Koordinatlar değişince rotaları temizle (tekrar hesaplama gerek)
  useEffect(() => { setRoutes([]); setError(null); setSelectedRouteIdx(0); }, [coords]);

  const calculate = async () => {
    if (!canCalc) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchRoutes(
        [coords.fromLat, coords.fromLng],
        [coords.toLat, coords.toLng]
      );
      setRoutes(result);
      setSelectedRouteIdx(0);
    } catch (e: any) {
      setError(e.message || 'Rota alinamadi');
      setRoutes([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-[var(--bg-surface)] rounded-2xl p-6 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-1 flex items-center gap-2">
          <Calculator size={20} className="text-amber-500" />
          Mesafe ve Maliyet Hesaplayıcı
        </h2>
        <p className="text-[11px] text-[var(--text-secondary)] mb-4 flex items-center gap-1">
          <RouteIcon size={11} /> Gerçek yol rotası · HGS tahmini · Çoklu alternatif
        </p>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setMode('search'); setSelecting(null); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              mode === 'search'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
            }`}
          >
            <Search size={14} />
            Adres Ara
          </button>
          <button
            onClick={() => { setMode('map'); setSelecting('from'); }}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
              mode === 'map'
                ? 'bg-[#2D6A4F] text-white'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
            }`}
          >
            <MousePointerClick size={14} />
            Haritadan Seç
          </button>
        </div>

        {mode === 'search' ? (
          <div className="space-y-3 mb-4">
            <AddressInput
              label="Nereden"
              value={fromLabel}
              onChange={(name, lat, lng) => { setFromLabel(name); setCoords(c => ({ ...c, fromLat: lat, fromLng: lng })); }}
              placeholder="Şehir veya adres yazın..."
            />
            <AddressInput
              label="Nereye"
              value={toLabel}
              onChange={(name, lat, lng) => { setToLabel(name); setCoords(c => ({ ...c, toLat: lat, toLng: lng })); }}
              placeholder="Şehir veya adres yazın..."
            />
          </div>
        ) : (
          <div className="mb-4">
            {/* Map selection info */}
            <div className={`mb-2 px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 ${
              geocoding
                ? 'bg-amber-500/10 text-amber-600'
                : selecting === 'from'
                  ? 'bg-green-500/10 text-green-600'
                  : selecting === 'to'
                    ? 'bg-red-500/10 text-red-600'
                    : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'
            }`}>
              <MousePointerClick size={14} />
              {geocoding
                ? 'Adres alınıyor...'
                : selecting === 'from'
                  ? 'Haritada NEREDEN noktasını seçin (yeşil)'
                  : selecting === 'to'
                    ? 'Haritada NEREYE noktasını seçin (kırmızı)'
                    : 'Her iki nokta seçildi'
              }
            </div>

            {/* Leaflet Map */}
            <div className="h-64 rounded-xl overflow-hidden border border-[var(--border-default)]">
              <MapContainer
                center={[39.0, 35.0]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                attributionControl={false}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <MapClickHandler selecting={selecting} onSelect={handleMapClick} />
                {fromPos && <Marker position={fromPos} icon={greenIcon} />}
                {toPos && <Marker position={toPos} icon={redIcon} />}
                {/* Tüm alternatif rotalari cizgi olarak ciz — seçilmis rota vurgulu */}
                {routesWithCosts.map((r, i) => (
                  <LeafletPolyline
                    key={r.idx}
                    positions={r.geometry}
                    pathOptions={{
                      color: i === selectedRouteIdx ? '#2D6A4F' : '#9CA3AF',
                      weight: i === selectedRouteIdx ? 5 : 3,
                      opacity: i === selectedRouteIdx ? 0.95 : 0.5,
                      dashArray: i === selectedRouteIdx ? undefined : '6,6',
                    }}
                    eventHandlers={{ click: () => setSelectedRouteIdx(i) }}
                  />
                ))}
                {selectedRoute && <FitBoundsToRoute geometry={selectedRoute.geometry} />}
              </MapContainer>
            </div>

            {/* Selected locations display */}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setSelecting('from')}
                className={`flex-1 text-left px-3 py-2 rounded-xl text-xs border transition-colors ${
                  selecting === 'from' ? 'border-green-500 bg-green-500/5' : 'border-[var(--border-default)]'
                }`}
              >
                <span className="text-green-600 font-semibold">Nereden: </span>
                {fromLabel || <span className="text-[var(--text-tertiary)]">Seçilmedi</span>}
              </button>
              <button
                onClick={() => setSelecting('to')}
                className={`flex-1 text-left px-3 py-2 rounded-xl text-xs border transition-colors ${
                  selecting === 'to' ? 'border-red-500 bg-red-500/5' : 'border-[var(--border-default)]'
                }`}
              >
                <span className="text-red-600 font-semibold">Nereye: </span>
                {toLabel || <span className="text-[var(--text-tertiary)]">Seçilmedi</span>}
              </button>
            </div>
          </div>
        )}

        {/* Vehicle Class + Diesel Price + Labor Price */}
        <div className="mb-4 p-3 bg-[var(--bg-input)]/50 rounded-2xl border border-[var(--border-default)]">
          <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
            <Gauge size={12} /> Araç ve Maliyet Girdileri
          </p>

          {/* Vehicle class chips */}
          <div className="flex gap-1.5 mb-3">
            {([1, 2, 3] as VehicleClass[]).map(cls => (
              <button
                key={cls}
                onClick={() => setVehicleClass(cls)}
                className={`flex-1 px-2 py-2 rounded-xl text-[11px] font-semibold transition-all ${
                  vehicleClass === cls
                    ? 'bg-[#2D6A4F] text-white shadow-sm'
                    : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-default)]'
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Truck size={11} />
                  Sınıf {cls}
                </div>
                <div className="text-[9px] opacity-80 mt-0.5">{VEHICLE_LABELS[cls]}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Motorin (₺/L)
              </label>
              <input
                type="number"
                step="0.1"
                value={dieselPrice}
                onChange={e => setDieselPrice(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[var(--bg-surface)] rounded-xl text-sm border border-[var(--border-default)] focus:outline-none focus:border-[#2D6A4F]"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                Nakliye (₺/km)
              </label>
              <input
                type="number"
                value={pricePerKm}
                onChange={e => setPricePerKm(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-[var(--bg-surface)] rounded-xl text-sm border border-[var(--border-default)] focus:outline-none focus:border-[#2D6A4F]"
              />
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Route alternatives */}
        {routesWithCosts.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2 flex items-center gap-1">
              <RouteIcon size={12} /> Rota Seçenekleri ({routesWithCosts.length})
            </p>
            <div className="space-y-2">
              {routesWithCosts.map((r, i) => {
                const isSelected = i === selectedRouteIdx;
                return (
                  <button
                    key={r.idx}
                    onClick={() => setSelectedRouteIdx(i)}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      isSelected
                        ? 'border-[#2D6A4F] bg-[#2D6A4F]/5'
                        : 'border-[var(--border-default)] hover:border-[#2D6A4F]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[12px] font-bold ${isSelected ? 'text-[#2D6A4F]' : 'text-[var(--text-primary)]'}`}>
                        {i === 0 && <TrendingUp size={11} className="inline mr-1" />}
                        {r.label}
                      </span>
                      <span className="text-[11px] font-bold text-amber-600">
                        {r.totalCost.toLocaleString('tr-TR')} ₺
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-[var(--text-secondary)] flex-wrap">
                      <span className="flex items-center gap-1">
                        <RouteIcon size={10} />
                        <b>{Math.round(r.distanceKm)}</b> km
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatDuration(r.durationMin)}
                      </span>
                      {r.tollKm > 1 && (
                        <span className="flex items-center gap-1 text-purple-600">
                          <Navigation size={10} />
                          <b>{Math.round(r.tollKm)}</b> km otoyol
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected route breakdown */}
        {selectedRoute && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
              Maliyet Dökümü ({selectedRoute.label})
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-green-500/10 rounded-xl">
                <div className="flex items-center gap-1 text-[10px] uppercase text-green-700 font-semibold tracking-wider">
                  <RouteIcon size={10} /> Mesafe
                </div>
                <p className="text-xl font-bold text-green-600 mt-0.5">
                  {Math.round(selectedRoute.distanceKm)} km
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">
                  {formatDuration(selectedRoute.durationMin)} · gerçek yol
                </p>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-xl">
                <div className="flex items-center gap-1 text-[10px] uppercase text-purple-700 font-semibold tracking-wider">
                  <Navigation size={10} /> HGS Otoyol
                </div>
                <p className="text-xl font-bold text-purple-600 mt-0.5">
                  {selectedRoute.estimatedToll.toLocaleString('tr-TR')} ₺
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">
                  {Math.round(selectedRoute.tollKm)} km × {TOLL_RATES[vehicleClass]} ₺/km
                </p>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <div className="flex items-center gap-1 text-[10px] uppercase text-orange-700 font-semibold tracking-wider">
                  <Fuel size={10} /> Yakıt
                </div>
                <p className="text-xl font-bold text-orange-600 mt-0.5">
                  {selectedRoute.fuelCost.toLocaleString('tr-TR')} ₺
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">
                  {FUEL_CONSUMPTION[vehicleClass]} L/100km × {dieselPrice} ₺
                </p>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl">
                <div className="flex items-center gap-1 text-[10px] uppercase text-amber-700 font-semibold tracking-wider">
                  <Calculator size={10} /> Toplam
                </div>
                <p className="text-xl font-bold text-amber-600 mt-0.5">
                  {selectedRoute.totalCost.toLocaleString('tr-TR')} ₺
                </p>
                <p className="text-[9px] text-[var(--text-tertiary)]">
                  HGS + yakıt + nakliye
                </p>
              </div>
            </div>
            <p className="text-[9px] text-[var(--text-tertiary)] mt-2 italic">
              * HGS ve yakıt tahminidir. Gerçek maliyet araç, yük ve güncel tarifeye göre değişebilir.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            Kapat
          </button>
          <button
            onClick={calculate}
            disabled={!canCalc || loading}
            className="flex-1 px-4 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Rota aranıyor...
              </>
            ) : (
              <>
                <RouteIcon size={14} />
                Gerçek Rotayı Hesapla
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
