import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CATEGORY_LABELS } from '../../utils/constants';

export default function CategoryNav() {
  const { t } = useTranslation();
  const categories = Object.entries(CATEGORY_LABELS);

  return (
    <nav className="bg-white border-b border-[#D6D0C8]/50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto py-2 scrollbar-hide">
          {categories.map(([key, cat]) => (
            <NavLink
              key={key}
              to={`/${key}`}
              className={({ isActive }) =>
                `flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-full whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-[#1A1A1A] text-white'
                    : 'text-[#6B6560] hover:bg-[#F5F3EF]'
                }`
              }
            >
              <span>{cat.icon}</span>
              <span>{t(`categories.${key}`)}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
