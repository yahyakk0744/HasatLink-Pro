import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { getPusherClient } from '../config/pusher';
import { useAuth } from './AuthContext';
import type { Conversation } from '../types';

interface MessageContextType {
  conversations: Conversation[];
  unreadCount: number;
  loading: boolean;
}

const MessageContext = createContext<MessageContextType>({
  conversations: [],
  unreadCount: 0,
  loading: false,
});

export const MessageProvider = ({ children }: { children: ReactNode }) => {
  const { firebaseUid, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Firestore subscription for conversations
  useEffect(() => {
    if (!firebaseUid) {
      setConversations([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);

    const q = query(
      collection(db, 'conversations'),
      where('participantUids', 'array-contains', firebaseUid),
      orderBy('lastMessageAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convs: Conversation[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as Conversation[];
      setConversations(convs);
      setLoading(false);

      let total = 0;
      for (const conv of convs) {
        try {
          const messagesQuery = query(
            collection(db, 'conversations', conv.id, 'messages'),
            where('read', '==', false),
            where('senderId', '!=', firebaseUid)
          );
          const msgSnap = await getDocs(messagesQuery);
          total += msgSnap.size;
        } catch {
          // ignore
        }
      }
      setUnreadCount(total);
    });

    return () => unsubscribe();
  }, [firebaseUid]);

  // Pusher subscription for instant conversation updates
  useEffect(() => {
    const userId = user?.userId;
    if (!userId) return;

    const pusher = getPusherClient();
    const channel = pusher.subscribe(`user-${userId}`);

    channel.bind('conversation:update', (data: { conversationId: string; lastMessage: string; senderName: string; senderId?: string }) => {
      // Update the conversation list with new last message
      setConversations(prev => {
        const updated = prev.map(c =>
          c.id === data.conversationId
            ? { ...c, lastMessage: data.lastMessage, lastMessageAt: new Date() }
            : c
        );
        // Sort by lastMessageAt descending (move updated conversation to top)
        return updated.sort((a, b) => {
          const aTime = a.lastMessageAt?.toDate ? a.lastMessageAt.toDate().getTime() : new Date(a.lastMessageAt).getTime();
          const bTime = b.lastMessageAt?.toDate ? b.lastMessageAt.toDate().getTime() : new Date(b.lastMessageAt).getTime();
          return bTime - aTime;
        });
      });
      // Only increment unread count if message sender is NOT the current user
      if (data.senderId !== userId && data.senderId !== firebaseUid) {
        setUnreadCount(prev => prev + 1);
      }
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`user-${userId}`);
    };
  }, [user?.userId, firebaseUid]);

  return (
    <MessageContext.Provider value={{ conversations, unreadCount, loading }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = () => useContext(MessageContext);
