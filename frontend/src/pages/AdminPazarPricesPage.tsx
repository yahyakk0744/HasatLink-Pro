import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import AdminLayout from '../components/admin/AdminLayout';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';
import type { HasatlinkPazarItem } from '../types';

const categoryLabels: Record<string, string> = {
  sebze: 'Sebze',
  meyve: 'Meyve',
  tahıl: 'Tahıl',
  baklagil: 'Baklagil',
  diğer: 'Diğer',
};

export default function AdminPazarPricesPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const [items, setItems] = useState<HasatlinkPazarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCat, setFilterCat] = useState('');

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/hasatlink-pazar');
      setItems(data);
    } catch {
      toast.error(isTr ? 'Fiyatlar yüklenemedi' : 'Failed to load prices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrices(); }, []);

  const categories = [...new Set(items.map(i => i.category))];
  const filtered = filterCat ? items.filter(i => i.category === filterCat) : items;

  return (
    <AdminLayout title="HasatLink Pazarı" icon={<ShoppingCart size={24} />}>
      <div className="flex justify-end mb-4">
        <button onClick={fetchPrices} className="p-2 rounded-xl hover:bg-[var(--bg-input)] transition-colors" title={isTr ? 'Yenile' : 'Refresh'}>
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 mb-6 shadow-sm">
        <p className="text-xs text-[var(--text-secondary)]">
          {isTr
            ? 'Bu fiyatlar kullanıcıların yayınladığı ilanlardan otomatik olarak hesaplanır. Manuel düzenleme gerekmez.'
            : 'These prices are automatically calculated from user listings. No manual editing needed.'}
        </p>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-1 bg-[var(--bg-input)] rounded-xl p-1 mb-6 overflow-x-auto">
          <button
            onClick={() => setFilterCat('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${!filterCat ? 'bg-[var(--bg-invert)] text-[var(--text-on-invert)]' : 'text-[var(--text-secondary)]'}`}
          >
            {isTr ? 'Tümü' : 'All'} ({items.length})
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filterCat === cat ? 'bg-[var(--bg-invert)] text-[var(--text-on-invert)]' : 'text-[var(--text-secondary)]'}`}
            >
              {categoryLabels[cat] || cat} ({items.filter(i => i.category === cat).length})
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner size="lg" className="py-20" />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-[var(--text-secondary)]">
          {isTr ? 'Henüz pazar fiyatı yok. Kullanıcılar ilan yayınladıkça fiyatlar oluşacaktır.' : 'No market prices yet.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-4 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <span className="text-[10px] text-[var(--text-secondary)] capitalize">{categoryLabels[item.category] || item.category}</span>
                </div>
                {item.change > 0 ? (
                  <TrendingUp size={18} className="text-emerald-500" />
                ) : item.change < 0 ? (
                  <TrendingDown size={18} className="text-red-500" />
                ) : (
                  <Minus size={18} className="text-gray-400" />
                )}
              </div>
              <div className="flex items-end gap-2">
                <span className="text-xl font-bold text-[#2D6A4F]">₺{item.price.toFixed(2)}</span>
                <span className="text-xs text-[var(--text-secondary)] mb-0.5">/{item.unit}</span>
                {item.change !== 0 && (
                  <span className={`text-xs font-medium ml-auto ${item.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {item.change > 0 ? '+' : ''}{item.change.toFixed(1)}%
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--border-default)] text-[10px] text-[var(--text-secondary)]">
                <span>Min: ₺{item.minPrice.toFixed(2)}</span>
                <span>Max: ₺{item.maxPrice.toFixed(2)}</span>
                <span className="ml-auto">{item.listingCount} {isTr ? 'ilan' : 'listings'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
