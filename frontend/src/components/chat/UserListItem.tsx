import { User } from '../../types';
import { Avatar } from '../common/Avatar';
import { Check, MessageCircle } from 'lucide-react';
import { classNames } from '../../utils/format';

interface Props {
  user: User;
  onClick: () => void;
  selected?: boolean;
  selectable?: boolean;
}

export function UserListItem({ user, onClick, selected, selectable }: Props) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-ink-800/60"
    >
      <Avatar name={user.name} src={user.avatar} isOnline={user.isOnline} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-100">{user.name}</p>
        <p className="truncate text-xs text-slate-500">{user.username ? `@${user.username} · ` : ''}{user.isOnline ? 'Online' : 'Offline'}</p>
      </div>
      {selectable && (
        <div
          className={classNames(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border',
            selected ? 'border-accent bg-accent text-ink-950' : 'border-ink-600'
          )}
        >
          {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
        </div>
      )}
      {!selectable && <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-secondary" aria-label="Start chat"><MessageCircle className="h-4 w-4" /></span>}
    </button>
  );
}
