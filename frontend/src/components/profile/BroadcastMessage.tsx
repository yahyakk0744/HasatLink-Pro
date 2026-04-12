import { useState } from 'react';
import { Send, Users, CheckCircle2 } from 'lucide-react';
import api from '../../config/api';
import { useFeatures } from '../../hooks/useFeatures';
import toast from 'react-hot-toast';

export default function BroadcastMessage() {
  const { isEnabled, loading: featuresLoading } = useFeatures();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (featuresLoading || !isEnabled('broadcastMessages')) return null;

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Mesaj boş olamaz');
      return;
    }
    setSending(true);
    try {
      const { data } = await api.post('/messages/broadcast', { message: message.trim() });
      toast.success(`${data.sentCount || 0} kullanıcıya mesaj gönderildi`);
      setMessage('');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    } catch {
      toast.error('Mesaj gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-default)] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#2D6A4F]/10 flex items-center justify-center">
          <Users size={18} className="text-[#2D6A4F]" />
        </div>
        <div>
          <h3 className="text-sm font-bold">Takipçilere Mesaj</h3>
          <p className="text-[10px] text-[var(--text-secondary)]">İlanlarınızı favoriye ekleyen alıcılara toplu mesaj gönderin</p>
        </div>
      </div>

      {sent ? (
        <div className="flex items-center gap-2 py-4 justify-center text-green-600">
          <CheckCircle2 size={20} />
          <span className="text-sm font-semibold">Mesaj gönderildi!</span>
        </div>
      ) : (
        <>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Kampanya, yeni ürün veya duyuru mesajınız..."
            rows={3}
            maxLength={500}
            className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-2xl text-sm resize-none focus:outline-none focus:border-[#2D6A4F] mb-3"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-secondary)]">{message.length}/500</span>
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#2D6A4F] text-white rounded-2xl text-sm font-semibold hover:bg-[#1B4332] disabled:opacity-50 transition-all"
            >
              <Send size={14} />
              {sending ? 'Gönderiliyor...' : 'Gönder'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
