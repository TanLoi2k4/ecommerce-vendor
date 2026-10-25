import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Flag, MessageCircle } from 'lucide-react';
import { Pagination, EmptyState, LoadingSkeleton } from '../../components/ui';
import { useMyReports } from '../../hooks/useMyReports';
import {
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  type ReportStatus,
} from '../../types/report';
import { formatRelativeTime } from '../../utils/helpers';

const STATUS_FILTERS: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'OPEN', label: 'Mở' },
  { value: 'IN_PROGRESS', label: 'Đang xử lý' },
  { value: 'RESOLVED', label: 'Đã giải quyết' },
  { value: 'REJECTED', label: 'Từ chối' },
];

export function ReportsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const pageSize = 10;

  const { reports, totalPages, isLoading, error } = useMyReports({
    page: page - 1,
    size: pageSize,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Báo cáo của tôi
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi các báo cáo bạn đã gửi đến admin
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => {
              setStatusFilter(filter.value);
              setPage(1);
            }}
            className={`btn btn-sm ${
              statusFilter === filter.value ? 'btn-primary' : 'btn-ghost'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-50 dark:bg-error-950 text-error-700 dark:text-error-400 text-sm">
          {error}
        </div>
      )}

      <div className="card divide-y divide-gray-100 dark:divide-gray-800">
        {isLoading ? (
          <LoadingSkeleton variant="list" count={5} />
        ) : reports.length === 0 ? (
          <EmptyState
            icon={<Flag className="w-12 h-12" />}
            title="Chưa có báo cáo"
            description="Các báo cáo bạn gửi từ đơn hàng hoặc chat sẽ hiển thị tại đây"
            variant="no-data"
          />
        ) : (
          reports.map((report) => (
            <div key={report.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                    {REPORT_TYPE_LABELS[report.type]}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${REPORT_STATUS_COLORS[report.status]}`}
                  >
                    {REPORT_STATUS_LABELS[report.status]}
                  </span>
                  {report.targetId != null && (
                    <span className="text-xs text-gray-400">#{report.targetId}</span>
                  )}
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">
                  {report.reason}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                  {report.description}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {formatRelativeTime(report.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  to={`/reports/${report.id}`}
                  className="btn btn-sm btn-ghost"
                >
                  Chi tiết
                </Link>
                {report.chatRoomCode && (
                  <button
                    type="button"
                    onClick={() => navigate(`/chat?room=${report.chatRoomCode}`)}
                    className="btn btn-sm btn-primary"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat hỗ trợ
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
