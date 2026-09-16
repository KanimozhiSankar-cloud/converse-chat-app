export interface User {
  _id: string;
  name: string;
  username?: string;
  email: string;
  avatar: string;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  username?: string;
  email: string;
  avatar: string;
}

export type ConversationType = 'private' | 'group';

export interface Conversation {
  _id: string;
  type: ConversationType;
  participants: User[];
  groupName?: string;
  groupAvatar?: string;
  groupAdmin?: User;
  lastMessage?: Message;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversationId: string;
  sender: User;
  content: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorResponse {
  message: string;
}
