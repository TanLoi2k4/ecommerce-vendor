import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { OrderStatsPeriod } from '../../types/order';
import {
  ORDER_STATS_PERIODS,
  canGoForward,
  monthInputValue,
  shiftAnchor,
  yearInputValue,
} from '../../utils/orderStatsPeriod';

interface OrderStatsPeriodBarProps {
  period: OrderStatsPeriod;
  anchor: string;
  periodLabel?: string;
  onPeriodChange: (period: OrderStatsPeriod) => void;
  onAnchorChange: (anchor: string) => void;
}

export function OrderStatsPeriodBar({
  period,
  anchor,
  periodLabel,
  onPeriodChange,
  onAnchorChange,
}: OrderStatsPeriodBarProps) {
  const showPicker = period !== 'ALL';
  const canNext = canGoForward(anchor, period);

  return (
    <div className="card p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {ORDER_STATS_PERIODS.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => onPeriodChange(item.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                period === item.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {showPicker && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              aria-label="Kỳ trước"
              onClick={() => onAnchorChange(shiftAnchor(anchor, period, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[10rem] text-center text-sm font-medium text-gray-800 dark:text-gray-100">
              {periodLabel ?? 'Đang tải...'}
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm disabled:opacity-40"
              aria-label="Kỳ sau"
              disabled={!canNext}
              onClick={() => onAnchorChange(shiftAnchor(anchor, period, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            {period === 'WEEK' && (
              <input
                type="date"
                value={anchor}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => e.target.value && onAnchorChange(e.target.value)}
                className="input"
                aria-label="Chọn ngày trong tuần"
              />
            )}
            {period === 'MONTH' && (
              <input
                type="month"
                value={monthInputValue(anchor)}
                max={monthInputValue(new Date().toISOString().slice(0, 10))}
                onChange={(e) => e.target.value && onAnchorChange(`${e.target.value}-01`)}
                className="input"
                aria-label="Chọn tháng"
              />
            )}
            {period === 'YEAR' && (
              <input
                type="number"
                min={2000}
                max={new Date().getFullYear()}
                value={yearInputValue(anchor)}
                onChange={(e) => {
                  const year = Number(e.target.value);
                  if (!Number.isFinite(year) || year < 2000) return;
                  onAnchorChange(`${year}-01-01`);
                }}
                className="input w-28"
                aria-label="Chọn năm"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
