import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { ChatMessageDto } from '../types/chat';
import { normalizeApiDateString } from '../utils/helpers';

type MessageHandler = (message: ChatMessageDto) => void;
type TokenProvider = () => string | null;

export interface TypingPayload {
  userId: string;
  typing?: boolean;
  timestamp?: number;
}

export interface ReadReceiptPayload {
  userId: string;
  timestamp?: number;
}

export interface ChatHubHandlers {
  onMessage: (roomCode: string, message: ChatMessageDto) => void;
  onRead?: (roomCode: string, payload: ReadReceiptPayload) => void;
  /** Đồng bộ isRead từ polling khi WebSocket bỏ lỡ sự kiện. */
  onMessagesSync?: (roomCode: string, messages: ChatMessageDto[]) => void;
}

export interface StompCallbacks {
  onTyping?: (payload: TypingPayload) => void;
}

let stompClient: Client | null = null;
let messageSubscriptions = new Map<string, StompSubscription>();
let readSubscriptions = new Map<string, StompSubscription>();
let subscribedRoomCodes = new Set<string>();
let hubHandlers: ChatHubHandlers | null = null;
let typingSubscription: StompSubscription | null = null;
let activeTypingRoomCode: string | null = null;
let activeTypingCallback: ((payload: TypingPayload) => void) | null = null;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let lastMessageId: Record<string, number> = {};

function wsUrl(): string {
  const base = import.meta.env.VITE_WS_URL as string | undefined;
  if (base) return `${base.replace(/\/$/, '')}/ws`;
  return `${window.location.origin}/ws`;
}

function parseChatMessage(payload: unknown): ChatMessageDto | null {
  if (!payload || typeof payload !== 'object') return null;
  const raw = payload as Record<string, unknown>;
  if (typeof raw.id !== 'number') return null;
  const attachments = Array.isArray(raw.attachments)
    ? raw.attachments.map((a) => {
        const att = a as Record<string, unknown>;
        return {
          fileUrl: String(att.fileUrl ?? ''),
          fileType: att.fileType ? String(att.fileType) : undefined,
        };
      })
    : undefined;
  return {
    id: raw.id,
    senderKeycloakId: String(raw.senderKeycloakId ?? ''),
    senderRole: String(raw.senderRole ?? ''),
    content: String(raw.content ?? ''),
    type: String(raw.type ?? 'TEXT'),
    sentAt: normalizeApiDateString(raw.sentAt),
    isRead: Boolean(raw.isRead ?? raw.read ?? false),
    attachments,
  };
}

function subscribeRoom(roomCode: string) {
  if (!stompClient?.connected || messageSubscriptions.has(roomCode)) return;

  const msgSub = stompClient.subscribe(`/topic/${roomCode}`, (msg: IMessage) => {
    try {
      const dto = parseChatMessage(JSON.parse(msg.body));
      if (dto) hubHandlers?.onMessage(roomCode, dto);
    } catch {
      // ignore malformed payloads
    }
  });
  messageSubscriptions.set(roomCode, msgSub);

  const readSub = stompClient.subscribe(`/topic/${roomCode}/read`, (msg: IMessage) => {
    try {
      const payload = JSON.parse(msg.body) as ReadReceiptPayload;
      if (payload?.userId) hubHandlers?.onRead?.(roomCode, payload);
    } catch {
      // ignore malformed payloads
    }
  });
  readSubscriptions.set(roomCode, readSub);
}

function unsubscribeRoom(roomCode: string) {
  messageSubscriptions.get(roomCode)?.unsubscribe();
  messageSubscriptions.delete(roomCode);
  readSubscriptions.get(roomCode)?.unsubscribe();
  readSubscriptions.delete(roomCode);
}

function setupTypingSubscription(roomCode: string) {
  if (!stompClient?.connected || !activeTypingCallback) return;
  if (typingSubscription) {
    typingSubscription.unsubscribe();
    typingSubscription = null;
  }
  typingSubscription = stompClient.subscribe(`/topic/${roomCode}/typing`, (msg: IMessage) => {
    try {
      const payload = JSON.parse(msg.body) as TypingPayload;
      if (payload?.userId) activeTypingCallback!(payload);
    } catch {
      // ignore
    }
  });
}

export function registerTypingListener(
  roomCode: string | null,
  callback: ((payload: TypingPayload) => void) | null
) {
  activeTypingRoomCode = roomCode;
  activeTypingCallback = callback;
  if (roomCode) {
    setupTypingSubscription(roomCode);
  } else if (typingSubscription) {
    typingSubscription.unsubscribe();
    typingSubscription = null;
  }
}

export function connectChatHub(getToken: TokenProvider, handlers: ChatHubHandlers): void {
  hubHandlers = handlers;

  const token = getToken();
  if (!token) return;

  if (stompClient?.connected) return;
  if (stompClient) return;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(wsUrl()),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      for (const code of subscribedRoomCodes) {
        subscribeRoom(code);
      }
      if (activeTypingRoomCode) {
        setupTypingSubscription(activeTypingRoomCode);
      }
    },
  });

  stompClient.activate();
}

export function syncRoomSubscriptions(roomCodes: string[]) {
  const nextSet = new Set(roomCodes.filter(Boolean));

  for (const code of subscribedRoomCodes) {
    if (!nextSet.has(code)) {
      unsubscribeRoom(code);
    }
  }

  subscribedRoomCodes = nextSet;

  if (stompClient?.connected) {
    for (const code of subscribedRoomCodes) {
      subscribeRoom(code);
    }
  }

  if (activeTypingRoomCode) {
    setupTypingSubscription(activeTypingRoomCode);
  }
}

export function disconnectChatHub(): void {
  for (const code of [...messageSubscriptions.keys()]) {
    unsubscribeRoom(code);
  }
  subscribedRoomCodes.clear();
  hubHandlers = null;

  if (typingSubscription) {
    typingSubscription.unsubscribe();
    typingSubscription = null;
  }
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
  }
}

export function sendTypingIndicator(roomCode: string, typing: boolean): void {
  if (!stompClient?.connected) return;
  stompClient.publish({
    destination: `/chat/${roomCode}/typing`,
    body: JSON.stringify({ typing }),
  });
}

export function isStompConnected(): boolean {
  return Boolean(stompClient?.connected);
}

export function startChatPolling(
  roomCode: string,
  fetchMessages: (roomCode: string) => Promise<ChatMessageDto[]>,
  onMessage: MessageHandler,
  intervalMs = 3000
) {
  stopChatPolling();

  const pollOnce = async () => {
    if (stompClient?.connected) return;

    try {
      const messages = await fetchMessages(roomCode);
      const lastId = lastMessageId[roomCode] ?? 0;
      const newMessages = messages.filter((m) => m.id > lastId);
      if (newMessages.length > 0) {
        lastMessageId[roomCode] = Math.max(...messages.map((m) => m.id));
        newMessages.forEach(onMessage);
      }
      hubHandlers?.onMessagesSync?.(roomCode, messages);
    } catch {
      // ignore polling errors
    }
  };

  void pollOnce();
  pollTimer = setInterval(() => {
    void pollOnce();
  }, intervalMs);
}

export function stopChatPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

export function stopChatRealtime() {
  disconnectChatHub();
  stopChatPolling();
}

export function resetRoomPollState(roomCode: string) {
  delete lastMessageId[roomCode];
}
