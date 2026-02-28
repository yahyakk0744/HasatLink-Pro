import { useTranslation } from 'react-i18next';
import type { Conversation } from '../../types';

interface ConversationItemProps {
  conversation: Conversation;
  currentUid: string;
  isActive: boolean;
  onClick: () => void;
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

export default function ConversationItem({ conversation, currentUid, isActive, onClick }: ConversationItemProps) {
  const { t } = useTranslation();

  // Get the other participant
  const otherUid = conversation.participantUids.find((uid) => uid !== currentUid) || '';
  const otherParticipant = conversation.participants?.[otherUid];
  const name = otherParticipant?.name || 'Kullanıcı';
  const profileImage = otherParticipant?.profileImage || '';

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--bg-surface-hover)] transition-colors text-left ${
        isActive ? 'bg-[var(--bg-input)]' : ''
      }`}
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full bg-[#2D6A4F]/10 flex items-center justify-center shrink-0 overflow-hidden">
        {profileImage ? (
          <img src={profileImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold text-[#2D6A4F]">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-[var(--text-primary)] truncate">{name}</h4>
          <span className="text-[10px] text-[#6B6560] shrink-0 ml-2">
            {formatRelativeTime(conversation.lastMessageAt, t)}
          </span>
        </div>
        <p className="text-[10px] text-[#2D6A4F] font-medium truncate">{conversation.listingTitle}</p>
        <p className="text-xs text-[#6B6560] truncate mt-0.5">
          {conversation.lastMessage || '...'}
        </p>
      </div>
    </button>
  );
}
