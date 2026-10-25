/**
 * productApi — product-service via gateway (/api/products, /api/categories).
 * Response unwrapped by axios interceptor → res.data is inner payload.
 */
import api from './client';
import type {
  ProductCategory,
  ProductDetail,
  ProductDocument,
  ProductRequest,
  ProductReview,
  SpringPage,
  PaginatedResult,
  ProductCardModel,
  VendorReviewView,
  VendorReplyRequest,
} from '../types/product';
import {
  mapSpringPage,
  toProductCardModelFromDocument,
  toProductCardModelFromDetail,
} from '../types/product';

export type ProductPageParams = {
  page?: number;
  size?: number;
  sortBy?: string;
  query?: string;
};

function toSpringPageParams(params: ProductPageParams = {}) {
  return {
    page: Math.max(0, (params.page ?? 1) - 1),
    size: params.size ?? 12,
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.query ? { query: params.query } : {}),
  };
}

function asPage<T>(data: SpringPage<T> | T[] | null | undefined): SpringPage<T> {
  if (!data) {
    return { content: [], totalElements: 0, totalPages: 0, size: 0, number: 0 };
  }
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      size: data.length,
      number: 0,
    };
  }
  return data;
}

// ─── Categories ───────────────────────────────────────────────────────────

export async function getCategories(): Promise<ProductCategory[]> {
  const res = await api.get<ProductCategory[]>('/categories');
  return (res.data ?? []).filter((c) => c.active);
}

// ─── Vendor products ──────────────────────────────────────────────────────

export async function getVendorProducts(
  params?: ProductPageParams
): Promise<PaginatedResult<ProductCardModel>> {
  const res = await api.get<SpringPage<ProductDocument>>('/products/vendor', {
    params: toSpringPageParams(params),
  });
  return mapSpringPage(asPage(res.data), toProductCardModelFromDocument);
}

export async function getVendorDeletedProducts(
  params?: ProductPageParams
): Promise<PaginatedResult<ProductCardModel>> {
  const res = await api.get<SpringPage<ProductDocument>>('/products/vendor/deleted', {
    params: toSpringPageParams(params),
  });
  return mapSpringPage(asPage(res.data), toProductCardModelFromDocument);
}

export async function getProductById(id: number): Promise<ProductDetail> {
  const res = await api.get<ProductDetail>(`/products/${id}`);
  if (!res.data) {
    throw new Error('Product not found');
  }
  return res.data;
}

export async function getProductCardById(id: number): Promise<ProductCardModel> {
  const detail = await getProductById(id);
  return toProductCardModelFromDetail(detail);
}

export type ProductMultipartOptions = {
  image?: File;
  images?: File[];
};

function appendProductMultipart(
  form: FormData,
  request: ProductRequest,
  options?: ProductMultipartOptions
) {
  form.append(
    'product',
    new Blob([JSON.stringify(request)], { type: 'application/json' })
  );
  if (options?.image) {
    form.append('image', options.image);
  }
  if (options?.images?.length) {
    for (const file of options.images) {
      form.append('images', file);
    }
  }
}

export async function createProduct(
  request: ProductRequest,
  options?: ProductMultipartOptions
): Promise<ProductDetail> {
  const form = new FormData();
  appendProductMultipart(form, request, options);
  const res = await api.post<ProductDetail>('/products/vendor', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateProduct(
  id: number,
  request: ProductRequest,
  options?: ProductMultipartOptions
): Promise<ProductDetail> {
  const form = new FormData();
  appendProductMultipart(form, request, options);
  const res = await api.put<ProductDetail>(`/products/vendor/${id}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function deleteProduct(id: number): Promise<void> {
  await api.delete(`/products/vendor/${id}`);
}

export async function restoreProduct(id: number): Promise<ProductDetail> {
  const res = await api.post<ProductDetail>(`/products/vendor/${id}/restore`);
  return res.data;
}

export async function setMainProductImage(
  productId: number,
  imageId: number
): Promise<ProductDetail> {
  const res = await api.put<ProductDetail>(
    `/products/vendor/${productId}/images/${imageId}/main`
  );
  return res.data;
}

export async function setGarmentProductImage(
  productId: number,
  imageId: number
): Promise<ProductDetail> {
  const res = await api.put<ProductDetail>(
    `/products/vendor/${productId}/images/${imageId}/garment`
  );
  return res.data;
}

export async function clearGarmentProductImage(
  productId: number,
  imageId: number
): Promise<ProductDetail> {
  const res = await api.delete<ProductDetail>(
    `/products/vendor/${productId}/images/${imageId}/garment`
  );
  return res.data;
}

export async function deleteProductImage(
  productId: number,
  imageId: number
): Promise<ProductDetail> {
  const res = await api.delete<ProductDetail>(
    `/products/vendor/${productId}/images/${imageId}`
  );
  return res.data;
}

// ─── Reviews (vendor reply — Phase 4 prep) ─────────────────────────────────

export async function getVendorReviews(
  params?: ProductPageParams & { query?: string }
): Promise<PaginatedResult<VendorReviewView>> {
  const res = await api.get<SpringPage<VendorReviewView>>('/products/vendor/reviews', {
    params: {
      page: Math.max(0, (params?.page ?? 1) - 1),
      size: params?.size ?? 10,
      query: params?.query || undefined,
    },
  });
  return mapSpringPage(asPage(res.data));
}

export async function replyToReview(
  reviewId: number,
  request: VendorReplyRequest
): Promise<ProductReview> {
  const res = await api.post<ProductReview>(
    `/products/reviews/${reviewId}/reply`,
    request
  );
  return res.data;
}

export async function getProductReviews(
  productId: number,
  params?: ProductPageParams & { rating?: number }
): Promise<PaginatedResult<ProductReview>> {
  const query = new URLSearchParams();
  query.set('page', String(Math.max(0, (params?.page ?? 1) - 1)));
  query.set('size', String(params?.size ?? 20));
  query.set('sort', 'createdAt,desc');
  if (params?.rating != null) {
    query.set('rating', String(params.rating));
    query.set('stars', String(params.rating));
  }
  const res = await api.get<SpringPage<ProductReview>>(
    `/products/${productId}/reviews?${query.toString()}`
  );
  return mapSpringPage(asPage(res.data));
}

// ─── Product reviews (vendor list) — see getVendorReviews above
