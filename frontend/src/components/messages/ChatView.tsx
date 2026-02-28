import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMessages } from '../../hooks/useMessages';
import type { Conversation, Message } from '../../types';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

interface ChatViewProps {
  conversation: Conversation;
  currentUid: string;
  onBack?: () => void;
}

export default function ChatView({ conversation, currentUid, onBack }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const { subscribeToMessages, sendMessage, markAsRead } = useMessages();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUid = conversation.participantUids.find((uid) => uid !== currentUid) || '';
  const otherParticipant = conversation.participants?.[otherUid];
  const otherName = otherParticipant?.name || 'Kullanıcı';

  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversation.id, (msgs) => {
      setMessages(msgs);

      // Mark incoming unread messages as read
      const unreadIds = msgs
        .filter((m) => m.senderId !== currentUid && !m.read)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markAsRead(conversation.id, unreadIds);
      }
    });
    return () => unsubscribe();
  }, [conversation.id, currentUid, subscribeToMessages, markAsRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    sendMessage(conversation.id, currentUid, text);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F5F3EF] bg-white">
        {onBack && (
          <button onClick={onBack} className="p-1 hover:bg-[#F5F3EF] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="w-9 h-9 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center shrink-0 overflow-hidden">
          {otherParticipant?.profileImage ? (
            <img src={otherParticipant.profileImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-semibold text-[#2D6A4F]">
              {otherName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{otherName}</h3>
          <Link
            to={`/ilan/${conversation.listingId}`}
            className="text-[10px] text-[#2D6A4F] font-medium hover:underline truncate block"
          >
            {conversation.listingTitle}
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUid} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} />
    </div>
  );
}
