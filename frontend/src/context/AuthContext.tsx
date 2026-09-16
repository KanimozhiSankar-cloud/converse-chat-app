import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { AuthUser } from '../types';
import { loginRequest, registerRequest } from '../services/authService';
import { getErrorMessage } from '../services/api';
import { connectSocket, disconnectSocket } from '../socket/socket';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from localStorage on first load and (re)connect the socket.
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      connectSocket(storedToken);
    }
    setIsLoading(false);
  }, []);

  function persistSession(newToken: string, newUser: AuthUser) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    connectSocket(newToken);
  }

  async function login(email: string, password: string) {
    try {
      const result = await loginRequest(email, password);
      persistSession(result.token, result.user);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function register(name: string, username: string, email: string, password: string, confirmPassword: string) {
    try {
      const result = await registerRequest(name, username, email, password, confirmPassword);
      persistSession(result.token, result.user);
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
    setToken(null);
    setUser(null);
  }

  function updateUser(updatedUser: AuthUser) {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  const value = useMemo(
    () => ({ user, token, isAuthenticated: Boolean(token), isLoading, login, register, updateUser, logout }),
    [user, token, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
