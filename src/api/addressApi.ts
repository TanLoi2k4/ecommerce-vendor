import api from './client';
import type {
  VendorShippingAddress,
  VendorShippingAddressRequest,
} from '../types/vendor';

export async function getAddresses(): Promise<VendorShippingAddress[]> {
  const res = await api.get<VendorShippingAddress[]>('/vendors/addresses');
  return res.data ?? [];
}

export async function createAddress(
  request: VendorShippingAddressRequest
): Promise<VendorShippingAddress> {
  const res = await api.post<VendorShippingAddress>('/vendors/addresses', request);
  return res.data;
}

export async function updateAddress(
  addressId: number,
  request: VendorShippingAddressRequest
): Promise<VendorShippingAddress> {
  const res = await api.put<VendorShippingAddress>(
    `/vendors/addresses/${addressId}`,
    request
  );
  return res.data;
}

export async function deleteAddress(addressId: number): Promise<void> {
  await api.delete(`/vendors/addresses/${addressId}`);
}
