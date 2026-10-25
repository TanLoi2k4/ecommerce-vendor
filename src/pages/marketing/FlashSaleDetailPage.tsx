import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Package,
  RefreshCw,
  Trash2,
  Zap,
} from 'lucide-react';
import { useFlashSaleDetail } from '../../hooks/useFlashSaleDetail';
import { EmptyState, LoadingSkeleton, Modal } from '../../components/ui';
import { toast } from '../../components/ui/Toast';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';
import {
  calculateDiscount,
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  getStatusColor,
} from '../../utils/helpers';
import { canDeleteFlashSale, formatFlashSaleStatus } from '../../utils/flashSaleMappers';
import { ApiRequestError } from '../../api/client';

export function FlashSaleDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const flashSaleId = id ? Number(id) : null;
  const { sale, isLoading, isSubmitting, error, refresh, remove } = useFlashSaleDetail(
    flashSaleId != null && !Number.isNaN(flashSaleId) ? flashSaleId : null
  );
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleDelete = async () => {
    try {
      await remove();
      toast.success('Đã xóa Flash Sale.');
      navigate('/marketing/flash-sales');
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : 'Không thể xóa Flash Sale.';
      toast.error(message);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (error || !sale) {
    return (
      <EmptyState
        title="Không tìm thấy Flash Sale"
        description={error ?? 'Flash Sale này không tồn tại hoặc không thuộc về bạn.'}
        variant="no-data"
        action={
          <button
            type="button"
            onClick={() => navigate('/marketing/flash-sales')}
            className="btn btn-primary"
          >
            Quay lại Flash Sales
          </button>
        }
      />
    );
  }

  const original = sale.originalPrice ?? sale.flashSalePrice;
  const discountPct =
    original > sale.flashSalePrice ? calculateDiscount(original, sale.flashSalePrice) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/marketing/flash-sales')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-warning-100 dark:bg-warning-900/30">
              <Zap className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{sale.name}</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
                Flash Sale #{sale.id}
                {sale.productName ? ` · ${sale.productName}` : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            disabled={isLoading}
            className="btn btn-secondary"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          {canDeleteFlashSale(sale.status) && (
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={isSubmitting}
              className="btn btn-danger"
            >
              <Trash2 className="w-4 h-4" />
              Xóa
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Giá bán
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">Giá Flash Sale</p>
                <p className="text-2xl font-bold text-primary-600">
                  {formatCurrency(sale.flashSalePrice)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Giá gốc</p>
                <p className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(original)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Giảm giá</p>
                {discountPct != null ? (
                  <span className="badge badge-error text-base px-3 py-1">-{discountPct}%</span>
                ) : (
                  <span className="text-gray-400">—</span>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Lịch trình
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Thời gian bắt đầu</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDateTime(sale.startTime)}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Thời gian kết thúc</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {formatDateTime(sale.endTime)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatRelativeTime(sale.endTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Trạng thái</h3>
            <span className={`badge badge-${getStatusColor(sale.status)} text-sm px-3 py-1`}>
              {formatFlashSaleStatus(sale.status)}
            </span>
          </div>

          <div className="card overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                Sản phẩm liên kết
              </h3>
            </div>
            <div className="p-6">
              <Link
                to={`/products/${sale.productId}`}
                className="flex items-center gap-4 group rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 p-2 -m-2"
              >
                <img
                  src={sale.productImage || PRODUCT_PLACEHOLDER}
                  alt={sale.productName ?? `Sản phẩm #${sale.productId}`}
                  className="w-16 h-16 rounded-lg object-cover bg-gray-100 dark:bg-gray-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-600 truncate">
                    {sale.productName ?? `Sản phẩm #${sale.productId}`}
                  </p>
                  <p className="text-sm text-gray-500">Mã sản phẩm: {sale.productId}</p>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Xóa Flash Sale"
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Giữ lại
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang xóa…' : 'Xóa Flash Sale'}
            </button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          Xóa vĩnh viễn Flash Sale <span className="font-semibold">{sale.name}</span>?
          {sale.status === 'ACTIVE' && <> Giá sản phẩm sẽ được khôi phục về giá gốc.</>}{' '}
          Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}
