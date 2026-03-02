import { useState, useEffect } from 'react';
import AdminLayout from '../components/admin/AdminLayout';
import { Bell, Send, Users, User, MapPin, Clock } from 'lucide-react';
import api from '../config/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/ui/LoadingSpinner';

type TargetType = 'all' | 'specific' | 'city';
type Tab = 'send' | 'history';

interface NotificationHistory {
  _id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
}

const TYPES = [
  { value: 'sistem', label: 'Sistem' },
  { value: 'ilan', label: 'İlan' },
  { value: 'borsa', label: 'Borsa' },
  { value: 'hava', label: 'Hava' },
];

const TYPE_COLORS: Record<string, string> = {
  sistem: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  ilan: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  borsa: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  hava: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
};

export default function AdminNotificationsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('send');

  // Send form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('sistem');
  const [target, setTarget] = useState<TargetType>('all');
  const [userIds, setUserIds] = useState('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sentCount: number; totalTargeted: number } | null>(null);

  // History state
  const [history, setHistory] = useState<NotificationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data } = await api.get('/admin/notifications/history');
      setHistory(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Bildirim geçmişi yüklenemedi');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        message: message.trim(),
        type,
      };
      if (target === 'specific' && userIds.trim()) {
        payload.userIds = userIds.split(',').map((id) => id.trim()).filter(Boolean);
      }
      if (target === 'city' && city.trim()) {
        payload.city = city.trim();
      }
      const { data } = await api.post('/admin/notifications/broadcast', payload);
      setResult(data);
      toast.success(`${data.sentCount} kullanıcıya bildirim gönderildi`);
      setTitle('');
      setMessage('');
      setUserIds('');
      setCity('');
    } catch {
      toast.error('Bildirim gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AdminLayout title="Bildirim Yönetimi" icon={<Bell size={24} />}>
      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'send'
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'
          }`}
        >
          <Send size={16} />
          Gönder
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-[#2D6A4F] text-white'
              : 'bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-input)]'
          }`}
        >
          <Clock size={16} />
          Geçmiş
        </button>
      </div>

      {/* Tab 1: Bildirim Gönder */}
      {activeTab === 'send' && (
        <div className="max-w-2xl">
          <form
            onSubmit={handleSend}
            className="bg-[var(--bg-surface)] rounded-2xl p-6 shadow-sm space-y-5"
          >
            {/* Target Selection */}
            <div>
              <label className="block text-xs font-medium uppercase text-[#6B6560] mb-2">
                Hedef
              </label>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setTarget('all')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    target === 'all'
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-[var(--bg-input)] text-[var(--text-primary)]'
                  }`}
                >
                  <Users size={16} />
                  Tüm Kullanıcılar
                </button>
                <button
                  type="button"
                  onClick={() => setTarget('specific')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    target === 'specific'
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-[var(--bg-input)] text-[var(--text-primary)]'
                  }`}
                >
                  <User size={16} />
                  Seçili Kullanıcılar
                </button>
                <button
                  type="button"
                  onClick={() => setTarget('city')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    target === 'city'
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-[var(--bg-input)] text-[var(--text-primary)]'
                  }`}
                >
                  <MapPin size={16} />
                  Şehre Göre
                </button>
              </div>
            </div>

            {/* Specific Users Input */}
            {target === 'specific' && (
              <div>
                <label className="block text-xs font-medium uppercase text-[#6B6560] mb-1">
                  Kullanıcı ID'leri (virgülle ayırın)
                </label>
                <input
                  value={userIds}
                  onChange={(e) => setUserIds(e.target.value)}
                  placeholder="user1, user2, user3"
                  className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                />
              </div>
            )}

            {/* City Input */}
            {target === 'city' && (
              <div>
                <label className="block text-xs font-medium uppercase text-[#6B6560] mb-1">
                  Şehir Adı
                </label>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ankara"
                  className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
                />
              </div>
            )}

            {/* Notification Type */}
            <div>
              <label className="block text-xs font-medium uppercase text-[#6B6560] mb-2">
                Bildirim Tipi
              </label>
              <div className="flex gap-2 flex-wrap">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      type === t.value
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-[var(--bg-input)] text-[var(--text-primary)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium uppercase text-[#6B6560] mb-1">
                Başlık
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={100}
                className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium uppercase text-[#6B6560] mb-1">
                Mesaj
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                rows={4}
                maxLength={500}
                className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F] resize-none"
              />
              <p className="text-[10px] text-[#6B6560] text-right mt-1">
                {message.length}/500
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !title.trim() || !message.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#2D6A4F] text-white rounded-xl font-semibold text-sm hover:bg-[#1B4332] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <Send size={16} />
              )}
              {loading ? 'Gönderiliyor...' : 'Bildirimi Gönder'}
            </button>

            {/* Result */}
            {result && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm text-green-800 dark:text-green-300">
                {result.sentCount} / {result.totalTargeted} kullanıcıya başarıyla gönderildi.
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Bildirim Geçmişi */}
      {activeTab === 'history' && (
        <div className="max-w-3xl">
          {historyLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : history.length === 0 ? (
            <div className="bg-[var(--bg-surface)] rounded-2xl p-8 text-center shadow-sm">
              <Bell size={40} className="mx-auto text-[var(--text-secondary)] opacity-40 mb-3" />
              <p className="text-sm text-[var(--text-secondary)]">
                Henüz bildirim gönderilmemiş.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div
                  key={item._id}
                  className="bg-[var(--bg-surface)] rounded-2xl p-4 sm:p-5 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Type badge and content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold uppercase ${
                            TYPE_COLORS[item.type] || TYPE_COLORS.sistem
                          }`}
                        >
                          {item.type}
                        </span>
                        <span className="text-[11px] text-[var(--text-secondary)]">
                          {formatDate(item.createdAt)}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-0.5">
                        {item.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-2">
                        {item.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
