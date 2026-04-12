import { useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CATEGORY_LABELS } from '../../utils/constants';
import api from '../../config/api';

// Prefetch on hover — warm up the backend + browser cache
const prefetched = new Set<string>();
function prefetchCategory(type: string) {
  if (prefetched.has(type)) return;
  prefetched.add(type);
  api.get('/listings', { params: { type, limit: '12' } }).catch(() => {});
}

export default function CategoryNav() {
  const { t } = useTranslation();
  const categories = Object.entries(CATEGORY_LABELS);

  const handleHover = useCallback((key: string) => {
    prefetchCategory(key);
  }, []);

  return (
    <nav className="bg-[var(--bg-surface)] border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-1.5 overflow-x-auto py-2 scrollbar-hide flex-nowrap">
          {categories.map(([key, cat]) => (
            <NavLink
              key={key}
              to={`/${key}`}
              onMouseEnter={() => handleHover(key)}
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
