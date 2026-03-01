import { useCallback } from 'react';
import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Conversation, Message, FirestoreParticipant } from '../types';

interface ListingInfo {
  listingId: string;
  listingTitle: string;
  listingImage: string;
}

export const useMessages = () => {
  const getOrCreateConversation = useCallback(
    async (
      myUid: string,
      myProfile: FirestoreParticipant,
      otherUid: string,
      otherProfile: FirestoreParticipant,
      listing: ListingInfo
    ): Promise<string> => {
      const conversationId = [myUid, otherUid].sort().join('_') + '_' + listing.listingId;
      const convRef = doc(db, 'conversations', conversationId);
      const convSnap = await getDoc(convRef);

      if (!convSnap.exists()) {
        await setDoc(convRef, {
          participantUids: [myUid, otherUid].sort(),
          participants: {
            [myUid]: myProfile,
            [otherUid]: otherProfile,
          },
          listingId: listing.listingId,
          listingTitle: listing.listingTitle,
          listingImage: listing.listingImage,
          lastMessage: '',
          lastMessageAt: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }

      return conversationId;
    },
    []
  );

  const sendMessage = useCallback(
    async (conversationId: string, senderId: string, text: string) => {
      const messagesRef = collection(db, 'conversations', conversationId, 'messages');
      await addDoc(messagesRef, {
        senderId,
        text,
        createdAt: serverTimestamp(),
        read: false,
      });

      const convRef = doc(db, 'conversations', conversationId);
      await updateDoc(convRef, {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
      });
    },
    []
  );

  const subscribeToConversations = useCallback(
    (uid: string, callback: (conversations: Conversation[]) => void) => {
      const q = query(
        collection(db, 'conversations'),
        where('participantUids', 'array-contains', uid),
        orderBy('lastMessageAt', 'desc')
      );

      return onSnapshot(q, (snapshot) => {
        const conversations: Conversation[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Conversation[];
        callback(conversations);
      });
    },
    []
  );

  const subscribeToMessages = useCallback(
    (conversationId: string, callback: (messages: Message[]) => void) => {
      const q = query(
        collection(db, 'conversations', conversationId, 'messages'),
        orderBy('createdAt', 'asc')
      );

      return onSnapshot(q, (snapshot) => {
        const messages: Message[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Message[];
        callback(messages);
      });
    },
    []
  );

  const markAsRead = useCallback(
    async (conversationId: string, messageIds: string[]) => {
      if (messageIds.length === 0) return;
      const batch = writeBatch(db);
      messageIds.forEach((msgId) => {
        const msgRef = doc(db, 'conversations', conversationId, 'messages', msgId);
        batch.update(msgRef, { read: true });
      });
      await batch.commit();
    },
    []
  );

  return {
    getOrCreateConversation,
    sendMessage,
    subscribeToConversations,
    subscribeToMessages,
    markAsRead,
  };
};
