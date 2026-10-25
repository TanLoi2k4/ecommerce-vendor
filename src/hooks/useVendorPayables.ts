import { useCallback, useEffect, useMemo, useState } from 'react';
import { getVendorPayables } from '../api/paymentApi';
import type { PlatformPayableToVendor } from '../types/payment';
import { getApiErrorMessage } from '../utils/apiErrors';

export function useVendorPayables(options: { enabled?: boolean } = {}) {
  const { enabled = true } = options;

  const [payables, setPayables] = useState<PlatformPayableToVendor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);
    try {
      const items = await getVendorPayables();
      setPayables(items);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải thu nhập chờ'));
      setPayables([]);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalAmount = useMemo(
    () => payables.reduce((sum, item) => sum + item.amount, 0),
    [payables]
  );

  return {
    payables,
    totalAmount,
    count: payables.length,
    isLoading,
    error,
    refresh,
  };
}
