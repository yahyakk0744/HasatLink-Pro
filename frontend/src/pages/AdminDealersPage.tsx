import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Store, Plus, Trash2, Edit3, Eye, MousePointer, MessageCircle,
  MapPin, Star, Calendar, Tag, Search,
} from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';
import type { Dealer } from '../types';

type AdStatus = Dealer['ad_status'];
const STATUS_OPTIONS: AdStatus[] = ['active', 'pending', 'rejected', 'expired'];

const STATUS_LABELS: Record<string, Record<AdStatus, string>> = {
  tr: { active: 'Aktif', pending: 'Beklemede', rejected: 'Reddedildi', expired: 'Süresi Doldu' },
  en: { active: 'Active', pending: 'Pending', rejected: 'Rejected', expired: 'Expired' },
};

const STATUS_COLORS: Record<AdStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-amber-50 text-amber-700',
  rejected: 'bg-red-50 text-red-700',
  expired: 'bg-gray-100 text-gray-500',
};

const emptyDealer = (): Partial<Dealer> => ({
  name: '',
  companyName: '',
  email: '',
  phone: '',
  whatsapp: '',
  address: '',
  coordinates: { lat: 0, lng: 0 },
  profileImage: '',
  coverImage: '',
  description: '',
  specialization_tags: [],
  target_regions: [],
  ad_status: 'pending',
  is_premium_partner: false,
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
  is_active: false,
  commission_rate: 0,
  website: '',
  google_maps_url: '',
});

