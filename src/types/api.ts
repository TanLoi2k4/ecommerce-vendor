/** Standard success wrapper from vendor-service and other backend services. */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  errorCode?: string;
}

/** Standard error body from GlobalExceptionHandler. */
export interface ErrorResponse {
  success: false;
  message: string;
  errorCode: string;
  timestamp: string;
}

/** Spring Data Page shape returned by paginated endpoints. */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    typeof (value as ApiResponse<unknown>).success === 'boolean' &&
    'data' in value
  );
}

export function isErrorResponse(value: unknown): value is ErrorResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as ErrorResponse).success === false &&
    'errorCode' in value
  );
}
