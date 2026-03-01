import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMessages } from '../../hooks/useMessages';
import { useSocket } from '../../contexts/SocketContext';
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
  const [isTyping, setIsTyping] = useState(false);
  const { subscribeToMessages, sendMessage, markAsRead } = useMessages();
  const { socket, isUserOnline } = useSocket();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const otherUid = conversation.participantUids.find((uid) => uid !== currentUid) || '';
  const otherParticipant = conversation.participants?.[otherUid];
  const otherName = otherParticipant?.name || 'Kullanıcı';
  const otherOnline = isUserOnline(otherParticipant?.userId || otherUid);

  // Join/leave conversation room via Socket.IO
  useEffect(() => {
    if (!socket || !conversation.id) return;
    socket.emit('conversation:join', conversation.id);
    return () => { socket.emit('conversation:leave', conversation.id); };
  }, [socket, conversation.id]);

  // Listen for typing events
  useEffect(() => {
    if (!socket) return;

    const handleTypingStart = ({ userId }: { userId: string }) => {
      if (userId !== currentUid) {
        setIsTyping(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
      }
    };
    const handleTypingStop = ({ userId }: { userId: string }) => {
      if (userId !== currentUid) setIsTyping(false);
    };

    // Listen for read receipts
    const handleMessageRead = (data: { messageIds: string[]; readBy: string }) => {
      if (data.readBy !== currentUid) {
        setMessages(prev => prev.map(m =>
          data.messageIds.includes(m.id) ? { ...m, read: true } : m
        ));
      }
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:read', handleMessageRead);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:read', handleMessageRead);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, currentUid]);

  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversation.id, (msgs) => {
      setMessages(msgs);

      // Mark incoming unread messages as read
      const unreadIds = msgs
        .filter((m) => m.senderId !== currentUid && !m.read)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markAsRead(conversation.id, unreadIds);
        // Notify via socket
        if (socket) {
          socket.emit('message:read', {
            conversationId: conversation.id,
            messageIds: unreadIds,
            readBy: currentUid,
          });
        }
      }
    });
    return () => unsubscribe();
  }, [conversation.id, currentUid, subscribeToMessages, markAsRead, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSend = (text: string) => {
    sendMessage(conversation.id, currentUid, text);
    // Relay via socket for instant delivery + notification
    if (socket) {
      const currentParticipant = conversation.participants?.[currentUid];
      socket.emit('message:new', {
        conversationId: conversation.id,
        message: { senderId: currentUid, text, createdAt: new Date().toISOString(), read: false },
        recipientId: otherParticipant?.userId || otherUid,
        senderName: currentParticipant?.name || 'Kullanıcı',
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--bg-input)] bg-[var(--bg-surface)]">
        {onBack && (
          <button onClick={onBack} className="p-1 hover:bg-[var(--bg-surface-hover)] rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
        )}
        <div className="relative">
          <div className="w-9 h-9 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center shrink-0 overflow-hidden">
            {otherParticipant?.profileImage ? (
              <img src={otherParticipant.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-[#2D6A4F]">
                {otherName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          {/* Online/offline dot */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)] ${otherOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate">{otherName}</h3>
          <div className="flex items-center gap-1">
            {isTyping ? (
              <span className="text-[10px] text-[#2D6A4F] font-medium animate-pulse">yazıyor...</span>
            ) : (
              <>
                <span className={`text-[10px] font-medium ${otherOnline ? 'text-green-600' : 'text-[#6B6560]'}`}>
                  {otherOnline ? 'Çevrimiçi' : 'Çevrimdışı'}
                </span>
                <span className="text-[10px] text-[#6B6560] mx-1">·</span>
                <Link
                  to={`/ilan/${conversation.listingId}`}
                  className="text-[10px] text-[#2D6A4F] font-medium hover:underline truncate"
                >
                  {conversation.listingTitle}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} isOwn={msg.senderId === currentUid} />
        ))}
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-[var(--bg-input)] rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
              <span className="w-2 h-2 bg-[#6B6560] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-[#6B6560] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-[#6B6560] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <MessageInput onSend={handleSend} conversationId={conversation.id} />
    </div>
  );
}
