import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Search,
  Leaf, Bug, ChevronDown, ChevronUp, Pill, Shield,
} from 'lucide-react';
import { useAIDiagnosis } from '../../hooks/useAIDiagnosis';

const URGENCY_STYLES = {
  low: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-200/50 dark:border-emerald-700/30' },
  medium: { bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200/50 dark:border-amber-700/30' },
  critical: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-400', border: 'border-red-200/50 dark:border-red-700/30' },
};

const CROP_ICONS: Record<string, string> = {
  'Zeytin': '🫒', 'Narenciye': '🍊', 'Domates': '🍅', 'Pamuk': '🌿',
  'Tahıl': '🌾', 'Üzüm': '🍇', 'Fındık': '🌰', 'Çay': '🍵',
  'Mısır': '🌽', 'Muz': '🍌', 'Nar': '🔴', 'Avokado': '🥑',
  'Elma': '🍎', 'Genel': '🌱',
};

export default function DiseaseLibrary() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { diseases, fetchDiseaseLibrary } = useAIDiagnosis();
  const [search, setSearch] = useState('');
  const [selectedCrop, setSelectedCrop] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchDiseaseLibrary();
  }, [fetchDiseaseLibrary]);

  const cropTypes = [...new Set(diseases.map(d => d.crop_type))];

  const filtered = diseases.filter(d => {
    const matchSearch = !search || d.disease.toLowerCase().includes(search.toLowerCase()) || d.crop_type.toLowerCase().includes(search.toLowerCase());
    const matchCrop = !selectedCrop || d.crop_type === selectedCrop;
    return matchSearch && matchCrop;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/20">
          <BookOpen size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-[17px] font-bold text-[var(--text-primary)] tracking-tight">
            {isTr ? 'Hastalık Kütüphanesi' : 'Disease Library'}
          </h3>
          <p className="text-[12px] text-[var(--text-secondary)]">
            {isTr ? `${diseases.length} hastalık kayıtlı` : `${diseases.length} diseases registered`}
          </p>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={isTr ? 'Hastalık ara...' : 'Search disease...'}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[var(--bg-input)] border border-[var(--border-default)] text-[13px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500/50"
          />
        </div>
      </div>

      {/* Crop type pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCrop('')}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors border ${
            !selectedCrop
              ? 'bg-emerald-500 text-white border-emerald-500'
              : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          {isTr ? 'Tümünü Göster' : 'Show All'}
        </button>
        {cropTypes.map(crop => (
          <button
            key={crop}
            onClick={() => setSelectedCrop(selectedCrop === crop ? '' : crop)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors border flex items-center gap-1.5 ${
              selectedCrop === crop
                ? 'bg-emerald-500 text-white border-emerald-500'
                : 'bg-[var(--bg-input)] text-[var(--text-secondary)] border-[var(--border-default)] hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            <span>{CROP_ICONS[crop] || '🌱'}</span>
            {crop}
          </button>
        ))}
      </div>

      {/* Disease Cards */}
      <div className="space-y-2.5">
        {filtered.map(d => {
          const style = URGENCY_STYLES[d.urgency];
          const isExpanded = expandedId === d.disease_code;

          return (
            <div
              key={d.disease_code}
              className={`rounded-2xl border overflow-hidden transition-all duration-300 ${style.border} ${isExpanded ? 'shadow-md' : 'shadow-sm'}`}
            >
              {/* Card header */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : d.disease_code)}
                className={`w-full flex items-center gap-3 p-4 text-left hover:bg-[var(--bg-surface-hover)] transition-colors`}
              >
                <div className={`w-10 h-10 rounded-xl ${style.bg} flex items-center justify-center shrink-0`}>
                  <Bug size={18} className={style.text} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{d.disease}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-[var(--text-tertiary)]">
                      {CROP_ICONS[d.crop_type] || '🌱'} {d.crop_type}
                    </span>
                    {d.is_seasonal && (
                      <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-[9px] font-bold animate-pulse">
                        {isTr ? 'AKTIF' : 'ACTIVE'}
                      </span>
                    )}
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${style.bg} ${style.text}`}>
                      {d.urgency === 'critical' ? (isTr ? 'KRİTİK' : 'CRITICAL')
                        : d.urgency === 'medium' ? (isTr ? 'ORTA' : 'MEDIUM')
                        : (isTr ? 'DÜŞÜK' : 'LOW')}
                    </span>
                  </div>
                </div>
                {isExpanded ? <ChevronUp size={16} className="text-[var(--text-tertiary)]" /> : <ChevronDown size={16} className="text-[var(--text-tertiary)]" />}
              </button>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 animate-fade-in border-t border-[var(--border-default)]/50">
                  {/* Treatment */}
                  <div className="flex items-start gap-2.5 pt-3">
                    <Pill size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase mb-0.5">{isTr ? 'Tedavi' : 'Treatment'}</p>
                      <p className="text-[12px] text-[var(--text-primary)] leading-relaxed">{d.treatment}</p>
                    </div>
                  </div>

                  {/* Prevention */}
                  <div className="flex items-start gap-2.5">
                    <Shield size={14} className="text-violet-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase mb-0.5">{isTr ? 'Önleme' : 'Prevention'}</p>
                      <p className="text-[12px] text-[var(--text-primary)] leading-relaxed">{d.prevention}</p>
                    </div>
                  </div>

                  {/* Recommended products */}
                  {d.recommended_products.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase mb-1.5">{isTr ? 'Önerilen Ürünler' : 'Products'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {d.recommended_products.map(p => (
                          <span key={p} className="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-[10px] font-medium border border-blue-200/40 dark:border-blue-700/30">
                            {p}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active regions */}
                  {d.active_regions.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase mb-1.5">{isTr ? 'Yaygın Bölgeler' : 'Active Regions'}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {d.active_regions.map(r => (
                          <span key={r} className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 text-[10px] font-medium border border-amber-200/40 dark:border-amber-700/30">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-12 gap-3">
          <Leaf size={32} className="text-[var(--text-tertiary)]" />
          <p className="text-[13px] text-[var(--text-secondary)]">
            {isTr ? 'Sonuç bulunamadı' : 'No results found'}
          </p>
        </div>
      )}
    </div>
  );
}
