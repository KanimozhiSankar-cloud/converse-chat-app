import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

let socket: Socket | null = null;

/** Creates (or returns the existing) authenticated socket connection. */
export function connectSocket(token: string): Socket {
  if (socket) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
  });

  if (import.meta.env.DEV) {
    socket.on('connect', () => console.log('[SOCKET] connected'));
    socket.on('disconnect', (reason) => console.log(`[SOCKET] disconnected reason=${reason}`));
    socket.io.on('reconnect', (attempt) => console.log(`[SOCKET] reconnected attempt=${attempt}`));
    socket.on('connect_error', (error) => console.log(`[SOCKET] connection error=${error.message}`));
  }

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  socket?.disconnect();
  socket = null;
}
