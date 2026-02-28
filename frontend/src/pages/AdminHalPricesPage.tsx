import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { TrendingUp, Plus, Pencil, Trash2, ChevronLeft, Save, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Modal from '../components/ui/Modal';
import api from '../config/api';
import toast from 'react-hot-toast';
import type { MarketPrice } from '../types';

const categories = ['sebze', 'meyve', 'tahıl', 'baklagil', 'diğer'];

const defaultForm = { name: '', nameEn: '', price: 0, unit: '₺/kg', category: 'sebze' };

export default function AdminHalPricesPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    api.get('/admin/market-prices')
      .then(({ data }) => setPrices(data))
      .catch(() => toast.error(isTr ? 'Fiyatlar yüklenemedi' : 'Failed to load prices'))
      .finally(() => setLoading(false));
  }, [isTr]);

  const openCreate = () => {
    setEditId(null);
    setForm(defaultForm);
    setModalOpen(true);
  };

  const openEdit = (p: MarketPrice) => {
    setEditId(p._id);
    setForm({ name: p.name, nameEn: p.nameEn, price: p.price, unit: p.unit, category: p.category });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.nameEn || form.price < 0) {
      toast.error(isTr ? 'Ad, İngilizce ad ve fiyat zorunlu' : 'Name, English name and price required');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const { data } = await api.put(`/admin/market-prices/${editId}`, form);
        setPrices(prev => prev.map(p => p._id === editId ? data : p));
        toast.success(isTr ? 'Fiyat güncellendi' : 'Price updated');
      } else {
        const { data } = await api.post('/admin/market-prices', form);
        setPrices(prev => [...prev, data]);
        toast.success(isTr ? 'Fiyat eklendi' : 'Price added');
      }
      setModalOpen(false);
    } catch {
      toast.error(isTr ? 'İşlem başarısız' : 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/market-prices/${deleteId}`);
      setPrices(prev => prev.filter(p => p._id !== deleteId));
      toast.success(isTr ? 'Fiyat silindi' : 'Price deleted');
    } catch {
      toast.error(isTr ? 'Silme başarısız' : 'Delete failed');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;

  const filtered = filterCat ? prices.filter(p => p.category === filterCat) : prices;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={isTr ? 'Admin - Hal Fiyatları' : 'Admin - Market Prices'} />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-[var(--bg-input)] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <TrendingUp size={24} className="text-[#A47148]" />
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'Hal Fiyatları Yönetimi' : 'Market Prices Management'}</h1>
      </div>

      {/* Filter + Add */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex bg-[var(--bg-input)] rounded-xl p-1 gap-1 overflow-x-auto">
          <button
            onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${!filterCat ? 'bg-[var(--bg-invert)] text-[var(--text-on-invert)]' : 'text-[var(--text-secondary)]'}`}
          >
            {isTr ? 'Tümü' : 'All'} ({prices.length})
          </button>
          {categories.map(cat => {
            const count = prices.filter(p => p.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap capitalize transition-colors ${filterCat === cat ? 'bg-[var(--bg-invert)] text-[var(--text-on-invert)]' : 'text-[var(--text-secondary)]'}`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
        <Button onClick={openCreate} className="ml-auto">
          <Plus size={14} className="mr-1" />
          {isTr ? 'Yeni Fiyat' : 'Add Price'}
        </Button>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          {isTr ? 'Fiyat bulunamadı' : 'No prices found'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p._id} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{p.nameEn}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-input)] text-[var(--text-secondary)] capitalize">{p.category}</span>
              </div>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-xl font-bold text-[#2D6A4F]">₺{p.price.toFixed(2)}</span>
                <span className="text-xs text-[var(--text-secondary)] mb-0.5">/{p.unit.replace('₺/', '')}</span>
                {p.change !== 0 && (
                  <span className={`text-xs font-medium ml-auto ${p.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {p.change > 0 ? '+' : ''}{p.change.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[var(--border-default)]">
                <p className="text-[10px] text-[var(--text-secondary)] flex-1">
                  {new Date(p.updatedAt).toLocaleDateString('tr-TR')}
                </p>
                <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-[var(--bg-input)] transition-colors">
                  <Pencil size={14} className="text-[var(--text-secondary)]" />
                </button>
                <button onClick={() => setDeleteId(p._id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={14} className="text-[#C1341B]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editId ? (isTr ? 'Fiyat Düzenle' : 'Edit Price') : (isTr ? 'Yeni Fiyat' : 'New Price')}>
        <div className="space-y-4">
          <Input label={isTr ? 'Ürün Adı (TR)' : 'Product Name (TR)'} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <Input label={isTr ? 'Ürün Adı (EN)' : 'Product Name (EN)'} value={form.nameEn} onChange={e => setForm(f => ({ ...f, nameEn: e.target.value }))} required />
          <Input label={isTr ? 'Fiyat (₺)' : 'Price (₺)'} type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} required />
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{isTr ? 'Birim' : 'Unit'}</label>
            <select
              value={form.unit}
              onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-2xl text-sm outline-none"
            >
              <option value="₺/kg">₺/kg</option>
              <option value="₺/ton">₺/ton</option>
              <option value="₺/adet">₺/adet</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">{isTr ? 'Kategori' : 'Category'}</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full px-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-2xl text-sm outline-none"
            >
              {categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)} className="flex-1">
              <X size={14} className="mr-1" /> {isTr ? 'İptal' : 'Cancel'}
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1">
              <Save size={14} className="mr-1" /> {isTr ? 'Kaydet' : 'Save'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title={isTr ? 'Fiyatı Sil' : 'Delete Price'} size="sm">
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {isTr ? 'Bu fiyat kaydını silmek istediğinizden emin misiniz?' : 'Are you sure you want to delete this price record?'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setDeleteId(null)} className="flex-1">{isTr ? 'İptal' : 'Cancel'}</Button>
          <Button variant="danger" onClick={handleDelete} loading={deleting} className="flex-1">{isTr ? 'Sil' : 'Delete'}</Button>
        </div>
      </Modal>
    </div>
  );
}
