import { formatCurrency, formatDateTime } from './helpers';
import type { SubOrderDetailView } from '../types/order';
import { ORDER_ITEM_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../types/order';

export function printPackingSlip(
  view: SubOrderDetailView,
  shopName?: string | null
): void {
  const popup = window.open('', '_blank', 'noopener,noreferrer,width=800,height=900');
  if (!popup) return;

  const itemsHtml = view.items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.productName)}</td>
          <td>${item.quantity}</td>
          <td>${formatCurrency(Number(item.unitPrice))}</td>
          <td>${formatCurrency(Number(item.lineTotal))}</td>
          <td>${ORDER_ITEM_STATUS_LABELS[item.status]}</td>
        </tr>`
    )
    .join('');

  popup.document.write(`<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Phiếu đóng gói ${escapeHtml(view.orderCode ?? `#${view.id}`)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    p, td, th { font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f3f4f6; }
    .muted { color: #6b7280; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
  </style>
</head>
<body>
  <h1>Phiếu đóng gói</h1>
  <p class="muted">${escapeHtml(shopName || 'Cửa hàng')} · ${formatDateTime(view.createdAt ?? new Date().toISOString())}</p>
  <div class="grid">
    <div>
      <p><strong>Mã đơn:</strong> ${escapeHtml(view.orderCode ?? '—')}</p>
      <p><strong>Đơn phụ:</strong> #${view.id}</p>
      <p><strong>Thanh toán:</strong> ${view.paymentMethod ? PAYMENT_METHOD_LABELS[view.paymentMethod] : '—'}</p>
    </div>
    <div>
      <p><strong>Khách hàng:</strong> ${escapeHtml(view.customerName ?? '—')}</p>
      <p><strong>SĐT:</strong> ${escapeHtml(view.customerPhone ?? '—')}</p>
      <p><strong>Địa chỉ:</strong> ${escapeHtml(view.shippingAddress ?? '—')}</p>
    </div>
  </div>
  ${view.note ? `<p><strong>Ghi chú:</strong> ${escapeHtml(view.note)}</p>` : ''}
  <table>
    <thead>
      <tr>
        <th>Sản phẩm</th>
        <th>SL</th>
        <th>Đơn giá</th>
        <th>Thành tiền</th>
        <th>Trạng thái</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>
  <p style="text-align:right;margin-top:16px"><strong>Tổng: ${formatCurrency(Number(view.finalAmount))}</strong></p>
</body>
</html>`);
  popup.document.close();
  popup.focus();
  popup.print();
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
