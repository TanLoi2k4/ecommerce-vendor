import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { forgetPassword } from '../../api/vendorApi';
import { getAuthErrorMessage } from '../../store/authStore';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await forgetPassword({ email: email.trim() });
      setIsSuccess(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Không thể gửi Email đặt lại mật khẩu. Vui lòng thử lại.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="w-full text-center">
        <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900 flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Kiểm tra Email của bạn
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Nếu có tài khoản cho{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {email}
          </span>
          , bạn sẽ nhận được liên kết đặt lại mật khẩu trong thời gian ngắn.
        </p>
        <Link to="/login" className="btn btn-primary btn-lg w-full">
          <ArrowLeft className="w-5 h-5" />
          Quay lại đăng nhập
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Quên mật khẩu?
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Đừng lo, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="label">
            Địa chỉ Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input pl-10"
              placeholder="Nhập Email của bạn"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary btn-lg w-full"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Đang gửi...
            </span>
          ) : (
            'Đặt lại mật khẩu'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}
