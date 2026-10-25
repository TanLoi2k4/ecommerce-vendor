import api from './client';
import type {
  VendorResponse,
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  VendorRequest,
  VerifyOtpRequest,
  ResendOtpRequest,
  ForgetPasswordRequest,
  ResetPasswordRequest,
  VendorUpdateProfileRequest,
  VendorUpdateAccountRequest,
} from '../types/vendor';

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/vendors/login', request);
  return res.data;
}

export async function logout(request: LogoutRequest): Promise<void> {
  await api.post('/vendors/logout', request);
}

export async function refreshAccessToken(refreshToken: string): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/vendors/refresh', { refreshToken });
  return res.data;
}

export async function getProfile(): Promise<VendorResponse> {
  const res = await api.get<VendorResponse>('/vendors');
  return res.data;
}

export async function registerInit(
  request: VendorRequest,
  logo?: File
): Promise<string> {
  const form = new FormData();
  form.append(
    'request',
    new Blob([JSON.stringify(request)], { type: 'application/json' })
  );
  if (logo) {
    form.append('logo', logo);
  }
  const res = await api.post<string>('/vendors/register-init', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function verifyOtp(request: VerifyOtpRequest): Promise<VendorResponse> {
  const res = await api.post<VendorResponse>('/vendors/verify-otp', {
    ...request,
    autoRegister: request.autoRegister ?? true,
  });
  return res.data;
}

export async function resendOtp(request: ResendOtpRequest): Promise<void> {
  await api.post('/vendors/verify-otp/resend-otp', request);
}

export async function forgetPassword(request: ForgetPasswordRequest): Promise<void> {
  await api.post('/vendors/forget-password', request);
}

export async function resetPassword(request: ResetPasswordRequest): Promise<void> {
  await api.post('/vendors/reset-password', request);
}

export async function updateProfile(
  request: VendorUpdateProfileRequest,
  logo?: File
): Promise<VendorResponse> {
  const form = new FormData();
  form.append(
    'request',
    new Blob([JSON.stringify(request)], { type: 'application/json' })
  );
  if (logo) {
    form.append('logo', logo);
  }
  const res = await api.put<VendorResponse>('/vendors/profile', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}

export async function updateAccount(
  request: VendorUpdateAccountRequest
): Promise<VendorResponse> {
  const res = await api.put<VendorResponse>('/vendors/account', request);
  return res.data;
}
