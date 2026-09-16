import { useCallback, useState } from 'react';
import { Conversation, Message } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useSocketContext } from '../../context/SocketContext';
import { useMessages } from '../../hooks/useMessages';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ErrorBanner } from '../common/ErrorBanner';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';

export function ChatWindow({ conversation, onBack }: { conversation: Conversation; onBack?: () => void }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const { socket, onlineUserIds } = useSocketContext();
  const { messages, isLoading, error, isSending, typingUserId, sendMessage, updateMessage, removeMessage } = useMessages(conversation._id);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const other =
    conversation.type === 'private'
      ? conversation.participants.find((p) => p._id !== user?._id)
      : undefined;
  const isOnline = other ? onlineUserIds.has(other._id) : false;

  async function handleEdit(messageId: string, content: string) {
    try {
      await updateMessage(messageId, content);
      showToast('Message updated successfully');
    } catch (editError) {
      showToast(getErrorMessage(editError) || 'Unable to update message. Please try again.', 'error');
      throw editError;
    }
  }

  async function handleDelete() {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      await removeMessage(messageToDelete._id);
      setMessageToDelete(null);
      showToast('Message deleted successfully');
    } catch (deleteError) {
      showToast(getErrorMessage(deleteError) || 'Unable to delete message. Please try again.', 'error');
    } finally {
      setIsDeleting(false);
    }
  }

  const highlightSearchResult = useCallback((messageId: string) => {
    setHighlightedMessageId(messageId);
    window.setTimeout(() => setHighlightedMessageId((current) => current === messageId ? null : current), 1800);
  }, []);

  return (
    <div className="app-shell relative flex h-full flex-1 flex-col overflow-hidden">
      <ChatHeader conversation={conversation} currentUserId={user?._id ?? ''} isOnline={isOnline} onBack={onBack} onSearchResult={highlightSearchResult} />

      {error && (
        <div className="px-5 pt-3 md:px-7">
          <ErrorBanner message={error} />
        </div>
      )}

      <MessageList messages={messages} currentUserId={user?._id ?? ''} isLoading={isLoading} onEdit={handleEdit} onDeleteRequest={setMessageToDelete} onReply={setReplyTo} highlightedMessageId={highlightedMessageId} />
      {typingUserId && <p className="px-7 pb-2 text-xs text-secondary"><span className="mr-1 inline-flex gap-0.5 align-middle"><i className="h-1 w-1 animate-pulse rounded-full bg-accent" /><i className="h-1 w-1 animate-pulse rounded-full bg-accent [animation-delay:120ms]" /><i className="h-1 w-1 animate-pulse rounded-full bg-accent [animation-delay:240ms]" /></span>Typing...</p>}
      <MessageInput
        onSend={async (content) => {
          await sendMessage(replyTo ? `Replying to "${replyTo.content}": ${content}` : content);
          setReplyTo(null);
        }}
        onTyping={(isTyping) => socket?.emit(isTyping ? 'typing:start' : 'typing:stop', conversation._id)}
        isSending={isSending}
        replyTo={replyTo?.content}
        onClearReply={() => setReplyTo(null)}
      />
      <ConfirmDialog
        open={Boolean(messageToDelete)}
        title="Delete message for everyone?"
        description="This message will be removed for everyone in this conversation. This action cannot be undone."
        confirmText="Delete for everyone"
        loading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => { if (!isDeleting) setMessageToDelete(null); }}
      />
    </div>
  );
}
