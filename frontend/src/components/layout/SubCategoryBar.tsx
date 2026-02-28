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
          className={`px-4 py-1.5 text-[10px] font-medium uppercase tracking-wider rounded-full whitespace-nowrap transition-all ${
            active === cat
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-[#F5F3EF] text-[#6B6560] hover:bg-[#EBE7E0]'
          }`}
        >
          {cat === 'HEPSİ' ? t('all') : cat}
        </button>
      ))}
    </div>
  );
}
