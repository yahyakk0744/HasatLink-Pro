import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
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
  const { firebaseUid } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

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

      // Count unread messages across all conversations
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
          // Unread count query failed for this conversation
        }
      }
      setUnreadCount(total);
    });

    return () => unsubscribe();
  }, [firebaseUid]);

  return (
    <MessageContext.Provider value={{ conversations, unreadCount, loading }}>
      {children}
    </MessageContext.Provider>
  );
};

export const useMessageContext = () => useContext(MessageContext);
