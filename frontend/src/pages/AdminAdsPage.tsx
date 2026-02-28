import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Megaphone, Plus, Trash2, Edit3, Eye, MousePointer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';
import type { Ad } from '../types';

type SlotType = Ad['slot'];
const SLOTS: SlotType[] = ['header', 'sidebar', 'footer', 'between-listings'];

const SLOT_LABELS: Record<string, Record<SlotType, string>> = {
  tr: { header: 'Header', sidebar: 'Sidebar', footer: 'Footer', 'between-listings': 'İlanlar Arası' },
  en: { header: 'Header', sidebar: 'Sidebar', footer: 'Footer', 'between-listings': 'Between Listings' },
};

const emptyAd = (): Omit<Ad, '_id' | 'clickCount' | 'impressionCount' | 'createdAt'> => ({
  slot: 'header',
  enabled: false,
  imageUrl: '',
  clickUrl: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
});

export default function AdminAdsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const lang = isTr ? 'tr' : 'en';
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSlot, setFilterSlot] = useState<SlotType | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState(emptyAd());

  const fetchAds = async () => {
    try {
      const { data } = await api.get<Ad[]>('/admin/ads');
      setAds(data);
    } catch {
      toast.error(isTr ? 'Reklamlar yüklenemedi' : 'Failed to load ads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAds(); }, []);

  const openModal = (ad?: Ad) => {
    if (ad) {
      setEditingId(ad._id);
      setAdForm({
        slot: ad.slot,
        enabled: ad.enabled,
        imageUrl: ad.imageUrl,
        clickUrl: ad.clickUrl,
        startDate: ad.startDate.slice(0, 10),
        endDate: ad.endDate.slice(0, 10),
      });
    } else {
      setEditingId(null);
      setAdForm(emptyAd());
    }
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!adForm.imageUrl || !adForm.clickUrl) {
      toast.error(isTr ? 'Görsel ve tıklama URL gerekli' : 'Image and click URL required');
      return;
    }
    try {
      if (editingId) {
        const { data } = await api.put<Ad>(`/admin/ads/${editingId}`, adForm);
        setAds(prev => prev.map(a => a._id === editingId ? data : a));
      } else {
        const { data } = await api.post<Ad>('/admin/ads', adForm);
        setAds(prev => [data, ...prev]);
      }
      setModalOpen(false);
      toast.success(isTr ? 'Reklam kaydedildi' : 'Ad saved');
    } catch {
      toast.error(isTr ? 'Kaydetme başarısız' : 'Save failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/ads/${id}`);
      setAds(prev => prev.filter(a => a._id !== id));
      toast.success(isTr ? 'Reklam silindi' : 'Ad deleted');
    } catch {
      toast.error(isTr ? 'Silme başarısız' : 'Delete failed');
    }
  };

  const handleToggle = async (ad: Ad) => {
    try {
      const { data } = await api.put<Ad>(`/admin/ads/${ad._id}`, { enabled: !ad.enabled });
      setAds(prev => prev.map(a => a._id === ad._id ? data : a));
    } catch {
      toast.error(isTr ? 'Güncelleme başarısız' : 'Update failed');
    }
  };

  const filtered = filterSlot === 'all' ? ads : ads.filter(a => a.slot === filterSlot);

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={isTr ? 'Admin - Reklam Yönetimi' : 'Admin - Ad Management'} />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Megaphone size={24} className="text-[#2D6A4F]" />
          <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'Reklam Yönetimi' : 'Ad Management'}</h1>
        </div>
        <Button size="sm" onClick={() => openModal()}>
          <Plus size={14} className="mr-1" />
          {isTr ? 'Yeni Reklam' : 'New Ad'}
        </Button>
      </div>

      {/* Slot Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterSlot('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterSlot === 'all' ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'}`}
        >
          {isTr ? 'Tümü' : 'All'}
        </button>
        {SLOTS.map(s => (
          <button
            key={s}
            onClick={() => setFilterSlot(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterSlot === s ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'}`}
          >
            {SLOT_LABELS[lang][s]}
          </button>
        ))}
      </div>

      {/* Ad Cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          {isTr ? 'Henüz reklam yok' : 'No ads yet'}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(ad => (
            <div key={ad._id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 shadow-sm">
              <div className="flex gap-4">
                <div className="w-32 h-20 rounded-xl overflow-hidden bg-[var(--bg-input)] shrink-0">
                  <img src={ad.imageUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-medium">
                      {SLOT_LABELS[lang][ad.slot]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ad.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ad.enabled ? (isTr ? 'Aktif' : 'Active') : (isTr ? 'Pasif' : 'Inactive')}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] truncate">{ad.clickUrl}</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    {new Date(ad.startDate).toLocaleDateString()} — {new Date(ad.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-secondary)]">
                    <span className="flex items-center gap-1"><Eye size={12} /> {ad.impressionCount}</span>
                    <span className="flex items-center gap-1"><MousePointer size={12} /> {ad.clickCount}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Toggle checked={ad.enabled} onChange={() => handleToggle(ad)} />
                  <div className="flex gap-1">
                    <button onClick={() => openModal(ad)} className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-xl transition-colors">
                      <Edit3 size={16} className="text-[var(--text-secondary)]" />
                    </button>
                    <button onClick={() => handleDelete(ad._id)} className="p-2 hover:bg-[var(--bg-surface-hover)] rounded-xl transition-colors">
                      <Trash2 size={16} className="text-[#C1341B]" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? (isTr ? 'Reklamı Düzenle' : 'Edit Ad') : (isTr ? 'Yeni Reklam' : 'New Ad')}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              Slot
            </label>
            <div className="flex flex-wrap gap-2">
              {SLOTS.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAdForm(f => ({ ...f, slot: s }))}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${adForm.slot === s ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-secondary)]'}`}
                >
                  {SLOT_LABELS[lang][s]}
                </button>
              ))}
            </div>
          </div>
          <Input
            label={isTr ? 'Görsel URL' : 'Image URL'}
            value={adForm.imageUrl}
            onChange={e => setAdForm(f => ({ ...f, imageUrl: e.target.value }))}
            placeholder="https://..."
          />
          {adForm.imageUrl && (
            <div className="w-full h-32 rounded-xl overflow-hidden bg-[var(--bg-input)]">
              <img src={adForm.imageUrl} alt="preview" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
            </div>
          )}
          <Input
            label={isTr ? 'Tıklama URL' : 'Click URL'}
            value={adForm.clickUrl}
            onChange={e => setAdForm(f => ({ ...f, clickUrl: e.target.value }))}
            placeholder="https://..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={isTr ? 'Başlangıç Tarihi' : 'Start Date'}
              type="date"
              value={adForm.startDate}
              onChange={e => setAdForm(f => ({ ...f, startDate: e.target.value }))}
            />
            <Input
              label={isTr ? 'Bitiş Tarihi' : 'End Date'}
              type="date"
              value={adForm.endDate}
              onChange={e => setAdForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
          <Toggle
            checked={adForm.enabled}
            onChange={v => setAdForm(f => ({ ...f, enabled: v }))}
            label={isTr ? 'Aktif' : 'Enabled'}
          />
          <Button onClick={handleSave} className="w-full">
            {editingId ? (isTr ? 'Güncelle' : 'Update') : (isTr ? 'Oluştur' : 'Create')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
