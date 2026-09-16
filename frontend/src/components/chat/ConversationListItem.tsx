import { Conversation } from '../../types';
import { Avatar } from '../common/Avatar';
import { classNames, formatConversationDate } from '../../utils/format';
import { Users } from 'lucide-react';

interface Props {
  conversation: Conversation;
  currentUserId: string;
  isActive: boolean;
  isOnline: boolean;
  onSelect: () => void;
}

function getDisplayInfo(conversation: Conversation, currentUserId: string) {
  if (conversation.type === 'group') {
    return {
      name: conversation.groupName ?? 'Group chat',
      avatar: conversation.groupAvatar,
      isGroup: true,
    };
  }
  const other = conversation.participants.find((p) => p._id !== currentUserId);
  return { name: other?.name ?? 'Unknown user', avatar: other?.avatar, isGroup: false };
}

export function ConversationListItem({ conversation, currentUserId, isActive, isOnline, onSelect }: Props) {
  const { name, avatar, isGroup } = getDisplayInfo(conversation, currentUserId);
  const preview = conversation.lastMessage
    ? `${conversation.lastMessage.sender._id === currentUserId ? 'You: ' : ''}${conversation.lastMessage.content}`
    : 'No messages yet';

  return (
    <button
      onClick={onSelect}
      className={classNames(
        'group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition',
        isActive ? 'border-accent/25 bg-accent/10 shadow-lg shadow-black/5' : 'border-transparent hover:border-token hover:bg-ink-800/45'
      )}
    >
      {isGroup ? (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-700 text-slate-300">
          <Users className="h-5 w-5" />
        </div>
      ) : (
        <Avatar name={name} src={avatar} isOnline={isOnline} />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className={classNames('truncate text-sm font-semibold', isActive ? 'text-primary' : 'text-secondary group-hover:text-primary')}>{name}</span>
          {conversation.lastMessage && (
            <span className="shrink-0 text-[11px] text-tertiary">
              {formatConversationDate(conversation.lastMessage.createdAt)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-tertiary">{preview}</span>
          {conversation.unreadCount > 0 && (
            <span className="flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-semibold text-ink-950">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
