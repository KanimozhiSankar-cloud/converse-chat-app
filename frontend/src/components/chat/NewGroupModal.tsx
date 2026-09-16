import { useEffect, useState } from 'react';
import { X, Users } from 'lucide-react';
import { User } from '../../types';
import { fetchUsers } from '../../services/userService';
import { createGroup } from '../../services/conversationService';
import { getErrorMessage } from '../../services/api';
import { UserListItem } from './UserListItem';
import { Spinner } from '../common/Spinner';
import { ErrorBanner } from '../common/ErrorBanner';

interface Props {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}

export function NewGroupModal({ onClose, onCreated }: Props) {
  const [users, setUsers] = useState<User[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoadingUsers(false));
  }, []);

  function toggleUser(userId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  async function handleCreate() {
    setError(null);
    if (groupName.trim().length === 0) {
      setError('Please give your group a name.');
      return;
    }
    if (selected.size < 2) {
      setError('Select at least 2 members to create a group.');
      return;
    }

    setIsCreating(true);
    try {
      const conversation = await createGroup(groupName.trim(), Array.from(selected));
      onCreated(conversation._id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="glass-panel flex max-h-[85vh] w-full max-w-md flex-col rounded-3xl">
        <div className="flex items-center justify-between border-b border-ink-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-accent" />
            <h3 className="text-base font-semibold text-slate-100">New group</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Close new group dialog" title="Close" className="text-slate-500 hover:text-slate-300">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-col gap-3 px-5 pt-4">
          {error && <ErrorBanner message={error} />}
          <input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Group name"
            className="w-full rounded-lg border border-ink-700 bg-ink-950 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Select members ({selected.size} selected)
          </p>
        </div>

        <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-2">
          {isLoadingUsers ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : users.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-slate-500">No other users found.</p>
          ) : (
            users.map((user) => (
              <UserListItem
                key={user._id}
                user={user}
                selectable
                selected={selected.has(user._id)}
                onClick={() => toggleUser(user._id)}
              />
            ))
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-ink-800 px-5 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 hover:bg-ink-800"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-ink-950 transition hover:bg-accent-light disabled:opacity-60"
          >
            {isCreating && <Spinner size="sm" className="border-ink-950 border-t-transparent" />}
            Create group
          </button>
        </div>
      </div>
    </div>
  );
}
