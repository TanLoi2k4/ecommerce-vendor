import { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { toast } from '../ui';
import { formatCurrency, formatDateTime } from '../../utils/helpers';
import { PRODUCT_PLACEHOLDER } from '../../constants/placeholders';
import {
  RETURN_REASON_LABELS,
  RETURN_STATUS_LABELS,
  type ReturnRequestDto,
  type ReturnRequestItemDto,
  type SubOrderItemView,
} from '../../types/order';
import * as orderApi from '../../api/orderApi';
import * as shipmentApi from '../../api/shipmentApi';
import type { Shipment } from '../../types/shipment';
import { formatCarrierLabel, shipmentStatusLabel } from '../../utils/shipmentLabels';
import { ShipmentTrackingTimeline } from './ShipmentTrackingTimeline';

interface ReturnRequestPanelProps {
  request: ReturnRequestDto;
  orderItems?: SubOrderItemView[];
  onUpdated: (next: ReturnRequestDto) => void;
}

function resolveReturnProduct(
  item: ReturnRequestItemDto,
  orderItems?: SubOrderItemView[]
) {
  const match =
    orderItems?.find((orderItem) => orderItem.id === item.orderItemId) ??
    orderItems?.find((orderItem) => orderItem.productId === item.productId);
  return {
    name: match?.productName ?? `Sản phẩm #${item.productId}`,
    image: match?.productImage ?? PRODUCT_PLACEHOLDER,
  };
}

export function ReturnRequestPanel({ request, orderItems, onUpdated }: ReturnRequestPanelProps) {
  const [busy, setBusy] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [note, setNote] = useState('');
  const [returnShipment, setReturnShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    if (request.status === 'REQUESTED' || request.status === 'REJECTED' || request.status === 'CLOSED') {
      setReturnShipment(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const data = await shipmentApi.getVendorShipmentBySubOrder(request.subOrderId, 'RETURN');
        if (!cancelled) setReturnShipment(data);
      } catch {
        if (!cancelled) setReturnShipment(null);
      }
    };
    void load();
    const timer = window.setInterval(() => {
      void load();
    }, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [request.id, request.status, request.subOrderId]);

  const run = async (action: () => Promise<ReturnRequestDto>, successMessage: string) => {
    setBusy(true);
    try {
      const updated = await action();
      onUpdated(updated);
      toast.success(successMessage);
      setRejectOpen(false);
      setNote('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Không xử lý được yêu cầu trả hàng');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card p-6 border border-warning-200">
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <RotateCcw className="w-5 h-5" />
          Yêu cầu trả hàng #{request.id}
        </h3>
        <span className="badge badge-warning">{RETURN_STATUS_LABELS[request.status]}</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">
        Lý do: {RETURN_REASON_LABELS[request.reason]}
        {request.description ? ` — ${request.description}` : ''}
      </p>
      <p className="text-sm font-medium mt-1">
        Số tiền hoàn: {formatCurrency(Number(request.refundAmount))}
      </p>
      <ReturnItemsList request={request} orderItems={orderItems} />
      {request.sellerRespondBy && request.status === 'REQUESTED' && (
        <p className="text-xs text-gray-500 mt-1">
          Phản hồi trước {formatDateTime(request.sellerRespondBy)} (quá hạn sẽ tự đồng ý)
        </p>
      )}
      {request.status === 'APPROVED' && (
        <p className="text-sm text-gray-600 mt-2">
          Đơn vị vận chuyển sẽ lấy hàng tại địa chỉ khách và giao về shop. Hệ thống hoàn ví khi đối tác vận chuyển xác nhận đã giao tới.
        </p>
      )}
      {request.status === 'SHIPPED' && (
        <p className="text-sm text-gray-600 mt-2">
          Đang hoàn về shop. Shop không xác nhận nhận hàng — hệ thống hoàn ví khi đối tác vận chuyển báo đã giao tới.
        </p>
      )}
      {request.customerShipNote && (
        <p className="text-sm text-gray-600 mt-2">Khách gửi hàng: {request.customerShipNote}</p>
      )}
      {request.adminNote && <p className="text-sm text-gray-600 mt-1">Avora: {request.adminNote}</p>}

      {returnShipment && (
        <div className="mt-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
          <p className="text-sm font-medium">Vận đơn hàng hoàn</p>
          <p className="text-sm text-gray-600">
            {formatCarrierLabel(returnShipment.carrierCode, returnShipment.carrierName)} ·{' '}
            {shipmentStatusLabel[returnShipment.status]}
          </p>
          {(returnShipment.carrierTrackingId || returnShipment.externalShipmentId) && (
            <p className="text-xs text-gray-500 font-mono">
              {returnShipment.carrierTrackingId || returnShipment.externalShipmentId}
            </p>
          )}
          <ShipmentTrackingTimeline shipment={returnShipment} />
        </div>
      )}

      {request.status === 'REQUESTED' && (
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={busy}
            onClick={() => void run(() => orderApi.approveVendorReturn(request.id), 'Đã đồng ý trả hàng')}
          >
            Đồng ý
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy}
            onClick={() => setRejectOpen((open) => !open)}
          >
            Từ chối
          </button>
        </div>
      )}

      {rejectOpen && (
        <div className="mt-3 space-y-2">
          <textarea
            className="input w-full"
            rows={3}
            placeholder="Lý do từ chối"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled={busy || !note.trim()}
            onClick={() =>
              void run(() => orderApi.rejectVendorReturn(request.id, note.trim()), 'Đã từ chối yêu cầu')
            }
          >
            Xác nhận từ chối
          </button>
        </div>
      )}

    </div>
  );
}

function ReturnItemsList({
  request,
  orderItems,
}: {
  request: ReturnRequestDto;
  orderItems?: SubOrderItemView[];
}) {
  const returnedItems = request.items ?? [];
  const returnableCount = (orderItems ?? []).filter((item) => item.status !== 'CANCELLED').length;
  const isPartial =
    returnedItems.length > 0 && returnableCount > 0 && returnedItems.length < returnableCount;

  if (returnedItems.length === 0) {
    return (
      <p className="text-sm text-warning-700 dark:text-warning-300 mt-3">
        Không xác định được sản phẩm hoàn trả. Vui lòng đối chiếu danh sách sản phẩm bên dưới.
      </p>
    );
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
        Sản phẩm muốn hoàn trả
        {returnableCount > 0 ? (
          <span className="font-normal text-gray-500">
            {' '}
            ({returnedItems.length}/{returnableCount} sản phẩm trong đơn)
          </span>
        ) : null}
      </p>
      {isPartial && (
        <p className="text-xs text-warning-700 dark:text-warning-300 mt-1">
          Khách chỉ trả một phần đơn, không phải toàn bộ đơn hàng.
        </p>
      )}
      <div className="mt-3 space-y-3">
        {returnedItems.map((item) => {
          const product = resolveReturnProduct(item, orderItems);
          return (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-lg border border-warning-200 bg-warning-50/70 dark:bg-warning-900/10 p-3"
            >
              <img
                src={product.image}
                alt={product.name}
                className="w-14 h-14 rounded-lg object-cover bg-gray-100 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">{product.name}</p>
                <p className="text-sm text-gray-500">
                  {formatCurrency(Number(item.unitPrice))} × {item.quantity}
                </p>
              </div>
              <p className="font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                {formatCurrency(Number(item.lineTotal))}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
