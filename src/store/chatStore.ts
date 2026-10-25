import { create } from 'zustand';
import type { ProductCardModel } from '../types/product';
import type { Message, MessageItem } from '../utils/types';
import { ApiRequestError } from '../api/client';
import { getApiErrorMessage } from '../utils/apiErrors';
import { normalizeApiDateString } from '../utils/helpers';
import { getUserIdFromToken } from '../utils/jwt';
import { AUTH_TOKEN_KEY, getAuthItem } from '../utils/authStorage';
import * as chatApi from '../api/chatApi';
import {
  connectChatHub,
  resetRoomPollState,
  startChatPolling,
  stopChatPolling,
  syncRoomSubscriptions,
  type ChatHubHandlers,
} from '../api/chatSocket';

interface ChatState {
  conversations: Message[];
  activeRoomCode: string | null;
  isLoading: boolean;
  error: string | null;
  loadConversations: () => Promise<void>;
  loadConversation: (roomCode: string) => Promise<Message | undefined>;
  clearActiveRoom: () => void;
  clearError: () => void;
  getChatUnreadCount: () => number;
  getConversations: () => Message[];
  getConversation: (customerId: string) => Message | undefined;
  sendMessage: (roomCode: string, content: string) => Promise<boolean>;
  sendImage: (roomCode: string, file: File) => Promise<boolean>;
  sendProduct: (roomCode: string, product: ProductCardModel) => Promise<boolean>;
}

function roomToConversation(room: chatApi.ChatRoomDto): Message {
  if (room.type === 'REPORT_ADMIN') {
    const admin = room.participants?.find((p) => p.role === 'ADMIN' || p.role === 'SUPER_ADMIN');
    return {
      customerId: admin?.userKeycloakId ?? 'support',
      id: room.roomCode,
      customerName: room.displayName || admin?.displayName || 'Hỗ trợ viên',
      customerAvatar: room.avatarUrl || admin?.avatarUrl || '',
      lastMessage: '',
      lastMessageAt: room.createdAt,
      unreadCount: room.unreadCount ?? 0,
      messages: [],
      roomCode: room.roomCode,
      roomType: room.type,
    };
  }

  const buyer = room.participants?.find(
    (p) => p.role === 'BUYER' || p.role === 'CUSTOMER'
  );
  const customerId = buyer?.userKeycloakId ?? 'unknown';
  return {
    customerId,
    id: room.roomCode,
    customerName: buyer?.displayName || room.displayName || 'Khách hàng',
    customerAvatar: buyer?.avatarUrl || room.avatarUrl || '',
    lastMessage: '',
    lastMessageAt: room.createdAt,
    unreadCount: room.unreadCount ?? 0,
    messages: [],
    roomCode: room.roomCode,
    roomType: room.type,
  };
}

function previewMessage(item?: MessageItem): string {
  if (!item) return '';
  switch (item.type) {
    case 'image':
      return 'Hình ảnh';
    case 'file':
      return 'Tệp đính kèm';
    case 'product_card':
      return 'Sản phẩm';
    case 'system':
    case 'report_context':
      return item.content.split('\n')[0];
    default:
      return item.content;
  }
}

function mapMessageType(dtoType: string): MessageItem['type'] {
  switch (dtoType.toUpperCase()) {
    case 'IMAGE':
      return 'image';
    case 'FILE':
      return 'file';
    case 'SYSTEM':
      return 'system';
    case 'PRODUCT_CARD':
      return 'product_card';
    case 'REPORT_CONTEXT':
      return 'report_context';
    default:
      return 'text';
  }
}

const REPORT_TYPE_LABELS: Record<string, string> = {
  PRODUCT: 'Sản phẩm',
  VENDOR: 'Nhà bán',
  ORDER: 'Đơn hàng',
  OTHER: 'Khác',
};

function formatReportContextContent(content: string): string {
  try {
    const ctx = JSON.parse(content) as {
      reportId?: number;
      type?: string;
      targetId?: number | null;
      reason?: string;
      description?: string;
    };
    const parts = [
      ctx.reportId != null ? `Khiếu nại #${ctx.reportId}` : null,
      ctx.type ? REPORT_TYPE_LABELS[ctx.type] ?? ctx.type : null,
      ctx.targetId != null ? `Mục tiêu #${ctx.targetId}` : null,
      ctx.reason,
    ].filter(Boolean);
    const header = parts.join(' · ');
    if (ctx.description) {
      return header ? `${header}\n${ctx.description}` : ctx.description;
    }
    return header || content;
  } catch {
    return content;
  }
}

