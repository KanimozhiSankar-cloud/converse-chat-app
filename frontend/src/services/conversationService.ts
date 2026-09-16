import { api } from './api';
import { Conversation, Message } from '../types';

export async function fetchConversations(): Promise<Conversation[]> {
  const { data } = await api.get<Conversation[]>('/conversations');
  return data;
}

export async function startPrivateConversation(userId: string): Promise<Conversation> {
  const { data } = await api.post<Conversation>('/conversations', { userId });
  return data;
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages`);
  return data;
}

export async function markConversationReadRequest(conversationId: string): Promise<void> {
  await api.put(`/conversations/${conversationId}/read`);
}

export async function clearConversationRequest(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}/messages`);
}

export async function deleteConversationRequest(conversationId: string): Promise<void> {
  await api.delete(`/conversations/${conversationId}`);
}

export async function searchConversationMessages(conversationId: string, query: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages/search`, { params: { q: query } });
  return data;
}

export async function createGroup(groupName: string, memberIds: string[]): Promise<Conversation> {
  const { data } = await api.post<Conversation>('/groups', { groupName, memberIds });
  return data;
}
