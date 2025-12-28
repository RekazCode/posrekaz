import { create } from 'zustand';
import api, { setTokens, clearTokens, getAccessToken, getRefreshToken } from '../lib/api';
import type { User, LoginRequest, LoginResponse, MeResponse } from '../types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<boolean>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (credentials: LoginRequest) => {
    console.log('🔐 Attempting login...', credentials.email);
    set({ isLoading: true, error: null });

    try {
      console.log('📤 Sending login request...');
      const response = await api.post<LoginResponse>('/auth/login', credentials);
      console.log('✅ Login response received:', response.data);
      
      const { user, access_token, refresh_token } = response.data.data;

      console.log('💾 Saving tokens...');
      setTokens(access_token, refresh_token);
      
      console.log('✅ Login successful! User:', user.name);
      set({ user, isAuthenticated: true, isLoading: false, error: null });

      return true;
    } catch (error: unknown) {
      console.error('❌ Login failed:', error);
      const message = extractErrorMessage(error, 'Invalid credentials or account is inactive.');
      set({ error: message, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore logout errors
    } finally {
      clearTokens();
      set({ user: null, isAuthenticated: false, error: null });
    }
  },

  fetchUser: async () => {
    try {
      const response = await api.get<MeResponse>('/auth/me');
      set({ user: response.data.data, isAuthenticated: true });
    } catch {
      clearTokens();
      set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    console.log('🔍 Checking authentication...');
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();
    
    console.log('🔑 Tokens status:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken
    });

    if (!accessToken && !refreshToken) {
      console.log('❌ No tokens found');
      set({ isLoading: false, isAuthenticated: false });
      return false;
    }

    set({ isLoading: true });

    // If we have an access token, try to use it first
    if (accessToken) {
      try {
        console.log('📤 Validating access token...');
        const response = await api.get<MeResponse>('/auth/me');
        console.log('✅ Access token valid, user:', response.data.data.name);
        set({ user: response.data.data, isAuthenticated: true, isLoading: false });
        return true;
      } catch (error) {
        console.log('⚠️ Access token invalid/expired:', error);
        // Access token expired or invalid, try refresh
      }
    }

    // Try to refresh tokens if we have a refresh token
    if (refreshToken) {
      try {
        const response = await api.post<LoginResponse>('/auth/refresh', {
          refresh_token: refreshToken,
        });

        const { user, access_token, refresh_token } = response.data.data;
        setTokens(access_token, refresh_token);
        set({ user, isAuthenticated: true, isLoading: false });

        return true;
      } catch {
        clearTokens();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return false;
      }
    }

    // No valid tokens
    clearTokens();
    set({ user: null, isAuthenticated: false, isLoading: false });
    return false;
  },

  clearError: () => set({ error: null }),
}));

// Helper to extract error message from various error formats
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) {
      return response.data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
