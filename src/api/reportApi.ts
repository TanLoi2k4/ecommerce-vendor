import api from './client';
import type { PageResponse } from '../types/api';
import type { CreateReportRequest, ReportDto, ReportStatus } from '../types/report';

export async function createReport(request: CreateReportRequest): Promise<ReportDto> {
  const res = await api.post<ReportDto>('/reports', request);
  return res.data;
}

export async function getReport(id: number): Promise<ReportDto> {
  const res = await api.get<ReportDto>(`/reports/${id}`);
  return res.data;
}

export async function getMyReports(page = 0, size = 20, status?: ReportStatus) {
  const res = await api.get<PageResponse<ReportDto>>('/reports/mine', {
    params: { page, size, ...(status ? { status } : {}) },
  });
  return res.data;
}
