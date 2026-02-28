import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export default function MessageInput({ onSend, disabled }: MessageInputProps) {
  const { t } = useTranslation();
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-[var(--bg-input)]">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
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
