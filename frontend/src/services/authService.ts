import { api } from './api';
import { AuthUser } from '../types';

interface AuthResponse {
  token: string;
  user: AuthUser;
}

export async function registerRequest(name: string, username: string, email: string, password: string, confirmPassword: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/register', { name, username, email, password, confirmPassword });
  return data;
}

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function forgotPasswordRequest(email: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/forgot-password', { email });
  return data;
}

export async function resetPasswordRequest(token: string, password: string): Promise<{ message: string }> {
  const { data } = await api.post<{ message: string }>('/auth/reset-password', { token, password });
  return data;
}