function dtoToItem(dto: chatApi.ChatMessageDto, vendorKeycloakId: string | null): MessageItem {
  const attachment = dto.attachments?.[0];
  const imageUrl =
    dto.type.toUpperCase() === 'IMAGE' ? attachment?.fileUrl : undefined;
  const fileUrl =
    dto.type.toUpperCase() === 'FILE' ? attachment?.fileUrl : undefined;
  const role = (dto.senderRole ?? '').toUpperCase();
  const isSystem =
    dto.type.toUpperCase() === 'SYSTEM' ||
    dto.type.toUpperCase() === 'REPORT_CONTEXT' ||
    role === 'SYSTEM' ||
    role === 'SYSTEM_AI';
  const isVendor =
    !isSystem &&
    (role === 'VENDOR' ||
      (vendorKeycloakId !== null && dto.senderKeycloakId === vendorKeycloakId));
  // ADMIN / SUPER_ADMIN / customer → incoming (non-vendor) bubble
  const mappedType = mapMessageType(dto.type);
  const content =
    mappedType === 'report_context' ? formatReportContextContent(dto.content) : dto.content;

  return {
    id: String(dto.id),
    senderId: dto.senderKeycloakId,
    senderType: isSystem ? 'system' : isVendor ? 'vendor' : 'customer',
    content,
    createdAt: normalizeApiDateString(dto.sentAt),
    type: mappedType,
    imageUrl,
    fileUrl,
    isRead: Boolean(dto.isRead ?? dto.read ?? false),
  };
}

function mapChatError(error: unknown, fallback: string): string {
  if (error instanceof ApiRequestError && error.status === 403) {
    return 'Bạn không có quyền truy cập cuộc trò chuyện này.';
  }
  return getApiErrorMessage(error, fallback);
}

function moveConversationToTop(conversations: Message[], roomCode: string): Message[] {
  const index = conversations.findIndex((c) => c.roomCode === roomCode);
  if (index <= 0) return conversations;
  const next = [...conversations];
  const [conv] = next.splice(index, 1);
  return [conv, ...next];
}

