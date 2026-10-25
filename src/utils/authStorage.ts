export const AUTH_TOKEN_KEY = 'auth-token';
export const REFRESH_TOKEN_KEY = 'refresh-token';
export const TOKEN_EXPIRES_AT_KEY = 'auth-token-expires-at';
export const REMEMBER_ME_KEY = 'auth-remember-me';

const AUTH_KEYS = [AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, TOKEN_EXPIRES_AT_KEY] as const;

/** Đọc preference "Ghi nhớ đăng nhập" — mặc định true (giữ hành vi cũ). */
export function isRememberMeEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
}

function getActiveStorage(): Storage {
  if (typeof window === 'undefined') return localStorage;
  return isRememberMeEnabled() ? localStorage : sessionStorage;
}

/**
 * Lưu preference — gọi trước khi lưu token (login).
 * true  -> token lưu ở localStorage, còn sau khi đóng trình duyệt.
 * false -> token lưu ở sessionStorage, mất khi đóng tab/trình duyệt.
 */
export function setRememberMePreference(remember: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
  // Xoá token cũ ở storage không còn dùng để tránh session "ma"
  const stale = remember ? sessionStorage : localStorage;
  AUTH_KEYS.forEach((key) => stale.removeItem(key));
}

export function getAuthItem(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return getActiveStorage().getItem(key);
}

export function setAuthItem(key: string, value: string): void {
  if (typeof window === 'undefined') return;
  getActiveStorage().setItem(key, value);
}

export function clearAuthItems(): void {
  if (typeof window === 'undefined') return;
  AUTH_KEYS.forEach((key) => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
}
