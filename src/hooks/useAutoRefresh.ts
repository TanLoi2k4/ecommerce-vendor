import { useEffect, useRef } from 'react';

type RefreshContext = {
  silent: boolean;
};

type UseAutoRefreshOptions = {
  intervalMs?: number;
  refetchOnFocus?: boolean;
  enabled?: boolean;
};

/**
 * Gọi lại callback khi mount, khi deps đổi, khi quay lại tab, và theo chu kỳ.
 * Lần đầu / deps đổi: silent=false. Polling & focus: silent=true.
 */
export function useAutoRefresh(
  callback: (ctx: RefreshContext) => void | Promise<void>,
  deps: React.DependencyList,
  options?: UseAutoRefreshOptions
) {
  const { intervalMs = 30_000, refetchOnFocus = true, enabled = true } = options ?? {};
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled) return;

    const run = (silent: boolean) => {
      void callbackRef.current({ silent });
    };

    run(false);

    const onFocus = () => run(true);
    if (refetchOnFocus) {
      window.addEventListener('focus', onFocus);
    }

    const timer = window.setInterval(() => run(true), intervalMs);

    return () => {
      if (refetchOnFocus) {
        window.removeEventListener('focus', onFocus);
      }
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, enabled, intervalMs, refetchOnFocus]);
}
