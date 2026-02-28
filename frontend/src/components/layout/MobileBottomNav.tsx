import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ShoppingBag, Map, MessageSquare, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessageContext } from '../../contexts/MessageContext';

const navItems = [
  { path: '/', icon: Home, labelKey: 'welcome' },
  { path: '/pazar', icon: ShoppingBag, labelKey: 'categories.pazar' },
  { path: '/harita', icon: Map, labelKey: 'map.title' },
  { path: '/mesajlar', icon: MessageSquare, labelKey: 'messages.title', auth: true },
  { path: '/profil', icon: User, labelKey: 'profile', auth: true },
];

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { unreadCount } = useMessageContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--glass-surface)] backdrop-blur-lg border-t border-[var(--border-subtle)] md:hidden">
      <div className="flex items-center justify-around py-2">
        {navItems.map(item => {
          if (item.auth && !user) {
            return (
              <NavLink
                key={item.path}
                to="/giris"
                className={({ isActive }) =>
                  `flex flex-col items-center gap-0.5 px-3 py-1 ${isActive ? 'text-[#2D6A4F]' : 'text-[#6B6560]'}`
                }
              >
                <item.icon size={20} />
                <span className="text-[9px] font-medium uppercase">{t('login')}</span>
              </NavLink>
            );
          }
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${isActive ? 'text-[#2D6A4F]' : 'text-[#6B6560]'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <item.icon size={20} />
                    {item.path === '/mesajlar' && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#2D6A4F] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium uppercase">{t(item.labelKey)}</span>
                  {isActive && (
                    <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#2D6A4F]" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
