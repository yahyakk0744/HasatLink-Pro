import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, ShoppingBag, Map, MessageSquare, User, LogIn, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useMessageContext } from '../../contexts/MessageContext';
import { hapticLight } from '../../utils/native';

export default function MobileBottomNav() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { unreadCount } = useMessageContext();
  const isAdmin = user?.role === 'admin';

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 px-2 py-1 relative transition-colors min-w-0 min-h-0 ${isActive ? 'text-[var(--accent-green)]' : 'text-[var(--text-secondary)]'}`;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--glass-surface)] backdrop-blur-lg border-t border-[var(--border-subtle)] md:hidden safe-area-bottom">
      <div className="flex items-center justify-around py-2" onClick={() => hapticLight()}>
        {/* Home */}
        <NavLink to="/" end className={navClass}>
          {({ isActive }) => (
            <>
              <Home size={20} />
              <span className="text-[9px] font-medium uppercase">{t('welcome').split("'")[0] || 'Ana Sayfa'}</span>
              {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--accent-green)]" />}
            </>
          )}
        </NavLink>

        {/* Pazar */}
        <NavLink to="/pazar" className={navClass}>
          {({ isActive }) => (
            <>
              <ShoppingBag size={20} />
              <span className="text-[9px] font-medium uppercase">{t('categories.pazar')}</span>
              {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--accent-green)]" />}
            </>
          )}
        </NavLink>

        {/* Harita */}
        <NavLink to="/harita" className={navClass}>
          {({ isActive }) => (
            <>
              <Map size={20} />
              <span className="text-[9px] font-medium uppercase">{t('map.title')}</span>
              {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--accent-green)]" />}
            </>
          )}
        </NavLink>

        {/* Mesajlar / Admin / Profil — when logged in */}
        {user ? (
          <>
            <NavLink to="/mesajlar" className={navClass}>
              {({ isActive }) => (
                <>
                  <div className="relative">
                    <MessageSquare size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 bg-[var(--accent-green)] text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  <span className="text-[9px] font-medium uppercase">{t('messages.title')}</span>
                  {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--accent-green)]" />}
                </>
              )}
            </NavLink>

            {/* Admin link for admin users */}
            {isAdmin ? (
              <NavLink to="/admin" className={navClass}>
                {({ isActive }) => (
                  <>
                    <Shield size={20} />
                    <span className="text-[9px] font-medium uppercase">Admin</span>
                    {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--accent-green)]" />}
                  </>
                )}
              </NavLink>
            ) : (
              <NavLink to="/profil" className={navClass}>
                {({ isActive }) => (
                  <>
                    <User size={20} />
                    <span className="text-[9px] font-medium uppercase">{t('profile')}</span>
                    {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--accent-green)]" />}
                  </>
                )}
              </NavLink>
            )}
          </>
        ) : (
          /* Single login button when not authenticated */
          <NavLink to="/giris" className={navClass}>
            {({ isActive }) => (
              <>
                <LogIn size={20} />
                <span className="text-[9px] font-medium uppercase">{t('login')}</span>
                {isActive && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-[var(--accent-green)]" />}
              </>
            )}
          </NavLink>
        )}
      </div>
    </nav>
  );
}
