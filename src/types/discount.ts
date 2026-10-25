/** Types aligned with discount-service Flash Sale DTOs. */

export type FlashSaleStatus = 'PENDING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED';

/** Matches discount-service FlashSale entity (response). */
export interface FlashSaleDto {
  id: number;
  productId: number;
  keycloakId: string;
  name: string;
  flashSalePrice: number;
  startTime: string | number;
  endTime: string | number;
  status: FlashSaleStatus;
  quartzJobId?: string;
}

/** Matches discount-service FlashSaleRequest. */
export interface FlashSaleRequestDto {
  name: string;
  productId: number;
  flashSalePrice: number;
  startTime: string;
  endTime: string;
}

/** UI view model — enriched with product-service data. */
export interface FlashSaleViewModel extends FlashSaleDto {
  productName?: string;
  productImage?: string;
  originalPrice?: number;
}
