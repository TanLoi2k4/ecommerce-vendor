import { Star, Trash2, Upload, X } from 'lucide-react';
import type { ProductImage } from '../../types/product';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';

interface ProductImageGalleryProps {
  /** Existing images from API (edit/detail mode) */
  existingImages?: ProductImage[];
  /** Pending files to upload on save (add/edit mode) */
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
  /** Set main image (existing only) */
  onSetMain?: (imageId: number) => void | Promise<void>;
  /** Mark or clear the flat garment photo used for virtual try-on */
  onSetGarment?: (imageId: number, enabled: boolean) => void | Promise<void>;
  /** Delete existing image */
  onDeleteExisting?: (imageId: number) => void | Promise<void>;
  readOnly?: boolean;
  maxFiles?: number;
  isBusy?: boolean;
}

export function ProductImageGallery({
  existingImages = [],
  pendingFiles = [],
  onPendingFilesChange,
  onSetMain,
  onSetGarment,
  onDeleteExisting,
  readOnly = false,
  maxFiles = 5,
  isBusy = false,
}: ProductImageGalleryProps) {
  const totalCount = existingImages.length + pendingFiles.length;
  const canAddMore = !readOnly && totalCount < maxFiles && onPendingFilesChange;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onPendingFilesChange || !e.target.files?.length) return;
    const incoming = Array.from(e.target.files);
    const room = maxFiles - existingImages.length - pendingFiles.length;
    onPendingFilesChange([...pendingFiles, ...incoming.slice(0, room)]);
    e.target.value = '';
  };

  const removePending = (index: number) => {
    if (!onPendingFilesChange) return;
    onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {existingImages.map((img, index) => {
          const imageId = img.id != null && img.id > 0 ? img.id : null;
          return (
          <div key={imageId ?? `cover-${img.imageUrl}-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={img.imageUrl || PRODUCT_PLACEHOLDER}
              alt=""
              className="w-full h-full object-cover"
            />
            {img.main && (
              <span className="absolute top-2 left-2 badge badge-primary text-xs flex items-center gap-1">
                <Star className="w-3 h-3" />
                Chính
              </span>
            )}
            {img.garmentFlat && (
              <span className="absolute top-2 right-2 badge badge-success text-xs">
                Ảnh thử đồ
              </span>
            )}
            {!readOnly && imageId != null && (
              <div className="absolute bottom-0 inset-x-0 flex flex-col gap-1 p-2 bg-gradient-to-t from-black/70 to-transparent">
                <div className="flex gap-1">
                  {!img.main && onSetMain && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onSetMain(imageId)}
                      className="flex-1 text-xs py-1 rounded bg-white/90 text-gray-800 hover:bg-white"
                    >
                      Đặt làm ảnh chính
                    </button>
                  )}
                  {onDeleteExisting && (
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => onDeleteExisting(imageId)}
                      className="p-1 rounded bg-error-600 text-white hover:bg-error-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                {onSetGarment && (
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => onSetGarment(imageId, !img.garmentFlat)}
                    className="text-xs py-1 rounded bg-white/90 text-gray-800 hover:bg-white"
                  >
                    {img.garmentFlat ? 'Bỏ ảnh thử đồ' : 'Dùng làm ảnh thử đồ'}
                  </button>
                )}
              </div>
            )}
          </div>
          );
        })}

        {pendingFiles.map((file, index) => (
          <div key={`pending-${file.name}-${index}`} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2 left-2 badge badge-warning text-xs">Mới</span>
            {!readOnly && onPendingFilesChange && (
              <button
                type="button"
                onClick={() => removePending(index)}
                className="absolute top-2 right-2 p-1 bg-white dark:bg-gray-800 rounded-full shadow"
              >
                <X className="w-4 h-4 text-error-600" />
              </button>
            )}
          </div>
        ))}

        {canAddMore && (
          <label className="relative aspect-square border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-primary-400 hover:text-primary-500 transition-colors">
            <Upload className="w-6 h-6" />
            <span className="text-xs mt-1">Thêm ảnh</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={handleFileSelect}
            />
          </label>
        )}
      </div>
      {!readOnly && (
        <p className="text-xs text-gray-500">
          JPEG, PNG hoặc WebP — tối đa 2MB mỗi ảnh. Tối đa {maxFiles} ảnh.
        </p>
      )}
    </div>
  );
}
