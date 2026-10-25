import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { createProduct } from '../../api/productApi';
import { useCategories } from '../../hooks/useCategories';
import { ProductImageGallery } from '../../components/products/ProductImageGallery';
import { getApiErrorMessage } from '../../utils/apiErrors';

export function AddProductPage() {
  const navigate = useNavigate();
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    price: '',
    stock: '',
  });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await createProduct(
        {
          name: formData.name.trim(),
          description: formData.description.trim(),
          categoryId: parseInt(formData.categoryId, 10),
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock, 10),
        },
        {
          image: pendingFiles[0],
          images: pendingFiles.length > 1 ? pendingFiles.slice(1) : undefined,
        }
      );
      navigate('/products');
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Không thể tạo sản phẩm'));
    } finally {
      setIsSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Thêm sản phẩm mới</h1>
          <p className="text-gray-500 dark:text-gray-400">Tạo sản phẩm mới cho cửa hàng</p>
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
                  {errors.name && <p className="text-sm text-error-600 mt-1">{errors.name}</p>}
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
              <h3 className="text-lg font-semibold mb-4">Hình ảnh sản phẩm</h3>
              <ProductImageGallery
                pendingFiles={pendingFiles}
                onPendingFilesChange={setPendingFiles}
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
              {errors.categoryId && (
                <p className="text-sm text-error-600 mt-1">{errors.categoryId}</p>
              )}
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
                    className={`input ${errors.price ? 'border-error-500' : ''}`}
                    min="0"
                    step="0.01"
                  />
                  {errors.price && <p className="text-sm text-error-600 mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="label">Tồn kho *</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => updateField('stock', e.target.value)}
                    className={`input ${errors.stock ? 'border-error-500' : ''}`}
                    min="0"
                  />
                  {errors.stock && <p className="text-sm text-error-600 mt-1">{errors.stock}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={() => navigate('/products')} className="btn btn-secondary">
            Hủy
          </button>
          <button type="submit" disabled={isSaving} className="btn btn-primary">
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Đang lưu...
              </span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Lưu sản phẩm
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
