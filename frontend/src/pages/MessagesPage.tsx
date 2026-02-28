import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';
import SEO from '../components/ui/SEO';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useMessageContext } from '../contexts/MessageContext';
import ConversationList from '../components/messages/ConversationList';
import ChatView from '../components/messages/ChatView';
import type { Conversation } from '../types';

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { t } = useTranslation();
  const { user, firebaseUid } = useAuth();
  const { conversations } = useMessageContext();
  const navigate = useNavigate();
  const [directConversation, setDirectConversation] = useState<Conversation | null>(null);

  // If conversationId exists but not in context list yet, fetch directly from Firestore
  useEffect(() => {
    if (!conversationId) { setDirectConversation(null); return; }
    const found = conversations.find((c) => c.id === conversationId);
    if (found) { setDirectConversation(null); return; }

    const unsubscribe = onSnapshot(doc(db, 'conversations', conversationId), (snap) => {
      if (snap.exists()) {
        setDirectConversation({ id: snap.id, ...snap.data() } as Conversation);
      }
    });
    return () => unsubscribe();
  }, [conversationId, conversations]);

  const activeConversation = conversationId
    ? conversations.find((c) => c.id === conversationId) || directConversation
    : null;

  if (!user || !firebaseUid) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-sm text-[#6B6560]">{t('login')}</p>
      </div>
    );
  }

  const handleSelectConversation = (id: string) => {
    navigate(`/mesajlar/${id}`);
  };

  const handleBack = () => {
    navigate('/mesajlar');
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <SEO title={t('messages.title')} description="HasatLink mesajlarınız." />
      <div className="bg-[var(--bg-surface)] rounded-2xl overflow-hidden shadow-sm md:my-6" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="flex h-full">
          {/* Conversation List — hidden on mobile when chat is active */}
          <div
            className={`w-full md:w-[360px] md:border-r border-[#F5F3EF] flex flex-col ${
              conversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="px-4 py-3 border-b border-[#F5F3EF]">
              <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                <MessageSquare size={20} className="text-[#2D6A4F]" />
                {t('messages.title')}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                currentUid={firebaseUid}
                activeConversationId={conversationId || null}
                onSelectConversation={handleSelectConversation}
              />
            </div>
          </div>

          {/* Chat View — hidden on mobile when no chat is active */}
          <div
            className={`flex-1 flex flex-col ${
              conversationId ? 'flex' : 'hidden md:flex'
            }`}
          >
            {activeConversation ? (
              <ChatView
                conversation={activeConversation}
                currentUid={firebaseUid}
                onBack={handleBack}
              />
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <div className="w-20 h-20 rounded-full bg-[var(--bg-input)] flex items-center justify-center mb-4">
                  <MessageSquare size={32} className="text-[var(--text-secondary)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{t('messages.empty')}</h3>
                <p className="text-xs text-[var(--text-secondary)]">{t('messages.emptyDescription')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
