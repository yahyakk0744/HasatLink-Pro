import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import Notification from './models/Notification';
import { sendPushToUser } from './utils/pushNotification';
import { getPusher } from './config/pusher';

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
    pingInterval: 25000,
    pingTimeout: 20000,
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

    // New message — relay via Socket.IO + Pusher + create notification
    socket.on('message:new', (data: { conversationId: string; message: any; recipientId?: string; senderName?: string }) => {
      // Relay message to other participants in the conversation via Socket.IO
      socket.to(`conversation:${data.conversationId}`).emit('message:new', data);

      // Pusher: instant delivery to conversation channel
      try {
        const pusher = getPusher();
        pusher.trigger(`conversation-${data.conversationId}`, 'message:new', {
          message: data.message,
          senderName: data.senderName,
        });
        // Also notify recipient's personal channel for unread badge updates
        if (data.recipientId) {
          pusher.trigger(`user-${data.recipientId}`, 'conversation:update', {
            conversationId: data.conversationId,
            lastMessage: data.message?.text,
            senderName: data.senderName,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('[Pusher] Trigger error:', err);
      }

      // Send delivery confirmation back to sender
      if (data.message?.id || data.message?.createdAt) {
        const recipientOnline = data.recipientId
          ? onlineUsers.has(data.recipientId) && onlineUsers.get(data.recipientId)!.size > 0
          : false;

        socket.emit('message:delivered', {
          conversationId: data.conversationId,
          messageId: data.message?.id,
          timestamp: new Date().toISOString(),
        });

        if (recipientOnline && data.recipientId) {
          io.to(`user:${data.recipientId}`).emit('message:delivered', {
            conversationId: data.conversationId,
            messageId: data.message?.id,
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Create notification for recipient if they're not in the conversation room
      if (data.recipientId && data.recipientId !== userId) {
        const senderName = data.senderName || 'Bir kullanıcı';
        const msgPreview = data.message?.text?.substring(0, 50) || 'Yeni mesaj';
        Notification.create({
          userId: data.recipientId,
          type: 'mesaj',
          title: `${senderName} mesaj gönderdi`,
          message: msgPreview,
          relatedId: data.conversationId,
        }).then(notif => {
          sendPushToUser(data.recipientId!, {
            title: `${senderName} mesaj gönderdi`,
            body: msgPreview,
            url: '/mesajlar',
          }, notif);
        }).catch(() => {});
      }
    });

    // Message read — relay via Socket.IO + Pusher
    socket.on('message:read', (data: { conversationId: string; messageIds: string[]; readBy: string }) => {
      socket.to(`conversation:${data.conversationId}`).emit('message:read', data);
      try {
        getPusher().trigger(`conversation-${data.conversationId}`, 'message:read', data);
      } catch {}
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

    // Favorite toggle notification to listing owner
    socket.on('favorite:new', (data: { listingId: string; ownerId: string; userName: string }) => {
      if (data.ownerId && data.ownerId !== userId) {
        io.to(`user:${data.ownerId}`).emit('notification:favorite', {
          listingId: data.listingId,
          userName: data.userName,
          type: 'new_favorite',
        });
      }
    });

    // View count update broadcast
    socket.on('listing:view', (data: { listingId: string; viewCount: number }) => {
      io.emit('listing:view_update', data);
    });

    // New rating notification
    socket.on('rating:new', (data: { toUserId: string; fromUserName: string; score: number; listingId?: string }) => {
      if (data.toUserId && data.toUserId !== userId) {
        io.to(`user:${data.toUserId}`).emit('notification:rating', {
          fromUserName: data.fromUserName,
          score: data.score,
          listingId: data.listingId,
          type: 'new_rating',
        });
      }
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