function sortConversationsByLastMessage(conversations: Message[]): Message[] {
  return [...conversations].sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

function getChatToken() {
  return getAuthItem(AUTH_TOKEN_KEY);
}

export const useChatStore = create<ChatState>((set, get) => {
  const hubHandlers: ChatHubHandlers = {
    onMessage: (roomCode, dto) => {
      const vendorKeycloakId = getUserIdFromToken();
      const newItem = dtoToItem(dto, vendorKeycloakId);
      const { conversations, activeRoomCode } = get();
      const conv = conversations.find((c) => c.roomCode === roomCode);
      if (!conv) return;
      if (conv.messages.some((m) => m.id === newItem.id)) return;

      const isFromOther = newItem.senderType === 'customer';
      const isActive = activeRoomCode === roomCode;

      const updated: Message = {
        ...conv,
        lastMessage: previewMessage(newItem),
        lastMessageAt: newItem.createdAt,
        unreadCount: isActive ? 0 : isFromOther ? conv.unreadCount + 1 : conv.unreadCount,
        messages: isActive ? [...conv.messages, newItem] : conv.messages,
      };

      set({
        conversations: moveConversationToTop(
          conversations.map((c) => (c.roomCode === roomCode ? updated : c)),
          roomCode
        ),
      });

      if (isActive && isFromOther) {
        void chatApi.markRoomRead(roomCode);
      }
    },
    onRead: (roomCode, payload) => {
      const currentUserId = getUserIdFromToken();
      if (!currentUserId || payload.userId === currentUserId) return;

      const { conversations } = get();
      set({
        conversations: conversations.map((c) =>
          c.roomCode === roomCode
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.senderType === 'vendor' ? { ...m, isRead: true } : m
                ),
              }
            : c
        ),
      });
    },
    onMessagesSync: (roomCode, dtos) => {
      const { conversations } = get();
      const conv = conversations.find((c) => c.roomCode === roomCode);
      if (!conv?.messages.length) return;

      const readById = new Map(
        dtos.map((d) => [String(d.id), Boolean(d.isRead ?? d.read ?? false)])
      );
      let changed = false;
      const nextMessages = conv.messages.map((m) => {
        const serverRead = readById.get(m.id);
        if (serverRead === undefined || serverRead === m.isRead) return m;
        changed = true;
        return { ...m, isRead: serverRead };
      });
      if (!changed) return;

      set({
        conversations: conversations.map((c) =>
          c.roomCode === roomCode ? { ...c, messages: nextMessages } : c
        ),
      });
    },
  };

  function ensureChatHub(roomCodes: string[]) {
    connectChatHub(getChatToken, hubHandlers);
    syncRoomSubscriptions(roomCodes);
  }

  return {
    conversations: [],
    activeRoomCode: null,
    isLoading: false,
    error: null,

    clearError: () => set({ error: null }),

    clearActiveRoom: () => {
      stopChatPolling();
      set({ activeRoomCode: null });
    },

    loadConversations: async () => {
      set({ isLoading: true, error: null });
      try {
        const rooms = await chatApi.getRooms();
        const visibleRooms = rooms.filter(
          (r) => r.type === 'BUYER_VENDOR' || r.type === 'REPORT_ADMIN'
        );
        const baseConversations = visibleRooms.map(roomToConversation);
        set({ conversations: baseConversations });
        ensureChatHub(visibleRooms.map((r) => r.roomCode));

        const vendorKeycloakId = getUserIdFromToken();
        const hydrated = await Promise.all(
          baseConversations.map(async (conv) => {
            if (!conv.roomCode) return conv;
            try {
              const page = await chatApi.getMessages(conv.roomCode, 0, 1);
              const dto = page?.content?.[0];
              if (!dto) return conv;
              const lastItem = dtoToItem(dto, vendorKeycloakId);
              return {
                ...conv,
                lastMessage: previewMessage(lastItem),
                lastMessageAt: lastItem.createdAt,
              };
            } catch {
              return conv;
            }
          })
        );

        set((state) => ({
          conversations: sortConversationsByLastMessage(
            hydrated.map((hydratedConv) => {
              const current = state.conversations.find(
                (c) => c.roomCode === hydratedConv.roomCode
              );
              if (!current) return hydratedConv;
              // Giữ preview mới hơn nếu STOMP đã cập nhật trong lúc hydrate.
              if (
                new Date(current.lastMessageAt).getTime() >
                new Date(hydratedConv.lastMessageAt).getTime()
              ) {
                return {
                  ...hydratedConv,
                  lastMessage: current.lastMessage,
                  lastMessageAt: current.lastMessageAt,
                  unreadCount: Math.max(hydratedConv.unreadCount, current.unreadCount),
                };
              }
              return {
                ...hydratedConv,
                unreadCount: Math.max(hydratedConv.unreadCount, current.unreadCount),
              };
            })
          ),
        }));
      } catch (error) {
        const message = mapChatError(error, 'Không thể tải danh sách chat');
        set({ error: message });
        throw error;
      } finally {
        set({ isLoading: false });
      }
    },

    loadConversation: async (roomCode: string) => {
      stopChatPolling();
      set({ activeRoomCode: roomCode, error: null });

      const vendorKeycloakId = getUserIdFromToken();

      try {
        const room = await chatApi.getRoom(roomCode);
        const page = await chatApi.getMessages(roomCode, 0, 50);
        const items: MessageItem[] = (page?.content ?? [])
          .slice()
          .reverse()
          .map((dto) => dtoToItem(dto, vendorKeycloakId));

        const buyer = room.participants?.find(
          (p) => p.role === 'BUYER' || p.role === 'CUSTOMER'
        );
        const admin = room.participants?.find(
          (p) => p.role === 'ADMIN' || p.role === 'SUPER_ADMIN'
        );
        const isSupport = room.type === 'REPORT_ADMIN';
        const counterpartId = isSupport
          ? admin?.userKeycloakId ?? 'support'
          : buyer?.userKeycloakId ?? 'unknown';
        const counterpartName = isSupport
          ? room.displayName || admin?.displayName || 'Hỗ trợ viên'
          : buyer?.displayName || room.displayName || 'Khách hàng';
        const counterpartAvatar = isSupport
          ? room.avatarUrl || admin?.avatarUrl || ''
          : buyer?.avatarUrl || room.avatarUrl || '';
        const lastItem = items[items.length - 1];
        const lastMessagePreview = lastItem
          ? lastItem.type === 'image'
            ? 'Hình ảnh'
            : lastItem.type === 'file'
              ? 'Tệp đính kèm'
              : lastItem.type === 'product_card'
                ? 'Sản phẩm'
                : lastItem.content.split('\n')[0]
          : '';

        const { conversations } = get();
        const existing = conversations.find((c) => c.roomCode === roomCode);
        const updated: Message = existing
          ? {
              ...existing,
              customerId: counterpartId || existing.customerId,
              customerName: counterpartName || existing.customerName,
              customerAvatar: counterpartAvatar || existing.customerAvatar,
              roomType: room.type,
              messages: items,
              lastMessage: lastMessagePreview,
              lastMessageAt: lastItem?.createdAt ?? existing.lastMessageAt,
              unreadCount: 0,
            }
          : {
              customerId: counterpartId,
              customerName: counterpartName,
              customerAvatar: counterpartAvatar,
              lastMessage: lastMessagePreview,
              lastMessageAt: lastItem?.createdAt ?? room.createdAt,
              unreadCount: 0,
              messages: items,
              roomCode,
              roomType: room.type,
            };

        set({
          conversations: sortConversationsByLastMessage(
            existing
              ? conversations.map((c) => (c.roomCode === roomCode ? updated : c))
              : [updated, ...conversations]
          ),
        });

        await chatApi.markRoomRead(roomCode);
        ensureChatHub(get().conversations.map((c) => c.roomCode ?? '').filter(Boolean));

        resetRoomPollState(roomCode);
        startChatPolling(
          roomCode,
          async (code) => {
            const p = await chatApi.getMessages(code, 0, 50);
            return p?.content ?? [];
          },
          (dto) => hubHandlers.onMessage(roomCode, dto)
        );

        return get().conversations.find((c) => c.roomCode === roomCode) ?? updated;
      } catch (error) {
        const message = mapChatError(error, 'Không thể tải tin nhắn');
        set({ error: message });
        throw error;
      }
    },

    getChatUnreadCount: () =>
      get().conversations.reduce((sum, c) => sum + c.unreadCount, 0),

    getConversations: () => sortConversationsByLastMessage(get().conversations),

    getConversation: (customerId: string) => {
      return get().conversations.find((m) => m.customerId === customerId);
    },

    sendMessage: async (roomCode: string, content: string) => {
      set({ isLoading: true, error: null });
      const vendorKeycloakId = getUserIdFromToken();
      try {
        const sent = await chatApi.sendMessage(roomCode, content);
        const newItem = dtoToItem(sent, vendorKeycloakId);
        const { conversations } = get();
        set({
          conversations: moveConversationToTop(
            conversations.map((c) =>
              c.roomCode === roomCode
                ? {
                    ...c,
                    messages: [...c.messages, newItem],
                    lastMessage: previewMessage(newItem),
                    lastMessageAt: normalizeApiDateString(sent.sentAt),
                  }
                : c
            ),
            roomCode
          ),
        });
        return true;
      } catch (error) {
        set({ error: mapChatError(error, 'Không thể gửi tin nhắn') });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    sendImage: async (roomCode: string, file: File) => {
      set({ isLoading: true, error: null });
      const vendorKeycloakId = getUserIdFromToken();
      try {
        const sent = await chatApi.sendMessage(roomCode, '', 'IMAGE', [file]);
        const newItem = dtoToItem(sent, vendorKeycloakId);
        const { conversations } = get();
        set({
          conversations: moveConversationToTop(
            conversations.map((c) =>
              c.roomCode === roomCode
                ? {
                    ...c,
                    messages: [...c.messages, newItem],
                    lastMessage: previewMessage(newItem),
                    lastMessageAt: normalizeApiDateString(sent.sentAt),
                  }
                : c
            ),
            roomCode
          ),
        });
        return true;
      } catch (error) {
        set({ error: mapChatError(error, 'Không thể gửi hình ảnh') });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },

    sendProduct: async (roomCode: string, product: ProductCardModel) => {
      set({ isLoading: true, error: null });
      const vendorKeycloakId = getUserIdFromToken();
      try {
        const sent = await chatApi.sendProductCard(roomCode, {
          id: product.id,
          name: product.name,
          price: product.price,
          imageUrl: product.thumbnail || product.images[0],
          category: product.categoryName || product.categorySlug,
        });
        const newItem = dtoToItem(sent, vendorKeycloakId);
        const { conversations } = get();
        set({
          conversations: moveConversationToTop(
            conversations.map((c) =>
              c.roomCode === roomCode
                ? {
                    ...c,
                    messages: [...c.messages, newItem],
                    lastMessage: previewMessage(newItem),
                    lastMessageAt: normalizeApiDateString(sent.sentAt),
                  }
                : c
            ),
            roomCode
          ),
        });
        return true;
      } catch (error) {
        set({ error: mapChatError(error, 'Không thể gửi sản phẩm') });
        return false;
      } finally {
        set({ isLoading: false });
      }
    },
  };
});
