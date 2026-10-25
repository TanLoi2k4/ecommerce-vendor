export type VendorStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'DELETED';

export type AccountVerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'FAILED'
  | 'REJECTED';

/** Vendor profile returned by authenticated vendor endpoints (maps to BE VendorResponse). */
export interface VendorResponse {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  shopName: string;
  logoUrl?: string | null;
  logoPublicId?: string | null;
  phone?: string | null;
  status: VendorStatus;
  keycloakId?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

/** Public-facing vendor profile (no PII). */
export interface PublicVendorProfileDto {
  id: number;
  keycloakId: string;
  shopName: string;
  logoUrl?: string | null;
  status: VendorStatus;
  createdAt: string;
  rating?: number | null;
  reviewCount?: number | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  scope?: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LogoutRequest {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface VendorRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  shopName: string;
  phone: string;
  password: string;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
  initToken: string;
  autoRegister?: boolean;
}

export interface ResendOtpRequest {
  email: string;
  initToken: string;
}

export interface ForgetPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface VendorUpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  shopName?: string;
  phone?: string;
}

export interface VendorUpdateAccountRequest {
  currentPassword: string;
  username?: string;
  email?: string;
  password?: string;
}

/** Vendor warehouse / office address (maps to BE AddressResponse). */
export interface VendorShippingAddress {
  id: number;
  street: string;
  city: string;
  country: string;
  label: string;
}

/** Create/update payload for vendor shipping addresses (maps to BE AddressRequest). */
export interface VendorShippingAddressRequest {
  street: string;
  city: string;
  country: string;
  label: string;
}

export interface BankAccountDto {
  id: number;
  vendorKeycloakId?: string;
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  accountType: string;
  isVerified?: boolean;
  verificationStatus: AccountVerificationStatus;
  verifiedAt?: string | null;
  verificationNotes?: string | null;
}

export interface BankAccountRequest {
  accountNumber: string;
  accountName: string;
  bankCode: string;
  bankName: string;
  accountType: string;
}