export default function AdminDealersPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const lang = isTr ? 'tr' : 'en';
  const [dealers, setDealers] = useState<Dealer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<AdStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyDealer());
  const [tagsInput, setTagsInput] = useState('');

  const fetchDealers = async () => {
    try {
      const { data } = await api.get<Dealer[]>('/admin/dealers');
      setDealers(data);
    } catch {
      toast.error(isTr ? 'Bayiler yüklenemedi' : 'Failed to load dealers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDealers(); }, []);

  const openModal = (dealer?: Dealer) => {
    if (dealer) {
      setEditingId(dealer._id);
      setForm({
        ...dealer,
        start_date: dealer.start_date.slice(0, 10),
        end_date: dealer.end_date.slice(0, 10),
      });
      setTagsInput(dealer.specialization_tags.join(', '));
    } else {
      setEditingId(null);
      setForm(emptyDealer());
      setTagsInput('');
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.companyName || !form.name || !form.phone) {
      toast.error(isTr ? 'Zorunlu alanları doldurun' : 'Fill required fields');
      return;
    }
    const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
    const regions = ((form as any).target_regions || []) as string[];
    const payload = { ...form, specialization_tags: tags, target_regions: regions };
    delete (payload as any).target_regions_input;

    try {
      if (editingId) {
        const { data } = await api.put<Dealer>(`/admin/dealers/${editingId}`, payload);
        setDealers(prev => prev.map(d => d._id === editingId ? data : d));
      } else {
        const { data } = await api.post<Dealer>('/admin/dealers', payload);
        setDealers(prev => [data, ...prev]);
      }
      setModalOpen(false);
      toast.success(isTr ? 'Bayi kaydedildi' : 'Dealer saved');
    } catch {
      toast.error(isTr ? 'Kaydetme başarısız' : 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/dealers/${id}`);
      setDealers(prev => prev.filter(d => d._id !== id));
      toast.success(isTr ? 'Bayi silindi' : 'Dealer deleted');
    } catch {
      toast.error(isTr ? 'Silme başarısız' : 'Delete failed');
    }
  };

  const handleToggle = async (dealer: Dealer) => {
    try {
      const { data } = await api.patch<Dealer>(`/admin/dealers/${dealer._id}/toggle`);
      setDealers(prev => prev.map(d => d._id === dealer._id ? data : d));
    } catch {
      toast.error(isTr ? 'Güncelleme başarısız' : 'Update failed');
    }
  };

  const filtered = dealers
    .filter(d => filterStatus === 'all' || d.ad_status === filterStatus)
    .filter(d =>
      !search ||
      d.companyName.toLowerCase().includes(search.toLowerCase()) ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.specialization_tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

  if (loading) return (
    <AdminLayout title={isTr ? 'Bayi Yönetimi' : 'Dealer Management'} icon={<Store size={24} />}>
      <LoadingSpinner size="lg" className="py-20" />
    </AdminLayout>
  );

  return (
    <AdminLayout title={isTr ? 'Bayi Yönetimi' : 'Dealer Management'} icon={<Store size={24} />}>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={isTr ? 'Bayi ara...' : 'Search dealers...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/70 backdrop-blur-md border border-white/20 text-[14px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/30 shadow-sm"
          />
        </div>
        <Button size="sm" onClick={() => openModal()}>
          <Plus size={14} className="mr-1" />
          {isTr ? 'Yeni Bayi' : 'New Dealer'}
        </Button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-emerald-500 text-white shadow-sm'
              : 'bg-white/70 backdrop-blur-md text-gray-600 border border-white/20 hover:bg-gray-50'
          }`}
        >
          {isTr ? 'Tümü' : 'All'} ({dealers.length})
        </button>
        {STATUS_OPTIONS.map(s => {
          const count = dealers.filter(d => d.ad_status === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-colors ${
                filterStatus === s
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-white/70 backdrop-blur-md text-gray-600 border border-white/20 hover:bg-gray-50'
              }`}
            >
              {STATUS_LABELS[lang][s]} ({count})
            </button>
          );
        })}
      </div>

      {/* Dealer cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          {isTr ? 'Bayi bulunamadı' : 'No dealers found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(dealer => (
            <div
              key={dealer._id}
              className={`
                relative overflow-hidden rounded-2xl p-5
                bg-white/70 backdrop-blur-md border border-white/20 shadow-sm
                hover:shadow-md transition-shadow
                ${dealer.is_premium_partner ? 'ring-2 ring-amber-400/40' : ''}
              `}
            >
              {/* Premium badge */}
              {dealer.is_premium_partner && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white text-[11px] font-semibold">
                  <Star size={11} fill="currentColor" /> Premium
                </div>
              )}

              <div className="flex items-start gap-3.5 mb-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {dealer.profileImage ? (
                    <img src={dealer.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-bold">
                      {dealer.companyName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[14px] font-semibold text-gray-900 truncate">{dealer.companyName}</h4>
                  <p className="text-[12px] text-gray-500">{dealer.name}</p>
                </div>
              </div>

              {/* Status & dates */}
              <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${STATUS_COLORS[dealer.ad_status]}`}>
                  {STATUS_LABELS[lang][dealer.ad_status]}
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(dealer.start_date).toLocaleDateString()} — {new Date(dealer.end_date).toLocaleDateString()}
                </span>
              </div>

              {/* Tags */}
              {dealer.specialization_tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {dealer.specialization_tags.map((tag, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-medium flex items-center gap-0.5">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Target Regions */}
              {dealer.target_regions?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {dealer.target_regions.map((region: string, i: number) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-medium flex items-center gap-0.5">
                      <MapPin size={10} /> {region}
                    </span>
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex items-center gap-4 text-[12px] text-gray-500 mb-3">
                <span className="flex items-center gap-1"><Eye size={13} /> {dealer.impressionCount}</span>
                <span className="flex items-center gap-1"><MousePointer size={13} /> {dealer.clickCount}</span>
                <span className="flex items-center gap-1"><MessageCircle size={13} /> {dealer.contactCount}</span>
                <span className="flex items-center gap-1"><MapPin size={13} /> {dealer.address.split(',')[0]}</span>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <Toggle checked={dealer.is_active} onChange={() => handleToggle(dealer)} label={isTr ? 'Aktif' : 'Active'} />
                <div className="flex gap-1">
                  <button onClick={() => openModal(dealer)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                    <Edit3 size={15} className="text-gray-500" />
                  </button>
                  <button onClick={() => handleDelete(dealer._id)} className="p-2 hover:bg-red-50 rounded-xl transition-colors">
                    <Trash2 size={15} className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? (isTr ? 'Bayi Düzenle' : 'Edit Dealer') : (isTr ? 'Yeni Bayi' : 'New Dealer')}
      >
        <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isTr ? 'Firma Adı *' : 'Company Name *'}
              value={form.companyName || ''}
              onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
            />
            <Input
              label={isTr ? 'Yetkili Kişi *' : 'Contact Person *'}
              value={form.name || ''}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="E-posta"
              type="email"
              value={form.email || ''}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
            <Input
              label={isTr ? 'Telefon *' : 'Phone *'}
              value={form.phone || ''}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <Input
            label="WhatsApp"
            value={form.whatsapp || ''}
            onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
            placeholder="+905..."
          />
          <Input
            label={isTr ? 'Adres' : 'Address'}
            value={form.address || ''}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Enlem (Lat)"
              type="number"
              value={form.coordinates?.lat?.toString() || '0'}
              onChange={e => setForm(f => ({ ...f, coordinates: { ...f.coordinates!, lat: parseFloat(e.target.value) || 0 } }))}
            />
            <Input
              label="Boylam (Lng)"
              type="number"
              value={form.coordinates?.lng?.toString() || '0'}
              onChange={e => setForm(f => ({ ...f, coordinates: { ...f.coordinates!, lng: parseFloat(e.target.value) || 0 } }))}
            />
          </div>
          <Input
            label={isTr ? 'Profil Görseli URL' : 'Profile Image URL'}
            value={form.profileImage || ''}
            onChange={e => setForm(f => ({ ...f, profileImage: e.target.value }))}
          />
          <Input
            label={isTr ? 'Kapak Görseli URL' : 'Cover Image URL'}
            value={form.coverImage || ''}
            onChange={e => setForm(f => ({ ...f, coverImage: e.target.value }))}
          />
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              {isTr ? 'Açıklama' : 'Description'}
            </label>
            <textarea
              value={form.description || ''}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/30"
            />
          </div>
          <Input
            label={isTr ? 'Uzmanlık Etiketleri (virgülle ayır)' : 'Specialization Tags (comma separated)'}
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            placeholder="Zeytin, Narenciye, Tahıl..."
          />
          {/* Target Regions */}
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              {isTr ? 'Hedef Bolgeler (virgülle ayır)' : 'Target Regions (comma separated)'}
            </label>
            <input
              type="text"
              value={(form as any).target_regions_input || (form as any).target_regions?.join(', ') || ''}
              onChange={e => setForm(f => ({ ...f, target_regions_input: e.target.value, target_regions: e.target.value.split(',').map((r: string) => r.trim()).filter(Boolean) } as any))}
              placeholder="Istanbul, Ankara, Izmir, Antalya..."
              className="w-full px-4 py-3 bg-[var(--bg-input)] border border-transparent rounded-2xl text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-green)] focus:ring-4 focus:ring-[var(--focus-ring)] transition-all"
            />
            <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
              {isTr ? 'Boş bırakılırsa tüm bölgelerde gösterilir' : 'Leave empty to show in all regions'}
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5">
              {isTr ? 'Reklam Durumu' : 'Ad Status'}
            </label>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, ad_status: s }))}
                  className={`px-3 py-1.5 rounded-xl text-[13px] font-medium transition-colors ${
                    form.ad_status === s
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {STATUS_LABELS[lang][s]}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isTr ? 'Başlangıç Tarihi' : 'Start Date'}
              type="date"
              value={typeof form.start_date === 'string' ? form.start_date : ''}
              onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
            />
            <Input
              label={isTr ? 'Bitiş Tarihi' : 'End Date'}
              type="date"
              value={typeof form.end_date === 'string' ? form.end_date : ''}
              onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isTr ? 'Komisyon Oranı (%)' : 'Commission Rate (%)'}
              type="number"
              value={form.commission_rate?.toString() || '0'}
              onChange={e => setForm(f => ({ ...f, commission_rate: parseFloat(e.target.value) || 0 }))}
            />
            <Input
              label="Website"
              value={form.website || ''}
              onChange={e => setForm(f => ({ ...f, website: e.target.value }))}
            />
          </div>
          <Input
            label="Google Maps URL"
            value={form.google_maps_url || ''}
            onChange={e => setForm(f => ({ ...f, google_maps_url: e.target.value }))}
          />
          <div className="flex gap-4">
            <Toggle
              checked={form.is_premium_partner || false}
              onChange={v => setForm(f => ({ ...f, is_premium_partner: v }))}
              label="Premium Partner"
            />
            <Toggle
              checked={form.is_active || false}
              onChange={v => setForm(f => ({ ...f, is_active: v }))}
              label={isTr ? 'Aktif' : 'Active'}
            />
          </div>
          <Button onClick={handleSave} className="w-full">
            {editingId ? (isTr ? 'Güncelle' : 'Update') : (isTr ? 'Oluştur' : 'Create')}
          </Button>
        </div>
      </Modal>
    </AdminLayout>
  );
}
