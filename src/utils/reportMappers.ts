import type { ReportDto, ReportItem } from '../types/report';

export function mapReportDto(dto: ReportDto): ReportItem {
  return {
    id: dto.id,
    type: dto.type,
    targetId: dto.targetId ?? undefined,
    targetKeycloakId: dto.targetKeycloakId ?? undefined,
    targetName: dto.targetName ?? undefined,
    reason: dto.reason,
    description: dto.description,
    status: dto.status,
    chatRoomCode: dto.chatRoomCode ?? undefined,
    createdAt: dto.createdAt,
  };
}
