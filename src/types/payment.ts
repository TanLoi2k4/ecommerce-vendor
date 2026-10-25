/**
 * Types aligned with payment-service vendor DTOs.
 * Axios interceptor unwraps ResponseDTO → callers receive T directly.
 */
import type { PaymentMethod, PaymentStatus } from './order';

/** Payout workflow status on payment-service VendorPayout (not order-service sub-order payout). */
export type VendorPayoutStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'FAILED_RECONCILED';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

/** PlatformPayableToVendor embedded in VendorPayout.payableItems */
export interface PlatformPayableToVendor {
  id: number;
  orderCode: string;
  orderId?: number | null;
  subOrderId?: number | null;
  vendorKeycloakId?: string | null;
  amount: number;
  status: PaymentStatus;
  paidAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Matches payment-service VendorPayout entity */
export interface VendorPayout {
  id: number;
  payoutCode: string;
  vendorKeycloakId: string;
  grossAmount: number;
  transactionFee: number;
  netAmount: number;
  bankCode?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  providerTransactionId?: string | null;
  status: VendorPayoutStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  completedAt?: string | null;
  payableItems?: PlatformPayableToVendor[];
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Matches payment-service VendorInvoiceResponse */
export interface VendorInvoice {
  id: number;
  invoiceCode: string;
  vendorKeycloakId: string;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate?: string | null;
  paymentId?: number | null;
  paymentStatus?: PaymentStatus | null;
  checkoutUrl?: string | null;
  providerPaymentIntentId?: string | null;
}

/** Matches payment-service PaymentDetailResponse */
export interface PaymentDetail {
  paymentId: number;
  orderCode: string;
  orderId?: number | null;
  customerKeycloakId?: string | null;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  provider?: string | null;
  providerPaymentIntentId?: string | null;
  providerCheckoutSessionId?: string | null;
  checkoutUrl?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  requestedAt?: string | null;
  paidAt?: string | null;
  failedAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

/** Matches payment-service RefundResponse */
export interface RefundResponse {
  refundId: number;
  orderCode: string;
  orderId?: number | null;
  amount: number;
  currency: string;
  reason?: string | null;
  status: string;
  provider?: string | null;
  providerRefundId?: string | null;
  requestedAt?: string | null;
  refundedAt?: string | null;
  failedAt?: string | null;
}

/** Matches payment-service CreatePaymentResponse */
export interface CreatePaymentResponse {
  paymentId: number;
  orderCode: string;
  status: PaymentStatus;
  provider?: string | null;
  providerCheckoutSessionId?: string | null;
  providerPaymentIntentId?: string | null;
  checkoutUrl?: string | null;
}

export interface UpdatePaymentRequest {
  amount: number;
  currency?: string;
}

export interface RefundPaymentRequest {
  amount: number;
  currency?: string;
  reason?: string;
  orderId?: number;
  requestedAt?: string;
}

export type PaymentType = 'CUSTOMER_ORDER' | 'VENDOR_FEE' | 'WALLET_TOPUP';

/** Response from GET /payments/vnpay-return */
export interface VnpayReturnResult {
  success: boolean;
  orderCode?: string;
  paymentId?: number;
  paymentStatus?: PaymentStatus;
  paymentType?: PaymentType;
  provider?: string;
  txnRef?: string;
  responseCode?: string;
  transactionNo?: string;
  message?: string;
}

/** Matches payment-service VendorFinanceSummaryResponse */
export interface VendorFinanceSummary {
  availableBalance: number;
  totalWithdrawn: number;
  totalGrossPaidOut: number;
  pendingInvoiceAmount: number;
  pendingPayableCount: number;
  pendingInvoiceCount: number;
  activePayoutCount: number;
  minimumPayoutAmount: number;
  canRequestPayout: boolean;
}

export function toMoney(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function normalizePlatformPayableToVendor(
  raw: PlatformPayableToVendor
): PlatformPayableToVendor {
  return {
    ...raw,
    id: Number(raw.id),
    orderId: raw.orderId != null ? Number(raw.orderId) : raw.orderId,
    subOrderId: raw.subOrderId != null ? Number(raw.subOrderId) : raw.subOrderId,
    amount: toMoney(raw.amount),
  };
}

export function normalizeVendorPayout(raw: VendorPayout): VendorPayout {
  return {
    ...raw,
    id: Number(raw.id),
    grossAmount: toMoney(raw.grossAmount),
    transactionFee: toMoney(raw.transactionFee),
    netAmount: toMoney(raw.netAmount),
    payableItems: raw.payableItems?.map(normalizePlatformPayableToVendor),
  };
}

export function normalizeVendorInvoice(raw: VendorInvoice): VendorInvoice {
  return {
    ...raw,
    id: Number(raw.id),
    totalAmount: toMoney(raw.totalAmount),
    paymentId: raw.paymentId != null ? Number(raw.paymentId) : raw.paymentId,
  };
}

export function normalizePaymentDetail(raw: PaymentDetail): PaymentDetail {
  return {
    ...raw,
    paymentId: Number(raw.paymentId),
    orderId: raw.orderId != null ? Number(raw.orderId) : raw.orderId,
    amount: toMoney(raw.amount),
  };
}

export function normalizeRefundResponse(raw: RefundResponse): RefundResponse {
  return {
    ...raw,
    refundId: Number(raw.refundId),
    orderId: raw.orderId != null ? Number(raw.orderId) : raw.orderId,
    amount: toMoney(raw.amount),
  };
}

export function normalizeCreatePaymentResponse(raw: CreatePaymentResponse): CreatePaymentResponse {
  return {
    ...raw,
    paymentId: Number(raw.paymentId),
  };
}

export function normalizeVendorFinanceSummary(raw: VendorFinanceSummary): VendorFinanceSummary {
  return {
    ...raw,
    availableBalance: toMoney(raw.availableBalance),
    totalWithdrawn: toMoney(raw.totalWithdrawn),
    totalGrossPaidOut: toMoney(raw.totalGrossPaidOut),
    pendingInvoiceAmount: toMoney(raw.pendingInvoiceAmount),
    pendingPayableCount: Number(raw.pendingPayableCount ?? 0),
    pendingInvoiceCount: Number(raw.pendingInvoiceCount ?? 0),
    activePayoutCount: Number(raw.activePayoutCount ?? 0),
    minimumPayoutAmount: toMoney(raw.minimumPayoutAmount),
    canRequestPayout: Boolean(raw.canRequestPayout),
  };
}
