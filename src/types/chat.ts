export type ChatRoomType = 'BUYER_VENDOR' | 'REPORT_ADMIN' | 'AI_SHOPPING_ASSISTANT';

export interface ChatParticipantDto {
  userKeycloakId: string;
  role: string;
  displayName?: string;
  avatarUrl?: string;
  joinedAt?: string;
}

export interface ChatRoomDto {
  id: number;
  roomCode: string;
  type: ChatRoomType | string;
  createdAt: string;
  participants?: ChatParticipantDto[];
  displayName?: string;
  avatarUrl?: string;
  unreadCount?: number;
}

export interface MessageAttachmentDto {
  fileUrl: string;
  fileType?: string;
}

export interface ChatMessageDto {
  id: number;
  senderKeycloakId: string;
  senderRole: string;
  content: string;
  type: string;
  sentAt: string;
  isRead?: boolean;
  read?: boolean;
  attachments?: MessageAttachmentDto[];
}
