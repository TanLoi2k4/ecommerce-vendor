import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Star } from 'lucide-react';
import {
  getProductById,
  deleteProduct,
  setMainProductImage,
  setGarmentProductImage,
  clearGarmentProductImage,
  deleteProductImage,
} from '../../api/productApi';
import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { ProductReviewsTab } from '../../components/products/ProductReviewsTab';
import { LoadingSkeleton, Modal } from '../../components/ui';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { resolveProductImages, toProductCardModelFromDetail } from '../../types/product';
import type { ProductDetail } from '../../types/product';
import { formatCurrency } from '../../utils/helpers';
import { getApiErrorMessage } from '../../utils/apiErrors';

type ProductDetailTab = 'overview' | 'reviews';

const TABS: { id: ProductDetailTab; label: string }[] = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'reviews', label: 'Đánh giá' },
];

export function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = id ? parseInt(id, 10) : NaN;

  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isImageBusy, setIsImageBusy] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<ProductDetailTab>('overview');

  useAutoRefresh(({ silent }) => {
    if (!productId || Number.isNaN(productId)) return;

    const loadProduct = async () => {
      if (!silent) setIsLoading(true);
      setLoadError('');
      try {
        setDetail(await getProductById(productId));
      } catch (err) {
        setLoadError(getApiErrorMessage(err, 'Không thể tải sản phẩm'));
        setDetail(null);
      } finally {
        setIsLoading(false);
      }
    };

    void loadProduct();
  }, [productId]);

  const handleDelete = async () => {
    if (!detail) return;
    setIsDeleting(true);
    setActionError('');
    try {
      await deleteProduct(detail.id);
      navigate('/products');
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể xóa sản phẩm'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSetMain = async (imageId: number) => {
    if (!detail) return;
    setIsImageBusy(true);
    try {
      setDetail(await setMainProductImage(detail.id, imageId));
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể đặt ảnh chính'));
    } finally {
      setIsImageBusy(false);
    }
  };

  const handleSetGarment = async (imageId: number, enabled: boolean) => {
    if (!detail) return;
    setIsImageBusy(true);
    try {
      setDetail(
        enabled
          ? await setGarmentProductImage(detail.id, imageId)
          : await clearGarmentProductImage(detail.id, imageId)
      );
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể cập nhật ảnh thử đồ'));
    } finally {
      setIsImageBusy(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!detail) return;
    setIsImageBusy(true);
    try {
      setDetail(await deleteProductImage(detail.id, imageId));
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Không thể xóa ảnh'));
    } finally {
      setIsImageBusy(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (loadError || !detail) {
    return (
      <div className="card p-8 text-center">
        <p className="text-error-600 mb-4">{loadError || 'Không tìm thấy sản phẩm'}</p>
        <button onClick={() => navigate('/products')} className="btn btn-secondary">
          Quay lại danh sách sản phẩm
        </button>
      </div>
    );
  }

  const card = toProductCardModelFromDetail(detail);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/products')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{detail.name}</h1>
            <p className="text-gray-500 dark:text-gray-400">ID: {detail.id}</p>
          </div>
        </div>
        {!detail.deleted && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/products/${detail.id}/edit`)}
              className="btn btn-secondary"
            >
              <Edit className="w-5 h-5" />
              Sửa
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="btn btn-danger">
              <Trash2 className="w-5 h-5" />
              Xóa
            </button>
          </div>
        )}
      </div>

      {actionError && (
        <div className="rounded-lg bg-error-50 text-error-700 px-4 py-3 text-sm">{actionError}</div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' ? (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-1">Hình ảnh</h3>
            <p className="text-sm text-gray-500 mb-4">
              {detail.tryOnEnabled
                ? 'Khách có thể thử đồ với ảnh phẳng đã chọn.'
                : 'Khách chưa thử được món này. Bật “Cho thử đồ ảo” ở danh mục và chọn một ảnh phẳng.'}
            </p>
            <ProductImageGallery
              existingImages={resolveProductImages(detail)}
              onSetMain={handleSetMain}
              onSetGarment={handleSetGarment}
              onDeleteExisting={handleDeleteImage}
              isBusy={isImageBusy}
            />
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Mô tả</h3>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {detail.description || 'Chưa có mô tả.'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Giá & Tồn kho</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Giá</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary-600">
                    {formatCurrency(detail.price)}
                  </span>
                  {card.discount > 0 && (
                    <p className="text-sm text-gray-400 line-through">
                      {formatCurrency(card.originalPrice)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Tồn kho</span>
                <span
                  className={`font-semibold ${
                    detail.stock < 10 ? 'text-error-600' : 'text-gray-900 dark:text-gray-100'
                  }`}
                >
                  {detail.stock} sản phẩm
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Trạng thái</span>
                <span
                  className={`badge ${
                    detail.deleted
                      ? 'badge-secondary'
                      : detail.stock <= 0
                        ? 'badge-error'
                        : 'badge-success'
                  }`}
                >
                  {detail.deleted ? 'Đã xóa' : detail.stock <= 0 ? 'Hết hàng' : 'Đang hoạt động'}
                </span>
              </div>
              {detail.flashSale && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Khuyến mãi chớp nhanh</span>
                  <span className="badge badge-warning">Đang diễn ra</span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Danh mục</h3>
            <p className="font-medium">{detail.category?.name ?? '—'}</p>
            {detail.category?.slug && (
              <p className="text-sm text-gray-500 mt-1">{detail.category.slug}</p>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold mb-4">Đánh giá</h3>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-warning-500 fill-warning-500" />
              <span className="text-xl font-bold">{Number(detail.rating ?? 0).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      ) : (
        <ProductReviewsTab productId={detail.id} productRating={detail.rating} />
      )}

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xóa sản phẩm"
        footer={
          <>
            <button onClick={() => setShowDeleteModal(false)} className="btn btn-secondary">
              Hủy
            </button>
            <button onClick={handleDelete} disabled={isDeleting} className="btn btn-danger">
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          Xóa mềm <span className="font-medium">{detail.name}</span>? Khôi phục sau từ tab Đã xóa.
        </p>
      </Modal>
    </div>
  );
}
