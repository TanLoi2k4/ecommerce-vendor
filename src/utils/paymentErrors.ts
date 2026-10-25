import { ApiRequestError } from '../api/client';

const PAYMENT_ERROR_MESSAGES: Record<string, string> = {
  PAYOUT_VENDOR_REQUIRED: 'Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.',
  PAYOUT_IN_PROGRESS: 'Bạn đã có yêu cầu rút tiền đang được xử lý.',
  PAYOUT_NO_PAYABLE_ITEMS: 'Chưa có khoản thu nhập nào có thể rút.',
  PAYOUT_BELOW_MINIMUM: 'Chưa có khoản thu nhập nào có thể rút.',
  PAYOUT_NO_VERIFIED_BANK: 'Cần có tài khoản ngân hàng đã xác minh. Vui lòng thiết lập trong Cài đặt thanh toán.',
  PAYOUT_NOT_FOUND: 'Không tìm thấy yêu cầu rút tiền.',
  PAYOUT_NOT_PENDING_APPROVAL: 'Không thể cập nhật yêu cầu rút tiền ở trạng thái hiện tại.',
  PAYOUT_NOT_FAILED: 'Chỉ có thể đối soát các yêu cầu rút tiền thất bại.',
  INVOICE_NOT_FOUND: 'Không tìm thấy hóa đơn.',
  INVOICE_ACCESS_DENIED: 'Bạn không có quyền truy cập hóa đơn này.',
  INVOICE_NOT_PAYABLE: 'Hóa đơn này không thể thanh toán ở trạng thái hiện tại.',
  PAYMENT_NOT_PENDING: 'Thanh toán không ở trạng thái chờ xử lý và không thể cập nhật.',
  PAYMENT_NOT_REFUNDABLE: 'Không thể hoàn tiền cho thanh toán này.',
  PAYMENT_IDEMPOTENCY_MISMATCH: 'Khóa idempotency không khớp. Vui lòng thử lại.',
  REFUND_AMOUNT_INVALID: 'Số tiền hoàn không hợp lệ.',
  REFUND_AMOUNT_EXCEEDED: 'Số tiền hoàn vượt quá số dư còn lại.',
  REFUND_ORDER_CODE_REQUIRED: 'Cần có mã đơn hàng để hoàn tiền.',
  REFUND_IDEMPOTENCY_CONFLICT: 'Đã tồn tại yêu cầu hoàn tiền với số tiền khác.',
};

export function getPaymentErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError && error.errorCode) {
    return PAYMENT_ERROR_MESSAGES[error.errorCode] ?? error.message ?? fallback;
  }

  if (error instanceof ApiRequestError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
