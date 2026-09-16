import { useEffect, useRef } from 'react';
import { Message } from '../../types';
import { MessageBubble } from './MessageBubble';
import { Spinner } from '../common/Spinner';
import { EmptyState } from '../common/EmptyState';
import { MessageSquare } from 'lucide-react';

interface Props {
  messages: Message[];
  currentUserId: string;
  isLoading: boolean;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDeleteRequest?: (message: Message) => void;
  onReply?: (message: Message) => void;
  highlightedMessageId?: string | null;
}

export function MessageList({ messages, currentUserId, isLoading, onEdit, onDeleteRequest, onReply, highlightedMessageId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!highlightedMessageId) return;
    document.querySelector(`[data-message-id="${highlightedMessageId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [highlightedMessageId]);

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        icon={<MessageSquare className="h-7 w-7" />}
        title="No messages yet"
        description="Say hello and start the conversation."
      />
    );
  }

  return (
    <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-5 py-5 md:px-7 md:py-6">
      {messages.map((message, index) => {
        const previous = messages[index - 1];
        const showSender = !previous || previous.sender._id !== message.sender._id;
        const currentDate = new Date(message.createdAt).toDateString();
        const previousDate = previous ? new Date(previous.createdAt).toDateString() : '';
        return (
          <div key={message._id} data-message-id={message._id} className={highlightedMessageId === message._id ? 'message-search-highlight' : undefined}>
            {currentDate !== previousDate && <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-tertiary"><span className="h-px flex-1 bg-[var(--border)]" /><span>{currentDate === new Date().toDateString() ? 'Today' : currentDate}</span><span className="h-px flex-1 bg-[var(--border)]" /></div>}
            <MessageBubble
              message={message}
              isOwn={message.sender._id === currentUserId}
              showSender={showSender}
              onEdit={onEdit}
              onDeleteRequest={onDeleteRequest}
              onReply={onReply}
            />
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
