import type { VendorShippingAddress } from '../types/vendor';

export function formatVendorPickupAddress(address: VendorShippingAddress): string {
  const parts = [address.street, address.city, address.country].filter(Boolean);
  const body = parts.join(', ');
  return address.label ? `${address.label} — ${body}` : body;
}
