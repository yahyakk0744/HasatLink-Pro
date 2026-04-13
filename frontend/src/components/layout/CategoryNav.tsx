import { useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wheat, Truck, HardHat, Wrench, Mountain, Warehouse } from 'lucide-react';
import type { ComponentType } from 'react';
import { CATEGORY_LABELS } from '../../utils/constants';
import api from '../../config/api';
import CowIcon from '../icons/CowIcon';

interface IconProps { size?: number; className?: string }

const CATEGORY_ICONS: Record<string, ComponentType<IconProps>> = {
  pazar: Wheat,
  lojistik: Truck,
  isgucu: HardHat,
  ekipman: Wrench,
  arazi: Mountain,
  depolama: Warehouse,
  hayvancilik: CowIcon,
};

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
        <div className="flex items-center justify-center gap-1.5 overflow-x-auto py-2 scrollbar-hide">
          {categories.map(([key, cat]) => {
            const Icon = CATEGORY_ICONS[key];
            return (
              <NavLink
                key={key}
                to={`/${key}`}
                onMouseEnter={() => handleHover(key)}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap transition-all shrink-0 text-[11px] font-semibold uppercase tracking-wider ${
                    isActive
                      ? 'bg-[var(--bg-invert)] text-[var(--text-on-invert)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
                  }`
                }
              >
                {Icon ? <Icon size={15} className="shrink-0" /> : <span className="text-sm leading-none shrink-0">{cat.icon}</span>}
                <span className="leading-none">{t(`categories.${key}`)}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
