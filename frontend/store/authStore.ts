import { create } from 'zustand';
import type { Admin, Doctor } from '../types';

interface AuthState {
  token: string | null;
  user: Admin | Doctor | null;
  isAuthenticated: boolean;
  role: 'ADMIN' | 'DOCTOR' | null;

  setAuth: (token: string, user: Admin | Doctor, role: 'ADMIN' | 'DOCTOR') => void;
  clearAuth: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  role: null,

  setAuth: (token, user, role) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('role', role);
    set({ token, user, isAuthenticated: true, role });
  },

  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    set({ token: null, user: null, isAuthenticated: false, role: null });
  },

  initAuth: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    const role = localStorage.getItem('role') as 'ADMIN' | 'DOCTOR' | null;

    if (token && userStr && role) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, role });
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
      }
    }
  },
}));
