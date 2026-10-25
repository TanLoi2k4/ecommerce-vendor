/** Client-side validation and API error mapping for flash sale forms. */

export interface FlashSaleFormValues {
  name: string;
  productId: string;
  flashSalePrice: string;
  startTime: string;
  endTime: string;
}

export type FlashSaleFormField = keyof FlashSaleFormValues;

export type FlashSaleFormErrors = Partial<Record<FlashSaleFormField, string>>;

export function validateFlashSaleForm(
  values: FlashSaleFormValues,
  options?: { productPrice?: number }
): FlashSaleFormErrors {
  const errors: FlashSaleFormErrors = {};
  const now = Date.now();

  if (!values.name.trim()) {
    errors.name = 'Vui lòng nhập tên flash sale.';
  }

  if (!values.productId) {
    errors.productId = 'Vui lòng chọn sản phẩm.';
  }

  const price = parseFloat(values.flashSalePrice);
  if (values.flashSalePrice === '' || Number.isNaN(price)) {
    errors.flashSalePrice = 'Vui lòng nhập giá flash sale.';
  } else if (price < 0) {
    errors.flashSalePrice = 'Giá phải lớn hơn hoặc bằng 0.';
  } else if (options?.productPrice != null && price >= options.productPrice) {
    errors.flashSalePrice = 'Giá flash sale phải thấp hơn giá sản phẩm hiện tại.';
  }

  let startMs: number | null = null;
  if (!values.startTime) {
    errors.startTime = 'Vui lòng chọn thời gian bắt đầu.';
  } else {
    startMs = new Date(values.startTime).getTime();
    if (Number.isNaN(startMs)) {
      errors.startTime = 'Thời gian bắt đầu không hợp lệ.';
    } else if (startMs <= now) {
      errors.startTime = 'Thời gian bắt đầu phải ở tương lai.';
    }
  }

  let endMs: number | null = null;
  if (!values.endTime) {
    errors.endTime = 'Vui lòng chọn thời gian kết thúc.';
  } else {
    endMs = new Date(values.endTime).getTime();
    if (Number.isNaN(endMs)) {
      errors.endTime = 'Thời gian kết thúc không hợp lệ.';
    } else if (endMs <= now) {
      errors.endTime = 'Thời gian kết thúc phải ở tương lai.';
    }
  }

  if (startMs != null && endMs != null && !errors.startTime && !errors.endTime && startMs >= endMs) {
    errors.endTime = 'Thời gian kết thúc phải sau thời gian bắt đầu.';
  }

  return errors;
}

export function hasFormErrors(errors: FlashSaleFormErrors): boolean {
  return Object.keys(errors).length > 0;
}

export function mapFlashSaleApiError(message: string, status?: number): string {
  const lower = message.toLowerCase();

  if (status === 403 || lower.includes('permission') || lower.includes('forbidden') || lower.includes('access denied')) {
    return 'Bạn không có quyền thực hiện thao tác này.';
  }

  if (status === 404 || lower.includes('not found')) {
    return 'Không tìm thấy flash sale. Có thể đã bị xóa.';
  }

  if (lower.includes('overlap')) {
    return 'Sản phẩm này đã có flash sale trong khoảng thời gian đã chọn.';
  }

  if (lower.includes('start time must be before end time')) {
    return 'Thời gian bắt đầu phải trước thời gian kết thúc.';
  }

  if (lower.includes('must be in the future') || lower.includes('future')) {
    return 'Thời gian bắt đầu và kết thúc phải ở tương lai.';
  }

  if (lower.includes('flash sale price') && lower.includes('lower than')) {
    return 'Giá flash sale phải thấp hơn giá sản phẩm hiện tại.';
  }

  if (lower.includes('flash sale price') && lower.includes('greater than or equal')) {
    return 'Giá flash sale phải lớn hơn hoặc bằng 0.';
  }

  return message;
}

export function minDatetimeLocalValue(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 1);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
