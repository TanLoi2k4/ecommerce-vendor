import { useCallback, useEffect, useState } from 'react';
import { getVendorCustomers } from '../api/analyticsApi';
import type { VendorCustomerListParams, VendorCustomerPage } from '../types/customer';

export function useVendorCustomers(params: VendorCustomerListParams) {
  const { page = 1, size = 10, search = '', sortBy = 'lastOrderAt', sortOrder = 'desc' } =
    params;

  const [result, setResult] = useState<VendorCustomerPage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getVendorCustomers({ page, size, search, sortBy, sortOrder });
      setResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load customers';
      setError(message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, search, sortBy, sortOrder]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { result, isLoading, error, refresh };
}
