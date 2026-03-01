import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CATEGORY_LABELS } from '../../utils/constants';

export default function CategoryNav() {
  const { t } = useTranslation();
  const categories = Object.entries(CATEGORY_LABELS);

  return (
    <nav className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-hide">
          {categories.map(([key, cat]) => (
            <NavLink
              key={key}
              to={`/${key}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all flex-shrink-0 ${
                  isActive
                    ? 'bg-[var(--bg-invert)] text-[var(--text-on-invert)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                }`
              }
            >
              <span className="text-base leading-none flex-shrink-0">{cat.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wider leading-none">{t(`categories.${key}`)}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
}
