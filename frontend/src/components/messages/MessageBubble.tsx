import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function formatTime(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ReadReceipt({ read }: { read: boolean }) {
  return (
    <span className={`inline-flex ml-1 ${read ? 'text-blue-300' : 'text-white/40'}`}>
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path d="M1 5l3 3L10 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6 5l3 3L15 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 ${
          isOwn
            ? 'bg-[#2D6A4F] text-white rounded-2xl rounded-br-md'
            : 'bg-[var(--bg-input)] text-[var(--text-primary)] rounded-2xl rounded-bl-md'
        }`}
      >
        <p className="text-sm leading-relaxed break-words">{message.text}</p>
        <div className={`flex items-center justify-end gap-0.5 mt-1 ${isOwn ? 'text-white/60' : 'text-[#6B6560]'}`}>
          <span className="text-[10px]">{formatTime(message.createdAt)}</span>
          {isOwn && <ReadReceipt read={message.read} />}
        </div>
      </div>
    </div>
  );
}
