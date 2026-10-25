import type { FlashSaleDto, FlashSaleViewModel } from '../types/discount';
import type { ProductCardModel } from '../types/product';

function productLookup(products: ProductCardModel[]): Map<number, ProductCardModel> {
  return new Map(products.map((p) => [p.id, p]));
}

export function enrichFlashSale(
  sale: FlashSaleDto,
  productsById: Map<number, ProductCardModel>
): FlashSaleViewModel {
  const product = productsById.get(sale.productId);
  return {
    ...sale,
    productName: product?.name,
    productImage: product?.thumbnail,
    originalPrice: product?.originalPrice ?? product?.price,
  };
}

export function enrichFlashSales(
  sales: FlashSaleDto[],
  products: ProductCardModel[]
): FlashSaleViewModel[] {
  const byId = productLookup(products);
  return sales.map((sale) => enrichFlashSale(sale, byId));
}

/** Convert datetime-local input (local time) to ISO Instant for the API. */
export function datetimeLocalToIso(value: string): string {
  if (!value) {
    throw new Error('Ngày giờ là bắt buộc');
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Ngày giờ không hợp lệ');
  }
  return date.toISOString();
}

/** Format FlashSaleStatus for display. */
export function formatFlashSaleStatus(status: string): string {
  const labels: Record<string, string> = {
    PENDING: 'Chờ xử lý',
    ACTIVE: 'Đang diễn ra',
    EXPIRED: 'Hết hạn',
    CANCELLED: 'Đã hủy',
  };
  return labels[status] ?? status;
}

export function canDeleteFlashSale(_status: string): boolean {
  return true;
}
