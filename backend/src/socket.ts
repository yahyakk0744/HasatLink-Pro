import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server;

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map<string, Set<string>>();

export function initSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || [
        'https://hasatlink.com',
        'https://www.hasatlink.com',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:5175',
      ],
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.handshake.query.userId as string;

    if (userId) {
      // Track online status
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);

      // Join user's personal room for notifications
      socket.join(`user:${userId}`);

      // Broadcast online status
      io.emit('user:online', { userId });
    }

    // Typing indicator
    socket.on('typing:start', (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:start', { userId: data.userId });
    });

    socket.on('typing:stop', (data: { conversationId: string; userId: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('typing:stop', { userId: data.userId });
    });

    // Join conversation room
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // New message — relay to conversation room
    socket.on('message:new', (data: { conversationId: string; message: any }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:new', data);
    });

    // Message read
    socket.on('message:read', (data: { conversationId: string; messageIds: string[]; readBy: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:read', data);
    });

    // Check if user is online
    socket.on('user:check-online', (targetUserId: string, callback: (online: boolean) => void) => {
      callback(onlineUsers.has(targetUserId) && onlineUsers.get(targetUserId)!.size > 0);
    });

    // Get all online users
    socket.on('users:online-list', (callback: (userIds: string[]) => void) => {
      const ids = Array.from(onlineUsers.entries())
        .filter(([, sockets]) => sockets.size > 0)
        .map(([uid]) => uid);
      callback(ids);
    });

    // Disconnect
    socket.on('disconnect', () => {
      if (userId) {
        const sockets = onlineUsers.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            onlineUsers.delete(userId);
            io.emit('user:offline', { userId });
          }
        }
      }
    });
  });

  return io;
}

export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

export function isUserOnline(userId: string): boolean {
  return onlineUsers.has(userId) && onlineUsers.get(userId)!.size > 0;
}

// Send notification to a specific user via socket
export function sendSocketNotification(userId: string, notification: any) {
  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }
}
