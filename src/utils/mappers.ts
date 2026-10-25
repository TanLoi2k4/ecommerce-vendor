import type { VendorResponse } from '../types/vendor';
import type { User, Shop } from './types';

function resolveShopId(vendor: VendorResponse): string {
  return vendor.keycloakId ?? String(vendor.id);
}

function resolveDisplayName(vendor: VendorResponse): string {
  // Tiếng Việt: họ (lastName) trước, tên (firstName) sau
  return `${vendor.lastName} ${vendor.firstName}`.trim();
}

export function vendorToUser(vendor: VendorResponse): User {
  return {
    id: String(vendor.id),
    username: vendor.username,
    email: vendor.email,
    firstName: vendor.firstName,
    lastName: vendor.lastName,
    name: resolveDisplayName(vendor),
    avatar: vendor.logoUrl ?? undefined,
    phone: vendor.phone ?? undefined,
    role: 'vendor',
    shopId: resolveShopId(vendor),
    status: vendor.status,
    createdAt: vendor.createdAt,
  };
}

export function vendorToShop(vendor: VendorResponse): Shop {
  return {
    id: resolveShopId(vendor),
    name: vendor.shopName,
    logo: vendor.logoUrl ?? undefined,
    phone: vendor.phone ?? '',
    email: vendor.email,
    status: vendor.status,
    createdAt: vendor.createdAt,
    updatedAt: vendor.updatedAt ?? undefined,
  };
}
