import { create } from 'zustand';
import { User } from '../types/api.types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User) => void;
  updateAccessToken: (accessToken: string) => void;
  clearAuth: () => void;
}

const getStoredValue = (key: string): string | null => {
  return localStorage.getItem(key);
};

const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: getStoredValue('accessToken'),
  refreshToken: getStoredValue('refreshToken'),
  user: getStoredUser(),
  isAuthenticated: !!getStoredValue('accessToken'),

  setAuth: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ accessToken, refreshToken, user, isAuthenticated: true });
  },

  updateAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken);
    set({ accessToken, isAuthenticated: true });
  },

  clearAuth: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false });
  },
}));
