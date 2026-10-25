/**
 * Types aligned with product-service DTOs / ProductDocument (Elasticsearch).
 */
import { PRODUCT_PLACEHOLDER } from '../constants/placeholders';

/** Spring Data Page JSON */
export interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  /** 0-based */
  number: number;
  first?: boolean;
  last?: boolean;
  empty?: boolean;
}

/** FE pagination view (1-based page for UI) */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Matches CategoryResponse */
export interface ProductCategory {
  id: number;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
  virtualTryOn?: boolean;
}

/** Matches ProductRequest */
export interface ProductRequest {
  name: string;
  description?: string;
  categoryId: number;
  price: number;
  stock: number;
}

/** Matches ProductImageResponse */
export interface ProductImage {
  /** Missing/0 when the cover photo exists only on Product.imageUrl (legacy). */
  id?: number | null;
  imageUrl: string;
  publicId?: string;
  main: boolean;
  /** Ảnh phẳng dùng cho thử đồ. Mỗi sản phẩm chỉ một ảnh. */
  garmentFlat?: boolean;
}

/** Matches ProductDocument (ES list/search) */
export interface ProductDocument {
  id: number;
  name: string;
  description?: string;
  category?: string;
  price: number;
  stock: number;
  rating?: number;
  imageUrl?: string;
  keycloakId?: string;
  isDeleted?: boolean;
  deleted?: boolean;
  originalPriceBeforeFs?: number | null;
  isFlashSale?: boolean;
  flashSale?: boolean;
  flashSaleEndTime?: string | null;
}

/** Matches ProductResponse (detail from PostgreSQL) */
export interface ProductDetail {
  id: number;
  name: string;
  description?: string;
  category?: ProductCategory | null;
  price: number;
  stock: number;
  rating?: number;
  keycloakId?: string;
  publicId?: string;
  imageUrl?: string;
  images?: ProductImage[];
  tryOnEnabled?: boolean;
  garmentImageUrl?: string | null;
  deleted?: boolean;
  version?: number;
  originalPriceBeforeFs?: number | null;
  flashSale?: boolean;
  flashSaleEndTime?: string | null;
}

