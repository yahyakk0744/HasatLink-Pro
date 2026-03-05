import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMessages } from '../../hooks/useMessages';
import { useSocket } from '../../contexts/SocketContext';
import { getPusherClient } from '../../config/pusher';
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
  const otherName = otherParticipant?.name || 'Kullanici';
  const otherOnline = isUserOnline(otherParticipant?.userId || otherUid);

  // Join/leave conversation room via Socket.IO
  useEffect(() => {
    if (!socket || !conversation.id) return;
    socket.emit('conversation:join', conversation.id);
    return () => { socket.emit('conversation:leave', conversation.id); };
  }, [socket, conversation.id]);

  // Pusher: subscribe to conversation channel for instant delivery
  useEffect(() => {
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`conversation-${conversation.id}`);

    channel.bind('message:new', (data: { message: any; senderName?: string }) => {
      if (data.message && data.message.senderId !== currentUid) {
        const newMsg: Message = {
          id: data.message.id || `pusher-${Date.now()}`,
          senderId: data.message.senderId,
          text: data.message.text,
          createdAt: data.message.createdAt,
          read: false,
          delivered: true,
        };
        setMessages(prev => {
          // Avoid duplicates (Firestore onSnapshot may also add this)
          if (prev.some(m => m.text === newMsg.text && m.senderId === newMsg.senderId && Math.abs(new Date(m.createdAt?.seconds ? m.createdAt.seconds * 1000 : m.createdAt).getTime() - new Date(newMsg.createdAt).getTime()) < 3000)) {
            return prev;
          }
          return [...prev, newMsg];
        });
      }
    });

    channel.bind('message:read', (data: { messageIds: string[]; readBy: string }) => {
      if (data.readBy !== currentUid) {
        setMessages(prev => prev.map(m =>
          data.messageIds.includes(m.id) ? { ...m, read: true } : m
        ));
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${conversation.id}`);
    };
  }, [conversation.id, currentUid]);

  // Listen for typing events via Socket.IO
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

    const handleMessageRead = (data: { messageIds: string[]; readBy: string }) => {
      if (data.readBy !== currentUid) {
        setMessages(prev => prev.map(m =>
          data.messageIds.includes(m.id) ? { ...m, read: true } : m
        ));
      }
    };

    const handleDelivered = (data: { conversationId: string; messageId?: string }) => {
      if (data.conversationId === conversation.id) {
        setMessages(prev => prev.map(m =>
          m.senderId === currentUid && !m.read ? { ...m, delivered: true } : m
        ));
      }
    };

    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    socket.on('message:read', handleMessageRead);
    socket.on('message:delivered', handleDelivered);

    return () => {
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
      socket.off('message:read', handleMessageRead);
      socket.off('message:delivered', handleDelivered);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, currentUid, conversation.id]);

  // Firestore subscription (persistence layer)
  useEffect(() => {
    const unsubscribe = subscribeToMessages(conversation.id, (msgs) => {
      setMessages(msgs);

      const unreadIds = msgs
        .filter((m) => m.senderId !== currentUid && !m.read)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        markAsRead(conversation.id, unreadIds);
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
    // Optimistic: add message to UI immediately
    const optimisticMsg: Message = {
      id: `opt-${Date.now()}`,
      senderId: currentUid,
      text,
      createdAt: new Date().toISOString(),
      read: false,
      delivered: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    sendMessage(conversation.id, currentUid, text);
    if (socket) {
      const currentParticipant = conversation.participants?.[currentUid];
      socket.emit('message:new', {
        conversationId: conversation.id,
        message: { senderId: currentUid, text, createdAt: new Date().toISOString(), read: false },
        recipientId: otherParticipant?.userId || otherUid,
        senderName: currentParticipant?.name || 'Kullanici',
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
          <div className="w-10 h-10 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center shrink-0 overflow-hidden">
            {otherParticipant?.profileImage ? (
              <img src={otherParticipant.profileImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-semibold text-[#2D6A4F]">
                {otherName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--bg-surface)] ${otherOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-[15px] font-semibold text-[var(--text-primary)] truncate">{otherName}</h3>
          <div className="flex items-center gap-1">
            {isTyping ? (
              <span className="text-[11px] text-[#2D6A4F] font-medium animate-pulse">yazıyor...</span>
            ) : (
              <>
                <span className={`text-[11px] font-medium ${otherOnline ? 'text-green-600' : 'text-[#6B6560]'}`}>
                  {otherOnline ? 'Cevrimici' : 'Cevrimdisi'}
                </span>
                <span className="text-[10px] text-[#6B6560] mx-1">·</span>
                <Link
                  to={`/ilan/${conversation.listingId}`}
                  className="text-[11px] text-[#2D6A4F] font-medium hover:underline truncate"
                >
                  {conversation.listingTitle}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 bg-gradient-to-b from-[var(--bg-page)] to-[var(--bg-surface)]">
        {messages.map((msg, i) => {
          const prevMsg = messages[i - 1];
          const showTail = !prevMsg || prevMsg.senderId !== msg.senderId;
          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUid}
              showTail={showTail}
            />
          );
        })}
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="bg-[#E9E9EB] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
