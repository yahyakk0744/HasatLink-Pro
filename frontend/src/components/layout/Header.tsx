import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Bell, User, LogOut, MessageSquare, Sun, Moon, Shield, Mic } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { useMessageContext } from '../../contexts/MessageContext';
import { useTheme } from '../../contexts/ThemeContext';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import NotificationDropdown from '../notifications/NotificationDropdown';

export default function Header() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotificationContext();
  const { unreadCount: messageUnreadCount } = useMessageContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) {
        setSearchQuery(transcript);
        navigate(`/pazar?search=${encodeURIComponent(transcript)}`);
      }
    };
    recognition.onerror = () => setIsListening(false);
    recognition.start();
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pazar?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 glass border-b border-[var(--border-subtle)]">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 md:gap-4">
        {/* Logo */}
        <Link to="/" className="shrink-0">
          <h1 className="text-lg md:text-2xl font-semibold tracking-tight">
            <span className="text-[var(--text-primary)]">HASAT</span>
            <span className="text-[#2D6A4F]">LiNK</span>
          </h1>
        </Link>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:block">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-10 pr-10 py-2 bg-[var(--bg-input)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)]"
            />
            {('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) && (
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full transition-colors ${isListening ? 'text-red-500 animate-pulse' : 'text-[var(--text-secondary)] hover:text-[var(--accent-green)]'}`}
                title="Sesli Arama"
              >
                <Mic size={14} />
              </button>
            )}
          </div>
        </form>

        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 ml-auto">
          <LanguageSwitcher />

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 md:p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun size={18} className="md:w-5 md:h-5" /> : <Moon size={18} className="md:w-5 md:h-5" />}
          </button>

          {/* Messages - hidden on mobile, accessible from bottom nav */}
          {user && (
            <Link to="/mesajlar" className="relative p-1.5 md:p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors hidden sm:flex">
              <MessageSquare size={18} className="md:w-5 md:h-5" />
              {messageUnreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-[var(--accent-green)] text-white text-[8px] md:text-[10px] font-bold rounded-full flex items-center justify-center">
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
                className="relative p-1.5 md:p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors"
              >
                <Bell size={18} className="md:w-5 md:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 bg-[var(--accent-red)] text-white text-[8px] md:text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <NotificationDropdown onClose={() => setShowNotifications(false)} />
              )}
            </div>
          )}

          {/* Admin - hidden on mobile, accessible from bottom nav */}
          {user?.role === 'admin' && (
            <Link to="/admin" className="p-1.5 md:p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors hidden sm:flex" title="Admin Panel">
              <Shield size={18} className="text-[var(--accent-green)] md:w-5 md:h-5" />
            </Link>
          )}

          {/* Auth */}
          {user ? (
            <div className="flex items-center gap-1 md:gap-2">
              <Link
                to="/profil"
                className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1.5 bg-[var(--bg-input)] rounded-full hover:bg-[var(--bg-surface-hover)] transition-colors"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt="" className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover" />
                ) : (
                  <User size={14} className="md:w-4 md:h-4" />
                )}
                <span className="text-xs font-semibold uppercase hidden sm:block text-[var(--text-primary)]">{user.name}</span>
              </Link>
              <button onClick={logout} className="p-1.5 md:p-2 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors hidden sm:flex" title={t('logout')}>
                <LogOut size={14} className="text-[var(--text-secondary)] md:w-4 md:h-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/giris"
              className="px-3 md:px-4 py-1.5 md:py-2 bg-[var(--accent-green)] text-white text-[10px] md:text-xs font-semibold tracking-wide rounded-full hover:opacity-90 transition-colors"
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
