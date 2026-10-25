import { Download, Package } from 'lucide-react';
import { formatMessageTime } from '../../utils/helpers';
import type { MessageItem } from '../../utils/types';
import { ChatProductCard } from './ChatProductCard';
import { OutgoingMessageMeta, IncomingMessageMeta } from './MessageReadStatus';

export interface ProductCardPayload {
  products?: Array<{
    id?: number | string;
    name?: string;
    price?: number;
    imageUrl?: string;
    category?: string;
    inquiry?: boolean;
  }>;
}

function parseProductCard(content: string): ProductCardPayload | null {
  try {
    return JSON.parse(content) as ProductCardPayload;
  } catch {
    return null;
  }
}

interface ChatMessageBubbleProps {
  msg: MessageItem;
  showMeta?: boolean;
  canToggleMeta?: boolean;
  onMessageClick?: (e: React.MouseEvent) => void;
}

export function ChatMessageBubble({
  msg,
  showMeta = true,
  canToggleMeta = false,
  onMessageClick,
}: ChatMessageBubbleProps) {
  if (msg.type === 'system' || msg.type === 'report_context') {
    return (
      <div className="flex justify-center">
        <p
          className={`text-xs px-3 py-1.5 rounded-lg max-w-[85%] text-center whitespace-pre-wrap ${
            msg.type === 'report_context'
              ? 'border border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100'
              : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'
          }`}
        >
          {msg.content}
        </p>
      </div>
    );
  }

  const isVendor = msg.senderType === 'vendor';

  if (msg.type === 'product_card') {
    return (
      <div className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}>
        <div
          className={`max-w-[70%] ${canToggleMeta ? 'cursor-pointer' : ''}`}
          onClick={canToggleMeta ? onMessageClick : undefined}
          role={canToggleMeta ? 'button' : undefined}
          tabIndex={canToggleMeta ? 0 : undefined}
        >
          <ProductCardContent content={msg.content} isVendor={isVendor} />
          {isVendor ? (
            <OutgoingMessageMeta
              createdAt={msg.createdAt}
              isRead={msg.isRead ?? false}
              placement="below-bubble"
              formatTime={formatMessageTime}
              visible={showMeta}
            />
          ) : (
            <IncomingMessageMeta
              createdAt={msg.createdAt}
              formatTime={formatMessageTime}
              visible={showMeta}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isVendor ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[70%] rounded-xl px-4 py-2 ${
          isVendor
            ? 'bg-primary-500 text-white'
            : 'bg-gray-100 dark:bg-gray-800'
        } ${canToggleMeta ? 'cursor-pointer' : ''}`}
        onClick={canToggleMeta ? onMessageClick : undefined}
        role={canToggleMeta ? 'button' : undefined}
        tabIndex={canToggleMeta ? 0 : undefined}
      >
        {msg.type === 'image' && msg.imageUrl ? (
          <a href={msg.imageUrl} target="_blank" rel="noreferrer">
            <img
              src={msg.imageUrl}
              alt="Tệp đính kèm"
              className="max-w-full rounded-lg max-h-64 object-cover"
            />
          </a>
        ) : msg.type === 'file' && msg.fileUrl ? (
          <a
            href={msg.fileUrl}
            target="_blank"
            rel="noreferrer"
            className={`flex items-center gap-2 text-sm underline ${
              isVendor ? 'text-primary-50' : 'text-primary-600'
            }`}
          >
            <Download className="w-4 h-4 shrink-0" />
            {msg.content || 'Tải tệp đính kèm'}
          </a>
        ) : (
          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
        )}
        {isVendor ? (
          <OutgoingMessageMeta
            createdAt={msg.createdAt}
            isRead={msg.isRead ?? false}
            placement="in-bubble"
            formatTime={formatMessageTime}
            visible={showMeta}
          />
        ) : (
          <IncomingMessageMeta
            createdAt={msg.createdAt}
            formatTime={formatMessageTime}
            visible={showMeta}
          />
        )}
      </div>
    </div>
  );
}

function ProductCardContent({
  content,
  isVendor,
}: {
  content: string;
  isVendor: boolean;
}) {
  const payload = parseProductCard(content);
  const products = payload?.products ?? [];

  if (products.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800">
        <Package className="w-4 h-4 shrink-0 text-gray-400" />
        <span className="text-gray-600 dark:text-gray-300">{content || 'Sản phẩm'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {products.map((product, index) => {
        const productId = product.id;
        const detailHref =
          productId != null ? `/products/${productId}` : undefined;

        return (
          <ChatProductCard
            key={String(productId ?? index)}
            product={product}
            to={detailHref}
            variant={isVendor ? 'outgoing' : 'incoming'}
            showInquiryHint={!isVendor && Boolean(product.inquiry)}
          />
        );
      })}
    </div>
  );
}
