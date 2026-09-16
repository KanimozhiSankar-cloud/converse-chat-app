import { useCallback, useEffect, useRef, useState } from 'react';
import { Message } from '../types';
import { fetchMessages } from '../services/conversationService';
import { deleteMessageRequest, sendMessageRequest, updateMessageRequest } from '../services/messageService';
import { clearConversationRequest } from '../services/conversationService';
import { getErrorMessage } from '../services/api';
import { useSocketContext } from '../context/SocketContext';

/**
 * Loads message history for a conversation, joins its Socket.IO room,
 * and appends new messages as they arrive in real time.
 */
export function useMessages(conversationId: string | null) {
  const { socket } = useSocketContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const activeConversationId = useRef<string | null>(null);

  useEffect(() => {
    activeConversationId.current = conversationId;

    if (!conversationId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchMessages(conversationId)
      .then((data) => {
        if (!cancelled) {
          setMessages((current) => {
            const merged = new Map(data.map((message) => [message._id, message]));
            current.forEach((message) => merged.set(message._id, message));
            return [...merged.values()].sort(
              (first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime()
            );
          });
        }
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    socket?.emit('conversation:join', conversationId);

    return () => {
      cancelled = true;
      socket?.emit('conversation:leave', conversationId);
    };
  }, [conversationId, socket]);

  useEffect(() => {
    if (!socket) return;

    if (import.meta.env.DEV) console.log('[SOCKET] registered message listener');

    const handleIncoming = (message: Message) => {
      if (message.conversationId !== activeConversationId.current) return;
      if (import.meta.env.DEV) console.log(`[SOCKET] received message messageId=${message._id}`);
      setMessages((prev) => {
        if (prev.some((m) => m._id === message._id)) return prev;
        if (import.meta.env.DEV) console.log(`[SOCKET] message appended messageId=${message._id}`);
        return [...prev, message];
      });
    };

    const handleUpdated = (message: Message) => {
      if (message.conversationId !== activeConversationId.current) return;
      setMessages((prev) => prev.map((current) => (current._id === message._id ? message : current)));
    };

    const handleDeleted = (payload: { messageId: string; conversationId: string }) => {
      if (payload.conversationId !== activeConversationId.current) return;
      setMessages((prev) => prev.filter((message) => message._id !== payload.messageId));
    };
    const handleConversationCleared = (payload: { conversationId: string }) => {
      if (payload.conversationId === activeConversationId.current) setMessages([]);
    };

    const handleTypingStart = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId === activeConversationId.current) setTypingUserId(payload.userId);
    };
    const handleTypingStop = (payload: { conversationId: string; userId: string }) => {
      if (payload.conversationId === activeConversationId.current) setTypingUserId(null);
    };

    socket.on('message:receive', handleIncoming);
    socket.on('message:update', handleUpdated);
    socket.on('message:delete', handleDeleted);
    socket.on('conversation:clear', handleConversationCleared);
    socket.on('typing:start', handleTypingStart);
    socket.on('typing:stop', handleTypingStop);
    return () => {
      socket.off('message:receive', handleIncoming);
      socket.off('message:update', handleUpdated);
      socket.off('message:delete', handleDeleted);
      socket.off('conversation:clear', handleConversationCleared);
      socket.off('typing:start', handleTypingStart);
      socket.off('typing:stop', handleTypingStop);
    };
  }, [socket]);

  const sendMessage = useCallback(
    async (content: string, replyToId?: string) => {
      if (!conversationId || content.trim().length === 0) return;
      setIsSending(true);
      setError(null);
      try {
        await sendMessageRequest(conversationId, content.trim(), replyToId);
        // The new message arrives via the 'message:receive' socket event,
        // so we don't need to optimistically insert it here.
      } catch (err) {
        setError(getErrorMessage(err));
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [conversationId]
  );

  const updateMessage = useCallback(async (messageId: string, content: string) => {
    setError(null);
    try {
      const updated = await updateMessageRequest(messageId, content);
      setMessages((prev) => prev.map((message) => (message._id === updated._id ? updated : message)));
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, []);

  const removeMessage = useCallback(async (messageId: string) => {
    setError(null);
    try {
      await deleteMessageRequest(messageId);
      setMessages((prev) => prev.filter((message) => message._id !== messageId));
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, []);

  const clearMessages = useCallback(async () => {
    if (!conversationId) return;
    setError(null);
    try {
      await clearConversationRequest(conversationId);
      setMessages([]);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  }, [conversationId]);

  return { messages, isLoading, error, isSending, typingUserId, sendMessage, updateMessage, removeMessage, clearMessages };
}
