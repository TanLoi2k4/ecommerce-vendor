import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Package,
  CheckCircle,
  XCircle,
  Truck,
  Loader2,
  Info,
  Flag,
  MessageSquare,
  Printer,
  StickyNote,
} from 'lucide-react';
import { useVendorSubOrderDetail } from '../../hooks/useVendorOrders';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useVendorSubOrderActions } from '../../hooks/useVendorSubOrderActions';
import { useVendorShipmentBySubOrder } from '../../hooks/useVendorShipmentBySubOrder';
import { getAddresses } from '../../api/addressApi';
import { getActiveCarriers } from '../../api/shipmentApi';
import { SubOrderStatusTimeline } from '../../components/orders/SubOrderStatusTimeline';
import { ShipmentCard } from '../../components/orders/ShipmentCard';
import { ReturnRequestPanel } from '../../components/orders/ReturnRequestPanel';
import { LoadingSkeleton, EmptyState, Modal } from '../../components/ui';
import { ReportModal } from '../../components/reports/ReportModal';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { enrichSubOrderDetail } from '../../utils/orderMappers';
import { formatVendorPickupAddress } from '../../utils/addressHelpers';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';
import { useAuthStore } from '../../store/authStore';
import * as chatApi from '../../api/chatApi';
import { printPackingSlip } from '../../utils/printPackingSlip';
import { toast } from '../../components/ui';
import type { VendorShippingAddress } from '../../types/vendor';
import type { ActiveCarrier } from '../../types/shipment';
import {
  SUB_ORDER_STATUS_LABELS,
  ORDER_ITEM_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  SUB_ORDER_PAYOUT_STATUS_LABELS,
  SHIPPING_SERVICE_LEVELS,
  subOrderStatusColor,
  subOrderPayoutStatusColor,
  paymentStatusColor,
  getPaymentGatingMessage,
  isRefundedPaymentStatus,
  canUpdateItems,
  canProcessSubOrder,
  canCancelSubOrder,
  canRequestShipping,
  isSubOrderTerminal,
  type SubOrderDetail,
  type SubOrderDetailView,
  type ReturnRequestDto,
} from '../../types/order';

