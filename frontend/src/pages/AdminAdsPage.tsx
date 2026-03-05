import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Megaphone, Plus, Trash2, Edit3, Eye, MousePointer, Upload, Monitor, Smartphone, Info, X, Image as ImageIcon } from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
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

const PIXEL_GUIDES: Record<SlotType, { desktop: string; mobile: string }> = {
  header: { desktop: '1280 × 400 px', mobile: '400 × 600 px' },
  sidebar: { desktop: '300 × 600 px', mobile: '400 × 300 px' },
  footer: { desktop: '1280 × 300 px', mobile: '400 × 400 px' },
  'between-listings': { desktop: '1280 × 250 px', mobile: '400 × 500 px' },
};

const emptyAd = (): Omit<Ad, '_id' | 'clickCount' | 'impressionCount' | 'createdAt'> => ({
  slot: 'header',
  enabled: false,
  imageUrl: '',
  mobileImageUrl: '',
  clickUrl: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
});

function ImageDropZone({
  label,
  pixelGuide,
  icon: Icon,
  imageUrl,
  onUpload,
  onClear,
  uploading,
}: {
  label: string;
  pixelGuide: string;
  icon: typeof Monitor;
  imageUrl: string;
  onUpload: (file: File) => void;
  onClear: () => void;
  uploading: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) onUpload(file);
  }, [onUpload]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onUpload(file);
    e.target.value = '';
  };

  if (imageUrl) {
    return (
      <div className="relative group">
        <div className="flex items-center gap-2 mb-2">
          <Icon size={14} className="text-[var(--text-secondary)]" />
          <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
          <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[10px] font-semibold text-[#2D6A4F]">
            <Info size={10} />{pixelGuide}
          </span>
        </div>
        <div className="relative rounded-xl overflow-hidden bg-[var(--bg-input)] border border-[var(--border-default)]">
          <img src={imageUrl.startsWith('/uploads') ? `${api.defaults.baseURL?.replace('/api', '')}${imageUrl}` : imageUrl} alt="" className="w-full h-32 object-cover" onError={e => (e.currentTarget.src = '')} />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-[var(--text-secondary)]" />
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="ml-auto flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[10px] font-semibold text-[#2D6A4F]">
          <Info size={10} />{pixelGuide}
        </span>
      </div>
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          w-full h-32 rounded-xl border-2 border-dashed cursor-pointer
          flex flex-col items-center justify-center gap-2 transition-all
          ${dragOver
            ? 'border-[#2D6A4F] bg-[#2D6A4F]/5'
            : 'border-[var(--border-default)] bg-[var(--bg-input)] hover:border-[#2D6A4F]/50 hover:bg-[var(--bg-surface-hover)]'
          }
        `}
      >
        {uploading ? (
          <LoadingSpinner size="sm" />
        ) : (
          <>
            <Upload size={20} className="text-[var(--text-secondary)]" />
            <span className="text-xs text-[var(--text-secondary)]">Sürükle & bırak veya tıkla</span>
          </>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      </div>
    </div>
  );
}

export default function AdminAdsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const lang = isTr ? 'tr' : 'en';
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSlot, setFilterSlot] = useState<SlotType | 'all'>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState(emptyAd());
  const [uploadingDesktop, setUploadingDesktop] = useState(false);
  const [uploadingMobile, setUploadingMobile] = useState(false);

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
        mobileImageUrl: ad.mobileImageUrl || '',
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

  const uploadImage = async (file: File, target: 'desktop' | 'mobile') => {
    const setter = target === 'desktop' ? setUploadingDesktop : setUploadingMobile;
    setter(true);
    try {
      // Client-side compression
      const compressed = await compressImage(file, 1200);
      const formData = new FormData();
      formData.append('image', compressed);
      const { data } = await api.post<{ url: string }>('/upload/ad-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAdForm(f => ({
        ...f,
        [target === 'desktop' ? 'imageUrl' : 'mobileImageUrl']: data.url,
      }));
      toast.success(isTr ? 'Görsel yüklendi' : 'Image uploaded');
    } catch {
      toast.error(isTr ? 'Yükleme başarısız' : 'Upload failed');
    } finally {
      setter(false);
    }
  };

  const handleSave = async () => {
    if (!adForm.imageUrl || !adForm.clickUrl) {
      toast.error(isTr ? 'Desktop görsel ve tıklama URL gerekli' : 'Desktop image and click URL required');
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

  if (loading) return (
    <AdminLayout title="Reklam Yönetimi" icon={<Megaphone size={24} />}>
      <LoadingSpinner size="lg" className="py-20" />
    </AdminLayout>
  );

  return (
    <AdminLayout title="Reklam Yönetimi" icon={<Megaphone size={24} />}>
      <div className="flex justify-end mb-4">
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
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="flex gap-2 shrink-0">
                  <div className="relative">
                    <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-[var(--bg-input)]">
                      <img src={ad.imageUrl.startsWith('/uploads') ? `${api.defaults.baseURL?.replace('/api', '')}${ad.imageUrl}` : ad.imageUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                    </div>
                    <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-md bg-[#0077B6] text-white text-[8px] font-bold flex items-center gap-0.5">
                      <Monitor size={8} />D
                    </span>
                  </div>
                  {ad.mobileImageUrl && (
                    <div className="relative">
                      <div className="w-16 h-16 sm:w-16 sm:h-20 rounded-xl overflow-hidden bg-[var(--bg-input)]">
                        <img src={ad.mobileImageUrl.startsWith('/uploads') ? `${api.defaults.baseURL?.replace('/api', '')}${ad.mobileImageUrl}` : ad.mobileImageUrl} alt="" className="w-full h-full object-cover" onError={e => (e.currentTarget.style.display = 'none')} />
                      </div>
                      <span className="absolute -top-1 -left-1 px-1.5 py-0.5 rounded-md bg-[#E76F00] text-white text-[8px] font-bold flex items-center gap-0.5">
                        <Smartphone size={8} />M
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-medium">
                      {SLOT_LABELS[lang][ad.slot]}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ad.enabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {ad.enabled ? (isTr ? 'Aktif' : 'Active') : (isTr ? 'Pasif' : 'Inactive')}
                    </span>
                    {ad.mobileImageUrl ? (
                      <span className="px-2 py-0.5 rounded-full bg-[#0077B6]/10 text-[#0077B6] text-[10px] font-semibold flex items-center gap-0.5">
                        <ImageIcon size={10} /> Dual
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-[#E76F00]/10 text-[#E76F00] text-[10px] font-semibold">
                        Tek Görsel
                      </span>
                    )}
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
                <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2 shrink-0">
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

          {/* Desktop Image Upload */}
          <ImageDropZone
            label={isTr ? 'Desktop Görsel' : 'Desktop Image'}
            pixelGuide={PIXEL_GUIDES[adForm.slot].desktop}
            icon={Monitor}
            imageUrl={adForm.imageUrl}
            onUpload={file => uploadImage(file, 'desktop')}
            onClear={() => setAdForm(f => ({ ...f, imageUrl: '' }))}
            uploading={uploadingDesktop}
          />

          {/* Mobile Image Upload */}
          <ImageDropZone
            label={isTr ? 'Mobil Görsel' : 'Mobile Image'}
            pixelGuide={PIXEL_GUIDES[adForm.slot].mobile}
            icon={Smartphone}
            imageUrl={adForm.mobileImageUrl || ''}
            onUpload={file => uploadImage(file, 'mobile')}
            onClear={() => setAdForm(f => ({ ...f, mobileImageUrl: '' }))}
            uploading={uploadingMobile}
          />

          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#0077B6]/5 border border-[#0077B6]/10">
            <Info size={14} className="text-[#0077B6] mt-0.5 shrink-0" />
            <p className="text-[11px] text-[#0077B6]">
              {isTr
                ? 'Mobil görsel opsiyoneldir. Yüklenmezse desktop görseli her cihazda kullanılır. Dual görsel ile her cihaza özel boyut sunulur.'
                : 'Mobile image is optional. If not uploaded, desktop image will be used on all devices. Dual image serves optimized sizes per device.'}
            </p>
          </div>

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
    </AdminLayout>
  );
}

// Client-side image compression utility
function compressImage(file: File, maxWidth: number): Promise<File> {
  return new Promise((resolve) => {
    if (file.size < 200 * 1024) { resolve(file); return; }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        blob => {
          if (blob) resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          else resolve(file);
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}
