import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { getReport } from '../../api/reportApi';
import { mapReportDto } from '../../utils/reportMappers';
import {
  REPORT_STATUS_COLORS,
  REPORT_STATUS_LABELS,
  REPORT_TYPE_LABELS,
  type ReportItem,
} from '../../types/report';
import { LoadingSkeleton, EmptyState } from '../../components/ui';
import { formatDateTime } from '../../utils/helpers';
import { getApiErrorMessage } from '../../utils/apiErrors';

export function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const reportId = id ? Number(id) : null;

  const [report, setReport] = useState<ReportItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reportId == null || Number.isNaN(reportId)) {
      setError('ID báo cáo không hợp lệ');
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    getReport(reportId)
      .then((dto) => {
        if (!cancelled) setReport(mapReportDto(dto));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, 'Không thể tải báo cáo'));
          setReport(null);
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [reportId]);

  if (isLoading) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (error || !report) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <EmptyState
          title="Không thể tải báo cáo"
          description={error ?? 'Báo cáo không tồn tại'}
          variant="error"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/reports')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Báo cáo #{report.id}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {REPORT_TYPE_LABELS[report.type]}
            {report.targetId != null ? ` · Mục tiêu #${report.targetId}` : ''}
          </p>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-medium px-3 py-1 rounded-full ${REPORT_STATUS_COLORS[report.status]}`}
          >
            {REPORT_STATUS_LABELS[report.status]}
          </span>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Lý do</p>
          <p className="font-medium text-gray-900 dark:text-gray-100 mt-1">{report.reason}</p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Mô tả</p>
          <p className="text-gray-900 dark:text-gray-100 mt-1 whitespace-pre-wrap">
            {report.description}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Thời gian gửi</p>
          <p className="text-gray-900 dark:text-gray-100 mt-1">
            {formatDateTime(report.createdAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          {report.chatRoomCode && (
            <button
              type="button"
              onClick={() => navigate(`/chat?room=${report.chatRoomCode}`)}
              className="btn btn-primary"
            >
              <MessageCircle className="w-4 h-4" />
              Mở chat hỗ trợ
            </button>
          )}
          <Link to="/reports" className="btn btn-ghost">
            Danh sách báo cáo
          </Link>
        </div>
      </div>
    </div>
  );
}
