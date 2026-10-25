import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import {
  getProductById,
  updateProduct,
  setMainProductImage,
  setGarmentProductImage,
  clearGarmentProductImage,
  deleteProductImage,
} from '../../api/productApi';
import { useCategories } from '../../hooks/useCategories';
import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { LoadingSkeleton } from '../../components/ui';
import type { ProductDetail } from '../../types/product';
import { resolveProductImages } from '../../types/product';
import { getApiErrorMessage } from '../../utils/apiErrors';

export function EditProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = id ? parseInt(id, 10) : NaN;
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [detail, setDetail] = useState<ProductDetail | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    stock: '',
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isImageBusy, setIsImageBusy] = useState(false);

  const loadProduct = async () => {
    if (!productId || Number.isNaN(productId)) return;
    setIsLoading(true);
    setLoadError('');
    try {
      const data = await getProductById(productId);
      setDetail(data);
      setFormData({
        name: data.name,
        description: data.description ?? '',
        categoryId: data.category?.id ? String(data.category.id) : '',
        price: String(data.price),
        stock: String(data.stock),
      });
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Không thể tải sản phẩm'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;
    setSubmitError('');

    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Vui lòng nhập tên sản phẩm';
    if (!formData.categoryId) errs.categoryId = 'Vui lòng chọn danh mục';
    if (!formData.price || parseFloat(formData.price) <= 0) errs.price = 'Vui lòng nhập giá hợp lệ';
    if (formData.stock === '' || parseInt(formData.stock, 10) < 0) errs.stock = 'Vui lòng nhập số lượng tồn kho hợp lệ';

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSaving(true);
    try {
      // `image` replaces the cover on the backend. If a main photo already exists,
      // extra uploads must go through `images` so they stay as gallery photos.
      const hasMainImage =
        Boolean(detail.imageUrl?.trim()) ||
        Boolean(detail.images?.some((img) => img.main));
      const imageUpload = hasMainImage
        ? { images: pendingFiles.length > 0 ? pendingFiles : undefined }
        : {
            image: pendingFiles[0],
            images: pendingFiles.length > 1 ? pendingFiles.slice(1) : undefined,
          };

      const updated = await updateProduct(
        detail.id,
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          categoryId: parseInt(formData.categoryId, 10),
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
        },
        imageUpload
      );
      setDetail(updated);
      setPendingFiles([]);
      navigate('/products');
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Không thể cập nhật sản phẩm'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetMain = async (imageId: number) => {
    if (!detail) return;
    setIsImageBusy(true);
    try {
      const updated = await setMainProductImage(detail.id, imageId);
      setDetail(updated);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Không thể đặt ảnh chính'));
    } finally {
      setIsImageBusy(false);
    }
  };

  const handleSetGarment = async (imageId: number, enabled: boolean) => {
    if (!detail) return;
    setIsImageBusy(true);
    try {
      const updated = enabled
        ? await setGarmentProductImage(detail.id, imageId)
        : await clearGarmentProductImage(detail.id, imageId);
      setDetail(updated);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Không thể cập nhật ảnh thử đồ'));
    } finally {
      setIsImageBusy(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!detail) return;
    setIsImageBusy(true);
    try {
      const updated = await deleteProductImage(detail.id, imageId);
      setDetail(updated);
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Không thể xóa ảnh'));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sửa sản phẩm</h1>
          <p className="text-gray-500 dark:text-gray-400">Cập nhật thông tin sản phẩm</p>
        </div>
      </div>

      {submitError && (
        <div className="rounded-lg bg-error-50 text-error-700 px-4 py-3 text-sm">{submitError}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Thông tin cơ bản</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Tên sản phẩm *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className={`input ${errors.name ? 'border-error-500' : ''}`}
                  />
                </div>
                <div>
                  <label className="label">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="input h-32 resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-1">Hình ảnh sản phẩm</h3>
              <p className="text-sm text-gray-500 mb-4">
                {detail.tryOnEnabled
                  ? 'Khách có thể thử đồ với ảnh phẳng đã chọn.'
                  : 'Khách chưa thử được món này. Bật “Cho thử đồ ảo” ở danh mục và chọn một ảnh phẳng.'}
              </p>
              <ProductImageGallery
                existingImages={resolveProductImages(detail)}
                pendingFiles={pendingFiles}
                onPendingFilesChange={setPendingFiles}
                onSetMain={handleSetMain}
                onSetGarment={handleSetGarment}
                onDeleteExisting={handleDeleteImage}
                isBusy={isImageBusy}
              />
            </div>
          </div>

          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Danh mục</h3>
              <select
                value={formData.categoryId}
                onChange={(e) => updateField('categoryId', e.target.value)}
                className={`input ${errors.categoryId ? 'border-error-500' : ''}`}
                disabled={categoriesLoading}
              >
                <option value="">Chọn danh mục</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-semibold mb-4">Giá & Tồn kho</h3>
              <div className="space-y-4">
                <div>
                  <label className="label">Giá (Rp) *</label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => updateField('price', e.target.value)}
                    className="input"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="label">Tồn kho *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => updateField('stock', e.target.value)}
                    className="input"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/products')} className="btn btn-secondary">
            Hủy
          </button>
          <button type="submit" disabled={isSaving || isImageBusy} className="btn btn-primary">
            {isSaving ? 'Đang lưu...' : (
              <>
                <Save className="w-5 h-5" />
                Lưu thay đổi
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
