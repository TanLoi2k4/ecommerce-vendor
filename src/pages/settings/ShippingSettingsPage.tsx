import { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, Pencil } from 'lucide-react';
import {
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
} from '../../api/addressApi';
import type { VendorShippingAddress, VendorShippingAddressRequest } from '../../types/vendor';
import { getAuthErrorMessage } from '../../store/authStore';
import { Modal, EmptyState, LoadingSkeleton } from '../../components/ui';

const EMPTY_FORM: VendorShippingAddressRequest = {
  label: '',
  street: '',
  city: '',
  country: '',
};

function AddressFormFields({
  form,
  onChange,
}: {
  form: VendorShippingAddressRequest;
  onChange: (form: VendorShippingAddressRequest) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label className="label">Nhãn</label>
        <input
          type="text"
          value={form.label}
          onChange={(e) => onChange({ ...form, label: e.target.value })}
          className="input"
          placeholder="vd: Kho hàng, Điểm lấy hàng"
          required
        />
      </div>
      <div>
        <label className="label">Đường</label>
        <textarea
          value={form.street}
          onChange={(e) => onChange({ ...form, street: e.target.value })}
          className="input h-20 resize-none"
          required
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Thành phố</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => onChange({ ...form, city: e.target.value })}
            className="input"
            required
          />
        </div>
        <div>
          <label className="label">Quốc gia</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => onChange({ ...form, country: e.target.value })}
            className="input"
            required
          />
        </div>
      </div>
    </div>
  );
}

export function ShippingSettingsPage({ embedded = false }: { embedded?: boolean }) {
  const [addresses, setAddresses] = useState<VendorShippingAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<VendorShippingAddress | null>(null);
  const [form, setForm] = useState<VendorShippingAddressRequest>(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);

  const loadAddresses = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Tải địa chỉ thất bại'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const openCreateModal = () => {
    setEditingAddress(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEditModal = (address: VendorShippingAddress) => {
    setEditingAddress(address);
    setForm({
      label: address.label,
      street: address.street,
      city: address.city,
      country: address.country,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    try {
      if (editingAddress) {
        await updateAddress(editingAddress.id, form);
      } else {
        await createAddress(form);
      }
      setModalOpen(false);
      await loadAddresses();
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Lưu địa chỉ thất bại'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId: number) => {
    if (!window.confirm('Xóa địa chỉ này?')) return;
    setError('');
    try {
      await deleteAddress(addressId);
      await loadAddresses();
    } catch (err) {
      setError(getAuthErrorMessage(err, 'Xóa địa chỉ thất bại'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          {embedded ? (
            <>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Địa chỉ giao hàng
              </h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Quản lý địa chỉ kho và điểm lấy hàng cho cửa hàng
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Địa chỉ giao hàng
              </h1>
              <p className="mt-1 text-gray-500 dark:text-gray-400">
                Quản lý địa chỉ kho và điểm lấy hàng cho cửa hàng
              </p>
            </>
          )}
        </div>
        <button onClick={openCreateModal} className="btn btn-primary">
          <Plus className="w-5 h-5" />
          Thêm địa chỉ
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error-50 dark:bg-error-950 text-error-700 dark:text-error-400 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <LoadingSkeleton variant="list" />
      ) : addresses.length === 0 ? (
        <div className="card">
          <EmptyState
            title="Chưa có địa chỉ nào"
            description="Thêm địa chỉ kho hoặc điểm lấy hàng cho cửa hàng."
            action={
              <button onClick={openCreateModal} className="btn btn-primary">
                <Plus className="w-5 h-5" />
                Thêm địa chỉ
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <div key={address.id} className="card p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary-500" />
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {address.label}
                  </h3>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(address)}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(address.id)}
                    className="p-2 rounded-lg text-error-600 hover:bg-error-50 dark:hover:bg-error-950"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {address.street}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {address.city}, {address.country}
              </p>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAddress ? 'Sửa địa chỉ' : 'Thêm địa chỉ'}
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="btn btn-secondary">
              Hủy
            </button>
            <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
              {isSaving ? 'Đang lưu...' : 'Lưu địa chỉ'}
            </button>
          </>
        }
      >
        <AddressFormFields form={form} onChange={setForm} />
      </Modal>
    </div>
  );
}
