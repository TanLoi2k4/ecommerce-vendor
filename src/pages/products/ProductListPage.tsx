import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, LayoutGrid, List, Package } from 'lucide-react';
import {
  Pagination,
  SearchBar,
  FilterPanel,
  ProductCard,
  EmptyState,
  Modal,
  LoadingSkeleton,
} from '../../components/ui';
import {
  deleteProduct,
  restoreProduct,
} from '../../api/productApi';
import { useVendorProducts } from '../../hooks/useVendorProducts';
import { useCategories } from '../../hooks/useCategories';
import { getApiErrorMessage } from '../../utils/apiErrors';
import type { ProductCardModel } from '../../types/product';

type TabId = 'active' | 'deleted';

export function ProductListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabId>('active');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [actionError, setActionError] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; product?: ProductCardModel }>({
    open: false,
  });
  const [isActing, setIsActing] = useState(false);

  const { categories } = useCategories();
  const { result, isLoading, error, refresh } = useVendorProducts({
    deleted: tab === 'deleted',
    page,
    size: 12,
    query: query || undefined,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const products = useMemo(() => {
    if (!result?.data) return [];
    if (!categoryFilter) return result.data;
    return result.data.filter(
      (p) =>
        p.categoryName === categoryFilter ||
        p.categorySlug === categoryFilter
    );
  }, [result?.data, categoryFilter]);

  const handleDelete = async () => {
    if (!deleteModal.product) return;
    setIsActing(true);
    setActionError('');
    try {
      await deleteProduct(deleteModal.product.id);
      setDeleteModal({ open: false });
      await refresh();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể xóa sản phẩm'));
    } finally {
      setIsActing(false);
    }
  };

  const handleRestore = async (product: ProductCardModel) => {
    setIsActing(true);
    setActionError('');
    try {
      await restoreProduct(product.id);
      await refresh();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể khôi phục sản phẩm'));
    } finally {
      setIsActing(false);
    }
  };

  const filterConfig = [
    {
      key: 'category',
      label: 'Danh mục',
      type: 'select' as const,
      options: categories.map((c) => ({ value: c.name, label: c.name })),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sản phẩm</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Quản lý danh mục sản phẩm của bạn</p>
        </div>
        {tab === 'active' && (
          <button onClick={() => navigate('/products/add')} className="btn btn-primary">
            <Plus className="w-5 h-5" />
            Thêm sản phẩm
          </button>
        )}
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['active', 'deleted'] as TabId[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setPage(1);
            }}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'active' ? 'Đang hoạt động' : 'Đã xóa'}
          </button>
        ))}
      </div>

      {(error || actionError) && (
        <div className="rounded-lg bg-error-50 dark:bg-error-950/30 text-error-700 dark:text-error-400 px-4 py-3 text-sm">
          {error || actionError}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <SearchBar placeholder="Tìm kiếm sản phẩm..." onSearch={setSearch} className="flex-1" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${
              viewMode === 'grid'
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${
              viewMode === 'list'
                ? 'bg-primary-100 text-primary-600 dark:bg-primary-900'
                : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {tab === 'active' && (
        <FilterPanel
          filters={filterConfig}
          values={{ category: categoryFilter }}
          onChange={(key, value) => {
            if (key === 'category') setCategoryFilter(value as string);
            setPage(1);
          }}
          onClear={() => {
            setCategoryFilter('');
            setPage(1);
          }}
        />
      )}

      {isLoading ? (
        <LoadingSkeleton variant="stats" />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="w-16 h-16" />}
          title={tab === 'deleted' ? 'Không có sản phẩm đã xóa' : 'Không tìm thấy sản phẩm'}
          description={
            tab === 'deleted'
              ? 'Sản phẩm đã xóa sẽ hiển thị ở đây'
              : 'Bắt đầu bằng cách thêm sản phẩm đầu tiên'
          }
          action={
            tab === 'active' ? (
              <button onClick={() => navigate('/products/add')} className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Thêm sản phẩm
              </button>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={() => navigate(`/products/${product.id}`)}
              onEdit={tab === 'active' ? () => navigate(`/products/${product.id}/edit`) : undefined}
              onDelete={
                tab === 'active'
                  ? () => setDeleteModal({ open: true, product })
                  : undefined
              }
              onRestore={tab === 'deleted' ? () => handleRestore(product) : undefined}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="list"
              onView={() => navigate(`/products/${product.id}`)}
              onEdit={tab === 'active' ? () => navigate(`/products/${product.id}/edit`) : undefined}
              onDelete={
                tab === 'active'
                  ? () => setDeleteModal({ open: true, product })
                  : undefined
              }
              onRestore={tab === 'deleted' ? () => handleRestore(product) : undefined}
            />
          ))}
        </div>
      )}

      {result && result.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={result.totalPages}
          total={result.total}
          limit={12}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false })}
        title="Xóa sản phẩm"
        footer={
          <>
            <button onClick={() => setDeleteModal({ open: false })} className="btn btn-secondary">
              Hủy
            </button>
            <button onClick={handleDelete} disabled={isActing} className="btn btn-danger">
              {isActing ? 'Đang xóa...' : 'Xóa'}
            </button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          Xóa mềm{' '}
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {deleteModal.product?.name}
          </span>
          ? Bạn có thể khôi phục từ tab Đã xóa.
        </p>
      </Modal>
    </div>
  );
}
