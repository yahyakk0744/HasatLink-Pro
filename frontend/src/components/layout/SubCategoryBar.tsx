import { useTranslation } from 'react-i18next';

interface SubCategoryBarProps {
  categories: readonly string[];
  active: string;
  onChange: (cat: string) => void;
}

export default function SubCategoryBar({ categories, active, onChange }: SubCategoryBarProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-3 scrollbar-hide">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-full whitespace-nowrap transition-all active:scale-95 ${
            active === cat
              ? 'bg-[#2D6A4F] text-white scale-105'
              : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          {cat === 'HEPSİ' ? t('all') : cat}
        </button>
      ))}
    </div>
  );
}
