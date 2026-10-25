import { useCallback, useEffect, useState } from 'react';
import { getVendorInvoiceById } from '../api/paymentApi';
import type { VendorInvoice } from '../types/payment';
import { getPaymentErrorMessage } from '../utils/paymentErrors';

export function useVendorInvoiceDetail(invoiceId: number | null) {
  const [invoice, setInvoice] = useState<VendorInvoice | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (invoiceId == null || Number.isNaN(invoiceId)) {
      setInvoice(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      setInvoice(await getVendorInvoiceById(invoiceId));
    } catch (err) {
      setError(getPaymentErrorMessage(err, 'Không thể tải hóa đơn'));
      setInvoice(null);
    } finally {
      setIsLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { invoice, isLoading, error, refresh };
}
