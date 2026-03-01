import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell, Send, Users, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../config/api';
import SEO from '../components/ui/SEO';

export default function AdminNotificationsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('sistem');
  const [target, setTarget] = useState<'all' | 'specific'>('all');
  const [userIds, setUserIds] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ sentCount: number; totalTargeted: number } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setLoading(true);
    setResult(null);
    try {
      const payload: any = { title: title.trim(), message: message.trim(), type };
      if (target === 'specific' && userIds.trim()) {
        payload.userIds = userIds.split(',').map(id => id.trim()).filter(Boolean);
      }
      const { data } = await api.post('/admin/notifications/broadcast', payload);
      setResult(data);
      toast.success(`${data.sentCount} kullanıcıya bildirim gönderildi`);
      setTitle('');
      setMessage('');
      setUserIds('');
    } catch {
      toast.error('Bildirim gönderilemedi');
    } finally {
      setLoading(false);
    }
  };

  const TYPES = [
    { value: 'sistem', label: 'Sistem' },
    { value: 'ilan', label: 'İlan' },
    { value: 'borsa', label: 'Borsa' },
    { value: 'hava', label: 'Hava' },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <SEO title="Admin - Bildirim Gönder" />

      <Link to="/admin" className="text-sm text-[#2D6A4F] hover:underline mb-4 inline-block">← Admin Panel</Link>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#2D6A4F] rounded-xl flex items-center justify-center">
          <Bell size={20} className="text-white" />
        </div>
        <h1 className="text-xl font-bold">{isTr ? 'Bildirim Gönder' : 'Send Notification'}</h1>
      </div>

      <form onSubmit={handleSend} className="bg-[var(--bg-surface)] rounded-2xl p-6 shadow-sm space-y-4">
        {/* Target */}
        <div>
          <label className="block text-xs font-medium uppercase text-[#6B6560] mb-2">{isTr ? 'Hedef' : 'Target'}</label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setTarget('all')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${target === 'all' ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-primary)]'}`}
            >
              <Users size={16} />
              {isTr ? 'Tüm Kullanıcılar' : 'All Users'}
            </button>
            <button
              type="button"
              onClick={() => setTarget('specific')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${target === 'specific' ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-primary)]'}`}
            >
              <User size={16} />
              {isTr ? 'Seçili Kullanıcılar' : 'Specific Users'}
            </button>
          </div>
        </div>

        {target === 'specific' && (
          <div>
            <label className="block text-xs font-medium uppercase text-[#6B6560] mb-1">
              {isTr ? 'Kullanıcı ID\'leri (virgülle ayırın)' : 'User IDs (comma separated)'}
            </label>
            <input
              value={userIds}
              onChange={e => setUserIds(e.target.value)}
              placeholder="user1, user2, user3"
              className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
            />
          </div>
        )}

        {/* Type */}
        <div>
          <label className="block text-xs font-medium uppercase text-[#6B6560] mb-2">{isTr ? 'Bildirim Tipi' : 'Type'}</label>
          <div className="flex gap-2 flex-wrap">
            {TYPES.map(t => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${type === t.value ? 'bg-[#2D6A4F] text-white' : 'bg-[var(--bg-input)] text-[var(--text-primary)]'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium uppercase text-[#6B6560] mb-1">{isTr ? 'Başlık' : 'Title'}</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            maxLength={100}
            className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          />
        </div>

        {/* Message */}
        <div>
          <label className="block text-xs font-medium uppercase text-[#6B6560] mb-1">{isTr ? 'Mesaj' : 'Message'}</label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            required
            rows={4}
            maxLength={500}
            className="w-full px-4 py-3 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]"
          />
          <p className="text-[10px] text-[#6B6560] text-right mt-1">{message.length}/500</p>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !title.trim() || !message.trim()}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#2D6A4F] text-white rounded-xl font-semibold text-sm hover:bg-[#1B4332] transition-colors disabled:opacity-50"
        >
          <Send size={16} />
          {loading ? (isTr ? 'Gönderiliyor...' : 'Sending...') : (isTr ? 'Bildirimi Gönder' : 'Send Notification')}
        </button>

        {/* Result */}
        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-sm text-green-800 dark:text-green-300">
            {isTr
              ? `${result.sentCount} / ${result.totalTargeted} kullanıcıya başarıyla gönderildi.`
              : `Successfully sent to ${result.sentCount} / ${result.totalTargeted} users.`}
          </div>
        )}
      </form>
    </div>
  );
}
