import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, LogIn, User, Lock } from 'lucide-react';
import { useAuthStore, getAuthErrorMessage } from '../../store/authStore';
import { isRememberMeEnabled } from '../../utils/authStorage';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(isRememberMeEnabled);
  const [error, setError] = useState('');

  const successMessage = (location.state as { message?: string } | null)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(username.trim(), password, rememberMe);
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;
      navigate(from ?? '/dashboard', { replace: true });
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Tên đăng nhập hoặc mật khẩu không hợp lệ'));
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Chào mừng trở lại
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Đăng nhập vào tài khoản nhà bán hàng
        </p>
      </div>

      {successMessage && (
        <div className="mb-5 p-3 rounded-lg bg-success-50 dark:bg-success-950 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 text-sm">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        {error && (
          <div className="p-3 rounded-lg bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="vendor-login-username" className="label">
            Tên đăng nhập
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="vendor-login-username"
              name="vendor-login-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input pl-10"
              placeholder="Nhập tên đăng nhập"
              autoComplete="off"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="vendor-login-password" className="label">
            Mật khẩu
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              id="vendor-login-password"
              name="vendor-login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input pl-10 pr-10"
              placeholder="Nhập mật khẩu"
              autoComplete="new-password"
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

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">Ghi nhớ đăng nhập</span>
          </label>
          <Link to="/forgot-password" className="text-sm link font-medium">
            Quên mật khẩu?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-lg w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang đăng nhập...
            </span>
          ) : (
            <>
              <LogIn className="w-5 h-5" />
              Đăng nhập
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Chưa có tài khoản?{' '}
        </span>
        <Link to="/register" className="link font-medium">
          Đăng ký cửa hàng
        </Link>
      </div>
    </div>
  );
}
