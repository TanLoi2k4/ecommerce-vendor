import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, Star } from 'lucide-react';
import { SearchBar, Pagination, EmptyState, LoadingSkeleton } from '../../components/ui';
import { ProductReviewsTab } from '../../components/products/ProductReviewsTab';
import { useVendorProducts } from '../../hooks/useVendorProducts';
import type { ProductCardModel } from '../../types/product';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';

function renderStars(rating: number) {
  const rounded = Math.round(rating);
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${
        i < rounded ? 'text-warning-500 fill-warning-500' : 'text-gray-300'
      }`}
    />
  ));
}

export function ProductReviewsPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ProductCardModel | null>(null);

  const { result, isLoading, error } = useVendorProducts({
    page,
    size: 10,
    query: query || undefined,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const products = result?.data ?? [];

  if (selected) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0 mt-1"
            aria-label="Quay lại danh sách sản phẩm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-4 min-w-0 flex-1">
            <img
              src={selected.thumbnail || PRODUCT_PLACEHOLDER}
              alt={selected.name}
              className="w-16 h-16 rounded-lg object-cover shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">Đánh giá sản phẩm</p>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 truncate">
                {selected.name}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <div className="flex items-center gap-1">{renderStars(selected.rating)}</div>
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {Number(selected.rating).toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <ProductReviewsTab
          key={selected.id}
          productId={selected.id}
          productRating={selected.rating}
          showHeader={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Đánh giá sản phẩm</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Chọn sản phẩm để xem và phản hồi đánh giá của khách hàng
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-error-50 text-error-700 px-4 py-3 text-sm">{error}</div>
      )}

      <SearchBar placeholder="Tìm sản phẩm..." onSearch={setSearch} className="max-w-md" />

      {isLoading && products.length === 0 ? (
        <LoadingSkeleton variant="list" />
      ) : products.length === 0 ? (
        <EmptyState
          title={query ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'}
          description={
            query
              ? 'Thử tìm với tên sản phẩm khác'
              : 'Thêm sản phẩm trước, sau đó đánh giá của khách hàng sẽ được quản lý theo từng sản phẩm tại đây'
          }
          variant={query ? 'search' : 'no-data'}
        />
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => setSelected(product)}
              className="card-hover p-4 w-full text-left cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <img
                  src={product.thumbnail || PRODUCT_PLACEHOLDER}
                  alt={product.name}
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1">{renderStars(product.rating)}</div>
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {Number(product.rating).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {product.rating > 0 ? 'Đã có đánh giá' : 'Chưa có đánh giá'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
              </div>
            </button>
          ))}
        </div>
      )}

      {result && result.totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={result.totalPages}
          total={result.total}
          limit={10}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}
