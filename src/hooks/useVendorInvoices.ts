import { useCallback, useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';
import type { InvoiceStatus } from '../types/payment';

export type InvoiceTab = 'ALL' | 'PENDING' | 'PAID' | 'OVERDUE';

export function useVendorInvoices(options: { tab?: InvoiceTab; enabled?: boolean } = {}) {
  const { tab = 'PENDING', enabled = true } = options;

  const invoices = useFinanceStore((s) => s.invoices);
  const isLoading = useFinanceStore((s) => s.invoicesLoading);
  const payingInvoiceId = useFinanceStore((s) => s.payingInvoiceId);
  const error = useFinanceStore((s) => s.invoicesError);
  const fetchInvoices = useFinanceStore((s) => s.fetchInvoices);
  const payInvoice = useFinanceStore((s) => s.payInvoice);
  const clearError = useFinanceStore((s) => s.clearInvoicesError);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    await fetchInvoices(tab === 'ALL' ? undefined : (tab as InvoiceStatus));
  }, [enabled, fetchInvoices, tab]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    invoices,
    isLoading,
    payingInvoiceId,
    error,
    refresh,
    payInvoice,
    clearError,
  };
}
