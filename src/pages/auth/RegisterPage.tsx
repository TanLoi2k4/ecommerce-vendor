import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus, Store, Upload } from 'lucide-react';
import { registerInit } from '../../api/vendorApi';
import { getAuthErrorMessage } from '../../store/authStore';

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
const PHONE_PATTERN = /^\d{10}$/;

const REGISTER_OTP_KEY = 'vendor-register-otp';

export function RegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    shopName: '',
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (!PASSWORD_PATTERN.test(formData.password)) {
      setError('Mật khẩu phải có ít nhất 8 ký tự và chứa chữ cái cùng số');
      return;
    }

    if (!PHONE_PATTERN.test(formData.phone)) {
      setError('Số điện thoại phải đúng 10 chữ số');
      return;
    }

    setIsLoading(true);
    try {
      const initToken = await registerInit(
        {
          username: formData.username.trim(),
          email: formData.email.trim(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          shopName: formData.shopName.trim(),
          phone: formData.phone.trim(),
          password: formData.password,
        },
        logo ?? undefined
      );

      const otpState = { email: formData.email.trim(), initToken };
      sessionStorage.setItem(REGISTER_OTP_KEY, JSON.stringify(otpState));

      navigate('/register/verify-otp', { state: otpState });
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Đăng ký thất bại. Vui lòng thử lại.'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Tạo tài khoản
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Đăng ký cửa hàng và bắt đầu bán hàng
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 text-sm">
            {error}
          </div>
        )}

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium mb-2">
            <UserPlus className="w-4 h-4" />
            Thông tin cá nhân
          </div>

          <div>
            <label htmlFor="username" className="label">
              Tên đăng nhập
            </label>
            <input
              id="username"
              type="text"
              value={formData.username}
              onChange={(e) => updateField('username', e.target.value)}
              className="input"
              placeholder="Chọn tên đăng nhập"
              minLength={3}
              maxLength={50}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lastName" className="label">
                Họ
              </label>
              <input
                id="lastName"
                type="text"
                value={formData.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="input"
                placeholder="Họ"
                required
              />
            </div>
            <div>
              <label htmlFor="firstName" className="label">
                Tên
              </label>
              <input
                id="firstName"
                type="text"
                value={formData.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="input"
                placeholder="Tên"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="label">
                Địa chỉ Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="input"
                placeholder="Nhập Email của bạn"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="label">
                Số điện thoại
              </label>
              <input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input"
                placeholder="10 chữ số, vd: 0812345678"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="label">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => updateField('password', e.target.value)}
                className="input pr-10"
                placeholder="Tối thiểu 8 ký tự, chữ và số"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="label">
              Xác nhận mật khẩu
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              className="input"
              placeholder="Xác nhận mật khẩu của bạn"
              required
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 font-medium mb-2">
            <Store className="w-4 h-4" />
            Thông tin cửa hàng
          </div>

          <div>
            <label htmlFor="shopName" className="label">
              Tên cửa hàng
            </label>
            <input
              id="shopName"
              type="text"
              value={formData.shopName}
              onChange={(e) => updateField('shopName', e.target.value)}
              className="input"
              placeholder="Nhập tên cửa hàng"
              minLength={3}
              required
            />
          </div>

          <div>
            <label htmlFor="logo" className="label">
              Logo cửa hàng (tùy chọn)
            </label>
            <label className="flex items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-primary-400 transition-colors">
              <Upload className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {logo ? logo.name : 'JPEG hoặc PNG, tối đa 2MB'}
              </span>
              <input
                id="logo"
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => setLogo(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <input type="checkbox" className="mt-1 w-4 h-4 rounded" required />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Tôi đồng ý với Điều khoản dịch vụ và Chính sách bảo mật
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-lg w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang gửi mã xác minh...
            </span>
          ) : (
            <>
              <UserPlus className="w-5 h-5" />
              Tiếp tục
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Đã có tài khoản?{' '}
        </span>
        <Link to="/login" className="link font-medium">
          Đăng nhập
        </Link>
      </div>
    </div>
  );
}

export { REGISTER_OTP_KEY };
