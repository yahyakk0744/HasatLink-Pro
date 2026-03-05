import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MessageSquare, CheckSquare, Trash2, X } from 'lucide-react';
import SEO from '../components/ui/SEO';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useMessageContext } from '../contexts/MessageContext';
import { useMessages } from '../hooks/useMessages';
import ConversationList from '../components/messages/ConversationList';
import ChatView from '../components/messages/ChatView';
import type { Conversation } from '../types';
import toast from 'react-hot-toast';

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { t } = useTranslation();
  const { user, firebaseUid } = useAuth();
  const { conversations } = useMessageContext();
  const { deleteMultipleConversations } = useMessages();
  const navigate = useNavigate();
  const [directConversation, setDirectConversation] = useState<Conversation | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        <p className="text-sm text-[var(--text-secondary)]">{t('login')}</p>
      </div>
    );
  }

  const handleSelectConversation = (id: string) => {
    navigate(`/mesajlar/${id}`);
  };

  const handleBack = () => {
    navigate('/mesajlar');
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedIds(new Set());
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === conversations.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(conversations.map((c) => c.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setDeleting(true);
    try {
      await deleteMultipleConversations(Array.from(selectedIds));
      toast.success(`${selectedIds.size} konuşma silindi`);
      if (conversationId && selectedIds.has(conversationId)) {
        navigate('/mesajlar');
      }
      setSelectedIds(new Set());
      setSelectionMode(false);
    } catch {
      toast.error('Konuşmalar silinirken hata oluştu');
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-fade-in">
      <SEO title={t('messages.title')} description="HasatLink mesajlarınız." />
      <div className="surface-card rounded-2xl overflow-hidden md:my-6" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="flex h-full">
          {/* Conversation List — hidden on mobile when chat is active */}
          <div
            className={`w-full md:w-[360px] md:border-r border-[#F5F3EF] flex flex-col ${
              conversationId ? 'hidden md:flex' : 'flex'
            }`}
          >
            <div className="px-4 py-3 border-b border-[#F5F3EF]">
              {selectionMode ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="text-xs font-medium text-[var(--accent-green)] hover:text-[#245a42] transition-colors"
                    >
                      {selectedIds.size === conversations.length ? 'Seçimi Kaldır' : 'Tümünü Seç'}
                    </button>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {selectedIds.size} seçildi
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedIds.size > 0 && (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-1.5 text-[var(--accent-red)] hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                    <button
                      onClick={toggleSelectionMode}
                      className="p-1.5 text-[var(--text-secondary)] hover:bg-[var(--bg-input)] rounded-lg transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2">
                    <MessageSquare size={20} className="text-[var(--accent-green)]" />
                    {t('messages.title')}
                  </h2>
                  {conversations.length > 0 && (
                    <button
                      onClick={toggleSelectionMode}
                      className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--accent-green)] transition-colors flex items-center gap-1"
                    >
                      <CheckSquare size={14} />
                      Seç
                    </button>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto">
              <ConversationList
                conversations={conversations}
                currentUid={firebaseUid}
                activeConversationId={conversationId || null}
                onSelectConversation={handleSelectConversation}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                onToggleSelect={handleToggleSelect}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="surface-card rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
              Konuşmaları Sil
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-5">
              {selectedIds.size} konuşmayı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--bg-input)] transition-colors disabled:opacity-50"
              >
                İptal
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={deleting}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl bg-[var(--accent-red)] text-white hover:opacity-90 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Siliniyor...' : 'Sil'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
