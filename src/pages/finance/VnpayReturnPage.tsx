import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import * as paymentApi from '../../api/paymentApi';
import type { VnpayReturnResult } from '../../types/payment';
import { translatePaymentError } from '../../utils/paymentLabels';

function isVendorFeeReturn(result: VnpayReturnResult | null): boolean {
  if (!result) return false;
  return (
    result.paymentType === 'VENDOR_FEE' ||
    (result.orderCode?.startsWith('VINV-') ?? false)
  );
}

export function VnpayReturnPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [result, setResult] = useState<VnpayReturnResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const vnpParams = useMemo(() => {
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key.startsWith('vnp_')) {
        params[key] = value;
      }
    });
    return params;
  }, [searchParams]);

  const isVendorFee = isVendorFeeReturn(result);

  useEffect(() => {
    if (Object.keys(vnpParams).length === 0) {
      setError('Thiếu tham số VNPay trong URL.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    void paymentApi
      .processVnpayReturn(vnpParams)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const raw = err instanceof Error ? err.message : 'Không thể xử lý kết quả VNPay';
        setError(translatePaymentError(raw));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vnpParams]);

  useEffect(() => {
    if (loading || !result) return;

    const targetPath = isVendorFeeReturn(result) ? '/finance/invoices' : '/finance/wallet';
    const timer = window.setTimeout(() => {
      navigate(targetPath, { replace: true });
    }, 4000);
    return () => window.clearTimeout(timer);
  }, [loading, result, navigate]);

  if (loading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Đang xác nhận thanh toán VNPay…
        </h1>
        <p className="text-gray-500 mt-2">Vui lòng không đóng trang này.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <XCircle className="w-14 h-14 text-error-500 mx-auto mb-4" />
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Không thể xử lý thanh toán
        </h1>
        <p className="text-gray-500 mt-2">{error}</p>
        <div className="mt-6 flex gap-3 justify-center">
        <Link to="/finance/invoices" className="btn btn-outline">
            Quay lại hóa đơn phí sàn
          </Link>
          <Link to="/finance/wallet" className="btn btn-primary">
            Ví
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = Boolean(result?.success);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {isSuccess ? (
        <CheckCircle className="w-14 h-14 text-success-500 mx-auto mb-4" />
      ) : (
        <XCircle className="w-14 h-14 text-error-500 mx-auto mb-4" />
      )}

      <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        {isSuccess
          ? isVendorFee
            ? 'Thanh toán hóa đơn thành công'
            : 'Thanh toán thành công'
          : isVendorFee
            ? 'Thanh toán hóa đơn chưa hoàn tất'
            : 'Thanh toán chưa hoàn tất'}
      </h1>

      <p className="text-gray-500 mt-2">
        {result?.message ||
          (isSuccess
            ? 'Trạng thái hóa đơn sẽ được cập nhật trong giây lát.'
            : 'Bạn có thể thử thanh toán lại từ trang hóa đơn.')}
      </p>

      {result?.orderCode && (
        <p className="text-sm text-gray-400 mt-2">
          Mã tham chiếu: <span className="font-mono">{result.orderCode}</span>
        </p>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Đang chuyển đến {isVendorFee ? 'hóa đơn phí sàn' : 'ví'} trong vài giây…
      </p>

      <div className="mt-6 flex gap-3 justify-center">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(isVendorFee ? '/finance/invoices' : '/finance/wallet', { replace: true })}
        >
          {isVendorFee ? 'Xem hóa đơn phí sàn' : 'Đến Ví'}
        </button>
      </div>
    </div>
  );
}
