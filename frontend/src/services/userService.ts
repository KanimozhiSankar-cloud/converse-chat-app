import { api } from './api';
import { User } from '../types';

export async function fetchUsers(search?: string): Promise<User[]> {
  const { data } = await api.get<User[]>('/users', { params: search ? { search } : undefined });
  return data;
}

export async function updateCurrentUser(input: { name: string; email: string; avatar?: string }): Promise<User> {
  const { data } = await api.put<User>('/users/me', input);
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api.put('/users/me/password', { currentPassword, newPassword });
}