/** Matches VendorReviewResponse (vendor dashboard list). */
export interface VendorReviewView {
  id: number;
  productId: number;
  productName: string;
  productImageUrl?: string | null;
  customerId: string;
  customerName?: string | null;
  rating: number;
  comment?: string;
  images?: string[];
  vendorReply?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function formatCustomerLabel(_customerId?: string | null, customerName?: string | null): string {
  const name = customerName?.trim();
  if (name) return name;
  return 'Khách hàng';
}

/** Matches ReviewResponse (single product / public list). */
export interface ProductReview {
  id: number;
  productId: number;
  customerId: string;
  customerName?: string | null;
  rating: number;
  comment?: string;
  images?: string[];
  vendorReply?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/** Matches VendorReplyRequest */
export interface VendorReplyRequest {
  reply: string;
}

/** View model for vendor product list/detail cards */
export interface ProductCardModel {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  thumbnail: string;
  images: string[];
  stock: number;
  rating: number;
  categorySlug: string;
  categoryName: string;
  categoryId?: number;
  vendorKeycloakId: string;
  isFlashSale: boolean;
  flashSaleEnd?: string;
  deleted?: boolean;
  /** Full image metadata when loaded from ProductDetail */
  productImages?: ProductImage[];
}

export function mapSpringPage<T, U = T>(
  page: SpringPage<T>,
  mapItem?: (item: T) => U
): PaginatedResult<U> {
  const data = (page.content ?? []).map((item) =>
    mapItem ? mapItem(item) : (item as unknown as U)
  );
  return {
    data,
    total: page.totalElements ?? data.length,
    page: (page.number ?? 0) + 1,
    limit: page.size ?? data.length,
    totalPages: page.totalPages ?? 1,
  };
}

function isFlashSaleFlag(
  src: Pick<ProductDocument, 'isFlashSale' | 'flashSale' | 'flashSaleEndTime'> | Pick<ProductDetail, 'flashSale' | 'flashSaleEndTime'>
): boolean {
  if ('isFlashSale' in src && src.isFlashSale === true) return true;
  if ('flashSale' in src && src.flashSale === true) return true;
  if ('flashSaleEndTime' in src && src.flashSaleEndTime) return true;
  return false;
}

function isDeletedFlag(doc: ProductDocument): boolean {
  return Boolean(doc.deleted ?? doc.isDeleted);
}

function calcDiscount(price: number, original?: number | null): number {
  if (original == null || original <= price || original <= 0) return 0;
  return Math.round(((original - price) / original) * 100);
}

export function toProductCardModelFromDocument(doc: ProductDocument): ProductCardModel {
  const price = Number(doc.price ?? 0);
  const original = doc.originalPriceBeforeFs != null ? Number(doc.originalPriceBeforeFs) : price;
  const thumbnail = doc.imageUrl || PRODUCT_PLACEHOLDER;
  const categoryLabel = doc.category?.trim() || '';

  return {
    id: Number(doc.id),
    name: doc.name ?? `Product #${doc.id}`,
    description: doc.description ?? '',
    price,
    originalPrice: original > 0 ? original : price,
    discount: calcDiscount(price, doc.originalPriceBeforeFs),
    thumbnail,
    images: doc.imageUrl ? [doc.imageUrl] : [],
    stock: Number(doc.stock ?? 0),
    rating: Number(doc.rating ?? 0),
    categorySlug: categoryLabel,
    categoryName: categoryLabel,
    vendorKeycloakId: doc.keycloakId ?? '',
    isFlashSale: isFlashSaleFlag(doc),
    flashSaleEnd: doc.flashSaleEndTime ?? undefined,
    deleted: isDeletedFlag(doc),
  };
}

function imageUrlKey(url?: string | null): string {
  return (url || '').trim();
}

function isMarkedMain(img: ProductImage & { isMain?: boolean }): boolean {
  return Boolean(img.main ?? img.isMain);
}

/**
 * Merge Product.imageUrl (cover photo) into the gallery and keep exactly one main image.
 * Legacy products stored the cover only on the product row, so `images` would otherwise
 * contain only extra photos — but those extras may also have `main: true`.
 */
export function resolveProductImages(
  detail: Pick<ProductDetail, 'imageUrl' | 'publicId' | 'images'>
): ProductImage[] {
  const mainUrl = imageUrlKey(detail.imageUrl);
  const seen = new Set<string>();
  const images: ProductImage[] = [];

  const push = (img: ProductImage) => {
    const url = imageUrlKey(img.imageUrl);
    if (!url || seen.has(url)) return;
    seen.add(url);
    images.push({ ...img, imageUrl: url, main: false });
  };

  if (mainUrl) {
    const fromGallery = (detail.images ?? []).find((img) => imageUrlKey(img.imageUrl) === mainUrl);
    push({
      id: fromGallery?.id && fromGallery.id > 0 ? fromGallery.id : 0,
      imageUrl: mainUrl,
      publicId: fromGallery?.publicId ?? detail.publicId,
      main: true,
      garmentFlat: Boolean(fromGallery?.garmentFlat),
    });
  }

  for (const img of detail.images ?? []) {
    push(img);
  }

  const mainIndex = mainUrl
    ? images.findIndex((img) => img.imageUrl === mainUrl)
    : images.findIndex((img) => isMarkedMain(img));
  const resolvedMain = mainIndex >= 0 ? mainIndex : 0;

  return images.map((img, index) => ({
    ...img,
    main: images.length > 0 && index === resolvedMain,
  }));
}

export function toProductCardModelFromDetail(detail: ProductDetail): ProductCardModel {
  const price = Number(detail.price ?? 0);
  const original =
    detail.originalPriceBeforeFs != null ? Number(detail.originalPriceBeforeFs) : price;
  const productImages = resolveProductImages(detail);
  const imageUrls = productImages.map((img) => img.imageUrl).filter(Boolean);
  const thumbnail =
    productImages.find((img) => img.main)?.imageUrl ||
    detail.imageUrl ||
    imageUrls[0] ||
    PRODUCT_PLACEHOLDER;

  return {
    id: Number(detail.id),
    name: detail.name ?? `Product #${detail.id}`,
    description: detail.description ?? '',
    price,
    originalPrice: original > 0 ? original : price,
    discount: calcDiscount(price, detail.originalPriceBeforeFs),
    thumbnail,
    images: imageUrls,
    stock: Number(detail.stock ?? 0),
    rating: Number(detail.rating ?? 0),
    categorySlug: detail.category?.slug ?? '',
    categoryName: detail.category?.name ?? '',
    categoryId: detail.category?.id,
    vendorKeycloakId: detail.keycloakId ?? '',
    isFlashSale: Boolean(detail.flashSale),
    flashSaleEnd: detail.flashSaleEndTime ?? undefined,
    deleted: Boolean(detail.deleted),
    productImages,
  };
}

export function detailToProductRequest(detail: ProductDetail, overrides: Partial<ProductRequest> = {}): ProductRequest {
  return {
    name: detail.name,
    description: detail.description ?? '',
    categoryId: detail.category?.id ?? overrides.categoryId ?? 0,
    price: detail.price,
    stock: detail.stock,
    ...overrides,
  };
}
