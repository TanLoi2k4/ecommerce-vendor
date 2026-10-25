import { create } from 'zustand';
import * as paymentApi from '../api/paymentApi';
import type { InvoiceStatus, VendorFinanceSummary, VendorInvoice, VendorPayout } from '../types/payment';
import {
  computeFinanceSummary,
  mergeFinanceSummaryWithApi,
  type FinanceSummary,
} from '../utils/paymentHelpers';
import { getPaymentErrorMessage } from '../utils/paymentErrors';

interface FinanceState {
  payouts: VendorPayout[];
  invoices: VendorInvoice[];
  financeSummary: VendorFinanceSummary | null;
  summary: FinanceSummary;
  isLoading: boolean;
  isRequesting: boolean;
  invoicesLoading: boolean;
  payingInvoiceId: number | null;
  error: string | null;
  invoicesError: string | null;
  fetchPayouts: () => Promise<void>;
  fetchInvoices: (status?: InvoiceStatus) => Promise<void>;
  requestPayout: () => Promise<VendorPayout>;
  payInvoice: (invoiceId: number) => Promise<void>;
  clearError: () => void;
  clearInvoicesError: () => void;
}

const emptySummary = computeFinanceSummary([]);

export const useFinanceStore = create<FinanceState>((set, get) => ({
  payouts: [],
  invoices: [],
  financeSummary: null,
  summary: emptySummary,
  isLoading: false,
  isRequesting: false,
  invoicesLoading: false,
  payingInvoiceId: null,
  error: null,
  invoicesError: null,

  fetchPayouts: async () => {
    set({ isLoading: true, error: null });
    try {
      const [payouts, financeSummary] = await Promise.all([
        paymentApi.getVendorPayouts(),
        paymentApi.getVendorFinanceSummary(),
      ]);
      const baseSummary = computeFinanceSummary(payouts);
      set({
        payouts,
        financeSummary,
        summary: mergeFinanceSummaryWithApi(baseSummary, financeSummary),
        isLoading: false,
      });
    } catch (err) {
      set({
        error: getPaymentErrorMessage(err, 'Không thể tải lịch sử rút tiền'),
        isLoading: false,
      });
    }
  },

  fetchInvoices: async (status?: InvoiceStatus) => {
    set({ invoicesLoading: true, invoicesError: null });
    try {
      const invoices =
        status === 'PAID'
          ? await paymentApi.getVendorInvoiceHistory()
          : await paymentApi.getVendorInvoices(status);
      set({ invoices, invoicesLoading: false });
    } catch (err) {
      set({
        invoicesError: getPaymentErrorMessage(err, 'Không thể tải hóa đơn'),
        invoicesLoading: false,
      });
    }
  },

  requestPayout: async () => {
    set({ isRequesting: true, error: null });
    try {
      const payout = await paymentApi.requestVendorPayout();
      await get().fetchPayouts();
      set({ isRequesting: false });
      return payout;
    } catch (err) {
      const message = getPaymentErrorMessage(err, 'Không thể gửi yêu cầu rút tiền');
      set({ error: message, isRequesting: false });
      throw err;
    }
  },

  payInvoice: async (invoiceId: number) => {
    set({ payingInvoiceId: invoiceId, invoicesError: null });
    try {
      const response = await paymentApi.payVendorInvoice(invoiceId);
      if (!response.checkoutUrl) {
        throw new Error('No VNPay checkout URL returned');
      }
      window.location.href = response.checkoutUrl;
    } catch (err) {
      const message = getPaymentErrorMessage(err, 'Không thể bắt đầu thanh toán hóa đơn');
      set({ payingInvoiceId: null, invoicesError: message });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
  clearInvoicesError: () => set({ invoicesError: null }),
}));
