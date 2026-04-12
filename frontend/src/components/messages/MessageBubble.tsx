import type { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showTail?: boolean;
}

function formatTime(timestamp: any): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function ReadReceipt({ read, delivered }: { read: boolean; delivered?: boolean }) {
  if (read) {
    return (
      <span className="inline-flex ml-1.5 text-[#34B7F1]">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1.5 5.5l2.5 3L9.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 5.5l2.5 3L13.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (delivered) {
    return (
      <span className="inline-flex ml-1.5 text-white/50">
        <svg width="16" height="11" viewBox="0 0 16 11" fill="none">
          <path d="M1.5 5.5l2.5 3L9.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 5.5l2.5 3L13.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex ml-1.5 text-white/35">
      <svg width="12" height="11" viewBox="0 0 12 11" fill="none">
        <path d="M1.5 5.5l2.5 3L9.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export default function MessageBubble({ message, isOwn, showTail = true }: MessageBubbleProps) {
  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${showTail ? 'mt-2' : 'mt-0.5'}`}>
      <div
        className={`relative max-w-[75%] px-3.5 py-2 shadow-sm ${
          isOwn
            ? `bg-[var(--accent-green)] text-white ${showTail ? 'rounded-[20px] rounded-br-[6px]' : 'rounded-[20px]'}`
            : `bg-[var(--bg-input)] text-[var(--text-primary)] ${showTail ? 'rounded-[20px] rounded-bl-[6px]' : 'rounded-[20px]'}`
        }`}
      >
        <p className="text-[15px] leading-[1.35] break-words whitespace-pre-wrap">{message.text}</p>
        <div className={`flex items-center justify-end gap-0.5 mt-0.5 -mb-0.5 ${isOwn ? 'text-white/55' : 'text-[var(--text-tertiary)]'}`}>
          <span className="text-[10px]">{formatTime(message.createdAt)}</span>
          {isOwn && <ReadReceipt read={message.read} delivered={message.delivered} />}
        </div>
      </div>
    </div>
  );
}
