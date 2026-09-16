import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { getSocket } from '../socket/socket';

interface SocketContextValue {
  socket: Socket | null;
  onlineUserIds: Set<string>;
}

const SocketContext = createContext<SocketContextValue>({ socket: null, onlineUserIds: new Set() });

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) {
      setSocket(null);
      return;
    }

    const activeSocket = getSocket();
    setSocket(activeSocket);
    if (!activeSocket) return;

    const handleOnlineSnapshot = (userIds: string[]) => setOnlineUserIds(new Set(userIds));
    const handleUserOnline = ({ userId }: { userId: string }) =>
      setOnlineUserIds((prev) => new Set(prev).add(userId));
    const handleUserOffline = ({ userId }: { userId: string }) =>
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });

    activeSocket.on('online:users', handleOnlineSnapshot);
    activeSocket.on('user:online', handleUserOnline);
    activeSocket.on('user:offline', handleUserOffline);

    return () => {
      activeSocket.off('online:users', handleOnlineSnapshot);
      activeSocket.off('user:online', handleUserOnline);
      activeSocket.off('user:offline', handleUserOffline);
    };
  }, [isAuthenticated]);

  return <SocketContext.Provider value={{ socket, onlineUserIds }}>{children}</SocketContext.Provider>;
}

export function useSocketContext(): SocketContextValue {
  return useContext(SocketContext);
}
