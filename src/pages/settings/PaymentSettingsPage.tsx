import { useEffect, useState } from 'react';
import { CreditCard, Save, Trash2 } from 'lucide-react';
import { getBankAccount, saveBankAccount, deleteBankAccount } from '../../api/bankAccountApi';
import type { BankAccountDto, AccountVerificationStatus } from '../../types/vendor';
import { getAuthErrorMessage } from '../../store/authStore';
import { BANKS } from '../../utils/constants';
import { LoadingSkeleton } from '../../components/ui';
import { FinanceDirectionBanner } from '../../components/finance/FinanceDirectionBanner';
import { BANK_VERIFICATION_LABELS } from '../../utils/paymentLabels';

const ACCOUNT_TYPES = [
  { value: 'SAVINGS', label: 'Tiết kiệm' },
  { value: 'CHECKING', label: 'Thanh toán' },
];

function verificationBadgeClass(status: AccountVerificationStatus): string {
  switch (status) {
    case 'VERIFIED':
      return 'badge-success';
    case 'PENDING':
      return 'badge-warning';
    case 'FAILED':
    case 'REJECTED':
      return 'badge-error';
    default:
      return 'badge-gray';
  }
}

export function PaymentSettingsPage({ embedded = false }: { embedded?: boolean }) {
  const [bankAccount, setBankAccount] = useState<BankAccountDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    bankCode: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    accountType: 'SAVINGS',
  });

  const loadBankAccount = async () => {
    setIsLoading(true);
    setError('');
    try {
      const account = await getBankAccount();
      setBankAccount(account);
      if (account) {
        setForm({
          bankCode: account.bankCode,
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountName: account.accountName,
          accountType: account.accountType || 'SAVINGS',
        });
      }
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Tải tài khoản ngân hàng thất bại'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBankAccount();
  }, []);

  const handleBankChange = (bankCode: string) => {
    const bank = BANKS.find((b) => b.value === bankCode);
    setForm({
      ...form,
      bankCode,
      bankName: bank?.label ?? bankCode,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsSaving(true);

    try {
      const saved = await saveBankAccount({
        bankCode: form.bankCode,
        bankName: form.bankName,
        accountNumber: form.accountNumber.trim(),
        accountName: form.accountName.trim(),
        accountType: form.accountType,
      });
      setBankAccount(saved);
      setSuccess(true);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Lưu tài khoản ngân hàng thất bại'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!bankAccount || !window.confirm('Xóa tài khoản ngân hàng này?')) return;

    setError('');
    try {
      await deleteBankAccount(bankAccount.id);
      setBankAccount(null);
      setForm({
        bankCode: '',
        bankName: '',
        accountNumber: '',
        accountName: '',
        accountType: 'SAVINGS',
      });
      setSuccess(false);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Xóa tài khoản ngân hàng thất bại'));
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="detail" />;
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Cài đặt thanh toán
          </h1>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Tài khoản ngân hàng dùng để nhận tiền khi sàn chi trả doanh thu
          </p>
        </div>
      )}

      {!embedded && (
        <FinanceDirectionBanner
          direction="platform-to-vendor"
          description="Tài khoản phải được quản trị viên xác minh trước khi bạn có thể yêu cầu rút tiền."
          links={[{ label: 'Ví & rút tiền', to: '/finance/wallet' }]}
        />
      )}

      {error && (
        <div className="p-3 rounded-lg bg-error-50 dark:bg-error-950 text-error-700 dark:text-error-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-success-50 dark:bg-success-950 text-success-700 dark:text-success-400 text-sm">
          Đã lưu tài khoản ngân hàng. Trạng thái xác minh có thể được đặt lại thành đang chờ sau khi thay đổi.
        </div>
      )}

      <div className={embedded ? 'card p-6' : 'card p-6 max-w-2xl'}>
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-50 p-2 dark:bg-primary-950">
              <CreditCard className="h-5 w-5 text-primary-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Tài khoản ngân hàng
              </h3>
              <p className="text-sm text-gray-500">
                {embedded
                  ? 'Tài khoản nhận tiền khi sàn chi trả doanh thu'
                  : 'Một tài khoản đã xác minh được dùng để nhận tiền rút'}
              </p>
            </div>
          </div>
          {bankAccount && (
            <span className={`badge ${verificationBadgeClass(bankAccount.verificationStatus)}`}>
              {BANK_VERIFICATION_LABELS[bankAccount.verificationStatus]}
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Ngân hàng</label>
            <select
              value={form.bankCode}
              onChange={(e) => handleBankChange(e.target.value)}
              className="input"
              required
            >
              <option value="">Chọn ngân hàng</option>
              {BANKS.map((bank) => (
                <option key={bank.value} value={bank.value}>
                  {bank.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Loại tài khoản</label>
            <select
              value={form.accountType}
              onChange={(e) => setForm({ ...form, accountType: e.target.value })}
              className="input"
              required
            >
              {ACCOUNT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">Số tài khoản</label>
            <input
              type="text"
              value={form.accountNumber}
              onChange={(e) => setForm({ ...form, accountNumber: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">Tên chủ tài khoản</label>
            <input
              type="text"
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
              className="input"
              required
            />
          </div>

          {bankAccount?.verificationNotes && (
            <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Ghi chú xác minh:</span>{' '}
              {bankAccount.verificationNotes}
            </div>
          )}

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={isSaving} className="btn btn-primary">
              <Save className="w-5 h-5" />
              {isSaving ? 'Đang lưu...' : bankAccount ? 'Cập nhật tài khoản' : 'Lưu tài khoản'}
            </button>
            {bankAccount && (
              <button type="button" onClick={handleDelete} className="btn btn-danger">
                <Trash2 className="w-5 h-5" />
                Xóa
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
