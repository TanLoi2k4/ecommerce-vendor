import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  AtSign,
  Shield,
  Eye,
  EyeOff,
  Store,
} from 'lucide-react';
import { useVendorProfile } from '../../hooks/useVendorProfile';
import { getAuthErrorMessage } from '../../store/authStore';
import { LoadingSkeleton } from '../../components/ui';
import { useToasts } from '../../components/ui/Toast';
import { getInitials } from '../../utils/helpers';
import type { VendorStatus } from '../../types/vendor';
import { ShippingSettingsPage } from './ShippingSettingsPage';
import { PaymentSettingsPage } from './PaymentSettingsPage';

const PHONE_PATTERN = /^\d{10}$/;
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

const STATUS_LABELS: Record<VendorStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  INACTIVE: 'Chưa kích hoạt',
  SUSPENDED: 'Đã tạm khóa',
  DELETED: 'Đã xóa',
};

const TAB_LABELS = {
  profile: 'Tài khoản',
  security: 'Bảo mật',
  address: 'Địa chỉ',
  payment: 'Thanh toán',
} as const;

type ProfileTab = keyof typeof TAB_LABELS;

function parseProfileTab(tabParam: string | null): ProfileTab {
  if (tabParam === 'security' || tabParam === 'address' || tabParam === 'payment') {
    return tabParam;
  }
  return 'profile';
}

function Field({
  label,
  error,
  helper,
  children,
}: {
  label: string;
  error?: string;
  helper?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full">
      <label className="label">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-error-500">{error}</p>}
      {helper && !error && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helper}</p>}
    </div>
  );
}

