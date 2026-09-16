import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { env } from '../config/env';
import { verifyToken } from '../utils/jwt';
import { registerSocketHandlers } from './socketHandlers';
import { Conversation } from '../models/Conversation';

let io: Server | null = null;

export interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  // Authenticate every socket connection using the JWT issued at login.
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token as string | undefined;
      if (!token) {
        next(new Error('Authentication token missing'));
        return;
      }
      const payload = verifyToken(token);
      socket.userId = payload.userId;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (env.nodeEnv !== 'production') console.log(`[SOCKET] connected userId=${socket.userId}`);
    registerSocketHandlers(io as Server, socket);
  });

  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet');
  }
  return io;
}

export async function emitMessageToParticipants(conversationId: string, message: unknown): Promise<void> {
  const conversation = await Conversation.findById(conversationId).select('participants');
  if (!conversation) return;

  const server = getIO();
  for (const participantId of conversation.participants) {
    const recipient = participantId.toString();
    server.to(recipient).emit('message:receive', message);
    if (env.nodeEnv !== 'production') {
      console.log(`[SOCKET] emitting message to recipient=${recipient}`);
      console.log('[SOCKET] emitted event=message:receive');
    }
  }
}
