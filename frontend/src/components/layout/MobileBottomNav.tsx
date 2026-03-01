import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ShoppingBag, Map, MessageSquare, User, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessageContext } from '../../contexts/MessageContext';

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { unreadCount } = useMessageContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--glass-surface)] backdrop-blur-lg border-t border-[var(--border-subtle)] md:hidden">
      <div className="flex items-center justify-around py-2">
        {/* Home */}
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${isActive ? 'text-[#2D6A4F]' : 'text-[#6B6560]'}`
          }
        >
          {({ isActive }) => (
            <>
              <Home size={20} />
              <span className="text-[9px] font-medium uppercase">{t('welcome').split("'")[0] || 'Ana Sayfa'}</span>
              {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#2D6A4F]" />}
            </>
          )}
        </NavLink>

        {/* Pazar */}
        <NavLink
          to="/pazar"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${isActive ? 'text-[#2D6A4F]' : 'text-[#6B6560]'}`
          }
        >
          {({ isActive }) => (
            <>
              <ShoppingBag size={20} />
              <span className="text-[9px] font-medium uppercase">{t('categories.pazar')}</span>
              {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#2D6A4F]" />}
            </>
          )}
        </NavLink>

        {/* Harita */}
        <NavLink
          to="/harita"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${isActive ? 'text-[#2D6A4F]' : 'text-[#6B6560]'}`
          }
        >
          {({ isActive }) => (
            <>
              <Map size={20} />
              <span className="text-[9px] font-medium uppercase">{t('map.title')}</span>
              {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#2D6A4F]" />}
            </>
          )}
        </NavLink>

        {/* Mesajlar / Profil — when logged in */}
        {user ? (
          <>
            <NavLink
              to="/mesajlar"
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${isActive ? 'text-[#2D6A4F]' : 'text-[#6B6560]'}`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <MessageSquare size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[#2D6A4F] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium uppercase">{t('messages.title')}</span>
                  {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#2D6A4F]" />}
                </>
              )}
            </NavLink>
            <NavLink
              to="/profil"
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${isActive ? 'text-[#2D6A4F]' : 'text-[#6B6560]'}`
              }
            >
              {({ isActive }) => (
                <>
                  <User size={20} />
                  <span className="text-[9px] font-medium uppercase">{t('profile')}</span>
                  {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#2D6A4F]" />}
                </>
              )}
            </NavLink>
          </>
        ) : (
          /* Single login button when not authenticated */
          <NavLink
            to="/giris"
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1 relative transition-colors ${isActive ? 'text-[#2D6A4F]' : 'text-[#6B6560]'}`
            }
          >
            {({ isActive }) => (
              <>
                <LogIn size={20} />
                <span className="text-[9px] font-medium uppercase">{t('login')}</span>
                {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[#2D6A4F]" />}
              </>
            )}
          </NavLink>
        )}
      </div>
    </nav>
  );
}
