import { useEffect, useRef, useState } from 'react';
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
      <button type="button" onClick={onCloseSearch} aria-label="Close message search" title="Close search" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-secondary transition hover:bg-ink-800 hover:text-accent"><ChevronLeft className="h-4 w-4" /></button>
      <div className="search-input-wrapper flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-token bg-input px-3">
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
        <span className="shrink-0 text-xs text-secondary">{isLoading ? 'Searching...' : `${results.length} result${results.length === 1 ? '' : 's'}`}</span>
      </div>
      <button type="button" onClick={() => results.length && setActiveIndex((current) => (current - 1 + results.length) % results.length)} disabled={!results.length} aria-label="Previous result" title="Previous result" className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-secondary transition hover:bg-ink-800 hover:text-accent disabled:opacity-40 sm:flex"><ChevronLeft className="h-4 w-4" /></button>
      <button type="button" onClick={() => results.length && setActiveIndex((current) => (current + 1) % results.length)} disabled={!results.length} aria-label="Next result" title="Next result" className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg text-secondary transition hover:bg-ink-800 hover:text-accent disabled:opacity-40 sm:flex"><ChevronRight className="h-4 w-4" /></button>
      <button type="button" onClick={onCloseSearch} aria-label="Close message search" title="Close search" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-secondary transition hover:bg-ink-800 hover:text-accent"><X className="h-4 w-4" /></button>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {query.trim() && !isLoading && !error && (
        <div className="absolute left-12 right-12 top-full z-[var(--z-popover)] mt-2 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-token bg-raised/95 p-1.5 shadow-xl backdrop-blur-xl sm:left-12 sm:right-12">
          {results.length === 0 ? <p className="px-1 py-2 text-xs text-tertiary">No matching messages.</p> : results.map((message, index) => (
            <button key={message._id} type="button" onClick={() => setActiveIndex(index)} className={`block w-full rounded-lg px-2 py-2 text-left text-xs transition ${index === activeIndex ? 'bg-accent/10 text-primary' : 'text-secondary hover:bg-ink-800/60'}`}>
              <span className="mb-0.5 block text-[10px] text-tertiary">{message.sender.name} · {new Date(message.createdAt).toLocaleString()}</span>
              <span>{highlight(message.content, query)}</span>
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

export function ContactPanel({ conversation, currentUserId, isOnline, onClose, onSearch }: HeaderActionsProps & { onSearch: () => void }) {
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

  return (
    <div className="fixed inset-0 z-[var(--z-modal)] bg-black/45" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <aside className="glass-panel absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-y-auto border-y-0 border-r-0 p-6 shadow-2xl scrollbar-thin">
        <div className="flex items-center justify-between"><h2 className="text-base font-semibold text-primary">Contact details</h2><button type="button" onClick={onClose} aria-label="Close contact details" title="Close" className="text-secondary hover:text-primary"><X className="h-5 w-5" /></button></div>
        <div className="flex flex-col items-center border-b border-token py-8"><Avatar name={name} src={contact?.avatar ?? conversation.groupAvatar} size="lg" showStatusDot={false} /><h3 className="mt-4 text-lg font-semibold text-primary">{name}</h3><p className="mt-1 text-sm text-secondary">{conversation.type === 'group' ? `${conversation.participants.length} members` : isOnline ? 'Online' : `Last seen ${formatLastSeen(contact?.lastSeen)}`}</p></div>
        <div className="space-y-3 border-b border-token py-5 text-sm"><div><p className="text-xs text-tertiary">Username</p><p className="text-primary">{contact?.username ? `@${contact.username}` : 'Not provided'}</p></div><div><p className="text-xs text-tertiary">Email</p><p className="text-primary">{contact?.email ?? 'Not available'}</p></div><div><p className="text-xs text-tertiary">About</p><p className="text-secondary">No bio has been added.</p></div></div>
        <div className="grid grid-cols-2 gap-2 py-5"><button type="button" onClick={onSearch} className="flex items-center justify-center gap-2 rounded-xl border border-token px-3 py-2 text-sm text-secondary hover:border-accent/50 hover:text-accent"><Search className="h-4 w-4" />Search</button><button type="button" onClick={() => handleUnavailable('Media')} className="flex items-center justify-center gap-2 rounded-xl border border-token px-3 py-2 text-sm text-secondary hover:border-accent/50 hover:text-accent"><Copy className="h-4 w-4" />Media</button></div>
      </aside>
    </div>
  );
}

export function HeaderMenu({ conversationId, onContact, onSearch }: { conversationId: string; onContact: () => void; onSearch: () => void }) {
  const { showToast } = useToast();
  const [muted, setMuted] = useState(() => localStorage.getItem(`muted:${conversationId}`) === 'true');
  function toggleMute() {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(`muted:${conversationId}`, String(next));
    showToast(next ? 'Notifications muted for this conversation' : 'Notifications unmuted');
  }
  return <div className="absolute right-4 top-12 z-40 w-60 rounded-xl border border-token bg-raised/95 p-1.5 shadow-xl backdrop-blur-xl md:right-7"><button type="button" onClick={onContact} className="menu-item flex items-center gap-2"><UserRound className="h-4 w-4" />Contact info</button><button type="button" onClick={onSearch} className="menu-item flex items-center gap-2"><Search className="h-4 w-4" />Search messages</button><button type="button" disabled className="menu-item flex cursor-not-allowed items-center gap-2 opacity-45"><FileStack className="h-4 w-4" />Media, links &amp; files <span className="ml-auto text-[10px]">Unavailable</span></button><button type="button" onClick={toggleMute} className="menu-item flex items-center gap-2"><BellOff className="h-4 w-4" />{muted ? 'Unmute notifications' : 'Mute notifications'}</button><button type="button" disabled className="menu-item flex cursor-not-allowed items-center gap-2 opacity-45"><Trash2 className="h-4 w-4" />Clear chat <span className="ml-auto text-[10px]">Unavailable</span></button><button type="button" disabled className="menu-item flex cursor-not-allowed items-center gap-2 text-red-300/50"><Trash2 className="h-4 w-4" />Delete chat <span className="ml-auto text-[10px]">Unavailable</span></button></div>;
}
