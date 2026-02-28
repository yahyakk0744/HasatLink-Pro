import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { DollarSign, Save, Plus, X, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import Toggle from '../components/ui/Toggle';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';
import type { SiteSettings, PremiumPackage } from '../types';

const defaultSettings: SiteSettings = {
  key: 'main',
  instagramUrl: '',
  twitterUrl: '',
  featuredListing: { enabled: false, pricePerListing: 0, durationOptions: [] },
  premiumMembership: { enabled: false, packages: [] },
  commission: { enabled: false, percentage: 0 },
  aiUsageLimit: { enabled: false, dailyFreeCount: 3 },
};

export default function AdminRevenuePage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();
  const [form, setForm] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [durationInput, setDurationInput] = useState('');
  const [packageModal, setPackageModal] = useState(false);
  const [editingPkgIndex, setEditingPkgIndex] = useState<number | null>(null);
  const [pkgForm, setPkgForm] = useState<PremiumPackage>({ name: '', price: 0, durationDays: 30, features: [] });
  const [featureInput, setFeatureInput] = useState('');

  useEffect(() => {
    api.get<SiteSettings>('/settings')
      .then(({ data }) => {
        setForm({
          ...defaultSettings,
          ...data,
          featuredListing: { ...defaultSettings.featuredListing, ...data.featuredListing },
          premiumMembership: { ...defaultSettings.premiumMembership, ...data.premiumMembership },
          commission: { ...defaultSettings.commission, ...data.commission },
          aiUsageLimit: { ...defaultSettings.aiUsageLimit, ...data.aiUsageLimit },
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/admin/settings', {
        featuredListing: form.featuredListing,
        premiumMembership: form.premiumMembership,
        commission: form.commission,
        aiUsageLimit: form.aiUsageLimit,
      });
      toast.success(isTr ? 'Ayarlar kaydedildi' : 'Settings saved');
    } catch {
      toast.error(isTr ? 'Kaydetme başarısız' : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const addDuration = () => {
    const val = parseInt(durationInput);
    if (!val || val <= 0) return;
    if (form.featuredListing.durationOptions.includes(val)) return;
    setForm(f => ({
      ...f,
      featuredListing: {
        ...f.featuredListing,
        durationOptions: [...f.featuredListing.durationOptions, val].sort((a, b) => a - b),
      },
    }));
    setDurationInput('');
  };

  const removeDuration = (val: number) => {
    setForm(f => ({
      ...f,
      featuredListing: {
        ...f.featuredListing,
        durationOptions: f.featuredListing.durationOptions.filter(d => d !== val),
      },
    }));
  };

  const openPackageModal = (index?: number) => {
    if (index !== undefined) {
      setEditingPkgIndex(index);
      setPkgForm({ ...form.premiumMembership.packages[index] });
    } else {
      setEditingPkgIndex(null);
      setPkgForm({ name: '', price: 0, durationDays: 30, features: [] });
    }
    setFeatureInput('');
    setPackageModal(true);
  };

  const savePackage = () => {
    if (!pkgForm.name || pkgForm.price <= 0) return;
    const packages = [...form.premiumMembership.packages];
    if (editingPkgIndex !== null) {
      packages[editingPkgIndex] = pkgForm;
    } else {
      packages.push(pkgForm);
    }
    setForm(f => ({ ...f, premiumMembership: { ...f.premiumMembership, packages } }));
    setPackageModal(false);
  };

  const deletePackage = (index: number) => {
    setForm(f => ({
      ...f,
      premiumMembership: {
        ...f.premiumMembership,
        packages: f.premiumMembership.packages.filter((_, i) => i !== index),
      },
    }));
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setPkgForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
    setFeatureInput('');
  };

  if (!user || user.role !== 'admin') return <Navigate to="/" replace />;
  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={isTr ? 'Admin - Gelir Yönetimi' : 'Admin - Revenue'} />

      <div className="flex items-center gap-3 mb-6">
        <DollarSign size={24} className="text-[#2D6A4F]" />
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'Gelir Yönetimi' : 'Revenue Management'}</h1>
      </div>

      <div className="space-y-6">
        {/* Öne Çıkan İlan */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {isTr ? 'Öne Çıkan İlan' : 'Featured Listing'}
            </h2>
            <Toggle
              checked={form.featuredListing.enabled}
              onChange={v => setForm(f => ({ ...f, featuredListing: { ...f.featuredListing, enabled: v } }))}
            />
          </div>
          <Input
            label={isTr ? 'İlan Başına Fiyat (₺)' : 'Price Per Listing (₺)'}
            type="number"
            min={0}
            value={form.featuredListing.pricePerListing}
            onChange={e => setForm(f => ({ ...f, featuredListing: { ...f.featuredListing, pricePerListing: Number(e.target.value) } }))}
          />
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              {isTr ? 'Süre Seçenekleri (gün)' : 'Duration Options (days)'}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.featuredListing.durationOptions.map(d => (
                <span key={d} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] text-sm font-medium">
                  {d} {isTr ? 'gün' : 'days'}
                  <button type="button" onClick={() => removeDuration(d)} className="hover:text-[#C1341B]"><X size={14} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                type="number"
                min={1}
                placeholder={isTr ? 'Gün sayısı' : 'Days'}
                value={durationInput}
                onChange={e => setDurationInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDuration())}
              />
              <Button size="sm" onClick={addDuration}><Plus size={14} /></Button>
            </div>
          </div>
        </div>

        {/* Premium Üyelik */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {isTr ? 'Premium Üyelik' : 'Premium Membership'}
            </h2>
            <Toggle
              checked={form.premiumMembership.enabled}
              onChange={v => setForm(f => ({ ...f, premiumMembership: { ...f.premiumMembership, enabled: v } }))}
            />
          </div>
          <div className="space-y-3">
            {form.premiumMembership.packages.map((pkg, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-input)]">
                <div>
                  <p className="font-medium text-sm">{pkg.name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{pkg.price}₺ / {pkg.durationDays} {isTr ? 'gün' : 'days'}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openPackageModal(i)}>{isTr ? 'Düzenle' : 'Edit'}</Button>
                  <Button size="sm" variant="ghost" onClick={() => deletePackage(i)}><Trash2 size={14} className="text-[#C1341B]" /></Button>
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" onClick={() => openPackageModal()}>
            <Plus size={14} className="mr-1" />
            {isTr ? 'Paket Ekle' : 'Add Package'}
          </Button>
        </div>

        {/* Komisyon */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {isTr ? 'Komisyon' : 'Commission'}
            </h2>
            <Toggle
              checked={form.commission.enabled}
              onChange={v => setForm(f => ({ ...f, commission: { ...f.commission, enabled: v } }))}
            />
          </div>
          <Input
            label={isTr ? 'Komisyon Oranı (%)' : 'Commission Rate (%)'}
            type="number"
            min={0}
            max={100}
            value={form.commission.percentage}
            onChange={e => setForm(f => ({ ...f, commission: { ...f.commission, percentage: Number(e.target.value) } }))}
          />
        </div>

        {/* AI Teşhis Limiti */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
              {isTr ? 'AI Teşhis Limiti' : 'AI Diagnosis Limit'}
            </h2>
            <Toggle
              checked={form.aiUsageLimit.enabled}
              onChange={v => setForm(f => ({ ...f, aiUsageLimit: { ...f.aiUsageLimit, enabled: v } }))}
            />
          </div>
          <Input
            label={isTr ? 'Günlük Ücretsiz Kullanım' : 'Daily Free Usage'}
            type="number"
            min={1}
            value={form.aiUsageLimit.dailyFreeCount}
            onChange={e => setForm(f => ({ ...f, aiUsageLimit: { ...f.aiUsageLimit, dailyFreeCount: Number(e.target.value) } }))}
          />
        </div>

        <Button onClick={handleSave} loading={saving} className="w-full">
          <Save size={14} className="mr-2" />
          {isTr ? 'Kaydet' : 'Save'}
        </Button>
      </div>

      {/* Package Modal */}
      <Modal isOpen={packageModal} onClose={() => setPackageModal(false)} title={editingPkgIndex !== null ? (isTr ? 'Paketi Düzenle' : 'Edit Package') : (isTr ? 'Yeni Paket' : 'New Package')}>
        <div className="space-y-4">
          <Input
            label={isTr ? 'Paket Adı' : 'Package Name'}
            value={pkgForm.name}
            onChange={e => setPkgForm(f => ({ ...f, name: e.target.value }))}
          />
          <Input
            label={isTr ? 'Fiyat (₺)' : 'Price (₺)'}
            type="number"
            min={0}
            value={pkgForm.price}
            onChange={e => setPkgForm(f => ({ ...f, price: Number(e.target.value) }))}
          />
          <Input
            label={isTr ? 'Süre (gün)' : 'Duration (days)'}
            type="number"
            min={1}
            value={pkgForm.durationDays}
            onChange={e => setPkgForm(f => ({ ...f, durationDays: Number(e.target.value) }))}
          />
          <div>
            <label className="block text-xs font-medium uppercase tracking-wide text-[var(--text-secondary)] mb-1.5">
              {isTr ? 'Özellikler' : 'Features'}
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {pkgForm.features.map((feat, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] text-sm">
                  {feat}
                  <button type="button" onClick={() => setPkgForm(f => ({ ...f, features: f.features.filter((_, fi) => fi !== i) }))} className="hover:text-[#C1341B]">
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder={isTr ? 'Özellik ekle' : 'Add feature'}
                value={featureInput}
                onChange={e => setFeatureInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
              />
              <Button size="sm" onClick={addFeature}><Plus size={14} /></Button>
            </div>
          </div>
          <Button onClick={savePackage} className="w-full">
            {editingPkgIndex !== null ? (isTr ? 'Güncelle' : 'Update') : (isTr ? 'Ekle' : 'Add')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
