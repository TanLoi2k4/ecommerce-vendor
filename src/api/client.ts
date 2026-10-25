import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { isApiResponse, isErrorResponse, type ApiResponse, type ErrorResponse } from '../types/api';
import { toast } from '../components/ui/Toast';
import {
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  TOKEN_EXPIRES_AT_KEY,
  getAuthItem,
  setAuthItem,
  clearAuthItems,
} from '../utils/authStorage';

const PUBLIC_PATH_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/payment/vnpay-return',
];

function isPublicAuthPath(): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (path) =>
      window.location.pathname === path ||
      window.location.pathname.startsWith(`${path}/`)
  );
}

export class ApiRequestError extends Error {
  readonly errorCode?: string;
  readonly status?: number;

  constructor(message: string, errorCode?: string, status?: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.errorCode = errorCode;
    this.status = status;
  }
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

let handling401 = false;
let refreshPromise: Promise<boolean> | null = null;

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

function isAuthPublicRequest(config?: InternalAxiosRequestConfig): boolean {
  const url = config?.url ?? '';
  return (
    url.includes('/vendors/login') ||
    url.includes('/vendors/refresh') ||
    url.includes('/vendors/register-init') ||
    url.includes('/vendors/verify-otp') ||
    url.includes('/vendors/forget-password') ||
    url.includes('/vendors/reset-password')
  );
}

async function tryRefreshSession(): Promise<boolean> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const { useAuthStore } = await import('../store/authStore');
      return await useAuthStore.getState().refreshSession();
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

function handleUnauthorized(): void {
  if (handling401) return;
  handling401 = true;

  clearAuthTokens();

  if (!isPublicAuthPath()) {
    toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    setTimeout(() => {
      window.location.href = '/login';
      handling401 = false;
    }, 1200);
  } else {
    handling401 = false;
  }
}

api.interceptors.request.use(
  (config) => {
    if (!isAuthPublicRequest(config)) {
      const token = getAuthItem(AUTH_TOKEN_KEY);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response: AxiosResponse) => {
    const body = response.data;

    if (isApiResponse(body)) {
      if (!body.success) {
        return Promise.reject(
          new ApiRequestError(body.message ?? 'Request failed', undefined, response.status)
        );
      }
      response.data = body.data;
    }

    return response;
  },
  async (error: AxiosError<ErrorResponse | ApiResponse<unknown>>) => {
    const status = error.response?.status;
    const body = error.response?.data;
    const config = error.config as RetryConfig | undefined;

    let apiError: ApiRequestError;

    if (body && isErrorResponse(body)) {
      apiError = new ApiRequestError(body.message, body.errorCode, status);
    } else if (body && isApiResponse(body) && !body.success) {
      apiError = new ApiRequestError(
        body.message ?? 'Request failed',
        body.errorCode,
        status
      );
    } else {
      apiError = new ApiRequestError(
        error.message || 'Network error',
        undefined,
        status
      );
    }

    if (
      status === 401 &&
      config &&
      !isAuthPublicRequest(config) &&
      !config._retry
    ) {
      config._retry = true;
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        return api(config);
      }
      handleUnauthorized();
    } else if (status === 403 && !isPublicAuthPath()) {
      toast.error('Bạn không có quyền thực hiện thao tác này.');
    }

    return Promise.reject(apiError);
  }
);

export function setAuthTokens(accessToken: string, refreshToken: string, expiresIn?: number): void {
  setAuthItem(AUTH_TOKEN_KEY, accessToken);
  setAuthItem(REFRESH_TOKEN_KEY, refreshToken);
  const expiresInSec = expiresIn && expiresIn > 0 ? expiresIn : 300;
  setAuthItem(TOKEN_EXPIRES_AT_KEY, String(Date.now() + expiresInSec * 1000));
}

export function getAuthTokenExpiresAt(): number | null {
  const value = getAuthItem(TOKEN_EXPIRES_AT_KEY);
  return value ? Number(value) : null;
}

export function clearAuthTokens(): void {
  clearAuthItems();
}

export { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRES_AT_KEY };
export default api;
