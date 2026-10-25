import { useCallback, useEffect, useState } from 'react';
import * as reportApi from '../api/reportApi';
import { mapReportDto } from '../utils/reportMappers';
import type { ReportItem, ReportStatus } from '../types/report';
import { getApiErrorMessage } from '../utils/apiErrors';

interface UseMyReportsOptions {
  page?: number;
  size?: number;
  status?: ReportStatus;
  enabled?: boolean;
}

export function useMyReports(options: UseMyReportsOptions = {}) {
  const { page = 0, size = 20, status, enabled = true } = options;
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const pageData = await reportApi.getMyReports(page, size, status);
      setReports((pageData?.content ?? []).map(mapReportDto));
      setTotalElements(pageData?.totalElements ?? 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Không thể tải danh sách báo cáo'));
      setReports([]);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [enabled, page, size, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    reports,
    totalElements,
    totalPages: size > 0 ? Math.ceil(totalElements / size) : 0,
    isLoading,
    error,
    refresh,
  };
}
