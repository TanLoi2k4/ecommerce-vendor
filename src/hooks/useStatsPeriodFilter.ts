import { useState } from 'react';
import type { OrderStatsPeriod } from '../types/order';
import { formatPeriodLabel, todayAnchor } from '../utils/orderStatsPeriod';

export function useStatsPeriodFilter(initial: OrderStatsPeriod = 'MONTH') {
  const [period, setPeriod] = useState<OrderStatsPeriod>(initial);
  const [anchor, setAnchor] = useState(todayAnchor);

  return {
    period,
    anchor,
    periodLabel: formatPeriodLabel(period, anchor),
    onPeriodChange: (next: OrderStatsPeriod) => {
      setPeriod(next);
      setAnchor(todayAnchor());
    },
    onAnchorChange: setAnchor,
  };
}
