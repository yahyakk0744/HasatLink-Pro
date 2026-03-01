import { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';

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

    // Stop typing indicator
    if (typingRef.current) {
      typingRef.current = false;
      emitTyping(false);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    }

    onSend(trimmed);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-[var(--bg-input)]">
      <input
        type="text"
        value={text}
        onChange={handleChange}
        placeholder={t('messages.typeMessage')}
        disabled={disabled}
        className="flex-1 px-4 py-2.5 bg-[var(--bg-input)] text-[var(--text-primary)] rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="w-10 h-10 flex items-center justify-center bg-[#2D6A4F] text-white rounded-full hover:bg-[#1B4332] transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
      >
        <Send size={16} />
      </button>
    </form>
  );
}
