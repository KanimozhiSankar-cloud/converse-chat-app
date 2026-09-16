import { useMemo, useState } from 'react';
import { LogOut, MessageCircle, Moon, Plus, Search, Settings, Sun, UsersRound, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocketContext } from '../../context/SocketContext';
import { Conversation, User } from '../../types';
import { Avatar } from '../common/Avatar';
import { Spinner } from '../common/Spinner';
import { ErrorBanner } from '../common/ErrorBanner';
import { ConversationListItem } from '../chat/ConversationListItem';
import { UserListItem } from '../chat/UserListItem';
import { NewGroupModal } from '../chat/NewGroupModal';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { useEffect } from 'react';
import { fetchUsers } from '../../services/userService';
import { getErrorMessage } from '../../services/api';
import { classNames } from '../../utils/format';
import { useTheme } from '../../context/ThemeContext';
import { SettingsPanel } from './SettingsPanel';

interface Props {
  conversations: Conversation[];
  isLoadingConversations: boolean;
  conversationsError: string | null;
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onStartConversation: (userId: string) => void;
  onGroupCreated: (conversationId: string) => void;
  isConversationOpen: boolean;
}

type Tab = 'chats' | 'people';
type ChatFilter = 'all' | 'unread' | 'groups';

export function Sidebar({
  conversations,
  isLoadingConversations,
  conversationsError,
  activeConversationId,
  onSelectConversation,
  onStartConversation,
  onGroupCreated,
  isConversationOpen,
}: Props) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { onlineUserIds } = useSocketContext();
  const [tab, setTab] = useState<Tab>('chats');
  const [chatFilter, setChatFilter] = useState<ChatFilter>('all');
  const [search, setSearch] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

  useEffect(() => {
    if (tab !== 'people') return;
    setIsLoadingUsers(true);
    setUsersError(null);
    fetchUsers(debouncedSearch)
      .then(setUsers)
      .catch((err) => setUsersError(getErrorMessage(err)))
      .finally(() => setIsLoadingUsers(false));
  }, [tab, debouncedSearch]);

  const filteredConversations = useMemo(() => {
    const filterMatches = conversations.filter((conversation) => {
      if (chatFilter === 'unread') return conversation.unreadCount > 0;
      if (chatFilter === 'groups') return conversation.type === 'group';
      return true;
    });
    if (!search.trim()) return filterMatches;
    const query = search.trim().toLowerCase();
    return filterMatches.filter((c) => {
      const name =
        c.type === 'group'
          ? c.groupName ?? ''
          : c.participants.find((p) => p._id !== user?._id)?.name ?? '';
      return name.toLowerCase().includes(query);
    });
  }, [conversations, search, user?._id]);

  return (
    <aside className={classNames('h-full w-full max-w-[22rem] flex-col border-r border-token bg-raised/70 md:flex', isConversationOpen ? 'hidden' : 'flex')}>
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-ink-950 shadow-lg shadow-accent/15">
              <MessageCircle className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-primary">CONVERSE</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-tertiary">quietly connected</p>
            </div>
          </div>
          <button type="button" onClick={() => { setTab('people'); setSearch(''); }} title="New conversation" aria-label="New conversation" className="flex h-9 w-9 items-center justify-center rounded-xl border border-token text-secondary transition hover:border-accent/50 hover:bg-ink-800 hover:text-accent"><Plus className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="mx-4 mb-4 flex items-center justify-between gap-3 rounded-2xl border border-token bg-ink-900/70 p-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar name={user?.name ?? ''} src={user?.avatar} size="sm" showStatusDot={false} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-primary">{user?.name}</p>
            <p className="truncate text-xs text-secondary">Available to chat</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={toggleTheme} title={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'} className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-ink-800 hover:text-accent">{theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</button>
          <button type="button" onClick={() => setShowSettings(true)} title="Settings" aria-label="Open settings" className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-ink-800 hover:text-accent"><Settings className="h-4 w-4" /></button>
          <button type="button" onClick={logout} title="Log out" aria-label="Log out" className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-ink-800 hover:text-red-300"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="px-4">
        <div className="search-input-wrapper relative">
          <Search className="search-input-icon pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2" />
          <input
            type="search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tab === 'chats' ? 'Search conversations...' : 'Search people...'}
            className="search-input w-full rounded-xl border py-2.5 pl-11 pr-10 text-sm outline-none transition focus:ring-2"
          />
          {search && (
            <button
              type="button"
              aria-label="Clear search"
              title="Clear search"
              onClick={() => setSearch('')}
              className="search-input-clear absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-1 px-4">
        <button
          onClick={() => setTab('chats')}
          className={classNames(
            'flex-1 rounded-lg py-1.5 text-sm font-medium transition',
            tab === 'chats' ? 'bg-accent/10 text-accent' : 'text-secondary hover:text-primary'
          )}
        >
          Chats
        </button>
        <button
          onClick={() => setTab('people')}
          className={classNames(
            'flex-1 rounded-lg py-1.5 text-sm font-medium transition',
            tab === 'people' ? 'bg-accent/10 text-accent' : 'text-secondary hover:text-primary'
          )}
        >
          People
        </button>
        <button
          onClick={() => setShowGroupModal(true)}
          title="New group"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-secondary transition hover:bg-ink-800 hover:text-accent"
        >
          <UsersRound className="h-4 w-4" />
        </button>
      </div>

      {tab === 'chats' && <div className="mt-4 flex gap-1 px-4">
        {(['all', 'unread', 'groups'] as ChatFilter[]).map((filter) => {
          const count = filter === 'all' ? conversations.length : filter === 'unread' ? conversations.filter((conversation) => conversation.unreadCount > 0).length : conversations.filter((conversation) => conversation.type === 'group').length;
          return <button key={filter} type="button" onClick={() => setChatFilter(filter)} className={classNames('rounded-full px-3 py-1 text-xs font-medium capitalize transition', chatFilter === filter ? 'bg-ink-800 text-primary' : 'text-tertiary hover:text-secondary')}>{filter} <span className="text-[10px] text-tertiary">{count}</span></button>;
        })}
      </div>}

      {/* List */}
      <div className="scrollbar-thin mt-3 flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {tab === 'chats' ? (
          isLoadingConversations ? (
            <div className="flex justify-center py-10">
              <Spinner />
            </div>
          ) : conversationsError ? (
            <div className="px-2 py-4">
              <ErrorBanner message={conversationsError} />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-14 text-center text-slate-500">
              <MessageCircle className="h-8 w-8" />
              <p className="text-sm">No conversations yet</p>
              <p className="max-w-[14rem] text-xs">
                Switch to the People tab to start a new chat.
              </p>
            </div>
          ) : (
            filteredConversations.map((conversation) => {
              const other =
                conversation.type === 'private'
                  ? conversation.participants.find((p) => p._id !== user?._id)
                  : undefined;
              return (
                <ConversationListItem
                  key={conversation._id}
                  conversation={conversation}
                  currentUserId={user?._id ?? ''}
                  isActive={conversation._id === activeConversationId}
                  isOnline={other ? onlineUserIds.has(other._id) : false}
                  onSelect={() => onSelectConversation(conversation._id)}
                />
              );
            })
          )
        ) : isLoadingUsers ? (
          <div className="flex justify-center py-10">
            <Spinner />
          </div>
        ) : usersError ? (
          <div className="px-2 py-4">
            <ErrorBanner message={usersError} />
          </div>
        ) : users.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500">No users found.</p>
        ) : (
          users.map((person) => (
            <UserListItem
              key={person._id}
              user={{ ...person, isOnline: onlineUserIds.has(person._id) }}
              onClick={() => onStartConversation(person._id)}
            />
          ))
        )}
      </div>

      {showGroupModal && (
        <NewGroupModal
          onClose={() => setShowGroupModal(false)}
          onCreated={(conversationId) => {
            setShowGroupModal(false);
            onGroupCreated(conversationId);
          }}
        />
      )}
      {showSettings && user && <SettingsPanel user={user} onClose={() => setShowSettings(false)} />}
    </aside>
  );
}