export function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vendor = useAuthStore((s) => s.vendor);
  const shop = useAuthStore((s) => s.shop);
  const subOrderId = id ? Number(id) : null;

  const { detail, isLoading, error, refresh, applyDetail } =
    useVendorSubOrderDetail(subOrderId);
  const {
    isSubmitting,
    actingItemId,
    confirmItem,
    cancelItem,
    processSubOrder,
    cancelSubOrder,
    requestShipping,
  } = useVendorSubOrderActions(subOrderId, applyDetail);

  const {
    shipment,
    loading: shipmentLoading,
    error: shipmentError,
    notFound: shipmentNotFound,
    refresh: refreshShipment,
    startAggressivePoll,
  } = useVendorShipmentBySubOrder(subOrderId, detail?.status);

  useAutoRefresh(
    () => refresh({ silent: true }),
    [detail?.status, detail?.paymentStatus, detail?.paymentMethod],
    {
      enabled: Boolean(
        detail &&
          !isSubOrderTerminal(detail.status) &&
          (detail.status === 'SHIPPING_REQUESTED' ||
            (detail.paymentMethod != null &&
              detail.paymentMethod !== 'COD' &&
              detail.paymentStatus === 'PENDING'))
      ),
      intervalMs: 8000,
    }
  );

  const [view, setView] = useState<SubOrderDetailView | null>(null);
  const [enriching, setEnriching] = useState(false);
  const viewRef = useRef<SubOrderDetailView | null>(null);
  viewRef.current = view;
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [shippingModalOpen, setShippingModalOpen] = useState(false);
  const [vendorAddresses, setVendorAddresses] = useState<VendorShippingAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | ''>('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [carrier, setCarrier] = useState('');
  const [activeCarriers, setActiveCarriers] = useState<ActiveCarrier[]>([]);
  const [carriersLoading, setCarriersLoading] = useState(false);
  const [carriersError, setCarriersError] = useState('');
  const [serviceLevel, setServiceLevel] = useState(SHIPPING_SERVICE_LEVELS[0].value);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [itemAction, setItemAction] = useState<{
    id: number;
    type: 'CONFIRMED' | 'CANCELLED';
    name: string;
  } | null>(null);
  const [openingChat, setOpeningChat] = useState(false);

  useEffect(() => {
    if (!detail) {
      setView(null);
      return;
    }
    let cancelled = false;
    const previous = viewRef.current;
    const hasCurrentView = previous != null && previous.id === detail.id;

    if (hasCurrentView) {
      setView(mergeDetailIntoView(detail, previous));
      setEnriching(false);
    } else {
      setEnriching(true);
    }

    enrichSubOrderDetail(detail)
      .then((enriched) => {
        if (!cancelled) setView(enriched);
      })
      .catch(() => {
        if (!cancelled) {
          setView(
            hasCurrentView && previous
              ? mergeDetailIntoView(detail, previous)
              : fallbackDetailView(detail)
          );
        }
      })
      .finally(() => {
        if (!cancelled) setEnriching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detail]);

  useEffect(() => {
    if (!shippingModalOpen) return;
    let cancelled = false;
    getAddresses()
      .then((addresses) => {
        if (cancelled) return;
        setVendorAddresses(addresses);
        if (addresses.length > 0) {
          setSelectedAddressId(addresses[0].id);
          setPickupAddress(formatVendorPickupAddress(addresses[0]));
        }
      })
      .catch(() => {
        if (!cancelled) setVendorAddresses([]);
      });

    setCarriersLoading(true);
    setCarriersError('');
    getActiveCarriers()
      .then((list) => {
        if (cancelled) return;
        setActiveCarriers(list);
        setCarrier((current) => {
          if (list.some((item) => item.carrierCode === current)) return current;
          return list[0]?.carrierCode ?? '';
        });
      })
      .catch(() => {
        if (cancelled) return;
        setActiveCarriers([]);
        setCarrier('');
        setCarriersError('Không tải được đơn vị vận chuyển. Admin cần thêm đơn vị trước.');
      })
      .finally(() => {
        if (!cancelled) setCarriersLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [shippingModalOpen]);

  const handleAddressSelect = (addressId: number) => {
    setSelectedAddressId(addressId);
    const addr = vendorAddresses.find((a) => a.id === addressId);
    if (addr) setPickupAddress(formatVendorPickupAddress(addr));
  };

  const handleRequestShipping = async () => {
    if (!pickupAddress.trim() || !carrier) return;
    try {
      await requestShipping({
        pickupAddress: pickupAddress.trim(),
        carrierPreference: carrier,
        serviceLevel,
      });
      setShippingModalOpen(false);
      startAggressivePoll();
      void refresh({ silent: true });
      void refreshShipment({ silent: true });
    } catch {
      /* toast handled in hook */
    }
  };

  const handleCancelSubOrder = async () => {
    try {
      await cancelSubOrder();
      setCancelModalOpen(false);
    } catch {
      /* toast handled in hook */
    }
  };

  const handleItemAction = async () => {
    if (!itemAction) return;
    try {
      if (itemAction.type === 'CONFIRMED') {
        await confirmItem(itemAction.id);
      } else {
        await cancelItem(itemAction.id);
      }
      setItemAction(null);
    } catch {
      /* toast handled in hook */
    }
  };

  const handleOpenChat = async () => {
    const buyerId = view?.customerKeycloakId;
    const vendorId = vendor?.keycloakId;
    if (!buyerId || !vendorId) {
      toast.error('Thiếu thông tin để mở chat với khách hàng');
      return;
    }
    setOpeningChat(true);
    try {
      const room = await chatApi.createRoom({ vendorId, buyerId });
      navigate(`/chat?room=${encodeURIComponent(room.roomCode)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không mở được chat');
    } finally {
      setOpeningChat(false);
    }
  };

  if ((isLoading || enriching) && !view) {
    return <LoadingSkeleton variant="detail" />;
  }

  if (error) {
    return (
      <div className="space-y-4">
        <button
          type="button"
          onClick={() => navigate('/orders/list')}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <EmptyState
          title="Không thể tải đơn hàng"
          description={error}
          variant="error"
          action={
            <button type="button" onClick={() => refresh()} className="btn btn-primary">
              Thử lại
            </button>
          }
        />
      </div>
    );
  }

  if (!view) {
    return (
      <EmptyState
        title="Không tìm thấy đơn hàng"
        description="Đơn phụ này không tồn tại hoặc bạn không có quyền truy cập."
        variant="no-data"
        action={
          <button type="button" onClick={() => navigate('/orders/list')} className="btn btn-primary">
            Quay lại danh sách đơn hàng
          </button>
        }
      />
    );
  }

  const displayCode = view.orderCode ?? `Đơn phụ #${view.id}`;
  const itemsUpdatable = canUpdateItems(view.status);
  const showProcess = canProcessSubOrder(view.status, view.items);
  const showCancel = canCancelSubOrder(view.status);
  const showShipping = canRequestShipping(
    view.status,
    view.items,
    view.paymentStatus,
    view.paymentMethod
  );
  const terminal = isSubOrderTerminal(view.status);
  const paymentGatingMessage = getPaymentGatingMessage(view.paymentMethod, view.paymentStatus);
  const showRefundNotice = isRefundedPaymentStatus(view.paymentStatus);
  const latestReturn = [...(view.returns ?? [])].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  )[0];
  const returningItemIds = new Set((latestReturn?.items ?? []).map((item) => item.orderItemId));
  const returningProductIds = new Set((latestReturn?.items ?? []).map((item) => item.productId));

  const patchReturn = (next: ReturnRequestDto) => {
    const merge = (returns?: ReturnRequestDto[]) => [
      next,
      ...(returns ?? []).filter((item) => item.id !== next.id),
    ];
    setView((current) => (current ? { ...current, returns: merge(current.returns) } : current));
    if (detail) {
      applyDetail({ ...detail, returns: merge(detail.returns) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/orders/list')}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {displayCode}
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Đơn phụ #{view.id}
              {view.createdAt ? ` · ${formatDateTime(view.createdAt)}` : ''}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`badge badge-${subOrderStatusColor(view.status)}`}>
            {SUB_ORDER_STATUS_LABELS[view.status]}
          </span>
          <button
            type="button"
            onClick={() => printPackingSlip(view, shop?.name)}
            className="btn btn-ghost btn-sm"
          >
            <Printer className="w-4 h-4" />
            In phiếu
          </button>
          <button
            type="button"
            onClick={() => setReportModalOpen(true)}
            className="btn btn-ghost btn-sm text-warning-600"
          >
            <Flag className="w-4 h-4" />
            Báo cáo
          </button>
          {!terminal && showProcess && (
            <button
              type="button"
              onClick={() => processSubOrder()}
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Bắt đầu xử lý
            </button>
          )}
          {!terminal && showShipping && (
            <button
              type="button"
              onClick={() => setShippingModalOpen(true)}
              disabled={isSubmitting}
              className="btn btn-primary btn-sm"
            >
              <Truck className="w-4 h-4" />
              Yêu cầu vận chuyển
            </button>
          )}
          {!terminal && showCancel && (
            <button
              type="button"
              onClick={() => setCancelModalOpen(true)}
              disabled={isSubmitting}
              className="btn btn-danger btn-sm"
            >
              <XCircle className="w-4 h-4" />
              Hủy đơn hàng
            </button>
          )}
        </div>
      </div>

      <SubOrderStatusTimeline status={view.status} shipmentStatus={shipment?.status} />

      <ShipmentCard
        subOrderStatus={view.status}
        shipment={shipment}
        loading={shipmentLoading}
        notFound={shipmentNotFound}
        error={shipmentError}
        onRetry={() => void refreshShipment()}
      />

      {!terminal && view.status === 'CREATED' && !allItemsHandledMessage(view) && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 dark:bg-warning-900/20 px-4 py-3 text-sm text-warning-800 dark:text-warning-200">
          Xác nhận hoặc đánh dấu hết hàng cho từng sản phẩm trước khi bắt đầu xử lý.
        </div>
      )}

      {!terminal && paymentGatingMessage && (
        <div className="rounded-lg border border-primary-200 bg-primary-50 dark:bg-primary-900/20 px-4 py-3 text-sm text-primary-800 dark:text-primary-200 flex items-start gap-3">
          <Info className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Cần thanh toán trước khi giao hàng</p>
            <p className="mt-1">{paymentGatingMessage}</p>
          </div>
        </div>
      )}

      {latestReturn && (
        <ReturnRequestPanel
          request={latestReturn}
          orderItems={view.items}
          onUpdated={(next) => {
            patchReturn(next);
            if (next.status === 'REFUNDED') {
              void refresh();
            }
          }}
        />
      )}

      {showRefundNotice && (
        <div className="rounded-lg border border-warning-200 bg-warning-50 dark:bg-warning-900/20 px-4 py-3 text-sm text-warning-800 dark:text-warning-200">
          Khách hàng đã được hoàn tiền
          {view.paymentStatus === 'PARTIALLY_REFUNDED' ? ' một phần' : ''}. Dịch vụ đơn hàng đã đồng bộ
          trạng thái này sau khi hủy hoặc xử lý trả hàng.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Sản phẩm trong đơn
            </h3>
            <div className="space-y-4">
              {view.items.map((item) => {
                const itemBusy = actingItemId === item.id && isSubmitting;
                const isReturning =
                  returningItemIds.has(item.id) || returningProductIds.has(item.productId);
                return (
                  <div
                    key={item.id}
                    className={`flex flex-col sm:flex-row sm:items-center gap-4 pb-4 border-b last:border-0 last:pb-0 ${
                      isReturning
                        ? 'border-warning-200 bg-warning-50/50 dark:bg-warning-900/10 -mx-2 px-2 pt-3 rounded-lg'
                        : 'border-gray-100 dark:border-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                          {item.productName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatCurrency(Number(item.unitPrice))} × {item.quantity}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className={`badge badge-${subOrderStatusColor(item.status)}`}>
                            {ORDER_ITEM_STATUS_LABELS[item.status]}
                          </span>
                          {isReturning && item.status !== 'RETURNED' && (
                            <span className="badge badge-warning">Đang yêu cầu trả</span>
                          )}
                        </div>
                      </div>
                      <p className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                        {formatCurrency(Number(item.lineTotal))}
                      </p>
                    </div>
                    {itemsUpdatable && item.status === 'PENDING' && (
                      <div className="flex gap-2 sm:shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setItemAction({
                              id: item.id,
                              type: 'CONFIRMED',
                              name: item.productName,
                            })
                          }
                          disabled={isSubmitting}
                          className="btn btn-primary btn-sm"
                        >
                          {itemBusy ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Xác nhận
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setItemAction({
                              id: item.id,
                              type: 'CANCELLED',
                              name: item.productName,
                            })
                          }
                          disabled={isSubmitting}
                          className="btn btn-secondary btn-sm"
                        >
                          Hết hàng
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tóm tắt thanh toán
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Tạm tính</span>
                <span>{formatCurrency(Number(view.subtotal))}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Phí vận chuyển</span>
                <span>Miễn phí</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-gray-100 pt-3 border-t border-gray-200 dark:border-gray-700">
                <span>Tổng cộng</span>
                <span className="text-primary-600">
                  {formatCurrency(Number(view.finalAmount))}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Trạng thái
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Đơn phụ</span>
                <span className={`badge badge-${subOrderStatusColor(view.status)}`}>
                  {SUB_ORDER_STATUS_LABELS[view.status]}
                </span>
              </div>
              {view.paymentStatus && (
                <div className="flex items-center justify-between gap-3">
                  <span
                    className="text-gray-500 inline-flex items-center gap-1"
                    title={
                      view.paymentMethod !== 'COD'
                        ? 'Đơn VNPay/Ví phải thanh toán trước khi có thể yêu cầu vận chuyển.'
                        : undefined
                    }
                  >
                    Thanh toán
                    {view.paymentMethod !== 'COD' && (
                      <Info className="w-3.5 h-3.5 text-gray-400" />
                    )}
                  </span>
                  <span className={`badge badge-${paymentStatusColor(view.paymentStatus)}`}>
                    {PAYMENT_STATUS_LABELS[view.paymentStatus]}
                  </span>
                </div>
              )}
              {view.paymentMethod && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Phương thức</span>
                  <span className="text-gray-900 dark:text-gray-100">
                    {PAYMENT_METHOD_LABELS[view.paymentMethod]}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Trạng thái chi trả</span>
                <span className={`badge badge-${subOrderPayoutStatusColor(view.payoutStatus)}`}>
                  {SUB_ORDER_PAYOUT_STATUS_LABELS[view.payoutStatus]}
                </span>
              </div>
              {view.payoutRef && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Mã chi trả</span>
                  <span className="text-sm font-mono text-gray-900 dark:text-gray-100">
                    {view.payoutRef}
                  </span>
                </div>
              )}
              {view.payoutAt && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-gray-500">Ngày chi trả</span>
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDateTime(view.payoutAt)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Khách hàng
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <span className="text-gray-900 dark:text-gray-100">
                  {view.customerName ?? '—'}
                </span>
              </div>
              {view.customerPhone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">{view.customerPhone}</span>
                </div>
              )}
              <div className="flex flex-wrap gap-2 pt-2">
                {view.customerKeycloakId && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/customers/${encodeURIComponent(view.customerKeycloakId!)}`)
                    }
                    className="btn btn-secondary btn-sm"
                  >
                    <User className="w-4 h-4" />
                    Xem khách
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void handleOpenChat()}
                  disabled={openingChat || !view.customerKeycloakId}
                  className="btn btn-primary btn-sm"
                >
                  {openingChat ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Nhắn tin
                </button>
              </div>
            </div>
          </div>

          {view.note && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 flex items-center gap-2">
                <StickyNote className="w-5 h-5" />
                Ghi chú khách hàng
              </h3>
              <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">{view.note}</p>
            </div>
          )}

          {view.shippingAddress && (
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Địa chỉ giao hàng
              </h3>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                  {view.shippingAddress}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={itemAction != null}
        onClose={() => setItemAction(null)}
        title={itemAction?.type === 'CONFIRMED' ? 'Xác nhận sản phẩm' : 'Đánh dấu hết hàng'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setItemAction(null)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => void handleItemAction()}
              disabled={isSubmitting}
              className={
                itemAction?.type === 'CANCELLED'
                  ? 'btn btn-primary bg-error-600 hover:bg-error-700'
                  : 'btn btn-primary'
              }
            >
              {isSubmitting
                ? 'Đang xử lý…'
                : itemAction?.type === 'CONFIRMED'
                  ? 'Xác nhận'
                  : 'Hết hàng'}
            </button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          {itemAction?.type === 'CONFIRMED'
            ? `Xác nhận còn hàng và sẽ giao “${itemAction.name}”?`
            : `Đánh dấu hết hàng cho “${itemAction?.name}”? Tồn kho đã giữ sẽ được hoàn và số tiền đơn được tính lại.`}
        </p>
      </Modal>

      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Hủy đơn phụ"
        footer={
          <>
            <button
              type="button"
              onClick={() => setCancelModalOpen(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Giữ đơn hàng
            </button>
            <button
              type="button"
              onClick={handleCancelSubOrder}
              disabled={isSubmitting}
              className="btn btn-primary bg-error-600 hover:bg-error-700"
            >
              {isSubmitting ? 'Đang hủy…' : 'Hủy đơn hàng'}
            </button>
          </>
        }
      >
        <p className="text-gray-600 dark:text-gray-400">
          Thao tác này sẽ hủy toàn bộ đơn phụ và giải phóng tồn kho đã giữ. Không thể hoàn tác.
        </p>
      </Modal>

      <Modal
        isOpen={shippingModalOpen}
        onClose={() => setShippingModalOpen(false)}
        title="Yêu cầu vận chuyển"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setShippingModalOpen(false)}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={handleRequestShipping}
              disabled={isSubmitting || !pickupAddress.trim() || !carrier || carriersLoading}
              className="btn btn-primary"
            >
              {isSubmitting ? 'Đang gửi…' : 'Gửi yêu cầu'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {vendorAddresses.length > 0 ? (
            <div>
              <label className="label">Địa chỉ lấy hàng</label>
              <select
                value={selectedAddressId}
                onChange={(e) => handleAddressSelect(Number(e.target.value))}
                className="input"
              >
                {vendorAddresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label} — {addr.street}, {addr.city}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="label">Địa chỉ lấy hàng (đầy đủ)</label>
            <textarea
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              className="input min-h-[80px]"
              placeholder="Địa chỉ kho / điểm lấy hàng"
              maxLength={500}
              required
            />
            {vendorAddresses.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Thêm địa chỉ trong Tài khoản → Địa chỉ để tự điền lần sau.
              </p>
            )}
          </div>
          <div>
            <label className="label">Đơn vị vận chuyển</label>
            {carriersLoading ? (
              <p className="text-sm text-gray-500">Đang tải đơn vị vận chuyển…</p>
            ) : activeCarriers.length === 0 ? (
              <p className="text-sm text-warning-700 dark:text-warning-300">
                {carriersError ||
                  'Nền tảng chưa cấu hình đơn vị vận chuyển. Liên hệ quản trị viên để thêm đơn vị.'}
              </p>
            ) : (
              <select
                value={carrier}
                onChange={(e) => setCarrier(e.target.value)}
                className="input"
              >
                {activeCarriers.map((c) => (
                  <option key={c.carrierCode} value={c.carrierCode}>
                    {c.carrierName || c.carrierCode}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="label">Loại dịch vụ</label>
            <select
              value={serviceLevel}
              onChange={(e) => setServiceLevel(e.target.value)}
              className="input"
            >
              {SHIPPING_SERVICE_LEVELS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          {view.paymentMethod !== 'COD' && view.paymentStatus !== 'COMPLETED' && (
            <p className="text-sm text-warning-700 dark:text-warning-300">
              Đơn trả trước cần hoàn tất thanh toán trước khi có thể yêu cầu vận chuyển.
            </p>
          )}
        </div>
      </Modal>

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        preset={{
          type: 'ORDER',
          targetId: view.id,
          title: `Báo cáo đơn hàng #${view.id}`,
          descriptionHint: `Mô tả vấn đề với đơn hàng ${displayCode}...`,
        }}
      />
    </div>
  );
}

function allItemsHandledMessage(view: SubOrderDetailView): boolean {
  return view.items.every((i) => i.status !== 'PENDING');
}

function mergeDetailIntoView(
  detail: SubOrderDetail,
  previous: SubOrderDetailView
): SubOrderDetailView {
  const prevByItemId = new Map(previous.items.map((item) => [item.id, item]));
  const prevByProductId = new Map(previous.items.map((item) => [item.productId, item]));
  return {
    ...detail,
    items: detail.items.map((item) => {
      const prev = prevByItemId.get(item.id) ?? prevByProductId.get(item.productId);
      return {
        ...item,
        productName: prev?.productName ?? `Sản phẩm #${item.productId}`,
        productImage: prev?.productImage ?? PRODUCT_PLACEHOLDER,
      };
    }),
  };
}

function fallbackDetailView(detail: SubOrderDetail): SubOrderDetailView {
  return {
    ...detail,
    items: detail.items.map((item) => ({
      ...item,
      productName: `Sản phẩm #${item.productId}`,
      productImage: PRODUCT_PLACEHOLDER,
    })),
  };
}
