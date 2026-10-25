import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { toast } from '../ui/Toast';
import * as productApi from '../../api/productApi';
import type { ProductCardModel } from '../../types/product';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (product: ProductCardModel) => Promise<void>;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductPickerModal({ isOpen, onClose, onSelect }: ProductPickerModalProps) {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [products, setProducts] = useState<ProductCardModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingId, setSendingId] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!isOpen) return;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const result = await productApi.getVendorProducts({
          query: debouncedSearch || undefined,
          page: 1,
          size: 20,
        });
        setProducts(result.data);
      } catch {
        toast.error('Không tải được danh sách sản phẩm');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchProducts();
  }, [isOpen, debouncedSearch]);

  useEffect(() => {
    if (!isOpen) {
      setSearch('');
      setDebouncedSearch('');
      setProducts([]);
      setSendingId(null);
    }
  }, [isOpen]);

  const handleSelect = async (product: ProductCardModel) => {
    setSendingId(product.id);
    try {
      await onSelect(product);
      onClose();
    } catch {
      toast.error('Gửi sản phẩm thất bại. Vui lòng thử lại.');
    } finally {
      setSendingId(null);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gửi sản phẩm" size="lg">
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm sản phẩm..."
            className="input pl-10 w-full"
          />
        </div>

        <div className="max-h-80 overflow-y-auto space-y-2">
          {loading ? (
            <p className="text-sm text-gray-500 text-center py-8">Đang tải...</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {debouncedSearch ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
            </p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <img
                  src={product.thumbnail || product.images[0] || ''}
                  alt={product.name}
                  className="w-14 h-14 rounded object-cover shrink-0 bg-gray-100"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-primary-600">{formatPrice(product.price)}</p>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  disabled={sendingId !== null}
                  onClick={() => void handleSelect(product)}
                >
                  {sendingId === product.id ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </Modal>
  );
}
