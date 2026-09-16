import { useCallback, useEffect, useState } from 'react';
import { Conversation, Message } from '../types';
import { fetchConversations } from '../services/conversationService';
import { getErrorMessage } from '../services/api';
import { useSocketContext } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

/**
 * Loads the current user's conversation list and keeps it live: new
 * incoming messages bump the relevant conversation to the top and
 * update its preview/unread count in real time.
 */
export function useConversations() {
  const { socket } = useSocketContext();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchConversations();
      setConversations(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;

    const handleIncoming = (message: Message) => {
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === message.conversationId);
        if (!exists) {
          // Conversation not loaded yet (e.g. brand new one) — refetch the list.
          load();
          return prev;
        }
        const updated = prev.map((c) =>
          c._id === message.conversationId
            ? {
                ...c,
                lastMessage: message,
                unreadCount:
                  message.sender._id === user?._id ? c.unreadCount : c.unreadCount + 1,
              }
            : c
        );
        return [...updated].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
    };

    socket.on('message:receive', handleIncoming);
    return () => {
      socket.off('message:receive', handleIncoming);
    };
  }, [socket, user?._id, load]);

  const clearUnread = useCallback((conversationId: string) => {
    setConversations((prev) =>
      prev.map((c) => (c._id === conversationId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const upsertConversation = useCallback((conversation: Conversation) => {
    setConversations((prev) => {
      const exists = prev.some((c) => c._id === conversation._id);
      if (exists) return prev.map((c) => (c._id === conversation._id ? conversation : c));
      return [conversation, ...prev];
    });
  }, []);

  return { conversations, isLoading, error, reload: load, clearUnread, upsertConversation };
}
