/**
 * paymentApi — payment-service vendor endpoints via gateway (/api/payments/vendor).
 * Response unwrapped by axios interceptor → res.data is inner payload.
 */
import api from './client';
import type {
  CreatePaymentResponse,
  InvoiceStatus,
  PaymentDetail,
  PlatformPayableToVendor,
  RefundPaymentRequest,
  RefundResponse,
  UpdatePaymentRequest,
  VendorFinanceSummary,
  VendorInvoice,
  VendorPayout,
  VnpayReturnResult,
} from '../types/payment';
import {
  normalizeCreatePaymentResponse,
  normalizePaymentDetail,
  normalizePlatformPayableToVendor,
  normalizeRefundResponse,
  normalizeVendorFinanceSummary,
  normalizeVendorInvoice,
  normalizeVendorPayout,
} from '../types/payment';

/** PUT /payments/vendor/{orderCode} */
export async function updateVendorPayment(
  orderCode: string,
  request: UpdatePaymentRequest,
  idempotencyKey?: string
): Promise<PaymentDetail> {
  const res = await api.put<PaymentDetail>(
    `/payments/vendor/${encodeURIComponent(orderCode)}`,
    request,
    { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined }
  );
  return normalizePaymentDetail(res.data);
}

/** POST /payments/vendor/{orderCode}/cancel */
export async function cancelVendorPayment(
  orderCode: string,
  idempotencyKey?: string
): Promise<PaymentDetail> {
  const res = await api.post<PaymentDetail>(
    `/payments/vendor/${encodeURIComponent(orderCode)}/cancel`,
    undefined,
    { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined }
  );
  return normalizePaymentDetail(res.data);
}

/** POST /payments/vendor/{orderCode}/refund */
export async function refundVendorPayment(
  orderCode: string,
  request: RefundPaymentRequest,
  idempotencyKey?: string
): Promise<RefundResponse> {
  const res = await api.post<RefundResponse>(
    `/payments/vendor/${encodeURIComponent(orderCode)}/refund`,
    request,
    { headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined }
  );
  return normalizeRefundResponse(res.data);
}

/** GET /payments/vendor/payouts */
export async function getVendorPayouts(): Promise<VendorPayout[]> {
  const res = await api.get<VendorPayout[]>('/payments/vendor/payouts');
  return (res.data ?? []).map(normalizeVendorPayout);
}

/** POST /payments/vendor/payouts/request-payout */
export async function requestVendorPayout(): Promise<VendorPayout> {
  const res = await api.post<VendorPayout>('/payments/vendor/payouts/request-payout');
  return normalizeVendorPayout(res.data);
}

/** GET /payments/vendor/invoices */
export async function getVendorInvoices(status?: InvoiceStatus): Promise<VendorInvoice[]> {
  const res = await api.get<VendorInvoice[]>('/payments/vendor/invoices', {
    params: status ? { status } : undefined,
  });
  return (res.data ?? []).map(normalizeVendorInvoice);
}

/** GET /payments/vendor/invoices/history */
export async function getVendorInvoiceHistory(): Promise<VendorInvoice[]> {
  const res = await api.get<VendorInvoice[]>('/payments/vendor/invoices/history');
  return (res.data ?? []).map(normalizeVendorInvoice);
}

/** GET /payments/vendor/invoices/{invoiceId} */
export async function getVendorInvoiceById(invoiceId: number): Promise<VendorInvoice> {
  const res = await api.get<VendorInvoice>(`/payments/vendor/invoices/${invoiceId}`);
  return normalizeVendorInvoice(res.data);
}

/** POST /payments/vendor/invoices/{invoiceId}/pay */
export async function payVendorInvoice(invoiceId: number): Promise<CreatePaymentResponse> {
  const res = await api.post<CreatePaymentResponse>(
    `/payments/vendor/invoices/${invoiceId}/pay`
  );
  return normalizeCreatePaymentResponse(res.data);
}

/** GET /payments/vendor/summary */
export async function getVendorFinanceSummary(): Promise<VendorFinanceSummary> {
  const res = await api.get<VendorFinanceSummary>('/payments/vendor/summary');
  return normalizeVendorFinanceSummary(res.data);
}

/** GET /payments/vendor/payables */
export async function getVendorPayables(): Promise<PlatformPayableToVendor[]> {
  const res = await api.get<PlatformPayableToVendor[]>('/payments/vendor/payables');
  return (res.data ?? []).map(normalizePlatformPayableToVendor);
}

/** GET /payments/vnpay-return — process VNPay redirect (public) */
export async function processVnpayReturn(
  params: Record<string, string>
): Promise<VnpayReturnResult> {
  const res = await api.get<VnpayReturnResult>('/payments/vnpay-return', { params });
  return res.data;
}
