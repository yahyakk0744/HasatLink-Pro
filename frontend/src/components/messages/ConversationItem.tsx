import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckSquare, Square } from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase';
import type { Conversation } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  currentUid: string;
  isActive: boolean;
  onClick: () => void;
  selectionMode?: boolean;
  isSelected?: boolean;
}

function formatRelativeTime(timestamp: any, t: (key: string) => string): string {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return t('messages.today');
  if (days === 1) return t('messages.yesterday');
  return date.toLocaleDateString();
}

export default function ConversationItem({ conversation, currentUid, isActive, onClick, selectionMode, isSelected }: ConversationItemProps) {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  const otherUid = conversation.participantUids.find((uid) => uid !== currentUid) || '';
  const otherParticipant = conversation.participants?.[otherUid];
  const name = otherParticipant?.name || 'Kullanıcı';
  const profileImage = otherParticipant?.profileImage || '';

  // Count unread messages for this conversation
  useEffect(() => {
    if (isActive) { setUnreadCount(0); return; }
    let cancelled = false;
    const countUnread = async () => {
      try {
        const q = query(
          collection(db, 'conversations', conversation.id, 'messages'),
          where('read', '==', false),
          where('senderId', '!=', currentUid)
        );
        const snap = await getDocs(q);
        if (!cancelled) setUnreadCount(snap.size);
      } catch {
        // ignore
      }
    };
    countUnread();
    return () => { cancelled = true; };
  }, [conversation.id, conversation.lastMessage, currentUid, isActive]);

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors text-left ${
        isActive && !selectionMode ? 'bg-[var(--bg-input)]' : ''
      } ${isSelected ? 'bg-[#2D6A4F]/5' : ''}`}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <div className="shrink-0">
          {isSelected ? (
            <CheckSquare size={20} className="text-[#2D6A4F]" />
          ) : (
            <Square size={20} className="text-[#6B6560]" />
          )}
        </div>
      )}

      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center overflow-hidden">
          {profileImage ? (
            <img src={profileImage} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[15px] font-semibold text-[#2D6A4F]">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className={`text-[14px] truncate ${unreadCount > 0 ? 'font-bold text-[var(--text-primary)]' : 'font-semibold text-[var(--text-primary)]'}`}>
            {name}
          </h4>
          <span className={`text-[10px] shrink-0 ml-2 ${unreadCount > 0 ? 'text-[#2D6A4F] font-semibold' : 'text-[#8E8E93]'}`}>
            {formatRelativeTime(conversation.lastMessageAt, t)}
          </span>
        </div>
        <p className="text-[10px] text-[#2D6A4F] font-medium truncate">{conversation.listingTitle}</p>
        <div className="flex items-center justify-between mt-0.5">
          <p className={`text-[13px] truncate ${unreadCount > 0 ? 'font-semibold text-[var(--text-primary)]' : 'text-[#8E8E93]'}`}>
            {conversation.lastMessage || '...'}
          </p>
          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="ml-2 w-5 h-5 rounded-full bg-[#2D6A4F] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
