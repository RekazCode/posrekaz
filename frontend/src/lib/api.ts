import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiError } from '../types';

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Token storage (both in-memory and localStorage for persistence)
let accessToken: string | null = null;
let refreshToken: string | null = null;

export const setTokens = (access: string, refresh: string) => {
  accessToken = access;
  refreshToken = refresh;
  // Store both tokens in localStorage for persistence across page refreshes
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
};

export const getAccessToken = () => {
  if (accessToken) return accessToken;
  // Retrieve from localStorage if not in memory (after page refresh)
  const stored = localStorage.getItem('access_token');
  if (stored) {
    accessToken = stored;
    return stored;
  }
  return null;
};

export const getRefreshToken = () => {
  if (refreshToken) return refreshToken;
  const stored = localStorage.getItem('refresh_token');
  if (stored) {
    refreshToken = stored;
    return stored;
  }
  return null;
};

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Get current locale from store (will be set by locale store)
let getLocale: () => string = () => 'en';

export const setLocaleGetter = (getter: () => string) => {
  getLocale = getter;
};

// Request interceptor - add auth token and locale
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add auth token (retrieve from localStorage if not in memory)
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔑 Request with token:', config.url);
    } else {
      console.warn('⚠️ No token for request:', config.url);
    }

    // Add locale header
    const locale = getLocale();
    config.headers['Accept-Language'] = locale;
    config.headers['X-Locale'] = locale;

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config;

    // If 401 and we have a refresh token, try to refresh
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest.headers['X-Retry']
    ) {
      console.log('🔄 Got 401, attempting token refresh...');
      const storedRefreshToken = getRefreshToken();

      if (storedRefreshToken) {
        try {
          console.log('🔄 Refreshing token...');
          const response = await axios.post('/api/auth/refresh', {
            refresh_token: storedRefreshToken,
          });

          const { access_token, refresh_token } = response.data.data;
          setTokens(access_token, refresh_token);
          console.log('✅ Token refreshed successfully');

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          originalRequest.headers['X-Retry'] = 'true';

          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, clear tokens
          console.error('❌ Token refresh failed:', refreshError);
          clearTokens();
          window.location.href = '/login';
        }
      } else {
        // No refresh token, redirect to login
        console.warn('⚠️ No refresh token available, redirecting to login');
        clearTokens();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
