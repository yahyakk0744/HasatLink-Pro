import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Sprout, MapPin, Users, TrendingUp, Package, AlertTriangle, Save, Search, X, UserPlus } from 'lucide-react';
import api from '../config/api';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import toast from 'react-hot-toast';

interface FarmRegion {
  _id: string;
  region_id: string;
  region_name: string;
  city_name: string;
  district: string;
  total_area_m2: number;
  rented_area_m2: number;
  available_area_m2: number;
  available_percent: number;
  crop_types: string[];
  is_active: boolean;
}

interface FarmStats {
  totalRegions: number;
  activeRegions: number;
  totalArea: number;
  rentedArea: number;
  activePlots: number;
  totalRevenue: number;
  activeUsers: number;
  pendingHarvests: number;
}

export default function AdminDigitalFarmPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<FarmStats | null>(null);
  const [regions, setRegions] = useState<FarmRegion[]>([]);
  const [tab, setTab] = useState<'overview' | 'regions' | 'settings'>('overview');

  // Settings state
  const [enabled, setEnabled] = useState(false);
  const [betaMode, setBetaMode] = useState(false);
  const [whitelistIds, setWhitelistIds] = useState<string[]>([]);
  const [activeCities, setActiveCities] = useState('');

  // User search for whitelist
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, regionsRes, settingsRes] = await Promise.all([
        api.get('/farm/admin/dashboard').catch(() => ({ data: null })),
        api.get('/farm/regions').catch(() => ({ data: { regions: [] } })),
        api.get('/farm/settings').catch(() => ({ data: null })),
      ]);
      if (statsRes.data) setStats(statsRes.data);
      if (regionsRes.data?.regions) setRegions(regionsRes.data.regions);
      if (settingsRes.data) {
        setEnabled(settingsRes.data.enabled ?? false);
        setBetaMode(settingsRes.data.beta_mode ?? false);
        setWhitelistIds(settingsRes.data.whitelist_user_ids || []);
        setActiveCities((settingsRes.data.active_cities || []).map((c: any) => c.city_name).join(', '));
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      const res = await api.put('/farm/admin/settings', {
        enabled,
        beta_mode: betaMode,
        whitelist_user_ids: whitelistIds,
        active_cities: activeCities.split(',').map(s => s.trim()).filter(Boolean).map(name => ({
          city_name: name,
          activated_at: new Date().toISOString(),
        })),
      });
      console.log('Settings saved:', res.data);
      toast.success('Dijital Tarla ayarları güncellendi');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Ayarlar güncellenemedi';
      console.error('Settings save error:', err.response?.status, msg);
      toast.error(msg);
    }
  };

  // Toggle değişince otomatik kaydet
  const quickToggle = async (field: string, value: boolean) => {
    try {
      await api.put('/farm/admin/settings', { [field]: value });
      toast.success(field === 'enabled' ? (value ? 'Modül aktif edildi' : 'Modül kapatıldı') : 'Güncellendi');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Güncelleme başarısız');
    }
  };

  const searchUsers = async (query: string) => {
    setUserSearch(query);
    if (query.length < 2) { setUserResults([]); return; }
    setSearchingUsers(true);
    try {
      // Admin kullanici listesinden ara
      const { data } = await api.get('/admin/users', { params: { search: query, limit: 10 } });
      setUserResults((data.users || data || []).filter((u: any) => !whitelistIds.includes(u.userId)));
    } catch {
      setUserResults([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const addToWhitelist = (userId: string) => {
    if (!whitelistIds.includes(userId)) {
      setWhitelistIds([...whitelistIds, userId]);
    }
    setUserSearch('');
    setUserResults([]);
  };

  const removeFromWhitelist = (userId: string) => {
    setWhitelistIds(whitelistIds.filter(id => id !== userId));
  };

  if (loading) return <AdminLayout title="Dijital Tarla"><LoadingSpinner size="lg" className="py-20" /></AdminLayout>;

  return (
    <AdminLayout title="Dijital Tarla" icon={<Sprout size={22} />}>
      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {(['overview', 'regions', 'settings'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors ${tab === t ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'}`}>
            {t === 'overview' ? 'Genel Bakis' : t === 'regions' ? 'Bolgeler' : 'Ayarlar'}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={<MapPin size={18} />} label="Aktif Bolge" value={stats?.activeRegions ?? 0} color="#2D6A4F" />
            <StatCard icon={<Package size={18} />} label="Aktif Parsel" value={stats?.activePlots ?? 0} color="#3B82F6" />
            <StatCard icon={<Users size={18} />} label="Aktif Kullanici" value={stats?.activeUsers ?? 0} color="#8B5CF6" />
            <StatCard icon={<TrendingUp size={18} />} label="Toplam Gelir" value={`${(stats?.totalRevenue ?? 0).toLocaleString('tr-TR')} TL`} color="#F59E0B" />
          </div>

          {/* Area Usage */}
          <div className="surface-card rounded-2xl p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-4">Alan Kullanimi</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <span className="text-[12px] text-[var(--text-secondary)]">Kiralanan</span>
                  <span className="text-[12px] font-bold">{stats?.rentedArea?.toLocaleString('tr-TR')} / {stats?.totalArea?.toLocaleString('tr-TR')} m2</span>
                </div>
                <div className="h-4 bg-[var(--bg-input)] rounded-full overflow-hidden">
                  <div className="h-full bg-[#2D6A4F] rounded-full transition-all" style={{ width: `${stats?.totalArea ? (stats.rentedArea / stats.totalArea * 100) : 0}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Pending Harvests */}
          {(stats?.pendingHarvests ?? 0) > 0 && (
            <div className="surface-card rounded-2xl p-4 border-l-4 border-amber-500 flex items-center gap-3">
              <AlertTriangle size={20} className="text-amber-500" />
              <div>
                <p className="text-[13px] font-semibold">{stats?.pendingHarvests} hasat kargolanmayi bekliyor</p>
                <p className="text-[11px] text-[var(--text-secondary)]">Hasat sonuclari ve kargo bilgileri icin kontrol edin.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'regions' && (
        <div className="space-y-4">
          {regions.length === 0 ? (
            <div className="text-center py-20 text-[var(--text-secondary)]">
              <Sprout size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-[14px] font-semibold">Henuz bolge eklenmemis</p>
              <p className="text-[12px]">API uzerinden bolge ekleyebilirsiniz.</p>
            </div>
          ) : (
            regions.map(region => (
              <div key={region._id} className="surface-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-[15px] font-bold">{region.region_name}</h3>
                    <p className="text-[11px] text-[var(--text-secondary)]">{region.city_name} / {region.district}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${region.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {region.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-[var(--bg-input)] rounded-xl p-3">
                    <p className="text-[16px] font-bold">{region.total_area_m2.toLocaleString('tr-TR')}</p>
                    <p className="text-[9px] text-[var(--text-secondary)]">Toplam m2</p>
                  </div>
                  <div className="bg-[var(--bg-input)] rounded-xl p-3">
                    <p className="text-[16px] font-bold text-[#2D6A4F]">{region.rented_area_m2.toLocaleString('tr-TR')}</p>
                    <p className="text-[9px] text-[var(--text-secondary)]">Kiralanan</p>
                  </div>
                  <div className={`rounded-xl p-3 ${region.available_percent < 10 ? 'bg-red-50' : region.available_percent < 20 ? 'bg-amber-50' : 'bg-[var(--bg-input)]'}`}>
                    <p className={`text-[16px] font-bold ${region.available_percent < 10 ? 'text-red-600' : region.available_percent < 20 ? 'text-amber-600' : ''}`}>
                      %{region.available_percent?.toFixed(0)}
                    </p>
                    <p className="text-[9px] text-[var(--text-secondary)]">Musait</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {region.crop_types.map(crop => (
                    <span key={crop} className="px-2.5 py-1 rounded-lg bg-[var(--bg-input)] text-[10px] font-medium">{crop}</span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'settings' && (
        <div className="space-y-6">
          <div className="surface-card rounded-2xl p-6 space-y-5">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">Modul Ayarlari</h3>

            <label className="flex items-center justify-between">
              <span className="text-[13px] font-medium">Modül Aktif</span>
              <button onClick={() => { setEnabled(!enabled); quickToggle('enabled', !enabled); }} className={`w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-[#2D6A4F]' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>

            <label className="flex items-center justify-between">
              <span className="text-[13px] font-medium">Beta Modu (Sadece Whitelist)</span>
              <button onClick={() => { setBetaMode(!betaMode); quickToggle('beta_mode', !betaMode); }} className={`w-12 h-7 rounded-full transition-colors ${betaMode ? 'bg-[#2D6A4F]' : 'bg-gray-300'}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${betaMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>

            {/* Kullanici Whitelist — Arama ile secim */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text-secondary)] mb-1.5">
                <UserPlus size={12} className="inline mr-1" />
                Whitelist Kullanicilari ({whitelistIds.length})
              </label>
              {/* Secili kullanicilar */}
              {whitelistIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {whitelistIds.map(uid => (
                    <span key={uid} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-medium">
                      {uid}
                      <button onClick={() => removeFromWhitelist(uid)} className="hover:text-red-500">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Arama */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => searchUsers(e.target.value)}
                  placeholder="Kullanici ara (isim veya email)..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[12px] focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {searchingUsers && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
              </div>
              {/* Arama sonuclari */}
              {userResults.length > 0 && (
                <div className="mt-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-lg max-h-40 overflow-y-auto">
                  {userResults.map((u: any) => (
                    <button key={u.userId} onClick={() => addToWhitelist(u.userId)}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[var(--bg-surface-hover)] text-left transition-colors">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center text-[11px] font-bold text-emerald-700">
                        {(u.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold truncate">{u.name || u.userId}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)] truncate">{u.email} | {u.location || 'Konum yok'}</p>
                      </div>
                      <UserPlus size={14} className="text-emerald-500 shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Input
              label="Aktif Sehirler (virgul ile)"
              value={activeCities}
              onChange={e => setActiveCities(e.target.value)}
              placeholder="Mersin, Ankara, Istanbul"
            />

            <Button onClick={handleSaveSettings} className="w-full">
              <Save size={14} className="mr-2" />
              Ayarlari Kaydet
            </Button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <div className="surface-card rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15`, color }}>
          {icon}
        </div>
        <span className="text-[11px] text-[var(--text-secondary)] font-medium">{label}</span>
      </div>
      <p className="text-[20px] font-bold">{value}</p>
    </div>
  );
}
