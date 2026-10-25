import { CheckCircle2, Circle, XCircle } from 'lucide-react';
import {
  SUB_ORDER_WORKFLOW_STEPS,
  SUB_ORDER_STATUS_LABELS,
  subOrderProgressIndex,
  type SubOrderStatus,
} from '../../types/order';
import type { ShipmentStatus } from '../../types/shipment';
import { shipmentStatusLabel } from '../../utils/shipmentLabels';
import { classNames } from '../../utils/helpers';

interface SubOrderStatusTimelineProps {
  status: SubOrderStatus;
  shipmentStatus?: ShipmentStatus | null;
}

function shipmentMilestoneLabel(
  subOrderStatus: SubOrderStatus,
  shipmentStatus?: ShipmentStatus | null
): string | null {
  if (!shipmentStatus) return null;
  if (subOrderStatus !== 'SHIPPING' && subOrderStatus !== 'SHIPPING_REQUESTED') {
    return null;
  }
  return shipmentStatusLabel[shipmentStatus];
}

export function SubOrderStatusTimeline({
  status,
  shipmentStatus,
}: SubOrderStatusTimelineProps) {
  const currentIndex = subOrderProgressIndex(status);
  const isCancelled = status === 'CANCELLED';
  const isReturned = status === 'RETURNED';
  const milestone = shipmentMilestoneLabel(status, shipmentStatus);

  if (isCancelled || isReturned) {
    return (
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Tiến độ đơn hàng
        </h3>
        <div
          className={classNames(
            'flex items-center gap-3 rounded-lg px-4 py-3',
            isCancelled
              ? 'bg-error-50 dark:bg-error-900/20 text-error-700 dark:text-error-300'
              : 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300'
          )}
        >
          <XCircle className="w-5 h-5 shrink-0" />
          <span className="font-medium">{SUB_ORDER_STATUS_LABELS[status]}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
        Tiến độ đơn hàng
      </h3>
      <ol className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0">
        {SUB_ORDER_WORKFLOW_STEPS.map((step, index) => {
          const done = currentIndex > index;
          const active = currentIndex === index;
          const upcoming = currentIndex < index;
          const showShipmentMilestone =
            milestone &&
            (step.status === 'SHIPPING' || step.status === 'SHIPPING_REQUESTED') &&
            (active || done);

          return (
            <li
              key={step.status}
              className="flex sm:flex-1 sm:flex-col sm:items-center sm:text-center gap-3 sm:gap-2 relative"
            >
              {index > 0 && (
                <span
                  className={classNames(
                    'hidden sm:block absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2',
                    done || active ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'
                  )}
                  style={{ width: 'calc(100% - 2rem)', right: '50%' }}
                  aria-hidden
                />
              )}
              <div
                className={classNames(
                  'relative z-10 flex items-center justify-center w-8 h-8 rounded-full shrink-0',
                  done && 'bg-primary-500 text-white',
                  active &&
                    'bg-primary-100 dark:bg-primary-900/40 text-primary-600 ring-2 ring-primary-500',
                  upcoming && 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <Circle
                    className={classNames('w-4 h-4', active && 'fill-primary-500 text-primary-500')}
                  />
                )}
              </div>
              <div className="min-w-0">
                <p
                  className={classNames(
                    'text-sm font-medium',
                    active
                      ? 'text-primary-600 dark:text-primary-400'
                      : done
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400'
                  )}
                >
                  {step.label}
                </p>
                {active && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Hiện tại</p>
                )}
                {showShipmentMilestone && active && (
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-0.5">
                    {milestone}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
