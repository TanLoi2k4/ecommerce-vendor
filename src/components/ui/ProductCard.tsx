import { Eye, Edit2, Trash2, RotateCcw, Zap } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../../utils/helpers';
import type { ProductCardModel } from '../../types/product';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';

interface ProductCardProps {
  product: ProductCardModel;
  onView?: (product: ProductCardModel) => void;
  onEdit?: (product: ProductCardModel) => void;
  onDelete?: (product: ProductCardModel) => void;
  onRestore?: (product: ProductCardModel) => void;
  variant?: 'grid' | 'list';
}

function FlashSaleBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`badge badge-error inline-flex items-center gap-1 ${className}`}>
      <Zap className="w-3 h-3" />
      Flash Sale
    </span>
  );
}

function renderProductStatusBadge(product: ProductCardModel) {
  if (product.deleted) {
    return <span className="badge badge-secondary">Đã xóa</span>;
  }
  if (product.stock <= 0) {
    return <span className="badge badge-error">Hết hàng</span>;
  }
  if (product.isFlashSale) {
    return <span className="badge badge-success">Đang diễn ra</span>;
  }
  return <span className="badge badge-success">Đang bán</span>;
}

export function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  onRestore,
  variant = 'grid',
}: ProductCardProps) {
  const thumbnail = product.thumbnail || PRODUCT_PLACEHOLDER;

  if (variant === 'list') {
    return (
      <div
        className={`card p-4 flex items-center gap-4 hover:shadow-md transition-shadow ${
          product.isFlashSale ? 'border-l-4 border-error-500' : ''
        }`}
      >
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 shrink-0">
          <img src={thumbnail} alt={product.name} className="w-full h-full object-cover" />
          {product.isFlashSale && (
            <div className="absolute top-1 left-1">
              <FlashSaleBadge className="text-[10px] px-1.5 py-0.5" />
            </div>
          )}
          {product.discount > 0 && !product.isFlashSale && (
            <span className="absolute top-1 left-1 badge-error text-xs">-{product.discount}%</span>
          )}
          {product.discount > 0 && product.isFlashSale && (
            <span className="absolute bottom-1 left-1 badge-error text-[10px] px-1 py-0.5">
              -{product.discount}%
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</h3>
            {product.isFlashSale && <FlashSaleBadge className="text-[10px] shrink-0" />}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{product.categoryName || '—'}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-primary-600">{formatCurrency(product.price)}</span>
            {product.discount > 0 && (
              <span className="text-sm text-gray-400 line-through">
                {formatCurrency(product.originalPrice)}
              </span>
            )}
          </div>
          {product.isFlashSale && product.flashSaleEnd && (
            <p className="text-xs text-error-600 dark:text-error-400 mt-1">
              Kết thúc {formatRelativeTime(product.flashSaleEnd)}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {renderProductStatusBadge(product)}
          <span className="text-sm text-gray-500">Tồn kho: {product.stock}</span>
        </div>

        <div className="flex items-center gap-1">
          {onView && (
            <button
              onClick={() => onView(product)}
              className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Eye className="w-5 h-5" />
            </button>
          )}
          {!product.deleted && onEdit && (
            <button
              onClick={() => onEdit(product)}
              className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Edit2 className="w-5 h-5" />
            </button>
          )}
          {product.deleted && onRestore && (
            <button
              onClick={() => onRestore(product)}
              className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          )}
          {!product.deleted && onDelete && (
            <button
              onClick={() => onDelete(product)}
              aria-label={`Xóa ${product.name}`}
              className="p-2 rounded-lg text-gray-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-950"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`card overflow-hidden hover:shadow-md transition-shadow ${
        product.isFlashSale ? 'ring-2 ring-error-500/40 border-l-4 border-error-500' : ''
      }`}
    >
      <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
        <img src={thumbnail} alt={product.name} className="w-full h-full object-cover" />
        {product.isFlashSale && (
          <div className="absolute top-2 left-2">
            <FlashSaleBadge />
          </div>
        )}
        {product.discount > 0 && (
          <span
            className={`absolute badge-error ${
              product.isFlashSale ? 'bottom-2 left-2 top-auto' : 'top-2 left-2'
            }`}
          >
            -{product.discount}%
          </span>
        )}
        <div className="absolute top-2 right-2">{renderProductStatusBadge(product)}</div>
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 line-clamp-2 min-h-[3rem]">
          {product.name}
        </h3>
        <p className="text-xs text-gray-500 mt-1">{product.categoryName || '—'}</p>

        <div className="flex items-center gap-2 mt-2">
          <span className="font-semibold text-primary-600">{formatCurrency(product.price)}</span>
          {(product.discount > 0 || product.isFlashSale) && product.originalPrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {formatCurrency(product.originalPrice)}
            </span>
          )}
        </div>

        {product.isFlashSale && product.flashSaleEnd && (
          <p className="text-xs text-error-600 dark:text-error-400 mt-2">
            Kết thúc {formatRelativeTime(product.flashSaleEnd)}
          </p>
        )}

        <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
          <span>Tồn kho: {product.stock}</span>
          <span>★ {product.rating.toFixed(1)}</span>
        </div>

        <div className="flex items-center gap-2 mt-4">
          {onView && (
            <button onClick={() => onView(product)} className="btn btn-ghost btn-sm flex-1">
              <Eye className="w-4 h-4" />
              Xem
            </button>
          )}
          {!product.deleted && onEdit && (
            <button onClick={() => onEdit(product)} className="btn btn-ghost btn-sm flex-1">
              <Edit2 className="w-4 h-4" />
              Sửa
            </button>
          )}
          {!product.deleted && onDelete && (
            <button
              onClick={() => onDelete(product)}
              aria-label={`Xóa ${product.name}`}
              className="btn btn-ghost btn-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-950"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          {product.deleted && onRestore && (
            <button
              onClick={() => onRestore(product)}
              aria-label={`Khôi phục ${product.name}`}
              className="btn btn-ghost btn-sm flex-1"
            >
              <RotateCcw className="w-4 h-4" />
              Khôi phục
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
