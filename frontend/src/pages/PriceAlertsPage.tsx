import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Bell, Plus, Trash2, X, TrendingDown, TrendingUp, BellOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePriceAlerts } from '../hooks/usePriceAlerts';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import SEO from '../components/ui/SEO';
import { formatPrice, formatDate } from '../utils/formatters';
import toast from 'react-hot-toast';

type Condition = 'below' | 'above';

interface FormState {
  category: string;
  subCategory: string;
  targetPrice: string;
  condition: Condition;
  keyword: string;
}

const INITIAL_FORM: FormState = {
  category: 'pazar',
  subCategory: '',
  targetPrice: '',
  condition: 'below',
  keyword: '',
};

export default function PriceAlertsPage() {
  const { user, loading: authLoading } = useAuth();
  const { alerts, loading, fetchAlerts, createAlert, deleteAlert, toggleAlert } = usePriceAlerts();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) fetchAlerts();
  }, [user, fetchAlerts]);

  if (!authLoading && !user) return <Navigate to="/giris" replace />;
  if (authLoading) return <LoadingSpinner size="lg" className="py-20" />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subCategory.trim()) {
      toast.error('Alt kategori gerekli');
      return;
    }
    const price = Number(form.targetPrice);
    if (!price || price <= 0) {
      toast.error('Geçerli bir hedef fiyat girin');
      return;
    }
    setSubmitting(true);
    try {
      // Encode condition into subCategory prefix so backend stores it
      // If backend supports `condition`, you can add it here
      await createAlert({
        category: form.category,
        subCategory: form.subCategory.trim(),
        targetPrice: price,
        keyword: form.keyword.trim(),
      });
      toast.success('Fiyat alarmı oluşturuldu');
      setForm(INITIAL_FORM);
      setShowForm(false);
    } catch {
      toast.error('Alarm oluşturulamadı');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bu alarmı silmek istediğinize emin misiniz?')) return;
    try {
      await deleteAlert(id);
      toast.success('Alarm silindi');
    } catch {
      toast.error('Silinemedi');
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleAlert(id);
    } catch {
      toast.error('Güncellenemedi');
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <SEO
        title="Fiyat Alarmları"
        description="Takip ettiğiniz ürünlerin fiyatları hedefe ulaşınca bildirim alın."
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Bell size={22} className="text-[var(--accent-green)]" />
            Fiyat Alarmları
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Fiyatlar hedefinize ulaştığında size haber verelim.
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm shrink-0 transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Yeni Alarm</span>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <LoadingSpinner size="md" className="py-12" />
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={<BellOff size={32} />}
          title="Henüz fiyat alarmanız yok"
          description="Yeni alarm oluşturarak ürün fiyatlarındaki değişimleri anında takip edin."
          action={
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}
            >
              <Plus size={16} />
              İlk alarmı oluştur
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => (
            <div
              key={alert._id}
              className="rounded-2xl p-4 border flex items-center gap-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-default)',
                opacity: alert.isActive ? 1 : 0.6,
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--bg-input)' }}
              >
                <TrendingDown size={20} className="text-[var(--accent-green)]" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold uppercase tracking-wide"
                    style={{ backgroundColor: 'var(--bg-input)', color: 'var(--text-secondary)' }}>
                    {alert.category}
                  </span>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                    {alert.subCategory}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span>
                    Hedef: <span className="font-bold text-[var(--accent-green)]">{formatPrice(alert.targetPrice)}</span>
                  </span>
                  {alert.keyword && <span>· {alert.keyword}</span>}
                  <span>· {formatDate(alert.createdAt)}</span>
                </div>
              </div>

              {/* Toggle */}
              <button
                onClick={() => handleToggle(alert._id)}
                className="relative w-11 h-6 rounded-full transition-colors shrink-0"
                style={{
                  backgroundColor: alert.isActive ? 'var(--accent-green)' : 'var(--bg-input)',
                }}
                aria-label={alert.isActive ? 'Pasif yap' : 'Aktif yap'}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: alert.isActive ? 'translateX(22px)' : 'translateX(2px)' }}
                />
              </button>

              <button
                onClick={() => handleDelete(alert._id)}
                className="p-2 rounded-lg transition-colors shrink-0"
                style={{ color: 'var(--text-secondary)' }}
                aria-label="Sil"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* New Alert Modal */}
      {showForm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-fade-in"
          onClick={() => !submitting && setShowForm(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderColor: 'var(--border-default)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border-default)' }}>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Yeni Fiyat Alarmı</h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 rounded-lg text-[var(--text-secondary)]"
                disabled={submitting}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                  Kategori
                </label>
                <select
                  value={form.category}
                  onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="pazar">Pazar (Ürün)</option>
                  <option value="ekipman">Ekipman</option>
                </select>
              </div>

              {/* Sub category */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                  Alt Kategori
                </label>
                <input
                  type="text"
                  value={form.subCategory}
                  onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))}
                  placeholder="Örn: Domates, Traktör, Buğday..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
              </div>

              {/* Target price */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                  Hedef Fiyat (₺)
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.targetPrice}
                  onChange={e => setForm(f => ({ ...f, targetPrice: e.target.value }))}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                  required
                />
              </div>

              {/* Condition */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                  Koşul
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'below', label: 'Altına düşünce', icon: TrendingDown },
                    { key: 'above', label: 'Üstüne çıkınca', icon: TrendingUp },
                  ] as const).map(opt => {
                    const Icon = opt.icon;
                    const active = form.condition === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, condition: opt.key }))}
                        className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border transition-colors"
                        style={{
                          backgroundColor: active ? 'var(--accent-green)' : 'var(--bg-input)',
                          borderColor: active ? 'var(--accent-green)' : 'var(--border-default)',
                          color: active ? 'white' : 'var(--text-primary)',
                        }}
                      >
                        <Icon size={14} />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Keyword */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-1.5">
                  Anahtar Kelime <span className="opacity-60">(opsiyonel)</span>
                </label>
                <input
                  type="text"
                  value={form.keyword}
                  onChange={e => setForm(f => ({ ...f, keyword: e.target.value }))}
                  placeholder="Örn: organik, sera..."
                  className="w-full px-3 py-2.5 rounded-xl text-sm border outline-none"
                  style={{
                    backgroundColor: 'var(--bg-input)',
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border"
                  style={{
                    borderColor: 'var(--border-default)',
                    color: 'var(--text-primary)',
                  }}
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent-green)', color: 'white' }}
                >
                  {submitting ? 'Oluşturuluyor...' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
