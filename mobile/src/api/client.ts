import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../config';
import { ApiError, TokenResponse } from './types';
import { useAuthStore } from '../store/auth';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(config => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken && !config.url?.startsWith('/api/v1/auth/')) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise: Promise<TokenResponse> | null = null;

api.interceptors.response.use(
  response => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;
    const { refreshToken, setTokens, logout } = useAuthStore.getState();

    const isAuthCall = original?.url?.startsWith('/api/v1/auth/');
    if (error.response?.status !== 401 || !original || original._retried || isAuthCall || !refreshToken) {
      throw error;
    }

    original._retried = true;
    try {
      // Single-flight: concurrent 401s share one refresh request.
      refreshPromise =
        refreshPromise ??
        axios
          .post<TokenResponse>(`${API_BASE_URL}/api/v1/auth/refresh`, { refreshToken })
          .then(r => r.data)
          .finally(() => {
            refreshPromise = null;
          });
      const tokens = await refreshPromise;
      await setTokens(tokens);
      original.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(original);
    } catch (refreshError) {
      await logout();
      throw refreshError;
    }
  },
);

/** Human-readable message from an API error (falls back to a generic one). */
export function errorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      return 'Tidak dapat terhubung ke server. Periksa koneksi Anda.';
    }
  }
  return 'Terjadi kesalahan. Silakan coba lagi.';
}
