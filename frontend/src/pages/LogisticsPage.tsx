import { useEffect, useState, useRef, useMemo } from 'react';
import {
  Truck, MapPin, Calculator, Search, Clock, Tag,
  Navigation, MousePointerClick,
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
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

/* ── Distance Calculator Modal ── */
function DistanceCalcModal({ onClose }: { onClose: () => void }) {
  const [coords, setCoords] = useState({ fromLat: 0, fromLng: 0, toLat: 0, toLng: 0 });
  const [fromLabel, setFromLabel] = useState('');
  const [toLabel, setToLabel] = useState('');
  const [pricePerKm, setPricePerKm] = useState('25');
  const [result, setResult] = useState<{ distanceKm: number; estimatedPrice: number } | null>(null);
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

  const calculate = () => {
    if (!canCalc) return;
    // Haversine formula — client-side, no backend needed
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(coords.toLat - coords.fromLat);
    const dLng = toRad(coords.toLng - coords.fromLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(coords.fromLat)) * Math.cos(toRad(coords.toLat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = Math.round(R * c);
    const price = parseFloat(pricePerKm) || 25;
    setResult({ distanceKm, estimatedPrice: distanceKm * price });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-[var(--bg-surface)] rounded-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calculator size={20} className="text-amber-500" />
          Mesafe ve Maliyet Hesaplayıcı
        </h2>

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
            Haritadan Sec
          </button>
        </div>

        {mode === 'search' ? (
          <div className="space-y-3 mb-4">
            <AddressInput
              label="Nereden"
              value={fromLabel}
              onChange={(name, lat, lng) => { setFromLabel(name); setCoords(c => ({ ...c, fromLat: lat, fromLng: lng })); }}
              placeholder="Sehir veya adres yazin..."
            />
            <AddressInput
              label="Nereye"
              value={toLabel}
              onChange={(name, lat, lng) => { setToLabel(name); setCoords(c => ({ ...c, toLat: lat, toLng: lng })); }}
              placeholder="Sehir veya adres yazin..."
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
                ? 'Adres aliniyor...'
                : selecting === 'from'
                  ? 'Haritada NEREDEN noktasini secin (yesil)'
                  : selecting === 'to'
                    ? 'Haritada NEREYE noktasini secin (kirmizi)'
                    : 'Her iki nokta secildi'
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
                {fromLabel || <span className="text-[var(--text-tertiary)]">Secilmedi</span>}
              </button>
              <button
                onClick={() => setSelecting('to')}
                className={`flex-1 text-left px-3 py-2 rounded-xl text-xs border transition-colors ${
                  selecting === 'to' ? 'border-red-500 bg-red-500/5' : 'border-[var(--border-default)]'
                }`}
              >
                <span className="text-red-600 font-semibold">Nereye: </span>
                {toLabel || <span className="text-[var(--text-tertiary)]">Secilmedi</span>}
              </button>
            </div>
          </div>
        )}

        {/* Price per km */}
        <div className="mb-4">
          <p className="text-xs text-[var(--text-secondary)] mb-1">Fiyat (₺/km)</p>
          <input
            type="number"
            placeholder="25"
            value={pricePerKm}
            onChange={e => setPricePerKm(e.target.value)}
            className="w-full px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30"
          />
        </div>

        {/* Result */}
        {result && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 bg-green-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-green-600">{result.distanceKm} km</p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">Mesafe</p>
            </div>
            <div className="p-4 bg-amber-500/10 rounded-xl text-center">
              <p className="text-2xl font-bold text-amber-600">{result.estimatedPrice.toLocaleString('tr-TR')} ₺</p>
              <p className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mt-1">Tahmini Maliyet</p>
            </div>
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
            disabled={!canCalc}
            className="flex-1 px-4 py-3 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] transition-colors disabled:opacity-50"
          >
            Hesapla
          </button>
        </div>
      </div>
    </div>
  );
}
