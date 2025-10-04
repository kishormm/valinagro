import { create } from 'zustand';
import { login as apiLogin, checkAuthStatus } from '@/services/apiService';
import { useRouter } from 'next/navigation';

export const useAuthStore = create((set) => ({
  user: null,
  
  login: async (credentials) => {
    try {
      const userData = await apiLogin(credentials);
      set({ user: userData });
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  },

  logout: () => {
    set({ user: null });
  },
  
  checkAuth: async () => {
    const userData = await checkAuthStatus();
    if (userData) {
      set({ user: userData });
    }
  },
}));