const statusLabels: Record<string, string> = {
  active: 'Hoạt động',
  inactive: 'Không hoạt động',
  deleted: 'Đã xóa',
  draft: 'Bản nháp',
  pending: 'Chờ xử lý',
  pending_review: 'Chờ duyệt',
  pending_approval: 'Chờ phê duyệt',
  processing: 'Đang xử lý',
  shipped: 'Đã giao vận',
  delivered: 'Đã giao',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  returned: 'Đã trả hàng',
  paid: 'Đã thanh toán',
  failed: 'Thất bại',
  refunded: 'Đã hoàn tiền',
  upcoming: 'Sắp diễn ra',
  ended: 'Đã kết thúc',
  expired: 'Hết hạn',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
  open: 'Mở',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao',
  urgent: 'Khẩn cấp',
};

export function getStatusLabel(status: string): string {
  const key = status.toLowerCase();
  return statusLabels[key] ?? status.replace(/_/g, ' ');
}
