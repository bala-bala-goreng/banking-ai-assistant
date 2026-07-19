import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { TokenResponse } from '../api/types';

// Prototype: AsyncStorage. A production app would use Keychain/EncryptedStorage.
const STORAGE_KEY = 'bankapp.tokens';

export type AuthStatus = 'loading' | 'signedIn' | 'signedOut';

interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  refreshToken: string | null;
  hydrate: () => Promise<void>;
  setTokens: (tokens: TokenResponse) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',
  accessToken: null,
  refreshToken: null,

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const { accessToken, refreshToken } = JSON.parse(raw);
        set({ accessToken, refreshToken, status: 'signedIn' });
        return;
      }
    } catch {
      // fall through to signed out
    }
    set({ status: 'signedOut' });
  },

  setTokens: async (tokens) => {
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      status: 'signedIn',
    });
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }),
    );
  },

  logout: async () => {
    set({ accessToken: null, refreshToken: null, status: 'signedOut' });
    await AsyncStorage.removeItem(STORAGE_KEY);
  },
}));
