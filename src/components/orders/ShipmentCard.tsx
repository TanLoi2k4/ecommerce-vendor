import { useState } from 'react';
import { Truck, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import type { SubOrderStatus } from '../../types/order';
import { shouldFetchShipment } from '../../types/order';
import type { Shipment } from '../../types/shipment';
import {
  formatCarrierLabel,
  shipmentStatusColor,
  shipmentStatusLabel,
  translateShipmentError,
} from '../../utils/shipmentLabels';
import { ShipmentTrackingTimeline } from './ShipmentTrackingTimeline';
import { LoadingSkeleton } from '../ui';
import { toast } from '../ui/Toast';

type ShipmentCardProps = {
  subOrderStatus: SubOrderStatus;
  shipment?: Shipment | null;
  loading?: boolean;
  notFound?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function ShipmentCard({
  subOrderStatus,
  shipment,
  loading = false,
  notFound = false,
  error = null,
  onRetry,
}: ShipmentCardProps) {
  const [copied, setCopied] = useState(false);

  if (!shouldFetchShipment(subOrderStatus)) {
    return null;
  }

  if (loading && !shipment) {
    return <LoadingSkeleton variant="shipment" />;
  }

  if (error && !shipment) {
    return (
      <div className="card p-6">
        <div className="rounded-lg border border-warning-200 bg-warning-50 dark:bg-warning-900/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-warning-700 dark:text-warning-300">
            {translateShipmentError(error)}
          </p>
          {onRetry && (
            <button type="button" onClick={() => void onRetry()} className="btn btn-secondary btn-sm">
              <RefreshCw className="w-4 h-4" />
              Thử lại
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!shipment) {
    if (notFound || subOrderStatus === 'SHIPPING_REQUESTED') {
      return (
        <div className="card p-6">
          <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
            <Truck className="w-5 h-5 text-primary-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">Vận chuyển</p>
              <p className="mt-1">
                Đã gửi yêu cầu vận chuyển — đang chờ đơn vị vận chuyển xác nhận.
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  const trackingCode = shipment.carrierTrackingId || shipment.externalShipmentId;

  const handleCopy = async () => {
    if (!trackingCode) return;
    try {
      await navigator.clipboard.writeText(trackingCode);
      setCopied(true);
      toast.success('Đã sao chép mã vận đơn');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Không sao chép được mã vận đơn');
    }
  };

  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Truck className="w-5 h-5 text-primary-500" />
          Vận chuyển
        </h3>
        <div className="flex items-center gap-2">
          <span className={`badge badge-${shipmentStatusColor(shipment.status)}`}>
            {shipmentStatusLabel[shipment.status]}
          </span>
        </div>
      </div>

      {shipment.status === 'BOOKING_FAILED' && (
        <div className="rounded-lg border border-error-200 bg-error-50 dark:bg-error-900/20 px-4 py-3 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-error-600 shrink-0 mt-0.5" />
          <div className="text-sm text-error-700 dark:text-error-300">
            <p className="font-medium">Đặt vận chuyển thất bại</p>
            <p className="mt-1">
              Đơn vị vận chuyển chưa nhận đơn. Đơn phụ đang ở trạng thái chờ vận chuyển và hiện
              chưa thể gửi lại yêu cầu từ giao diện. Vui lòng liên hệ hỗ trợ hoặc chờ hệ thống xử
              lý.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div>
          <span className="text-gray-500 dark:text-gray-400">Đơn vị: </span>
          <span className="text-gray-900 dark:text-gray-100">
            {formatCarrierLabel(shipment.carrierCode, shipment.carrierName)}
          </span>
        </div>
        {shipment.serviceLevel && (
          <div>
            <span className="text-gray-500 dark:text-gray-400">Dịch vụ: </span>
            <span className="text-gray-900 dark:text-gray-100">{shipment.serviceLevel}</span>
          </div>
        )}
        {trackingCode && (
          <div className="sm:col-span-2 flex items-center gap-2 flex-wrap">
            <span className="text-gray-500 dark:text-gray-400">Mã vận đơn:</span>
            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded font-mono">
              {trackingCode}
            </code>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
              title="Sao chép mã vận đơn"
            >
              {copied ? (
                <Check className="w-4 h-4 text-success-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>

      <ShipmentTrackingTimeline shipment={shipment} />
    </div>
  );
}
