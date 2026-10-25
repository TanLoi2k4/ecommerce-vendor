import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { NotificationDto } from '../types/notification';
import { parseNotificationPayload } from '../utils/notificationMappers';

type NotificationHandler = (notification: NotificationDto) => void;
type TokenProvider = () => string | null;

let notificationClient: Client | null = null;
let notificationSubscription: StompSubscription | null = null;

function wsUrl(): string {
  const base = import.meta.env.VITE_WS_URL as string | undefined;
  if (base) return `${base.replace(/\/$/, '')}/ws`;
  return `${window.location.origin}/ws`;
}

export function connectNotificationSocket(
  getToken: TokenProvider,
  onNotification: NotificationHandler
): void {
  if (notificationClient?.connected) return;

  const token = getToken();
  if (!token) return;

  notificationClient = new Client({
    webSocketFactory: () => new SockJS(wsUrl()),
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    beforeConnect: () => {
      const latestToken = getToken();
      notificationClient!.connectHeaders = latestToken
        ? { Authorization: `Bearer ${latestToken}` }
        : {};
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect: () => {
      notificationSubscription = notificationClient!.subscribe(
        '/user/queue/notifications',
        (msg: IMessage) => {
          try {
            const dto = parseNotificationPayload(JSON.parse(msg.body));
            if (dto) onNotification(dto);
          } catch {
            // ignore malformed payloads
          }
        }
      );
    },
  });

  notificationClient.activate();
}

export function isNotificationSocketConnected(): boolean {
  return Boolean(notificationClient?.connected);
}

export function disconnectNotificationSocket(): void {
  if (notificationSubscription) {
    notificationSubscription.unsubscribe();
    notificationSubscription = null;
  }
  if (notificationClient) {
    notificationClient.deactivate();
    notificationClient = null;
  }
}
