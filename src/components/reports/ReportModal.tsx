import { useState } from 'react';
import { Flag } from 'lucide-react';
import { Modal } from '../ui';
import { createReport } from '../../api/reportApi';
import type { CreateReportRequest, ReportType } from '../../types/report';
import { getApiErrorMessage } from '../../utils/apiErrors';
import { toast } from '../ui/Toast';

export interface ReportModalPreset {
  type: ReportType;
  targetId?: number;
  targetKeycloakId?: string;
  title?: string;
  descriptionHint?: string;
}

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  preset: ReportModalPreset;
  onSuccess?: (reportId: number) => void;
}

const REASON_OPTIONS = [
  'Hành vi không phù hợp',
  'Gian lận / lừa đảo',
  'Sản phẩm không đúng mô tả',
  'Không giao hàng',
  'Quấy rối qua chat',
  'Khác',
];

export function ReportModal({ isOpen, onClose, preset, onSuccess }: ReportModalProps) {
  const [reason, setReason] = useState(REASON_OPTIONS[0]);
  const [customReason, setCustomReason] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const effectiveReason = reason === 'Khác' ? customReason.trim() : reason;

  const handleSubmit = async () => {
    if (!effectiveReason) {
      setError('Vui lòng nhập lý do báo cáo');
      return;
    }
    if (!description.trim()) {
      setError('Vui lòng mô tả chi tiết');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const payload: CreateReportRequest = {
        type: preset.type,
        targetId: preset.targetId ?? null,
        targetKeycloakId: preset.targetKeycloakId ?? null,
        reason: effectiveReason,
        description: description.trim(),
      };
      const report = await createReport(payload);
      toast.success('Đã gửi báo cáo. Admin sẽ xem xét sớm nhất.');
      onSuccess?.(report.id);
      onClose();
      setDescription('');
      setCustomReason('');
      setReason(REASON_OPTIONS[0]);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể gửi báo cáo'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={preset.title ?? 'Gửi báo cáo'}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="btn btn-ghost" disabled={isSubmitting}>
            Hủy
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-lg bg-warning-50 dark:bg-warning-950 text-warning-700 dark:text-warning-400 text-sm">
          <Flag className="w-5 h-5 shrink-0 mt-0.5" />
          <p>
            Báo cáo sẽ được chuyển đến admin. Một phòng chat hỗ trợ sẽ được tạo để theo dõi tiến độ.
          </p>
        </div>

        {error && (
          <p className="text-sm text-error-600 dark:text-error-400">{error}</p>
        )}

        <div>
          <label className="label">Lý do</label>
          <select
            className="input"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          >
            {REASON_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {reason === 'Khác' && (
          <div>
            <label className="label">Lý do cụ thể</label>
            <input
              className="input"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Nhập lý do..."
            />
          </div>
        )}

        <div>
          <label className="label">Mô tả chi tiết</label>
          <textarea
            className="input min-h-[120px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={preset.descriptionHint ?? 'Mô tả sự việc cần báo cáo...'}
          />
        </div>
      </div>
    </Modal>
  );
}
