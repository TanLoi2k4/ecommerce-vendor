import type { VendorStatus } from '../types/vendor';

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  /** Display name derived from first + last name */
  name: string;
  avatar?: string;
  phone?: string;
  role: 'vendor' | 'admin';
  shopId: string;
  status?: VendorStatus;
  createdAt: string;
}

export interface Shop {
  id: string;
  name: string;
  logo?: string;
  phone: string;
  email: string;
  status?: VendorStatus;
  rating?: number;
  reviewCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  id?: string;
  roomCode?: string;
  roomType?: 'BUYER_VENDOR' | 'REPORT_ADMIN' | 'AI_SHOPPING_ASSISTANT';
  customerId: string;
  customerName: string;
  customerAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  messages: MessageItem[];
}

export interface MessageItem {
  id: string;
  senderId: string;
  senderType: 'customer' | 'vendor' | 'system';
  content: string;
  createdAt: string;
  type?: 'text' | 'image' | 'file' | 'system' | 'product_card' | 'report_context';
  imageUrl?: string;
  fileUrl?: string;
  isRead?: boolean;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  category?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
