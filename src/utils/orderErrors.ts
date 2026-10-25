import { ApiRequestError } from '../api/client';

const ORDER_ERROR_MESSAGES: Record<string, string> = {
  STATUS_REQUIRED: 'Trạng thái đơn hàng là bắt buộc.',
  SUBORDER_STATUS_NOT_ALLOWED: 'Vendor không thể đặt trạng thái sub-order này.',
  SUBORDER_LOCKED: 'Sub-order không thể cập nhật ở giai đoạn hiện tại.',
  INVALID_SUBORDER_STATE: 'Sub-order phải ở trạng thái CREATED để bắt đầu xử lý.',
  EMPTY_SUBORDER: 'Sub-order không có sản phẩm.',
  ITEMS_NOT_CONFIRMED: 'Tất cả sản phẩm phải được xác nhận hoặc hủy trước khi xác nhận đơn.',
  NO_CONFIRMED_ITEMS: 'Cần ít nhất một sản phẩm được xác nhận để xử lý đơn.',
  ORDER_ITEM_STATUS_REQUIRED: 'Trạng thái sản phẩm là bắt buộc.',
  ITEM_STATUS_NOT_ALLOWED: 'Vendor chỉ có thể xác nhận hoặc hủy sản phẩm.',
  ORDER_ITEM_LOCKED: 'Chỉ sản phẩm đang PENDING mới có thể cập nhật.',
  SUBORDER_NOT_READY_FOR_SHIPPING: 'Sub-order phải ở trạng thái PROCESSING trước khi giao hàng.',
  ORDER_NOT_FOUND: 'Không tìm thấy thông tin đơn hàng cha.',
  PAYMENT_NOT_COMPLETED: 'Không thể yêu cầu giao hàng trước khi thanh toán hoàn tất.',
  NO_CONFIRMED_ITEMS_TO_SHIP: 'Không có sản phẩm đã xác nhận để giao.',
  RESOURCE_NOT_FOUND: 'Không tìm thấy sub-order.',
  VALIDATION_ERROR: 'Dữ liệu không hợp lệ.',
  ACCESS_DENIED: 'Bạn không có quyền thực hiện thao tác này.',
};

export function getOrderErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError && error.errorCode) {
    return ORDER_ERROR_MESSAGES[error.errorCode] ?? error.message ?? fallback;
  }
  if (error instanceof ApiRequestError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
