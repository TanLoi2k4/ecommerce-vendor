import type { AccountVerificationStatus } from '../types/vendor';
import type { InvoiceStatus, VendorPayoutStatus } from '../types/payment';

export const VENDOR_PAYOUT_STATUS_LABELS: Record<VendorPayoutStatus, string> = {
  PENDING_APPROVAL: 'Chờ phê duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  PROCESSING: 'Đang xử lý',
  COMPLETED: 'Hoàn thành',
  FAILED: 'Thất bại',
  FAILED_RECONCILED: 'Thất bại (đã đối soát)',
};

export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  OVERDUE: 'Quá hạn',
  CANCELLED: 'Đã hủy',
};

export function vendorPayoutStatusColor(status: VendorPayoutStatus): string {
  const map: Record<VendorPayoutStatus, string> = {
    PENDING_APPROVAL: 'warning',
    APPROVED: 'primary',
    REJECTED: 'error',
    PROCESSING: 'primary',
    COMPLETED: 'success',
    FAILED: 'error',
    FAILED_RECONCILED: 'gray',
  };
  return map[status] ?? 'gray';
}

export const BANK_VERIFICATION_LABELS: Record<AccountVerificationStatus, string> = {
  PENDING: 'Chờ xác minh',
  VERIFIED: 'Đã xác minh',
  FAILED: 'Thất bại',
  REJECTED: 'Từ chối',
};

export function invoiceStatusColor(status: InvoiceStatus): string {
  const map: Record<InvoiceStatus, string> = {
    PENDING: 'warning',
    PAID: 'success',
    OVERDUE: 'error',
    CANCELLED: 'gray',
  };
  return map[status] ?? 'gray';
}

export function translatePaymentError(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('invalid vnpay signature')) {
    return 'Chữ ký VNPay không hợp lệ. Vui lòng liên hệ hỗ trợ.';
  }
  if (normalized.includes('payment not found')) {
    return 'Không tìm thấy bản ghi thanh toán cho giao dịch này.';
  }
  if (normalized.includes('invoice not found')) {
    return 'Không tìm thấy hóa đơn.';
  }
  if (normalized.includes('not authorized')) {
    return 'Bạn không có quyền xem hóa đơn này.';
  }
  if (normalized.includes('payment already completed')) {
    return 'Hóa đơn này đã được thanh toán.';
  }

  return message;
}
