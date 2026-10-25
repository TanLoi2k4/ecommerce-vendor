import { useEffect, useRef, useCallback } from 'react';
import { sendTypingIndicator } from '../api/chatSocket';

export function useTypingIndicator(
  roomCode: string | null | undefined,
  currentUserId: string | null | undefined,
  onOtherTyping: (typing: boolean) => void
) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stopTypingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSentRef = useRef(false);

  const handleRemoteTyping = useCallback(
    (payload: { userId: string; typing?: boolean }) => {
      if (!currentUserId || payload.userId === currentUserId) return;
      const isTyping = payload.typing !== false;
      onOtherTyping(isTyping);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (isTyping) {
        typingTimeoutRef.current = setTimeout(() => onOtherTyping(false), 3000);
      }
    },
    [currentUserId, onOtherTyping]
  );

  const notifyTyping = useCallback(
    (hasContent: boolean) => {
      if (!roomCode) return;
      if (hasContent) {
        if (!lastSentRef.current) {
          sendTypingIndicator(roomCode, true);
          lastSentRef.current = true;
        }
        if (stopTypingRef.current) clearTimeout(stopTypingRef.current);
        stopTypingRef.current = setTimeout(() => {
          sendTypingIndicator(roomCode, false);
          lastSentRef.current = false;
        }, 1500);
      } else if (lastSentRef.current) {
        sendTypingIndicator(roomCode, false);
        lastSentRef.current = false;
      }
    },
    [roomCode]
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (stopTypingRef.current) clearTimeout(stopTypingRef.current);
      if (roomCode && lastSentRef.current) {
        sendTypingIndicator(roomCode, false);
      }
    };
  }, [roomCode]);

  return { handleRemoteTyping, notifyTyping };
}
