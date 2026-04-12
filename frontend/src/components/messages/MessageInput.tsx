import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, Plus, MapPin, Camera, X } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import { containsProfanity } from '../../utils/profanityFilter';
import toast from 'react-hot-toast';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  conversationId?: string;
}

export default function MessageInput({ onSend, disabled, conversationId }: MessageInputProps) {
  const { t } = useTranslation();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [showAttach, setShowAttach] = useState(false);
  const typingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const emitTyping = useCallback((isTyping: boolean) => {
    if (!socket || !conversationId || !user?.userId) return;
    const event = isTyping ? 'typing:start' : 'typing:stop';
    socket.emit(event, { conversationId, userId: user.userId });
  }, [socket, conversationId, user?.userId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    if (!typingRef.current && e.target.value.trim()) {
      typingRef.current = true;
      emitTyping(true);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      typingRef.current = false;
      emitTyping(false);
    }, 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;

    if (containsProfanity(trimmed)) {
      toast.error('Uygunsuz içerik tespit edildi, lütfen düzenleyin');
      return;
    }

    if (typingRef.current) {
      typingRef.current = false;
      emitTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }

    onSend(trimmed);
    setText('');
    setShowAttach(false);
  };

  const handleAttachAction = (type: 'location' | 'photo') => {
    toast(`${type === 'location' ? 'Konum' : 'Fotoğraf'} paylaşımı yakında aktif olacak`, { icon: 'info' });
    setShowAttach(false);
  };

  const isTr = user?.language?.startsWith('tr') !== false;

  return (
    <div className="relative">
      {/* Attachment menu */}
      {showAttach && (
        <div className="absolute bottom-full left-3 mb-2 flex gap-2 animate-fade-in">
          <button
            type="button"
            onClick={() => handleAttachAction('photo')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-lg text-[12px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <Camera size={15} className="text-[#2D6A4F]" />
            {isTr ? 'Fotograf' : 'Photo'}
          </button>
          <button
            type="button"
            onClick={() => handleAttachAction('location')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-lg text-[12px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors"
          >
            <MapPin size={15} className="text-blue-500" />
            {isTr ? 'Konum' : 'Location'}
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-[var(--border-default)] bg-[var(--bg-surface)]">
        {/* Plus button */}
        <button
          type="button"
          onClick={() => setShowAttach(!showAttach)}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all duration-200 shrink-0 ${
            showAttach
              ? 'bg-[#2D6A4F] text-white rotate-45'
              : 'bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]'
          }`}
        >
          {showAttach ? <X size={18} /> : <Plus size={18} />}
        </button>

        {/* Input */}
        <input
          type="text"
          value={text}
          onChange={handleChange}
          placeholder={t('messages.typeMessage')}
          disabled={disabled}
          className="flex-1 px-4 py-2.5 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-full text-[15px] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 placeholder:text-[var(--text-tertiary)]"
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="w-9 h-9 flex items-center justify-center bg-[#2D6A4F] text-white rounded-full hover:bg-[#1B4332] transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed shrink-0 active:scale-95"
        >
          <Send size={15} className="ml-0.5" />
        </button>
      </form>
    </div>
  );
}
