/** Vendor customer from analytics-service CustomerVendorStats */
export type CustomerSegment = 'NEW' | 'RETURNING' | 'VIP' | 'INACTIVE';

export interface VendorCustomer {
  customerKeycloakId: string;
  name: string;
  phone: string | null;
  totalOrders: number;
  totalSpent: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  segment?: CustomerSegment | null;
}

export interface VendorCustomerListParams {
  page?: number;
  size?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VendorCustomerPage {
  data: VendorCustomer[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** @deprecated Use VendorCustomer */
export type DerivedCustomer = VendorCustomer;
