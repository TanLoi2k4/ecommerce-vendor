import { useEffect, useState } from 'react';
import { Camera, Phone, Mail, Save, Upload } from 'lucide-react';
import { useVendorProfile } from '../../hooks/useVendorProfile';
import { getAuthErrorMessage } from '../../store/authStore';
import { LoadingSkeleton } from '../../components/ui';

const PHONE_PATTERN = /^\d{10}$/;

export function ShopProfilePage() {
  const { vendor, user, shop, isLoading, updateVendorProfile } = useVendorProfile({
    refetchOnMount: true,
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    shopName: '',
    firstName: '',
    lastName: '',
    phone: '',
  });

  useEffect(() => {
    if (vendor) {
      setFormData({
        shopName: vendor.shopName,
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        phone: vendor.phone ?? '',
      });
    }
  }, [vendor]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.phone && !PHONE_PATTERN.test(formData.phone)) {
      setError('Số điện thoại phải đúng 10 chữ số');
      return;
    }

    setIsSaving(true);
    try {
      await updateVendorProfile(
        {
          shopName: formData.shopName.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim() || undefined,
        },
        logoFile ?? undefined
      );
      setSuccess(true);
      setIsEditing(false);
      setLogoFile(null);
      setLogoPreview(null);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Cập nhật hồ sơ cửa hàng thất bại'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoChange = (file: File | null) => {
    setLogoFile(file);
    if (file) {
      setLogoPreview(URL.createObjectURL(file));
    } else {
      setLogoPreview(null);
    }
  };

  if (isLoading && !shop) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (!shop || !user || !vendor) return null;

  const displayLogo = logoPreview ?? shop.logo;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Hồ sơ cửa hàng
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Quản lý thông tin cửa hàng
          </p>
        </div>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className="btn btn-primary">
            Chỉnh sửa hồ sơ
          </button>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="relative h-32 bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-600" />
        <div className="relative px-6 pb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4 -mt-12">
            <div className="relative">
              <div className="w-24 h-24 rounded-xl bg-white dark:bg-gray-900 p-1 shadow-lg">
                {displayLogo ? (
                  <img
                    src={displayLogo}
                    alt={shop.name}
                    className="w-full h-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-full h-full rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-2xl font-bold text-primary-600">
                    {shop.name[0]}
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 p-2 rounded-lg bg-white dark:bg-gray-900 shadow-md text-gray-600 cursor-pointer">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              )}
            </div>
            <div className="flex-1 pt-4 sm:pt-0">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {shop.name}
              </h2>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                <span>@{user.username}</span>
                <span className={`badge badge-${vendor.status === 'ACTIVE' ? 'success' : 'warning'}`}>
                  {vendor.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {error && (
          <div className="lg:col-span-2 p-3 rounded-lg bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="lg:col-span-2 p-3 rounded-lg bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-400 text-sm">
            Cập nhật hồ sơ cửa hàng thành công!
          </div>
        )}

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Thông tin cửa hàng
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label">Tên cửa hàng</label>
              <input
                type="text"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                className="input"
                disabled={!isEditing}
                required
                minLength={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Họ chủ cửa hàng</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="input"
                  disabled={!isEditing}
                  required
                />
              </div>
              <div>
                <label className="label">Tên chủ cửa hàng</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="input"
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>
            {isEditing && (
              <div>
                <label className="label">Logo cửa hàng</label>
                <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-400">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {logoFile ? logoFile.name : 'Tải lên JPEG hoặc PNG (tối đa 2MB)'}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => handleLogoChange(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Liên hệ (chỉ đọc)
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Email và tên đăng nhập có thể thay đổi trong Cài đặt tài khoản.
          </p>
          <div className="space-y-4">
            <div>
              <label className="label">Số điện thoại</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      phone: e.target.value.replace(/\D/g, '').slice(0, 10),
                    })
                  }
                  className="input pl-10"
                  disabled={!isEditing}
                  placeholder="10 chữ số"
                />
              </div>
            </div>
            <div>
              <label className="label">Địa chỉ Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="email" value={user.email} className="input pl-10" disabled />
              </div>
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="lg:col-span-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                setLogoFile(null);
                setLogoPreview(null);
                setError('');
                if (vendor) {
                  setFormData({
                    shopName: vendor.shopName,
                    firstName: vendor.firstName,
                    lastName: vendor.lastName,
                    phone: vendor.phone ?? '',
                  });
                }
              }}
              className="btn btn-secondary"
            >
              Hủy
            </button>
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Đang lưu...
                </span>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Lưu thay đổi
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
