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

export async function searchConversationMessages(conversationId: string, query: string): Promise<Message[]> {
  const { data } = await api.get<Message[]>(`/conversations/${conversationId}/messages/search`, { params: { q: query } });
  return data;
}

export async function createGroup(groupName: string, memberIds: string[]): Promise<Conversation> {
  const { data } = await api.post<Conversation>('/groups', { groupName, memberIds });
  return data;
}
