import { Link } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { classNames } from '../../utils/helpers';

export type FinanceDirection = 'platform-to-vendor' | 'vendor-to-platform';

interface RelatedLink {
  label: string;
  to: string;
}

interface FinanceDirectionBannerProps {
  direction: FinanceDirection;
  description?: string;
  links?: RelatedLink[];
}

const COPY: Record<
  FinanceDirection,
  { title: string; defaultDescription: string; tone: 'in' | 'out' }
> = {
  'platform-to-vendor': {
    title: 'Sàn trả tiền cho cửa hàng',
    defaultDescription:
      'Doanh thu đơn đã hoàn tất được gom rồi chuyển vào tài khoản ngân hàng khi bạn yêu cầu rút. Tách biệt với phí sàn.',
    tone: 'in',
  },
  'vendor-to-platform': {
    title: 'Cửa hàng trả phí cho sàn',
    defaultDescription:
      'Phí hoa hồng được gom thành hóa đơn. Thanh toán qua VNPay, không cấn trừ vào lần rút tiền.',
    tone: 'out',
  },
};

export function FinanceDirectionBanner({
  direction,
  description,
  links,
}: FinanceDirectionBannerProps) {
  const copy = COPY[direction];
  const Icon = copy.tone === 'in' ? ArrowDownLeft : ArrowUpRight;

  return (
    <div
      className={classNames(
        'card flex flex-col gap-3 p-4 sm:flex-row sm:items-center',
        copy.tone === 'in'
          ? 'border-l-4 border-success-500 bg-success-50/60 dark:bg-success-950/20'
          : 'border-l-4 border-warning-500 bg-warning-50/60 dark:bg-warning-950/20'
      )}
    >
      <div
        className={classNames(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          copy.tone === 'in'
            ? 'bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-400'
            : 'bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-400'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-gray-900 dark:text-gray-100">{copy.title}</p>
        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400">
          {description ?? copy.defaultDescription}
        </p>
      </div>
      {links && links.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="font-medium text-primary-600 hover:underline dark:text-primary-400"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
