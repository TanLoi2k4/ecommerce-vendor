import { MapPin, Clock, User, Phone, Car } from 'lucide-react';
import { useVendorShipmentTracking } from '../../hooks/useVendorShipmentTracking';
import type { Shipment } from '../../types/shipment';
import { formatDateTime } from '../../utils/helpers';
import { LoadingSkeleton } from '../ui';

type ShipmentTrackingTimelineProps = {
  shipment: Shipment;
};

export function ShipmentTrackingTimeline({ shipment }: ShipmentTrackingTimelineProps) {
  const { events, loading, error, refresh } = useVendorShipmentTracking(shipment, {
    enabled: true,
  });

  if (loading && events.length === 0) {
    return <LoadingSkeleton variant="shipment-tracking" />;
  }

  if (error && events.length === 0) {
    return (
      <div className="rounded-lg border border-warning-200 bg-warning-50 dark:bg-warning-900/20 p-3 flex items-start justify-between gap-3">
        <p className="text-sm text-warning-700 dark:text-warning-300">{error}</p>
        <button type="button" onClick={() => void refresh()} className="btn btn-secondary btn-sm shrink-0">
          Thử lại
        </button>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Chưa có cập nhật hành trình. Thông tin sẽ hiển thị khi đơn vị vận chuyển quét mã.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Hành trình</h4>
      <ol className="relative border-l border-gray-200 dark:border-gray-700 ml-2 space-y-4">
        {events.map((event, index) => (
          <li key={event.id} className="ml-4">
            <span
              className={`absolute -left-1.5 flex h-3 w-3 rounded-full ${
                index === 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
            <div className="text-sm">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {event.location || 'Cập nhật trạng thái'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDateTime(event.createdAt)}
                {event.trackingId ? ` · ${event.trackingId}` : ''}
              </p>

              <div className="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                {event.eta && (
                  <p className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Dự kiến: {formatDateTime(event.eta)}
                  </p>
                )}
                {event.driverName && (
                  <p className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {event.driverName}
                  </p>
                )}
                {event.driverPhone && (
                  <p className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {event.driverPhone}
                  </p>
                )}
                {event.vehicle && (
                  <p className="flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    {event.vehicle}
                  </p>
                )}
                {event.location && (
                  <p className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {event.location}
                  </p>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
