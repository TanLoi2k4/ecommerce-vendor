/** Mirrors communication-service ReportType enum. */
export type ReportType = 'PRODUCT' | 'VENDOR' | 'ORDER' | 'OTHER';

/** Mirrors communication-service ReportStatus enum. */
export type ReportStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';

export interface CreateReportRequest {
  type: ReportType;
  targetId?: number | null;
  targetKeycloakId?: string | null;
  reason: string;
  description: string;
}

export interface ReportDto {
  id: number;
  reporterKeycloakId: string;
  reporterRole: string;
  type: ReportType;
  targetId?: number | null;
  targetKeycloakId?: string | null;
  targetName?: string | null;
  reason: string;
  description: string;
  status: ReportStatus;
  assignedAdminId?: string | null;
  chatRoomCode?: string | null;
  createdAt: string;
}

export interface ReportItem {
  id: number;
  type: ReportType;
  targetId?: number;
  targetKeycloakId?: string;
  targetName?: string;
  reason: string;
  description: string;
  status: ReportStatus;
  chatRoomCode?: string;
  createdAt: string;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  PRODUCT: 'Sản phẩm',
  VENDOR: 'Gian hàng',
  ORDER: 'Đơn hàng',
  OTHER: 'Khác',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: 'Mở',
  IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Từ chối',
};

export const REPORT_STATUS_COLORS: Record<ReportStatus, string> = {
  OPEN: 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300',
  IN_PROGRESS: 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  RESOLVED: 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300',
  REJECTED: 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300',
};
