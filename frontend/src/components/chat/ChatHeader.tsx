import { ArrowLeft, MoreHorizontal, Phone, Search, Users, Video } from 'lucide-react';
import { Conversation } from '../../types';
import { Avatar } from '../common/Avatar';
import { formatLastSeen } from '../../utils/format';
import { useState } from 'react';
import { useEffect, useRef } from 'react';
import { CallModal, ContactPanel, HeaderMenu, MessageSearch } from './ChatHeaderActions';

interface Props {
  conversation: Conversation;
  currentUserId: string;
  isOnline: boolean;
  onBack?: () => void;
  onSearchResult?: (messageId: string) => void;
  onClearChat?: () => void;
  onDeleteChat?: () => void;
}

export function ChatHeader({ conversation, currentUserId, isOnline, onBack, onSearchResult, onClearChat, onDeleteChat }: Props) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [callMode, setCallMode] = useState<'voice' | 'video' | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const isGroup = conversation.type === 'group';
  const other = conversation.participants.find((p) => p._id !== currentUserId);
  const name = isGroup ? conversation.groupName ?? 'Group chat' : other?.name ?? 'Unknown user';

  const statusText = isGroup
    ? `${conversation.participants.length} members`
    : isOnline
    ? 'Online'
    : `Last seen ${formatLastSeen(other?.lastSeen)}`;

  function openSearch() {
    setMenuOpen(false);
    setContactOpen(false);
    setSearchOpen(true);
  }

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  return (
    <div ref={headerRef} className="glass-subtle relative z-[var(--z-dropdown)] flex min-h-[73px] items-center gap-3 border-x-0 border-t-0 px-5 py-4 md:px-7">
      {searchOpen ? (
        <MessageSearch conversation={conversation} onCloseSearch={() => setSearchOpen(false)} onSelectMessage={onSearchResult} />
      ) : <>
        {onBack && <button type="button" onClick={onBack} aria-label="Back to conversations" title="Back" className="-ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-secondary hover:bg-ink-800 hover:text-primary md:hidden"><ArrowLeft className="h-5 w-5" /></button>}
        <button type="button" onClick={() => setContactOpen(true)} aria-label="Open contact details" title="Contact details" className="shrink-0 rounded-full">
        {isGroup ? (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-700 text-slate-300">
            <Users className="h-5 w-5" />
          </div>
        ) : (
          <Avatar name={name} src={other?.avatar} isOnline={isOnline} />
        )}
        </button>
        <button type="button" onClick={() => setContactOpen(true)} aria-label="Open contact details" title="Contact details" className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-semibold text-primary">{name}</p>
          <p className="flex items-center gap-1.5 truncate text-xs text-secondary"><span className={isOnline ? 'h-1.5 w-1.5 rounded-full bg-accent' : 'h-1.5 w-1.5 rounded-full bg-ink-600'} />{statusText}</p>
        </button>
        <div className="ml-auto flex shrink-0 items-center gap-1">
        <button type="button" onClick={openSearch} aria-label="Search messages" title="Search messages" className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary transition hover:bg-ink-800 hover:text-accent"><Search className="h-4 w-4" /></button>
         <button type="button" onClick={() => setMenuOpen((current) => !current)} aria-label="Open conversation options" title="More options" className="flex h-9 w-9 items-center justify-center rounded-xl text-secondary transition hover:bg-ink-800 hover:text-accent"><MoreHorizontal className="h-4 w-4" /></button>
        </div>
      </>}
      {menuOpen && <HeaderMenu conversationId={conversation._id} onContact={() => { setMenuOpen(false); setContactOpen(true); }} onSearch={openSearch} onClear={onClearChat} onDelete={onDeleteChat} />}
      {callMode && <CallModal conversation={conversation} currentUserId={currentUserId} mode={callMode} onClose={() => setCallMode(null)} />}
      {contactOpen && <ContactPanel conversation={conversation} currentUserId={currentUserId} isOnline={isOnline} onClose={() => setContactOpen(false)} onCloseSearch={() => setSearchOpen(false)} onSearch={openSearch} />}
    </div>
  );
}
