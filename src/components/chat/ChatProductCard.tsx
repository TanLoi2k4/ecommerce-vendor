import { Link } from 'react-router-dom';
import { ChevronRight, Package } from 'lucide-react';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';

export interface ChatProductCardItem {
  id?: number | string;
  name?: string;
  price?: number;
  imageUrl?: string;
  category?: string;
  inquiry?: boolean;
}

interface ChatProductCardProps {
  product: ChatProductCardItem;
  to?: string;
  variant?: 'outgoing' | 'incoming';
  showInquiryHint?: boolean;
}

function formatPrice(value?: number): string {
  if (value == null) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ChatProductCard({
  product,
  to,
  variant = 'incoming',
  showInquiryHint = false,
}: ChatProductCardProps) {
  const isOutgoing = variant === 'outgoing';

  const card = (
    <div
      className={`group relative w-[280px] max-w-full overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-gray-800 ${
        isOutgoing
          ? 'border-primary-200 dark:border-primary-800/60'
          : 'border-gray-200 dark:border-gray-700'
      }`}
    >
      {showInquiryHint && (
        <div className="border-b border-gray-100 bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700 dark:border-gray-700 dark:bg-amber-950/30 dark:text-amber-300">
          Khách hàng hỏi về sản phẩm này
        </div>
      )}

      <div className="flex gap-3 p-3">
        <div className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
          <img
            src={product.imageUrl || PRODUCT_PLACEHOLDER}
            alt={product.name ?? 'Sản phẩm'}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center">
          {product.category && (
            <span className="mb-1 inline-flex w-fit max-w-full truncate rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-500 dark:bg-gray-700 dark:text-gray-400">
              {product.category}
            </span>
          )}
          <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 dark:text-gray-100">
            {product.name ?? 'Sản phẩm'}
          </p>
          {product.price != null && (
            <p className="mt-1 text-sm font-bold text-primary-600 dark:text-primary-400">
              {formatPrice(product.price)}
            </p>
          )}
        </div>
      </div>

      {to && (
        <div
          className={`flex items-center justify-between border-t px-3 py-2 text-xs font-medium ${
            isOutgoing
              ? 'border-primary-100 bg-primary-50/80 text-primary-700 dark:border-primary-900/50 dark:bg-primary-950/40 dark:text-primary-300'
              : 'border-gray-100 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-900/50 dark:text-gray-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5 shrink-0" />
            Xem sản phẩm
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
        </div>
      )}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
