import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Search, Image, AlertCircle, Flag, Package } from 'lucide-react';
import { useChatStore } from '../../store';
import { registerTypingListener, stopChatPolling } from '../../api/chatSocket';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { getUserIdFromToken, isTokenExpired } from '../../utils/jwt';
import { toast } from '../../components/ui/Toast';
import { EmptyState, LoadingSkeleton } from '../../components/ui';
import { ChatMessageBubble } from '../../components/chat/ChatMessageBubble';
import { ProductPickerModal } from '../../components/chat/ProductPickerModal';
import { ReportModal } from '../../components/reports/ReportModal';
import { formatRelativeTime, getInitials } from '../../utils/helpers';

export function ChatPage() {
  const [searchParams] = useSearchParams();
  const roomFromQuery = searchParams.get('room');
  const {
    conversations,
    loadConversations,
    loadConversation,
    sendMessage,
    sendImage,
    sendProduct,
    isLoading,
    error,
    clearError,
    clearActiveRoom,
  } = useChatStore();
  const [selectedRoomCode, setSelectedRoomCode] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [productPickerOpen, setProductPickerOpen] = useState(false);
  const [revealedMetaId, setRevealedMetaId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentUserId = getUserIdFromToken();

  const activeConversation = useMemo(
    () => conversations.find((c) => c.roomCode === selectedRoomCode) ?? null,
    [conversations, selectedRoomCode]
  );

  const onOtherTyping = useCallback((typing: boolean) => setIsTyping(typing), []);
  const { handleRemoteTyping, notifyTyping } = useTypingIndicator(
    selectedRoomCode,
    currentUserId,
    onOtherTyping
  );

  useEffect(() => {
    if (!currentUserId) {
      toast.error('Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.');
      return;
    }
    if (isTokenExpired()) {
      toast.error('Token đã hết hạn. Vui lòng đăng nhập lại.');
      return;
    }

    void loadConversations()
      .then(() => {
        if (roomFromQuery) {
          setSelectedRoomCode(roomFromQuery);
          return loadConversation(roomFromQuery);
        }
        return undefined;
      })
      .catch(() => undefined)
      .finally(() => setInitialLoading(false));

    return () => {
      stopChatPolling();
      registerTypingListener(null, null);
      clearActiveRoom();
    };
  }, [loadConversations, loadConversation, currentUserId, roomFromQuery, clearActiveRoom]);

  useEffect(() => {
    setRevealedMetaId(null);
  }, [selectedRoomCode]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  useEffect(() => {
    registerTypingListener(selectedRoomCode, handleRemoteTyping);
    return () => registerTypingListener(null, null);
  }, [selectedRoomCode, handleRemoteTyping]);

  const filteredChats = useMemo(() => {
    const query = search.toLowerCase();
    const sorted = [...conversations].sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
    if (!query) return sorted;
    return sorted.filter(
      (m) =>
        m.customerName.toLowerCase().includes(query) ||
        m.lastMessage.toLowerCase().includes(query)
    );
  }, [conversations, search]);

  const handleSelectChat = async (roomCode: string) => {
    clearError();
    setSelectedRoomCode(roomCode);
    try {
      await loadConversation(roomCode);
    } catch {
      // Error surfaced via store + toast
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedRoomCode) return;
    const ok = await sendMessage(selectedRoomCode, newMessage);
    if (ok) {
      setNewMessage('');
      notifyTyping(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedRoomCode) return;
    void sendImage(selectedRoomCode, file);
    e.target.value = '';
  };

  const handleSendProduct = async (product: Parameters<typeof sendProduct>[1]) => {
    if (!selectedRoomCode) return;
    await sendProduct(selectedRoomCode, product);
  };

  const conversationMessages = activeConversation?.messages ?? [];
  const lastMessageId = conversationMessages[conversationMessages.length - 1]?.id;
  const lastOutgoingId = [...conversationMessages]
    .reverse()
    .find((m) => m.senderType === 'vendor')?.id;
  const isSupportRoom = activeConversation?.roomType === 'REPORT_ADMIN';

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
  }, [conversationMessages, selectedRoomCode, isTyping]);

  // Luôn hiện meta (giờ + Đã gửi/Đã xem) ở tin cuối và tin gửi đi gần nhất của vendor
  const isMetaVisible = (msgId: string) =>
    msgId === lastMessageId || msgId === lastOutgoingId || revealedMetaId === msgId;

  const handleMessageClick = (msgId: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    if (msgId === lastMessageId || msgId === lastOutgoingId) return;
    setRevealedMetaId((prev) => (prev === msgId ? null : msgId));
  };

  if (!currentUserId) {
    return (
      <EmptyState
        title="Yêu cầu xác thực"
        description="Vui lòng đăng nhập lại để sử dụng chat khách hàng."
        variant="error"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Chat khách hàng
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Trao đổi với khách hàng qua dịch vụ chat
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-error-50 dark:bg-error-950 border border-error-200 dark:border-error-800 text-error-700 dark:text-error-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="flex-1">{error}</div>
          <button type="button" onClick={clearError} className="text-xs underline">
            Đóng
          </button>
        </div>
      )}

      <div className="card grid grid-cols-1 lg:grid-cols-3 h-[calc(100vh-12rem)] min-h-[600px] overflow-hidden">
        <div className="border-r border-gray-200 dark:border-gray-700 flex flex-col min-h-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm cuộc trò chuyện..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
            {initialLoading ? (
              <LoadingSkeleton variant="list" count={1} />
            ) : filteredChats.length === 0 ? (
              <EmptyState
                title="Chưa có cuộc trò chuyện"
                description="Cuộc trò chuyện với khách hàng sẽ hiển thị tại đây"
                variant="no-data"
              />
            ) : (
              filteredChats.map((chat) => (
                <button
                  key={chat.roomCode ?? chat.customerId}
                  onClick={() => chat.roomCode && void handleSelectChat(chat.roomCode)}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800 ${
                    selectedRoomCode === chat.roomCode ? 'bg-primary-50 dark:bg-primary-950/50' : ''
                  }`}
                >
                  <div className="relative shrink-0">
                    {chat.customerAvatar ? (
                      <img
                        src={chat.customerAvatar}
                        alt={chat.customerName}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-medium">
                        {getInitials(chat.customerName)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium truncate">{chat.customerName}</p>
                      <span className="text-xs text-gray-400">
                        {formatRelativeTime(chat.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.lastMessage || 'Chưa có tin nhắn'}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-0.5">
                      {chat.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 flex flex-col min-h-0">
          {activeConversation ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {activeConversation.customerAvatar ? (
                      <img
                        src={activeConversation.customerAvatar}
                        alt={activeConversation.customerName}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-600 font-medium">
                        {getInitials(activeConversation.customerName)}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{activeConversation.customerName}</p>
                    {isTyping && (
                      <p className="text-sm text-success-500">Đang nhập...</p>
                    )}
                  </div>
                </div>
                {!isSupportRoom && (
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="btn btn-sm btn-ghost text-warning-600"
                    title="Báo cáo khách hàng"
                  >
                    <Flag className="w-4 h-4" />
                    Báo cáo
                  </button>
                )}
              </div>

              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin min-h-0"
              >
                {conversationMessages.map((msg) => {
                  const showMeta = isMetaVisible(msg.id);
                  const canToggleMeta =
                    msg.id !== lastMessageId && msg.id !== lastOutgoingId;
                  return (
                    <ChatMessageBubble
                      key={msg.id}
                      msg={msg}
                      showMeta={showMeta}
                      canToggleMeta={canToggleMeta}
                      onMessageClick={(e) => handleMessageClick(msg.id, e)}
                    />
                  );
                })}
              </div>

              <div className="p-4 border-t border-gray-200 dark:border-gray-700 shrink-0">
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageSelect}
                  />
                  <button
                    type="button"
                    className="btn-ghost btn-icon"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title="Gửi hình ảnh"
                  >
                    <Image className="w-5 h-5" />
                  </button>
                  {!isSupportRoom && (
                    <button
                      type="button"
                      className="btn-ghost btn-icon"
                      onClick={() => setProductPickerOpen(true)}
                      disabled={isLoading}
                      title="Gửi sản phẩm"
                    >
                      <Package className="w-5 h-5" />
                    </button>
                  )}
                  <input
                    type="text"
                    placeholder={isSupportRoom ? 'Nhắn tin với hỗ trợ viên...' : 'Nhập tin nhắn...'}
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      notifyTyping(e.target.value.length > 0);
                    }}
                    onKeyDown={(e) => e.key === 'Enter' && void handleSend()}
                    className="input flex-1"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={isLoading || !newMessage.trim()}
                    className="btn-primary btn-icon"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              title="Chọn cuộc trò chuyện"
              description="Chọn khách hàng để bắt đầu trò chuyện"
              variant="no-data"
            />
          )}
        </div>
      </div>

      <ProductPickerModal
        isOpen={productPickerOpen}
        onClose={() => setProductPickerOpen(false)}
        onSelect={handleSendProduct}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        preset={{
          type: 'OTHER',
          targetKeycloakId:
            activeConversation && activeConversation.roomType !== 'REPORT_ADMIN'
              ? activeConversation.customerId
              : undefined,
          title: 'Báo cáo khách hàng',
          descriptionHint: `Mô tả hành vi của khách hàng ${activeConversation?.customerName ?? ''} trong cuộc trò chuyện...`,
        }}
      />
    </div>
  );
}