export function AccountSettingsPage() {
  const { user, vendor, isLoading, updateVendorProfile, updateVendorAccount } = useVendorProfile({
    refetchOnMount: true,
  });
  const { success, error: toastError } = useToasts();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeView = parseProfileTab(tabParam);

  useEffect(() => {
    if (!tabParam || !(tabParam in TAB_LABELS)) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'profile');
      setSearchParams(next, { replace: true });
    }
  }, [tabParam, searchParams, setSearchParams]);

  const setActiveView = (tab: ProfileTab) => {
    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    if (tab !== 'profile') next.delete('edit');
    setSearchParams(next, { replace: true });
  };

  const [isEditing, setIsEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    shopName: '',
  });
  const [accountForm, setAccountForm] = useState({
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [accountLoading, setAccountLoading] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (vendor) {
      setProfileForm({
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        phone: vendor.phone ?? '',
        shopName: vendor.shopName,
      });
      setAccountForm((prev) => ({
        ...prev,
        username: vendor.username,
        email: vendor.email,
      }));
    }
  }, [vendor]);

  useEffect(() => {
    if (searchParams.get('edit') === '1' && activeView === 'profile') {
      setIsEditing(true);
    }
  }, [searchParams, activeView]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    setIsEditing(true);
  };

  const handleProfileSave = async () => {
    const errors: Record<string, string> = {};
    if (profileForm.phone && !PHONE_PATTERN.test(profileForm.phone)) {
      errors.phone = 'Số điện thoại phải gồm đúng 10 chữ số';
    }
    if (!profileForm.shopName.trim() || profileForm.shopName.trim().length < 3) {
      errors.shopName = 'Tên cửa hàng tối thiểu 3 ký tự';
    }
    setProfileErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setProfileLoading(true);
    try {
      await updateVendorProfile(
        {
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
          shopName: profileForm.shopName.trim(),
          phone: profileForm.phone.trim() || undefined,
        },
        logoFile ?? undefined
      );
      setLogoFile(null);
      setLogoPreview(null);
      setIsEditing(false);
      success('Cập nhật thông tin thành công!');
    } catch (err) {
      toastError(getAuthErrorMessage(err, 'Cập nhật thông tin thất bại'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (vendor) {
      setProfileForm({
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        phone: vendor.phone ?? '',
        shopName: vendor.shopName,
      });
    }
    setLogoFile(null);
    setLogoPreview(null);
    setProfileErrors({});
    setIsEditing(false);
  };

  const validateAccountForm = () => {
    const errors: Record<string, string> = {};
    if (!accountForm.currentPassword) {
      errors.currentPassword = 'Mật khẩu hiện tại là bắt buộc';
    }
    if (accountForm.username && accountForm.username.length < 3) {
      errors.username = 'Tên đăng nhập tối thiểu 3 ký tự';
    }
    if (accountForm.newPassword) {
      if (!PASSWORD_PATTERN.test(accountForm.newPassword)) {
        errors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự và chứa chữ cái cùng số';
      }
      if (accountForm.newPassword !== accountForm.confirmPassword) {
        errors.confirmPassword = 'Mật khẩu mới không khớp';
      }
    }
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAccountSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAccountForm()) return;

    setAccountLoading(true);
    try {
      await updateVendorAccount({
        currentPassword: accountForm.currentPassword,
        username:
          accountForm.username.trim() !== vendor?.username
            ? accountForm.username.trim()
            : undefined,
        email:
          accountForm.email.trim() !== vendor?.email ? accountForm.email.trim() : undefined,
        password: accountForm.newPassword || undefined,
      });
      setAccountForm((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      success('Cập nhật tài khoản thành công!');
    } catch (err) {
      toastError(getAuthErrorMessage(err, 'Cập nhật tài khoản thất bại'));
    } finally {
      setAccountLoading(false);
    }
  };

  if (isLoading && !user) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (!user || !vendor) return null;

  const avatarSrc = logoPreview ?? user.avatar ?? vendor.logoUrl ?? undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="card p-6">
        <div className="flex items-center gap-6">
          <div className="relative shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={user.name}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100 text-3xl font-bold text-primary-600 dark:bg-primary-900">
                {getInitials(user.name)}
              </div>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 rounded-full bg-primary-500 p-2 text-white transition-colors hover:bg-primary-600"
              title="Đổi logo cửa hàng"
            >
              <Camera className="h-4 w-4" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{user.name}</h1>
            <p className="text-gray-500">@{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
              <Store className="h-4 w-4 text-gray-400" />
              {vendor.shopName}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <Shield className="h-4 w-4 text-gray-400" />
              <span
                className={`text-sm font-medium ${
                  vendor.status === 'ACTIVE'
                    ? 'text-green-500'
                    : vendor.status === 'INACTIVE'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }`}
              >
                {STATUS_LABELS[vendor.status] ?? vendor.status}
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-400">
              Thành viên từ {new Date(user.createdAt).toLocaleDateString('vi-VN')}
            </p>
          </div>
        </div>
        {logoFile && (
          <p className="mt-3 text-sm text-primary-500">
            Logo mới chờ lưu: <span className="font-medium">{logoFile.name}</span> — nhấn{' '}
            <strong>Lưu thay đổi</strong> để cập nhật
          </p>
        )}
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {(Object.keys(TAB_LABELS) as ProfileTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveView(tab)}
            className={`border-b-2 px-6 py-4 font-medium transition-colors ${
              activeView === tab
                ? 'border-primary-500 text-primary-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {activeView === 'profile' && (
        <div className="card p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Thông tin cá nhân
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">Quản lý thông tin chủ cửa hàng</p>
            </div>
            {!isEditing ? (
              <button type="button" className="btn btn-outline" onClick={() => setIsEditing(true)}>
                Chỉnh sửa
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>
                  Hủy
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={profileLoading}
                  onClick={() => void handleProfileSave()}
                >
                  {profileLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Họ" error={profileErrors.lastName}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    disabled={!isEditing}
                    value={profileForm.lastName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, lastName: e.target.value })
                    }
                    className="input pl-10 disabled:opacity-60"
                    required
                  />
                </div>
              </Field>
              <Field label="Tên" error={profileErrors.firstName}>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    disabled={!isEditing}
                    value={profileForm.firstName}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, firstName: e.target.value })
                    }
                    className="input pl-10 disabled:opacity-60"
                    required
                  />
                </div>
              </Field>
            </div>
            <Field label="Tên cửa hàng" error={profileErrors.shopName}>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  disabled={!isEditing}
                  value={profileForm.shopName}
                  onChange={(e) => setProfileForm({ ...profileForm, shopName: e.target.value })}
                  className="input pl-10 disabled:opacity-60"
                  required
                  minLength={3}
                />
              </div>
            </Field>
            <Field label="Tên đăng nhập" helper="Đổi tên đăng nhập ở tab Bảo mật">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input disabled value={vendor.username} className="input pl-10 opacity-60" />
              </div>
            </Field>
            <Field label="Email" helper="Đổi email ở tab Bảo mật">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input disabled value={vendor.email} className="input pl-10 opacity-60" />
              </div>
            </Field>
            <Field label="Số điện thoại" error={profileErrors.phone} helper="10 chữ số">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  disabled={!isEditing}
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                  className="input pl-10 disabled:opacity-60"
                  placeholder="10 chữ số"
                />
              </div>
            </Field>
          </div>
        </div>
      )}

      {activeView === 'security' && (
        <div className="card p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Bảo mật tài khoản
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">Cập nhật thông tin đăng nhập và mật khẩu</p>
          </div>

          <form onSubmit={handleAccountSave} className="space-y-4">
            <Field label="Tên đăng nhập mới" error={accountErrors.username} helper="Để trống nếu không muốn thay đổi">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  value={accountForm.username}
                  onChange={(e) => setAccountForm({ ...accountForm, username: e.target.value })}
                  className="input pl-10"
                  minLength={3}
                />
              </div>
            </Field>
            <Field label="Email mới" error={accountErrors.email} helper="Để trống nếu không muốn thay đổi">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={accountForm.email}
                  onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                  className="input pl-10"
                />
              </div>
            </Field>

            <hr className="border-gray-200 dark:border-gray-700" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Đổi mật khẩu</p>

            <Field label="Mật khẩu hiện tại *" error={accountErrors.currentPassword}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={accountForm.currentPassword}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, currentPassword: e.target.value })
                  }
                  className="input pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPwd ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </Field>
            <Field
              label="Mật khẩu mới"
              error={accountErrors.newPassword}
              helper="Để trống nếu không đổi mật khẩu"
            >
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={accountForm.newPassword}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, newPassword: e.target.value })
                  }
                  className="input pl-10"
                />
              </div>
            </Field>
            <Field label="Xác nhận mật khẩu mới" error={accountErrors.confirmPassword}>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={accountForm.confirmPassword}
                  onChange={(e) =>
                    setAccountForm({ ...accountForm, confirmPassword: e.target.value })
                  }
                  className="input pl-10"
                />
              </div>
            </Field>

            <button type="submit" disabled={accountLoading} className="btn btn-primary mt-2">
              {accountLoading ? 'Đang lưu...' : 'Lưu thay đổi tài khoản'}
            </button>
          </form>
        </div>
      )}

      {activeView === 'address' && <ShippingSettingsPage embedded />}

      {activeView === 'payment' && <PaymentSettingsPage embedded />}
    </div>
  );
}
