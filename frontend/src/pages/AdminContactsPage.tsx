import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { Mail, MailOpen, Trash2, Clock, User, AtSign, ChevronLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import SEO from '../components/ui/SEO';
import EmptyState from '../components/ui/EmptyState';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import api from '../config/api';
import toast from 'react-hot-toast';

interface ContactMsg {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminContactsPage() {
  const { i18n } = useTranslation();
  const isTr = i18n.language?.startsWith('tr');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ContactMsg | null>(null);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const { data } = await api.get('/admin/contacts');
      setMessages(data);
    } catch {
      toast.error(isTr ? 'Mesajlar yüklenemedi' : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/admin/contacts/${id}/read`);
      setMessages(prev => prev.map(m => m._id === id ? { ...m, isRead: true } : m));
      if (selected?._id === id) setSelected(s => s ? { ...s, isRead: true } : null);
    } catch {
      toast.error(isTr ? 'İşlem başarısız' : 'Action failed');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/admin/contacts/${id}`);
      setMessages(prev => prev.filter(m => m._id !== id));
      if (selected?._id === id) setSelected(null);
      toast.success(isTr ? 'Mesaj silindi' : 'Message deleted');
    } catch {
      toast.error(isTr ? 'Silme başarısız' : 'Delete failed');
    }
  };

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (loading) return <LoadingSpinner size="lg" className="py-20" />;

  const unreadCount = messages.filter(m => !m.isRead).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 animate-fade-in">
      <SEO title={isTr ? 'Admin - Mesajlar' : 'Admin - Messages'} />

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-[var(--bg-input)] transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-2xl font-semibold tracking-tight">{isTr ? 'İletişim Mesajları' : 'Contact Messages'}</h1>
        {unreadCount > 0 && (
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-[#C1341B] text-white rounded-full">
            {unreadCount}
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <EmptyState icon={<Mail size={48} />} title={isTr ? 'Henüz mesaj yok' : 'No messages yet'} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Message List */}
          <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto">
            {messages.map(msg => (
              <button
                key={msg._id}
                onClick={() => {
                  setSelected(msg);
                  if (!msg.isRead) handleMarkRead(msg._id);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${
                  selected?._id === msg._id
                    ? 'bg-[#2D6A4F]/10 border-[#2D6A4F]/30'
                    : msg.isRead
                      ? 'bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[#2D6A4F]/30'
                      : 'bg-[var(--bg-surface)] border-[#2D6A4F]/30'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {msg.isRead ? (
                    <MailOpen size={14} className="text-[var(--text-secondary)]" />
                  ) : (
                    <Mail size={14} className="text-[#2D6A4F]" />
                  )}
                  <span className={`text-sm font-semibold truncate ${!msg.isRead ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>
                    {msg.subject}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] truncate">{msg.name} &middot; {msg.email}</p>
                <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                  {new Date(msg.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </button>
            ))}
          </div>

          {/* Message Detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-lg font-semibold">{selected.subject}</h2>
                  <div className="flex items-center gap-2">
                    {!selected.isRead && (
                      <button
                        onClick={() => handleMarkRead(selected._id)}
                        className="p-2 rounded-xl hover:bg-[var(--bg-surface-hover)] text-[var(--text-secondary)] transition-colors"
                        title={isTr ? 'Okundu işaretle' : 'Mark as read'}
                      >
                        <MailOpen size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(selected._id)}
                      className="p-2 rounded-xl hover:bg-[#C1341B]/10 text-[#C1341B] transition-colors"
                      title={isTr ? 'Sil' : 'Delete'}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 mb-4 text-sm text-[var(--text-secondary)]">
                  <div className="flex items-center gap-1.5">
                    <User size={14} />
                    {selected.name}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AtSign size={14} />
                    <a href={`mailto:${selected.email}`} className="text-[#2D6A4F] hover:underline">{selected.email}</a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={14} />
                    {new Date(selected.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="border-t border-[var(--border-default)] pt-4">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
                </div>
              </div>
            ) : (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-12 text-center">
                <Mail size={40} className="text-[var(--text-secondary)] mx-auto mb-3 opacity-40" />
                <p className="text-sm text-[var(--text-secondary)]">
                  {isTr ? 'Bir mesaj seçin' : 'Select a message'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
