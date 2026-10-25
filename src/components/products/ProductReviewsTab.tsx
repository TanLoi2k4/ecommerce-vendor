import { useEffect, useState } from 'react';
import { MessageCircle, Send, Star } from 'lucide-react';
import { replyToReview } from '../../api/productApi';
import { useProductReviews } from '../../hooks/useProductReviews';
import { EmptyState, LoadingSkeleton, Modal, Pagination } from '../ui';
import { formatRelativeTime, getInitials } from '../../utils/helpers';
import { formatCustomerLabel, type ProductReview } from '../../types/product';
import { getApiErrorMessage } from '../../utils/apiErrors';

interface ProductReviewsTabProps {
  productId: number;
  productRating?: number;
  showHeader?: boolean;
}

const STAR_FILTERS: Array<{ value: number | null; label: string }> = [
  { value: null, label: 'Tất cả' },
  { value: 5, label: '5 sao' },
  { value: 4, label: '4 sao' },
  { value: 3, label: '3 sao' },
  { value: 2, label: '2 sao' },
  { value: 1, label: '1 sao' },
];

const PAGE_SIZE = 10;

function renderStars(rating: number) {
  return Array.from({ length: 5 }).map((_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${
        i < rating ? 'text-warning-500 fill-warning-500' : 'text-gray-300'
      }`}
    />
  ));
}

export function ProductReviewsTab({
  productId,
  productRating,
  showHeader = true,
}: ProductReviewsTabProps) {
  const [page, setPage] = useState(1);
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [replyModal, setReplyModal] = useState<{
    open: boolean;
    review?: ProductReview;
  }>({ open: false });
  const [reply, setReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [actionError, setActionError] = useState('');

  const { result, isLoading, error, refresh } = useProductReviews({
    productId,
    page,
    size: PAGE_SIZE,
    rating: starFilter ?? undefined,
  });

  useEffect(() => {
    setPage(1);
    setStarFilter(null);
  }, [productId]);

  const reviews = result?.data ?? [];
  const totalPages = Math.max(1, result?.totalPages ?? 1);
  const total = result?.total ?? 0;

  const averageRating = productRating != null ? productRating : 0;

  useEffect(() => {
    if (total > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [page, total, totalPages]);

  const handleStarFilter = (value: number | null) => {
    setStarFilter(value);
    setPage(1);
  };

  const handleReply = async () => {
    if (!replyModal.review || !reply.trim()) return;

    setIsReplying(true);
    setActionError('');
    try {
      await replyToReview(replyModal.review.id, { reply: reply.trim() });
      setReplyModal({ open: false });
      setReply('');
      await refresh();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể gửi phản hồi'));
    } finally {
      setIsReplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Đánh giá của khách hàng
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Phản hồi về sản phẩm này — trả lời để phản hồi công khai
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2">
              <Star className="w-5 h-5 text-warning-500 fill-warning-500" />
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {Number(averageRating).toFixed(1)}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              {starFilter == null
                ? `${total} đánh giá`
                : `${total} đánh giá ${starFilter} sao`}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {STAR_FILTERS.map((filter) => {
          const active = starFilter === filter.value;
          return (
            <button
              key={filter.label}
              type="button"
              onClick={() => handleStarFilter(filter.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                active
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {filter.value != null && (
                <Star
                  className={`w-3.5 h-3.5 ${
                    active ? 'text-white fill-white' : 'text-warning-500 fill-warning-500'
                  }`}
                />
              )}
              {filter.label}
            </button>
          );
        })}
      </div>

      {(error || actionError) && (
        <div className="rounded-lg bg-error-50 text-error-700 px-4 py-3 text-sm">
          {error || actionError}
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton variant="list" />
      ) : reviews.length === 0 ? (
        <EmptyState
          title={starFilter == null ? 'Chưa có đánh giá' : `Không có đánh giá ${starFilter} sao`}
          description={
            starFilter == null
              ? 'Đánh giá của khách hàng về sản phẩm này sẽ hiển thị ở đây'
              : 'Thử chọn mức sao khác để xem đánh giá'
          }
          variant={starFilter == null ? 'no-data' : 'search'}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="card p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-medium shrink-0">
                  {getInitials(formatCustomerLabel(review.customerId, review.customerName))}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {formatCustomerLabel(review.customerId, review.customerName)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {review.createdAt ? formatRelativeTime(review.createdAt) : '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">{renderStars(review.rating)}</div>
                  </div>

                  <p className="mt-3 text-gray-600 dark:text-gray-400">{review.comment}</p>

                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mt-3 flex-wrap">
                      {review.images.map((img, i) => (
                        <img
                          key={i}
                          src={img}
                          alt={`Đánh giá ${i + 1}`}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {review.vendorReply ? (
                    <div className="mt-4 ml-4 p-4 bg-primary-50 dark:bg-primary-950 border-l-2 border-primary-500 rounded-r-lg">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Bạn đã phản hồi</p>
                      <p className="text-gray-700 dark:text-gray-300">{review.vendorReply}</p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setReplyModal({ open: true, review })}
                      className="btn btn-ghost btn-sm mt-4"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Phản hồi
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          total={total}
          limit={PAGE_SIZE}
          onPageChange={setPage}
        />
      )}

      <Modal
        isOpen={replyModal.open}
        onClose={() => setReplyModal({ open: false })}
        title="Phản hồi đánh giá"
        footer={
          <>
            <button
              type="button"
              onClick={() => setReplyModal({ open: false })}
              className="btn btn-secondary"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleReply}
              disabled={!reply.trim() || isReplying}
              className="btn btn-primary"
            >
              <Send className="w-4 h-4" />
              {isReplying ? 'Đang gửi...' : 'Gửi phản hồi'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Đánh giá gốc:</p>
            <p className="text-gray-700 dark:text-gray-300">{replyModal.review?.comment}</p>
          </div>
          <div>
            <label className="label">Phản hồi của bạn</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              className="input h-32 resize-none"
              placeholder="Viết phản hồi của bạn..."
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
