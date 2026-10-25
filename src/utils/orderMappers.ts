import { getProductById } from '../api/productApi';
import { PRODUCT_PLACEHOLDER } from '../constants/placeholders';
import type { SubOrderDetail, SubOrderDetailView, SubOrderItemView } from '../types/order';

export async function enrichSubOrderDetail(
  detail: SubOrderDetail
): Promise<SubOrderDetailView> {
  const productIds = [...new Set(detail.items.map((i) => i.productId))];
  const productMap = new Map<number, { name: string; image: string }>();

  await Promise.all(
    productIds.map(async (productId) => {
      try {
        const product = await getProductById(productId);
        const image =
          product.imageUrl ??
          product.images?.find((img) => img.main)?.imageUrl ??
          product.images?.[0]?.imageUrl ??
          PRODUCT_PLACEHOLDER;
        productMap.set(productId, { name: product.name, image });
      } catch {
        productMap.set(productId, {
          name: `Product #${productId}`,
          image: PRODUCT_PLACEHOLDER,
        });
      }
    })
  );

  const items: SubOrderItemView[] = detail.items.map((item) => {
    const product = productMap.get(item.productId);
    return {
      ...item,
      productName: product?.name ?? `Product #${item.productId}`,
      productImage: product?.image ?? PRODUCT_PLACEHOLDER,
    };
  });

  return { ...detail, items };
}
