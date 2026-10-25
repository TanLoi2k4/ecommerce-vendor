import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, RefreshCw } from 'lucide-react';
import { resendOtp, verifyOtp } from '../../api/vendorApi';
import { getAuthErrorMessage } from '../../store/authStore';
import { REGISTER_OTP_KEY } from './RegisterPage';

interface OtpLocationState {
  email: string;
  initToken: string;
}

function loadOtpState(locationState: unknown): OtpLocationState | null {
  const state = locationState as OtpLocationState | null;
  if (state?.email && state?.initToken) {
    return state;
  }

  const stored = sessionStorage.getItem(REGISTER_OTP_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as OtpLocationState;
  } catch {
    return null;
  }
}

export function OtpVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const otpState = loadOtpState(location.state);

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (!otpState) {
      navigate('/register', { replace: true });
    }
  }, [otpState, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  if (!otpState) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp.trim()) {
      setError('Vui lòng nhập mã xác minh');
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp({
        email: otpState.email,
        otp: otp.trim(),
        initToken: otpState.initToken,
        autoRegister: true,
      });

      sessionStorage.removeItem(REGISTER_OTP_KEY);
      navigate('/login', {
        replace: true,
        state: {
          message: 'Đăng ký thành công! Vui lòng đăng nhập bằng tên đăng nhập.',
        },
      });
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Mã xác minh không hợp lệ hoặc đã hết hạn'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setIsResending(true);
    try {
      await resendOtp({
        email: otpState.email,
        initToken: otpState.initToken,
      });
      setResendCooldown(60);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Không thể gửi lại mã xác minh'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-950 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-7 h-7 text-primary-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Xác minh Email của bạn
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Nhập mã được gửi đến{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {otpState.email}
          </span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 rounded-lg bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="otp" className="label">
            Mã xác minh
          </label>
          <input
            id="otp"
            type="text"
            inputMode="numeric"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\s/g, ''))}
            className="input text-center text-lg tracking-widest"
            placeholder="Nhập mã OTP"
            autoComplete="one-time-code"
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
              Đang xác minh...
            </span>
          ) : (
            'Xác minh và tạo tài khoản'
          )}
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending || resendCooldown > 0}
          className="text-sm link font-medium inline-flex items-center gap-1 disabled:opacity-50 disabled:no-underline"
        >
          <RefreshCw className={`w-4 h-4 ${isResending ? 'animate-spin' : ''}`} />
          {resendCooldown > 0
            ? `Gửi lại mã sau ${resendCooldown}s`
            : 'Gửi lại mã xác minh'}
        </button>

        <Link
          to="/register"
          className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 inline-flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại đăng ký
        </Link>
      </div>
    </div>
  );
}
