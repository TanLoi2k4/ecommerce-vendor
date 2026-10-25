import { create } from 'zustand';
import type { User, Shop } from '../utils/types';
import type { VendorResponse, VendorUpdateProfileRequest, VendorUpdateAccountRequest } from '../types/vendor';
import {
  ApiRequestError,
  setAuthTokens,
  clearAuthTokens,
} from '../api/client';
import * as vendorApi from '../api/vendorApi';
import { vendorToUser, vendorToShop } from '../utils/mappers';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, getAuthItem, setRememberMePreference } from '../utils/authStorage';

interface AuthState {
  user: User | null;
  shop: Shop | null;
  vendor: VendorResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  updateVendorProfile: (data: VendorUpdateProfileRequest, logo?: File) => Promise<void>;
  updateVendorAccount: (data: VendorUpdateAccountRequest) => Promise<void>;
  clearSession: () => void;
}

function applyVendorSession(vendor: VendorResponse) {
  return {
    user: vendorToUser(vendor),
    shop: vendorToShop(vendor),
    vendor,
    isAuthenticated: true,
  };
}

function clearTokens() {
  clearAuthTokens();
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  shop: null,
  vendor: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,

  clearSession: () => {
    clearTokens();
    set({
      user: null,
      shop: null,
      vendor: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  fetchProfile: async () => {
    set({ isLoading: true });
    try {
      const vendor = await vendorApi.getProfile();
      set({ ...applyVendorSession(vendor), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  initializeAuth: async () => {
    if (get().isInitialized) return;

    const token = getAuthItem(AUTH_TOKEN_KEY);
    const refreshToken = getAuthItem(REFRESH_TOKEN_KEY);

    if (!token && !refreshToken) {
      set({ isInitialized: true, isAuthenticated: false });
      return;
    }

    set({ isLoading: true });
    try {
      const vendor = await vendorApi.getProfile();
      set({
        ...applyVendorSession(vendor),
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      if (refreshToken) {
        const refreshed = await get().refreshSession();
        if (refreshed) {
          try {
            const vendor = await vendorApi.getProfile();
            set({
              ...applyVendorSession(vendor),
              isLoading: false,
              isInitialized: true,
            });
            return;
          } catch {
            // fall through to clear session
          }
        }
      }
      get().clearSession();
      set({ isInitialized: true });
    }
  },

  refreshSession: async () => {
    const refreshToken = getAuthItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return false;

    try {
      const tokens = await vendorApi.refreshAccessToken(refreshToken);
      setAuthTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);
      return true;
    } catch {
      return false;
    }
  },

  login: async (username: string, password: string, rememberMe = true) => {
    setRememberMePreference(rememberMe);
    set({ isLoading: true });
    try {
      const tokens = await vendorApi.login({ username, password });
      setAuthTokens(tokens.accessToken, tokens.refreshToken, tokens.expiresIn);

      const vendor = await vendorApi.getProfile();
      set({
        ...applyVendorSession(vendor),
        isLoading: false,
        isInitialized: true,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    const accessToken = getAuthItem(AUTH_TOKEN_KEY);
    const refreshToken = getAuthItem(REFRESH_TOKEN_KEY);

    try {
      if (accessToken && refreshToken) {
        await vendorApi.logout({ accessToken, refreshToken });
      }
    } catch {
      // Proceed with local logout even if API call fails
    } finally {
      get().clearSession();
      set({ isInitialized: true });
    }
  },

  updateVendorProfile: async (data: VendorUpdateProfileRequest, logo?: File) => {
    set({ isLoading: true });
    try {
      const vendor = await vendorApi.updateProfile(data, logo);
      set({ ...applyVendorSession(vendor), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateVendorAccount: async (data: VendorUpdateAccountRequest) => {
    set({ isLoading: true });
    try {
      const vendor = await vendorApi.updateAccount(data);
      set({ ...applyVendorSession(vendor), isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },
}));

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError) {
    return error.message;
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function hasAuthToken(): boolean {
  return Boolean(getAuthItem(AUTH_TOKEN_KEY));
}
