import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  onlineUsers: new Set(),
  isUserOnline: () => false,
});

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace('/api', '');

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setOnlineUsers(new Set());
      }
      return;
    }

    const s = io(SOCKET_URL, {
      query: { userId: user.userId },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    s.on('connect', () => {
      // Get initial online users list
      s.emit('users:online-list', (userIds: string[]) => {
        setOnlineUsers(new Set(userIds));
      });
    });

    s.on('user:online', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    s.on('user:offline', ({ userId }: { userId: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    socketRef.current = s;
    setSocket(s);

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, [user?.userId]);

  const isUserOnline = useCallback((userId: string) => onlineUsers.has(userId), [onlineUsers]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
