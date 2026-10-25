import { useEffect, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

interface UseVendorProfileOptions {
  /** Refetch profile when the hook mounts */
  refetchOnMount?: boolean;
}

export function useVendorProfile(options: UseVendorProfileOptions = {}) {
  const { refetchOnMount = false } = options;
  const vendor = useAuthStore((s) => s.vendor);
  const user = useAuthStore((s) => s.user);
  const shop = useAuthStore((s) => s.shop);
  const isLoading = useAuthStore((s) => s.isLoading);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const updateVendorProfile = useAuthStore((s) => s.updateVendorProfile);
  const updateVendorAccount = useAuthStore((s) => s.updateVendorAccount);

  const refresh = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (refetchOnMount) {
      refresh().catch(() => undefined);
    }
  }, [refetchOnMount, refresh]);

  return {
    vendor,
    user,
    shop,
    isLoading,
    refresh,
    updateVendorProfile,
    updateVendorAccount,
  };
}
