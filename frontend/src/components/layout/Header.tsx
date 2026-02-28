import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Bell, User, LogOut, MessageSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useMessageContext } from '../../contexts/MessageContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import NotificationDropdown from '../notifications/NotificationDropdown';

export default function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationContext();
  const { unreadCount: messageUnreadCount } = useMessageContext();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pazar?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-[#D6D0C8]/50">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight">
            <span className="text-[#1A1A1A]">HASAT</span>
            <span className="text-[#2D6A4F]">LiNK</span>
          </h1>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6560]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2 bg-[#F5F3EF] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            />
          </div>
        </form>

        <div className="flex items-center gap-3 ml-auto">
          <LanguageSwitcher />

          {/* Messages */}
          {user && (
            <Link to="/mesajlar" className="relative p-2 hover:bg-[#F5F3EF] rounded-full transition-colors">
              <MessageSquare size={20} />
              {messageUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#2D6A4F] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {messageUnreadCount > 9 ? '9+' : messageUnreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Notifications */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-[#F5F3EF] rounded-full transition-colors"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[#C1341B] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </div>
          )}

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-2">
              <Link
                to="/profil"
                className="flex items-center gap-2 px-3 py-1.5 bg-[#F5F3EF] rounded-full hover:bg-[#EBE7E0] transition-colors"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <User size={16} />
                )}
                <span className="text-xs font-semibold uppercase hidden sm:block">{user.name}</span>
              </Link>
              <button onClick={logout} className="p-2 hover:bg-[#F5F3EF] rounded-full transition-colors" title={t('logout')}>
                <LogOut size={16} className="text-[#6B6560]" />
              </button>
            </div>
          ) : (
            <Link
              to="/giris"
              className="px-4 py-2 bg-[#2D6A4F] text-white text-xs font-semibold tracking-wide rounded-full hover:bg-[#1B4332] transition-colors"
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
