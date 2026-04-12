import { useState } from 'react';
import { Flag, X } from 'lucide-react';
import api from '../../config/api';
import toast from 'react-hot-toast';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'listing' | 'comment' | 'user' | 'message';
  targetId: string;
}

const REASONS = [
  'Yanıltıcı veya sahte ilan',
  'Uygunsuz içerik',
  'Dolandırıcılık şüphesi',
  'Kişisel bilgi paylaşımı',
  'Spam / reklam',
  'Hakaret / küfür',
  'Diğer',
];

export default function ReportModal({ isOpen, onClose, targetType, targetId }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Lütfen bir sebep seçin');
      return;
    }
    setSending(true);
    try {
      await api.post('/reports', { targetType, targetId, reason, description });
      toast.success('Şikayetiniz alındı. Ekibimiz inceleyecek.');
      onClose();
      setReason('');
      setDescription('');
    } catch {
      toast.error('Şikayet gönderilemedi');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md bg-[var(--bg-surface)] rounded-2xl p-6 animate-fade-in" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Flag size={18} className="text-red-500" />
            Şikayet Et
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-[var(--bg-input)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Bu içerikle ilgili bir sorun mu var? Lütfen sebebini belirtin.
        </p>

        <div className="space-y-2 mb-4">
          {REASONS.map(r => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-all ${
                reason === r
                  ? 'bg-red-500/10 text-red-600 border border-red-500/30 font-semibold'
                  : 'bg-[var(--bg-input)] hover:bg-[var(--bg-surface-hover)] border border-transparent'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Ek açıklama (opsiyonel)..."
          rows={3}
          className="w-full px-4 py-3 bg-[var(--bg-input)] border border-[var(--border-default)] rounded-2xl text-sm resize-none focus:outline-none focus:border-red-400 mb-4"
        />

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 bg-[var(--bg-input)] rounded-2xl text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            İptal
          </button>
          <button
            onClick={handleSubmit}
            disabled={sending || !reason}
            className="flex-1 px-4 py-3 bg-red-500 text-white rounded-2xl text-sm font-semibold hover:bg-red-600 disabled:opacity-50 transition-all"
          >
            {sending ? 'Gönderiliyor...' : 'Gönder'}
          </button>
        </div>
      </div>
    </div>
  );
}
