import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  user: { id: string; phone: string; name: string } | null;
  setTokens: (access: string, refresh: string, userPayload: any) => Promise<void>;
  clearAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  user: null,
  setTokens: async (access, refresh, userPayload) => {
    try {
      await SecureStore.setItemAsync('access_token', access);
      await SecureStore.setItemAsync('refresh_token', refresh);
      set({ accessToken: access, refreshToken: refresh, isAuthenticated: true, user: userPayload });
    } catch (e) {
      console.error('Error saving credentials to SecureStore', e);
    }
  },
  clearAuth: async () => {
    try {
      await SecureStore.deleteItemAsync('access_token');
      await SecureStore.deleteItemAsync('refresh_token');
      set({ accessToken: null, refreshToken: null, isAuthenticated: false, user: null });
    } catch (e) {
      console.error('Error deleting credentials from SecureStore', e);
    }
  }
}));
