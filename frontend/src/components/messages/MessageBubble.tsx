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
        <p
          className={`text-[10px] mt-1 ${
            isOwn ? 'text-white/60' : 'text-[#6B6560]'
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>
    </div>
  );
}
