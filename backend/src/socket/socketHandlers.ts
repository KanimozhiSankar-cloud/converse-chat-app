import { Server } from 'socket.io';
import { Conversation } from '../models/Conversation';
import { User } from '../models/User';
import { sendMessage } from '../services/messageService';
import { onlineUsers } from './onlineUsers';
import { AuthenticatedSocket } from './index';
import { emitMessageToParticipants } from './index';

interface MessageSendPayload {
  conversationId: string;
  content: string;
  replyToId?: string;
}

/**
 * Registers all Socket.IO event handlers for a single connected client.
 * Kept separate from REST controllers so real-time and HTTP concerns
 * don't leak into each other.
 */
export function registerSocketHandlers(io: Server, socket: AuthenticatedSocket): void {
  const userId = socket.userId as string;

  void handleConnect(io, socket, userId);

  socket.on('conversation:join', async (conversationId: string, ack?: (response: unknown) => void) => {
    const conversation = await Conversation.exists({ _id: conversationId, participants: userId });
    if (!conversation) {
      ack?.({ success: false, error: 'Conversation access denied' });
      return;
    }
    socket.join(conversationId);
    if (process.env.NODE_ENV !== 'production') console.log(`[SOCKET] joined conversation=${conversationId} userId=${userId}`);
    ack?.({ success: true });
  });

  socket.on('conversation:leave', (conversationId: string) => {
    socket.leave(conversationId);
  });

  socket.on('message:send', async (payload: MessageSendPayload, ack?: (response: unknown) => void) => {
    try {
      const message = await sendMessage({
        conversationId: payload.conversationId,
        senderId: userId,
        content: payload.content,
        replyToId: payload.replyToId,
      });
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[SOCKET] message created messageId=${message._id} conversationId=${payload.conversationId} senderId=${userId}`);
      }
      await emitMessageToParticipants(payload.conversationId, message);
      ack?.({ success: true, message });
    } catch (error) {
      const errMessage = error instanceof Error ? error.message : 'Failed to send message';
      ack?.({ success: false, error: errMessage });
    }
  });

  socket.on('typing:start', async (conversationId: string) => {
    const conversation = await Conversation.exists({ _id: conversationId, participants: userId });
    if (!conversation) return;
    socket.to(conversationId).emit('typing:start', { conversationId, userId });
  });

  socket.on('typing:stop', async (conversationId: string) => {
    const conversation = await Conversation.exists({ _id: conversationId, participants: userId });
    if (!conversation) return;
    socket.to(conversationId).emit('typing:stop', { conversationId, userId });
  });

  socket.on('disconnect', () => {
    void handleDisconnect(io, socket, userId);
  });
}

async function handleConnect(io: Server, socket: AuthenticatedSocket, userId: string): Promise<void> {
  const wasOffline = onlineUsers.addSocket(userId, socket.id);
  socket.join(userId);
  if (process.env.NODE_ENV !== 'production') console.log(`[SOCKET] joined user room=${userId}`);

  // Auto-join every conversation the user belongs to so messages arrive
  // without an extra round trip after connecting.
  const conversations = await Conversation.find({ participants: userId }).select('_id');
  conversations.forEach((conversation) => {
    socket.join(conversation._id.toString());
    if (process.env.NODE_ENV !== 'production') console.log(`[SOCKET] joined conversation=${conversation._id} userId=${userId}`);
  });

  // Send the current snapshot of online users to the newly connected client.
  socket.emit('online:users', onlineUsers.getOnlineUserIds());

  if (wasOffline) {
    await User.findByIdAndUpdate(userId, { isOnline: true });
    io.emit('user:online', { userId });
  }
}

async function handleDisconnect(io: Server, socket: AuthenticatedSocket, userId: string): Promise<void> {
  const isFullyOffline = onlineUsers.removeSocket(userId, socket.id);

  if (isFullyOffline) {
    const lastSeen = new Date();
    await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
    io.emit('user:offline', { userId, lastSeen });
  }
}
