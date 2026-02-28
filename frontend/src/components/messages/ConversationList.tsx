import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import type { Conversation } from '../../types';
import ConversationItem from './ConversationItem';

interface ConversationListProps {
  conversations: Conversation[];
  currentUid: string;
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
}

export default function ConversationList({
  conversations,
  currentUid,
  activeConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const { t } = useTranslation();

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-[#F5F3EF] flex items-center justify-center mb-4">
          <MessageSquare size={24} className="text-[#6B6560]" />
        </div>
        <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">{t('messages.empty')}</h3>
        <p className="text-xs text-[#6B6560]">{t('messages.emptyDescription')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-[#F5F3EF]">
      {conversations.map((conv) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          currentUid={currentUid}
          isActive={conv.id === activeConversationId}
          onClick={() => onSelectConversation(conv.id)}
        />
      ))}
    </div>
  );
}
