import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Zap, Clock, Trash2 } from 'lucide-react';
import {
  DataTable,
  Pagination,
  SearchBar,
  EmptyState,
  Modal,
  LoadingSkeleton,
} from '../../components/ui';
import { useFlashSales } from '../../hooks/useFlashSales';
import {
  formatCurrency,
  formatRelativeTime,
  getStatusColor,
  calculateDiscount,
  paginate,
  filterBySearch,
} from '../../utils/helpers';
import {
  datetimeLocalToIso,
  formatFlashSaleStatus,
  canDeleteFlashSale,
} from '../../utils/flashSaleMappers';
import {
  validateFlashSaleForm,
  hasFormErrors,
  minDatetimeLocalValue,
  type FlashSaleFormErrors,
  type FlashSaleFormValues,
} from '../../utils/flashSaleValidation';
import type { FlashSaleViewModel } from '../../types/discount';
import { toast } from '../../components/ui/Toast';
import { ApiRequestError } from '../../api/client';

const PAGE_SIZE = 10;
const EMPTY_FORM: FlashSaleFormValues = {
  name: '',
  productId: '',
  flashSalePrice: '',
  startTime: '',
  endTime: '',
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-error-600 dark:text-error-400">{message}</p>;
}

export function FlashSalesPage() {
  const navigate = useNavigate();
  const {
    flashSales,
    activeFlashSales,
    vendorProducts,
    isLoading,
    isSubmitting,
    error,
    create,
    remove,
  } = useFlashSales();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; sale?: FlashSaleViewModel }>({
    open: false,
  });
  const [formData, setFormData] = useState<FlashSaleFormValues>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<FlashSaleFormErrors>({});
  const [actionError, setActionError] = useState('');

  const minDatetime = minDatetimeLocalValue();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const filteredSales = useMemo(() => {
    let items = [...flashSales];
    if (searchQuery.trim()) {
      items = filterBySearch(items, searchQuery, ['name', 'productName']);
    }
    return items;
  }, [flashSales, searchQuery]);

  const paginated = useMemo(
    () => paginate(filteredSales, page, PAGE_SIZE),
    [filteredSales, page]
  );

  const selectedProduct = vendorProducts.find((p) => String(p.id) === formData.productId);

  const clearFieldError = (field: keyof FlashSaleFormValues) => {
    setFormErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleCreate = async () => {
    const errors = validateFlashSaleForm(formData, {
      productPrice: selectedProduct?.price,
    });
    setFormErrors(errors);
    if (hasFormErrors(errors)) return;

    setActionError('');
    try {
      const created = await create({
        name: formData.name.trim(),
        productId: Number(formData.productId),
        flashSalePrice: parseFloat(formData.flashSalePrice),
        startTime: datetimeLocalToIso(formData.startTime),
        endTime: datetimeLocalToIso(formData.endTime),
      });
      toast.success('Tạo Flash Sale thành công.');
      setCreateModalOpen(false);
      setFormData(EMPTY_FORM);
      setFormErrors({});
      navigate(`/marketing/flash-sales/${created.id}`);
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : 'Không thể tạo Flash Sale.';
      setActionError(message);
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.sale) return;
    setActionError('');
    try {
      await remove(deleteModal.sale.id);
      toast.success('Đã xóa Flash Sale.');
      setDeleteModal({ open: false });
    } catch (err) {
      const message =
        err instanceof ApiRequestError ? err.message : 'Không thể xóa Flash Sale.';
      setActionError(message);
      toast.error(message);
    }
  };

  const openCreateModal = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setActionError('');
    setCreateModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      header: 'Flash Sale',
      render: (sale: FlashSaleViewModel) => (
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning-100 dark:bg-warning-900/30">
            <Zap className="w-4 h-4 text-warning-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{sale.name}</p>
            <p className="text-xs text-gray-500">{sale.productName ?? `Sản phẩm #${sale.productId}`}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Giá',
      render: (sale: FlashSaleViewModel) => {
        const original = sale.originalPrice ?? sale.flashSalePrice;
        return (
          <div>
            <span className="font-semibold text-primary-600">{formatCurrency(sale.flashSalePrice)}</span>
            {original > sale.flashSalePrice && (
              <p className="text-xs text-gray-400 line-through">{formatCurrency(original)}</p>
            )}
          </div>
        );
      },
    },
    {
      key: 'discount',
      header: 'Giảm giá',
      render: (sale: FlashSaleViewModel) => {
        const original = sale.originalPrice ?? sale.flashSalePrice;
        if (original <= sale.flashSalePrice) return <span className="text-gray-400">—</span>;
        return (
          <span className="badge badge-error">
            -{calculateDiscount(original, sale.flashSalePrice)}%
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (sale: FlashSaleViewModel) => (
        <span className={`badge badge-${getStatusColor(sale.status)}`}>
          {formatFlashSaleStatus(sale.status)}
        </span>
      ),
    },
    {
      key: 'endTime',
      header: 'Kết thúc',
      render: (sale: FlashSaleViewModel) => (
        <span className="text-gray-600 dark:text-gray-400">
          {formatRelativeTime(sale.endTime)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (sale: FlashSaleViewModel) => (
        <div className="flex items-center gap-1">
          {canDeleteFlashSale(sale.status) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActionError('');
                setDeleteModal({ open: true, sale });
              }}
              className="p-2 rounded-lg text-gray-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950"
              title="Xóa Flash Sale"
              disabled={isSubmitting}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Flash Sales</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Tạo chương trình khuyến mãi giới hạn thời gian
          </p>
        </div>
        <button onClick={openCreateModal} className="btn btn-primary" disabled={isSubmitting}>
          <Plus className="w-5 h-5" />
          Tạo Flash Sale
        </button>
      </div>

      {(error || actionError) && (
        <div className="rounded-lg bg-error-50 dark:bg-error-950/30 text-error-700 dark:text-error-400 px-4 py-3 text-sm">
          {error || actionError}
        </div>
      )}

      {activeFlashSales.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {activeFlashSales.map((sale) => {
            const original = sale.originalPrice ?? sale.flashSalePrice;
            return (
              <div
                key={sale.id}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/marketing/flash-sales/${sale.id}`)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    navigate(`/marketing/flash-sales/${sale.id}`);
                  }
                }}
                className="card p-4 border-l-4 border-warning-500 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`badge badge-${getStatusColor(sale.status)}`}>
                    {formatFlashSaleStatus(sale.status)}
                  </span>
                  <Clock className="w-4 h-4 text-gray-400" />
                </div>
                <p className="font-medium text-gray-900 dark:text-gray-100 mb-1">{sale.name}</p>
                <p className="text-xs text-gray-500 mb-2">
                  {sale.productName ?? `Sản phẩm #${sale.productId}`}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{formatCurrency(sale.flashSalePrice)}</span>
                  {original > sale.flashSalePrice && (
                    <span className="text-warning-600 font-medium">
                      -{calculateDiscount(original, sale.flashSalePrice)}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <SearchBar
        placeholder="Tìm Flash Sale..."
        onSearch={setSearch}
        className="max-w-md"
      />

      {isLoading ? (
        <LoadingSkeleton variant="table" />
      ) : paginated.data.length === 0 ? (
        <EmptyState
          title="Chưa có Flash Sale"
          description="Tạo Flash Sale để tăng độ hiển thị sản phẩm"
          variant="no-data"
          action={
            <button onClick={openCreateModal} className="btn btn-primary">
              <Plus className="w-5 h-5" />
              Tạo Flash Sale
            </button>
          }
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginated.data}
            keyExtractor={(s) => String(s.id)}
            onRowClick={(sale) => navigate(`/marketing/flash-sales/${sale.id}`)}
          />
          <Pagination
            currentPage={page}
            totalPages={paginated.totalPages}
            total={paginated.total}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Tạo Flash Sale"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setCreateModalOpen(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Hủy
            </button>
            <button onClick={handleCreate} className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Đang tạo…' : 'Tạo'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">Tên Flash Sale</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                clearFieldError('name');
                setFormData({ ...formData, name: e.target.value });
              }}
              className="input"
              placeholder="Khuyến mãi cuối tuần"
            />
            <FieldError message={formErrors.name} />
          </div>
          <div>
            <label className="label">Sản phẩm</label>
            <select
              value={formData.productId}
              onChange={(e) => {
                clearFieldError('productId');
                clearFieldError('flashSalePrice');
                setFormData({
                  ...formData,
                  productId: e.target.value,
                  flashSalePrice: '',
                });
              }}
              className="input"
            >
              <option value="">Chọn sản phẩm</option>
              {vendorProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {formatCurrency(p.price)}
                </option>
              ))}
            </select>
            <FieldError message={formErrors.productId} />
          </div>
          {selectedProduct && (
            <p className="text-sm text-gray-500">
              Giá hiện tại: {formatCurrency(selectedProduct.price)}
              {selectedProduct.originalPrice > selectedProduct.price && (
                <> (giá gốc: {formatCurrency(selectedProduct.originalPrice)})</>
              )}
            </p>
          )}
          <div>
            <label className="label">Giá Flash Sale</label>
            <input
              type="number"
              min={0}
              max={selectedProduct?.price}
              step="any"
              value={formData.flashSalePrice}
              onChange={(e) => {
                clearFieldError('flashSalePrice');
                setFormData({ ...formData, flashSalePrice: e.target.value });
              }}
              className="input"
              placeholder="0"
            />
            <FieldError message={formErrors.flashSalePrice} />
            {selectedProduct && (
              <p className="mt-1 text-xs text-gray-500">
                Giá flash sale phải thấp hơn {formatCurrency(selectedProduct.price)}.
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Thời gian bắt đầu</label>
              <input
                type="datetime-local"
                min={minDatetime}
                value={formData.startTime}
                onChange={(e) => {
                  clearFieldError('startTime');
                  setFormData({ ...formData, startTime: e.target.value });
                }}
                className="input"
              />
              <FieldError message={formErrors.startTime} />
            </div>
            <div>
              <label className="label">Thời gian kết thúc</label>
              <input
                type="datetime-local"
                min={formData.startTime || minDatetime}
                value={formData.endTime}
                onChange={(e) => {
                  clearFieldError('endTime');
                  setFormData({ ...formData, endTime: e.target.value });
                }}
                className="input"
              />
              <FieldError message={formErrors.endTime} />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Thời gian theo múi giờ địa phương và được gửi lên máy chủ dưới dạng UTC. Thời gian bắt
            đầu và kết thúc phải ở tương lai. Không được trùng chiến dịch cho cùng một sản phẩm.
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        title="Xóa Flash Sale"
        footer={
          <>
            <button
              onClick={() => setDeleteModal({ open: false })}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Giữ lại
            </button>
            <button
              onClick={handleDelete}
              className="btn btn-danger"
              disabled={isSubmitting || !deleteModal.sale}
            >
              {isSubmitting ? 'Đang xóa…' : 'Xóa Flash Sale'}
            </button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          Xóa vĩnh viễn Flash Sale{' '}
          <span className="font-semibold">{deleteModal.sale?.name}</span>?
          {deleteModal.sale?.status === 'ACTIVE' && (
            <> Giá sản phẩm sẽ được khôi phục về giá gốc.</>
          )}{' '}
          Hành động này không thể hoàn tác.
        </p>
      </Modal>
    </div>
  );
}
