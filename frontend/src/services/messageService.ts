import { api } from './api';
import { Message } from '../types';

export async function sendMessageRequest(conversationId: string, content: string, replyToId?: string): Promise<Message> {
  const { data } = await api.post<Message>('/messages', { conversationId, content, replyToId });
  return data;
}

export async function markMessageRead(messageId: string): Promise<Message> {
  const { data } = await api.put<Message>(`/messages/${messageId}/read`);
  return data;
}

export async function updateMessageRequest(messageId: string, content: string): Promise<Message> {
  const { data } = await api.put<Message>(`/messages/${messageId}`, { content });
  return data;
}

export async function deleteMessageRequest(messageId: string): Promise<void> {
  await api.delete(`/messages/${messageId}`);
}
