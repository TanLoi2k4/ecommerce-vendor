import api from './client';
import type { PageResponse } from '../types/api';
import type { ChatMessageDto, ChatRoomDto } from '../types/chat';

export type { ChatMessageDto, ChatRoomDto } from '../types/chat';

/** @deprecated Use PageResponse from src/types/api instead. */
export type SpringPage<T> = Pick<
  PageResponse<T>,
  'content' | 'totalElements' | 'totalPages'
>;

export async function createRoom(params: {
  vendorId: string;
  buyerId: string;
}): Promise<ChatRoomDto> {
  const res = await api.post<ChatRoomDto>('/chat/rooms', params);
  if (!res.data) {
    throw new Error('Không tạo được phòng chat');
  }
  return res.data;
}

export async function getRooms(): Promise<ChatRoomDto[]> {
  const res = await api.get<ChatRoomDto[]>('/chat/rooms');
  return res.data ?? [];
}

export async function getMessages(roomCode: string, page = 0, size = 50) {
  const res = await api.get<PageResponse<ChatMessageDto>>(
    `/chat/rooms/${roomCode}/messages`,
    { params: { page, size } }
  );
  return res.data;
}

export async function sendMessage(
  roomCode: string,
  content: string,
  type = 'TEXT',
  files?: File[]
): Promise<ChatMessageDto> {
  const form = new FormData();
  if (content) form.append('content', content);
  form.append('type', type);
  if (files) {
    files.forEach((file) => form.append('files', file));
  }
  const res = await api.post<ChatMessageDto>(
    `/chat/rooms/${roomCode}/messages`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  );
  return res.data;
}

export async function getRoom(roomCode: string): Promise<ChatRoomDto> {
  const res = await api.get<ChatRoomDto>(`/chat/rooms/${roomCode}`);
  return res.data;
}

export async function getUnread(roomCode: string): Promise<number> {
  const res = await api.get<number>(`/chat/rooms/${roomCode}/unread`);
  return res.data ?? 0;
}

export async function markRoomRead(roomCode: string): Promise<void> {
  await api.put(`/chat/rooms/${roomCode}/read`);
}

export async function sendProductCard(
  roomCode: string,
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string;
    category?: string;
  }
): Promise<ChatMessageDto> {
  const card: Record<string, unknown> = {
    id: product.id,
    name: product.name,
    price: product.price,
  };
  if (product.imageUrl) card.imageUrl = product.imageUrl;
  if (product.category) card.category = product.category;

  const form = new FormData();
  form.append('content', JSON.stringify({ products: [card] }));
  form.append('type', 'PRODUCT_CARD');
  const res = await api.post<ChatMessageDto>(`/chat/rooms/${roomCode}/messages`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
}
