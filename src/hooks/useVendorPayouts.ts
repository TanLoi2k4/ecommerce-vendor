import { useCallback, useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';

export function useVendorPayouts(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const payouts = useFinanceStore((s) => s.payouts);
  const summary = useFinanceStore((s) => s.summary);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const isRequesting = useFinanceStore((s) => s.isRequesting);
  const error = useFinanceStore((s) => s.error);
  const fetchPayouts = useFinanceStore((s) => s.fetchPayouts);
  const requestPayout = useFinanceStore((s) => s.requestPayout);
  const clearError = useFinanceStore((s) => s.clearError);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    await fetchPayouts();
  }, [enabled, fetchPayouts]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    payouts,
    summary,
    isLoading,
    isRequesting,
    error,
    refresh,
    requestPayout,
    clearError,
  };
}
