import { useCallback, useEffect, useState } from 'react';
import { getVendorCustomerById } from '../api/analyticsApi';
import type { VendorCustomer } from '../types/customer';

export function useVendorCustomerDetail(customerKeycloakId: string | null) {
  const [customer, setCustomer] = useState<VendorCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!customerKeycloakId) {
      setCustomer(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await getVendorCustomerById(customerKeycloakId);
      setCustomer(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load customer';
      setError(message);
      setCustomer(null);
    } finally {
      setIsLoading(false);
    }
  }, [customerKeycloakId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { customer, isLoading, error, refresh };
}
