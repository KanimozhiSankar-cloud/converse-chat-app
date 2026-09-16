import { useCallback, useEffect, useRef, useState } from 'react';
import { Conversation, Message } from '../types';
import { fetchConversations, markConversationReadRequest } from '../services/conversationService';
import { getErrorMessage } from '../services/api';
import { useSocketContext } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Loads the current user's conversation list and keeps it live: new
 * incoming messages bump the relevant conversation to the top and
 * update its preview/unread count in real time.
 */
export function useConversations(activeConversationId: string | null, onOpenConversation: (conversationId: string) => void) {
  const { socket } = useSocketContext();
  const { user } = useAuth();
  const { showToast, showMessageToast } = useToast();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadRequestId = useRef(0);
  const processedMessageIds = useRef(new Set<string>());
  const activeConversationRef = useRef(activeConversationId);

  useEffect(() => {
    activeConversationRef.current = activeConversationId;
    if (import.meta.env.DEV) console.log(`[SOCKET] activeConversation=${activeConversationId ?? 'none'}`);
  }, [activeConversationId]);

  const load = useCallback(async () => {
    const requestId = ++loadRequestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchConversations();
      if (requestId === loadRequestId.current) setConversations(data);
    } catch (err) {
      if (requestId === loadRequestId.current) setError(getErrorMessage(err));
    } finally {
      if (requestId === loadRequestId.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!socket) return;
    if (import.meta.env.DEV) console.log('[SOCKET] registered conversation message listener');

    const handleIncoming = (message: Message) => {
      if (processedMessageIds.current.has(message._id)) return;
      processedMessageIds.current.add(message._id);
      const isOwnMessage = message.sender._id === user?._id;
      if (import.meta.env.DEV) console.log(`[SOCKET] received message messageId=${message._id}`);
      const isActiveConversation = message.conversationId === activeConversationRef.current;
      let shouldReload = false;
      setConversations((prev) => {
        const exists = prev.some((c) => c._id === message.conversationId);
        if (!exists) {
          shouldReload = true;
          return prev;
        }
        const updated = prev.map((c) =>
          c._id === message.conversationId
            ? {
                ...c,
                lastMessage: message,
                unreadCount: isOwnMessage || isActiveConversation ? 0 : c.unreadCount + 1,
              }
            : c
        );
        return [...updated].sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      });
      if (isActiveConversation && !isOwnMessage) {
        void markConversationReadRequest(message.conversationId).then(() => {
          if (import.meta.env.DEV) console.log(`[SOCKET] message marked read messageId=${message._id}`);
        });
      }
      if (shouldReload) {
        const reloadPromise = load();
        if (!isOwnMessage) {
          if (import.meta.env.DEV) console.log(`[SOCKET] notification created messageId=${message._id}`);
          showMessageToast(message, () => {
            void reloadPromise.then(() => onOpenConversation(message.conversationId));
          });
        }
      } else if (!isOwnMessage && !isActiveConversation) {
        if (import.meta.env.DEV) console.log(`[SOCKET] unread incremented conversationId=${message.conversationId}`);
        if (import.meta.env.DEV) console.log(`[SOCKET] notification created messageId=${message._id}`);
        showMessageToast(message, () => onOpenConversation(message.conversationId));
      }
    };

    socket.on('message:receive', handleIncoming);
    const handleConversationCreated = (payload: { conversation: Conversation; createdBy: string }) => {
      const conversation = payload.conversation;
      setConversations((prev) => {
        const exists = prev.some((current) => current._id === conversation._id);
        if (exists) return prev;
        return [{ ...conversation, unreadCount: conversation.unreadCount ?? 0 }, ...prev];
      });
      if (payload.createdBy !== user?._id) {
        const creator = conversation.participants.find((participant) => participant._id === payload.createdBy);
        showToast(`${creator?.name ?? 'A contact'} started a new conversation`);
      }
    };
    const handleConversationCleared = (payload: { conversationId: string }) => {
      setConversations((prev) => prev.map((conversation) => conversation._id === payload.conversationId
        ? { ...conversation, lastMessage: undefined, unreadCount: 0 }
        : conversation));
    };
    const handleConversationDeleted = (payload: { conversationId: string }) => {
      setConversations((prev) => prev.filter((conversation) => conversation._id !== payload.conversationId));
    };
    socket.on('conversation:clear', handleConversationCleared);
    socket.on('conversation:delete', handleConversationDeleted);
    socket.on('conversation:created', handleConversationCreated);
    return () => {
      socket.off('message:receive', handleIncoming);
      socket.off('conversation:clear', handleConversationCleared);
      socket.off('conversation:delete', handleConversationDeleted);
      socket.off('conversation:created', handleConversationCreated);
    };
  }, [socket, user?._id, load, showToast, showMessageToast, onOpenConversation]);

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

  const removeConversation = useCallback((conversationId: string) => {
    setConversations((prev) => prev.filter((conversation) => conversation._id !== conversationId));
  }, []);

  return { conversations, isLoading, error, reload: load, clearUnread, upsertConversation, removeConversation };
}
