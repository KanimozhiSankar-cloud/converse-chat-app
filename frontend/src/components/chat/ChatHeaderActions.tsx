import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { BellOff, ChevronLeft, ChevronRight, Copy, FileStack, Mic, MicOff, PhoneOff, Search, Trash2, UserRound, Video, VideoOff, X } from 'lucide-react';
import { Conversation, Message, User } from '../../types';
import { Avatar } from '../common/Avatar';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../services/api';
import { searchConversationMessages } from '../../services/conversationService';
import { formatLastSeen } from '../../utils/format';

interface HeaderActionsProps {
  conversation: Conversation;
  currentUserId: string;
  isOnline: boolean;
  onCloseSearch: () => void;
}

interface ContactPanelProps {
  conversation: Conversation;
  currentUserId: string;
  isOnline: boolean;
  onClose: () => void;
  onSearch: () => void;
}

function highlight(content: string, query: string) {
  if (!query.trim()) return content;
  const parts = content.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')})`, 'ig'));
  return parts.map((part, index) => part.toLowerCase() === query.trim().toLowerCase()
    ? <mark key={index} className="rounded bg-accent/25 px-0.5 text-inherit">{part}</mark>
    : part);
}

export function MessageSearch({ conversation, onCloseSearch, onSelectMessage }: Pick<HeaderActionsProps, 'conversation' | 'onCloseSearch'> & { onSelectMessage?: (messageId: string) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseSearch();
      if (event.key === 'ArrowDown' && results.length > 0) setActiveIndex((current) => (current + 1) % results.length);
      if (event.key === 'ArrowUp' && results.length > 0) setActiveIndex((current) => (current - 1 + results.length) % results.length);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCloseSearch, results.length]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) onCloseSearch();
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [onCloseSearch]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      searchConversationMessages(conversation._id, query)
        .then((messages) => { setResults(messages); setActiveIndex(0); setError(null); })
        .catch((err) => setError(getErrorMessage(err)))
        .finally(() => setIsLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [conversation._id, query]);

  useEffect(() => {
    const activeMessage = results[activeIndex];
    if (activeMessage) onSelectMessage?.(activeMessage._id);
  }, [activeIndex, onSelectMessage, results]);

  return (
    <div ref={searchRef} className="relative flex min-w-0 flex-1 items-center gap-2">
      <button type="button" onClick={onCloseSearch} aria-label="Close message search" title="Close search" className="header-action-control"><ChevronLeft className="h-4 w-4" /></button>
      <div className="search-input-wrapper flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-token bg-input px-3">
        <Search className="search-input-icon h-4 w-4 shrink-0" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter' && results.length > 0) setActiveIndex((current) => (current + 1) % results.length); }}
          placeholder="Search messages..."
          aria-label="Search messages"
          className="min-w-0 flex-1 bg-transparent py-2 text-sm text-primary outline-none placeholder:text-tertiary"
        />
        <span className="shrink-0 text-[11px] font-medium text-secondary">{isLoading ? 'Searching...' : `${results.length} result${results.length === 1 ? '' : 's'}`}</span>
      </div>
      <button type="button" onClick={() => results.length && setActiveIndex((current) => (current - 1 + results.length) % results.length)} disabled={!results.length} aria-label="Previous result" title="Previous result" className="header-action-control hidden sm:flex"><ChevronLeft className="h-4 w-4" /></button>
      <button type="button" onClick={() => results.length && setActiveIndex((current) => (current + 1) % results.length)} disabled={!results.length} aria-label="Next result" title="Next result" className="header-action-control hidden sm:flex"><ChevronRight className="h-4 w-4" /></button>
      <button type="button" onClick={onCloseSearch} aria-label="Close message search" title="Close search" className="header-action-control"><X className="h-4 w-4" /></button>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {query.trim() && !isLoading && !error && (
        <div className="absolute left-12 right-12 top-full z-[var(--z-popover)] mt-2 max-h-64 space-y-1 overflow-x-hidden overflow-y-auto rounded-2xl border border-token bg-raised p-2 shadow-2xl sm:left-12 sm:right-12">
          {results.length === 0 ? <p className="px-1 py-2 text-xs text-tertiary">No matching messages.</p> : results.map((message, index) => (
            <button key={message._id} type="button" onClick={() => setActiveIndex(index)} className={`message-search-result block w-full rounded-xl px-3 py-2.5 text-left text-xs transition ${index === activeIndex ? 'bg-accent/10 text-primary' : 'text-secondary hover:bg-ink-800/60'}`}>
              <span className="mb-1 block truncate text-[10px] font-medium text-tertiary">{message.sender.name} · {new Date(message.createdAt).toLocaleString()}</span>
              <span className="block truncate">{highlight(message.content, query)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CallPanel({ conversation, currentUserId, mode, onClose }: { conversation: Conversation; currentUserId: string; mode: 'voice' | 'video'; onClose: () => void }) {
  const other = conversation.participants.find((participant) => participant._id !== currentUserId);
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(mode === 'video');
  const name = conversation.type === 'group' ? conversation.groupName ?? 'Group call' : other?.name ?? 'Unknown user';

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm">
      <div className="glass-panel w-full max-w-sm rounded-3xl p-6 text-center">
        <div className="mb-5 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{mode === 'voice' ? 'Voice call' : 'Video call'}</span><button type="button" onClick={onClose} aria-label="Close call" title="Close" className="text-secondary hover:text-primary"><X className="h-4 w-4" /></button></div>
        <Avatar name={name} src={other?.avatar ?? conversation.groupAvatar} size="lg" showStatusDot={false} />
        <h2 className="mt-4 text-lg font-semibold text-primary">{name}</h2>
        <p className="mt-1 text-sm text-secondary">Calling is unavailable until a call transport is configured.</p>
        <p className="mt-2 text-xs text-tertiary">No connection has been established.</p>
        <div className="mt-7 flex justify-center gap-3">
          <button type="button" onClick={() => setMuted((current) => !current)} aria-label={muted ? 'Unmute microphone' : 'Mute microphone'} title={muted ? 'Unmute' : 'Mute'} className={`flex h-11 w-11 items-center justify-center rounded-full ${muted ? 'bg-accent text-ink-950' : 'bg-ink-800 text-primary'}`}>{muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</button>
          {mode === 'video' && <button type="button" onClick={() => setCameraEnabled((current) => !current)} aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'} title={cameraEnabled ? 'Turn camera off' : 'Turn camera on'} className={`flex h-11 w-11 items-center justify-center rounded-full ${cameraEnabled ? 'bg-ink-800 text-primary' : 'bg-accent text-ink-950'}`}>{cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}</button>}
          <button type="button" onClick={onClose} aria-label="End call" title="End call" className="flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-400"><PhoneOff className="h-4 w-4" /></button>
        </div>
      </div>
    </div>
  );
}

export function CallModal(props: { conversation: Conversation; currentUserId: string; mode: 'voice' | 'video'; onClose: () => void }) {
  return <CallPanel {...props} />;
}

export function ContactPanel({ conversation, currentUserId, isOnline, onClose, onSearch }: ContactPanelProps) {
  const { showToast } = useToast();
  const other = conversation.participants.find((participant) => participant._id !== currentUserId);
  const contact: User | undefined = conversation.type === 'private' ? other : conversation.groupAdmin;
  const name = conversation.type === 'group' ? conversation.groupName ?? 'Group chat' : contact?.name ?? 'Unknown user';
  const handleUnavailable = (label: string) => showToast(`${label} is unavailable in this version.`, 'error');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return createPortal((
    <div className="fixed inset-0 z-[var(--z-modal)] bg-black/45" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="glass-panel absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto border-y-0 border-r-0 shadow-2xl scrollbar-thin">
        <div className="flex items-center justify-between border-b border-token px-6 py-5"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-accent">Conversation</p><h2 className="mt-1 text-lg font-semibold text-primary">Contact details</h2></div><button type="button" onClick={onClose} aria-label="Close contact details" title="Close" className="header-action-control"><X className="h-5 w-5" /></button></div>
        <div className="border-b border-token px-6 py-8"><div className="flex items-center gap-4"><Avatar name={name} src={contact?.avatar ?? conversation.groupAvatar} size="lg" showStatusDot={false} /><div className="min-w-0"><h3 className="truncate text-xl font-semibold text-primary">{name}</h3><p className="mt-1 flex items-center gap-2 text-sm text-secondary"><span className={isOnline ? 'h-2 w-2 rounded-full bg-accent' : 'h-2 w-2 rounded-full bg-ink-600'} />{conversation.type === 'group' ? `${conversation.participants.length} members` : isOnline ? 'Online now' : `Last seen ${formatLastSeen(contact?.lastSeen)}`}</p></div></div></div>
        <div className="px-6 py-6"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-tertiary">Profile information</p><div className="overflow-hidden rounded-2xl border border-token bg-input/40"><div className="border-b border-token px-4 py-4"><p className="text-xs text-tertiary">Username</p><p className="mt-1 truncate text-sm text-primary">{contact?.username ? `@${contact.username}` : 'Not provided'}</p></div><div className="border-b border-token px-4 py-4"><p className="text-xs text-tertiary">Email address</p><p className="mt-1 truncate text-sm text-primary">{contact?.email ?? 'Not available'}</p></div><div className="px-4 py-4"><p className="text-xs text-tertiary">About</p><p className="mt-1 text-sm text-secondary">No bio has been added.</p></div></div></div>
        <div className="mt-auto border-t border-token px-6 py-5"><p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-tertiary">Quick actions</p><div className="grid grid-cols-2 gap-3"><button type="button" onClick={onSearch} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-token text-sm font-medium text-secondary transition hover:border-accent/50 hover:bg-accent/10 hover:text-accent"><Search className="h-4 w-4" />Search</button><button type="button" onClick={() => handleUnavailable('Media')} className="flex h-10 items-center justify-center gap-2 rounded-xl border border-token text-sm font-medium text-secondary transition hover:border-accent/50 hover:bg-accent/10 hover:text-accent"><Copy className="h-4 w-4" />Media</button></div></div>
      </aside>
    </div>
  ), document.body);
}

export function HeaderMenu({ conversationId, onContact, onSearch, onClear, onDelete }: { conversationId: string; onContact: () => void; onSearch: () => void; onClear?: () => void; onDelete?: () => void }) {
  const { showToast } = useToast();
  const [muted, setMuted] = useState(() => localStorage.getItem(`muted:${conversationId}`) === 'true');
  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(`muted:${conversationId}`, String(next));
    showToast(next ? 'Notifications muted for this conversation' : 'Notifications unmuted');
  }
  return (
    <div className="conversation-menu absolute right-4 top-12 z-40 max-h-[calc(100vh-5rem)] w-[min(18rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto rounded-2xl border border-token bg-raised p-1.5 shadow-2xl scrollbar-thin md:right-7">
      <div className="border-b border-token px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-tertiary">Conversation options</div>
      <div className="py-1">
        <button type="button" onClick={onContact} className="conversation-menu-item"><UserRound className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">Contact info</span></button>
        <button type="button" onClick={onSearch} className="conversation-menu-item"><Search className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">Search messages</span></button>
      </div>
      <div className="border-t border-token py-1">
        <button type="button" onClick={onClear} disabled={!onClear} className="conversation-menu-item conversation-menu-item-disabled"><Trash2 className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">Clear chat</span>{!onClear && <span className="conversation-menu-badge">Unavailable</span>}</button>
        <button type="button" onClick={onDelete} disabled={!onDelete} className="conversation-menu-item conversation-menu-item-danger"><Trash2 className="h-4 w-4 shrink-0" /><span className="min-w-0 flex-1">Delete chat</span>{!onDelete && <span className="conversation-menu-badge">Unavailable</span>}</button>
      </div>
    </div>
  );
}
