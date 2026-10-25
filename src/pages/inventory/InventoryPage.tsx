import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Package, TrendingDown, Pencil } from 'lucide-react';
import {
  DataTable,
  Pagination,
  SearchBar,
  EmptyState,
  LoadingSkeleton,
  Modal,
} from '../../components/ui';
import { getVendorProducts, updateProduct, getProductById } from '../../api/productApi';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { detailToProductRequest } from '../../types/product';
import type { ProductCardModel } from '../../types/product';
import { formatCurrency } from '../../utils/helpers';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';

export function InventoryPage() {
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState<ProductCardModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [threshold, setThreshold] = useState(10);
  const [page, setPage] = useState(1);
  const [stockModal, setStockModal] = useState<{ open: boolean; product?: ProductCardModel }>({
    open: false,
  });
  const [newStock, setNewStock] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const loadInventory = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    setLoadError('');
    try {
      const result = await getVendorProducts({ page: 1, size: 200, sortBy: 'stock' });
      setAllProducts(result.data.filter((p) => !p.deleted));
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Không thể tải tồn kho'));
      setAllProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useAutoRefresh(({ silent }) => {
    void loadInventory(silent);
  }, [loadInventory]);

  const lowStockProducts = useMemo(
    () =>
      allProducts.filter(
        (p) =>
          p.stock <= threshold &&
          (p.name.toLowerCase().includes(search.toLowerCase()) ||
            String(p.id).includes(search))
      ),
    [allProducts, threshold, search]
  );

  const paginatedProducts = lowStockProducts.slice((page - 1) * 15, page * 15);
  const outOfStockCount = allProducts.filter((p) => p.stock === 0).length;

  const openStockModal = (product: ProductCardModel) => {
    setStockModal({ open: true, product });
    setNewStock(String(product.stock));
    setSaveError('');
  };

  const handleStockUpdate = async () => {
    const product = stockModal.product;
    if (!product) return;
    const stock = parseInt(newStock, 10);
    if (Number.isNaN(stock) || stock < 0) {
      setSaveError('Vui lòng nhập số lượng tồn kho hợp lệ');
      return;
    }

    setIsSaving(true);
    setSaveError('');
    try {
      const detail = await getProductById(product.id);
      await updateProduct(product.id, detailToProductRequest(detail, { stock }));
      await loadInventory(false);
      setStockModal({ open: false });
    } catch (err) {
      setSaveError(getApiErrorMessage(err, 'Không thể cập nhật tồn kho'));
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Sản phẩm',
      render: (product: ProductCardModel) => (
        <div className="flex items-center gap-3">
          <img
            src={product.thumbnail || PRODUCT_PLACEHOLDER}
            alt={product.name}
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
              {product.name}
            </p>
            <p className="text-xs text-gray-500">#{product.id}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Danh mục',
      render: (product: ProductCardModel) => product.categoryName || '—',
    },
    {
      key: 'stock',
      header: 'Tồn kho',
      render: (product: ProductCardModel) => (
        <div className="flex items-center gap-2">
          {product.stock <= 5 ? (
            <AlertTriangle className="w-4 h-4 text-error-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-warning-500" />
          )}
          <span
            className={
              product.stock <= 5 ? 'text-error-600 font-medium' : 'text-warning-600 font-medium'
            }
          >
            {product.stock}
          </span>
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Giá',
      render: (product: ProductCardModel) => formatCurrency(product.price),
    },
    {
      key: 'actions',
      header: '',
      render: (product: ProductCardModel) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            openStockModal(product);
          }}
          className="btn btn-ghost btn-sm"
        >
          <Pencil className="w-4 h-4" />
          Tồn kho
        </button>
      ),
    },
  ];

  if (isLoading) {
    return <LoadingSkeleton variant="stats" />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Quản lý tồn kho
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Theo dõi mức tồn kho và cập nhật số lượng
        </p>
      </div>

      {loadError && (
        <div className="rounded-lg bg-error-50 text-error-700 px-4 py-3 text-sm">{loadError}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-6 border-l-4 border-warning-500">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-warning-100 dark:bg-warning-900/30">
              <AlertTriangle className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tồn kho thấp (≤ {threshold})</p>
              <p className="text-2xl font-bold">{lowStockProducts.length}</p>
            </div>
          </div>
        </div>
        <div className="card p-6 border-l-4 border-error-500">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-error-100 dark:bg-error-900/30">
              <Package className="w-6 h-6 text-error-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Hết hàng</p>
              <p className="text-2xl font-bold">{outOfStockCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Package className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng sản phẩm đang hoạt động</p>
              <p className="text-2xl font-bold">{allProducts.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <SearchBar placeholder="Tìm kiếm sản phẩm..." onSearch={setSearch} className="max-w-md" />
        <select
          value={threshold}
          onChange={(e) => {
            setThreshold(parseInt(e.target.value, 10));
            setPage(1);
          }}
          className="input w-40"
        >
          <option value={5}>5 trở xuống</option>
          <option value={10}>10 trở xuống</option>
          <option value={20}>20 trở xuống</option>
          <option value={50}>50 trở xuống</option>
        </select>
      </div>

      {paginatedProducts.length === 0 ? (
        <EmptyState
          title="Không có sản phẩm tồn kho thấp"
          description="Tất cả sản phẩm đều đủ tồn kho ở ngưỡng này"
          variant="no-data"
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginatedProducts}
            keyExtractor={(p) => String(p.id)}
            onRowClick={(p) => navigate(`/products/${p.id}`)}
          />
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(lowStockProducts.length / 15))}
            total={lowStockProducts.length}
            onPageChange={setPage}
          />
        </>
      )}

      <Modal
        isOpen={stockModal.open}
        onClose={() => setStockModal({ open: false })}
        title="Cập nhật tồn kho"
        footer={
          <>
            <button onClick={() => setStockModal({ open: false })} className="btn btn-secondary">
              Hủy
            </button>
            <button onClick={handleStockUpdate} disabled={isSaving} className="btn btn-primary">
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-3">{stockModal.product?.name}</p>
        {saveError && <p className="text-sm text-error-600 mb-2">{saveError}</p>}
        <label className="label">Số lượng tồn kho</label>
        <input
          type="number"
          min={0}
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
          className="input"
        />
      </Modal>
    </div>
  );
}
