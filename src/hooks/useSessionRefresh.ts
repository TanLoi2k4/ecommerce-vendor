import { useEffect, useRef } from 'react';
import { getAuthTokenExpiresAt } from '../api/client';
import { useAuthStore } from '../store/authStore';

const REFRESH_BUFFER_MS = 60_000;
const FALLBACK_REFRESH_MS = 4 * 60_000;
const MIN_SCHEDULE_MS = 30_000;

function getRefreshDelay(expiresAt: number | null): number {
  if (expiresAt) {
    return Math.max(MIN_SCHEDULE_MS, expiresAt - Date.now() - REFRESH_BUFFER_MS);
  }
  return FALLBACK_REFRESH_MS;
}

function shouldRefreshNow(expiresAt: number | null): boolean {
  if (!expiresAt) return true;
  return expiresAt - Date.now() <= REFRESH_BUFFER_MS;
}

/** Tự refresh access token trước khi hết hạn để vendor không bị đăng xuất khi idle. */
export function useSessionRefresh(enabled = true) {
  const refreshSession = useAuthStore((s) => s.refreshSession);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled || !useAuthStore.getState().isAuthenticated) return;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const scheduleNext = () => {
      clearTimer();
      const expiresAt = getAuthTokenExpiresAt();
      timerRef.current = setTimeout(() => {
        void runRefresh();
      }, getRefreshDelay(expiresAt));
    };

    const runRefresh = async () => {
      const ok = await refreshSession();
      if (ok) {
        scheduleNext();
      }
    };

    const refreshIfNeeded = async () => {
      const expiresAt = getAuthTokenExpiresAt();
      if (shouldRefreshNow(expiresAt)) {
        await runRefresh();
        return;
      }
      scheduleNext();
    };

    void refreshIfNeeded();

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshIfNeeded();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimer();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [enabled, refreshSession]);
}
