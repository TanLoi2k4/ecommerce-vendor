import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, KeyRound, CheckCircle } from 'lucide-react';
import { resetPassword } from '../../api/vendorApi';
import { getAuthErrorMessage } from '../../store/authStore';

const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Token đặt lại không hợp lệ hoặc thiếu');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (!PASSWORD_PATTERN.test(password)) {
      setError('Mật khẩu phải có ít nhất 8 ký tự và chứa chữ cái cùng số');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, password, confirmPassword });
      setIsSuccess(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Không thể đặt lại mật khẩu. Liên kết có thể đã hết hạn.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="w-full text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Liên kết đặt lại không hợp lệ
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Liên kết đặt lại mật khẩu này không hợp lệ hoặc đã hết hạn.
        </p>
        <Link to="/forgot-password" className="btn btn-primary btn-lg w-full">
          Yêu cầu liên kết mới
        </Link>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Mật khẩu đã được cập nhật
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Mật khẩu của bạn đã được đặt lại thành công.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login', { replace: true })}
          className="btn btn-primary btn-lg w-full"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Đặt mật khẩu mới
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Chọn mật khẩu mạnh cho tài khoản của bạn
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="label">
            Mật khẩu mới
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pr-10"
              placeholder="Tối thiểu 8 ký tự, chữ và số"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input"
            placeholder="Xác nhận mật khẩu mới"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-lg w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang cập nhật...
            </span>
          ) : (
            <>
              <KeyRound className="w-5 h-5" />
              Đặt lại mật khẩu
            </>
          )}
        </button>
      </form>
    </div>
  );
}
