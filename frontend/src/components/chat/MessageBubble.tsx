import { useEffect, useState } from 'react';
import { Message } from '../../types';
import { Avatar } from '../common/Avatar';
import { classNames, formatMessageTime } from '../../utils/format';
import { Check, Copy, Pencil, Reply, SmilePlus, Trash2, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
  message: Message;
  isOwn: boolean;
  showSender: boolean;
  onEdit?: (messageId: string, content: string) => Promise<void>;
  onDeleteRequest?: (message: Message) => void;
  onReply?: (message: Message) => void;
}

export function MessageBubble({ message, isOwn, showSender, onEdit, onDeleteRequest, onReply }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [isSaving, setIsSaving] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    setDraft(message.content);
  }, [message.content]);

  async function handleSave() {
    const content = draft.trim();
    if (!content || !onEdit) return;
    setIsSaving(true);
    try {
      await onEdit(message._id, content);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }

  async function copyMessage() {
    await navigator.clipboard.writeText(message.content);
    showToast('Message copied');
  }

  return (
    <div className={classNames('flex animate-fade-in gap-2', isOwn ? 'flex-row-reverse' : 'flex-row')}>
      {!isOwn && (
        <div className="w-8 shrink-0">
          {showSender && <Avatar name={message.sender.name} src={message.sender.avatar} size="sm" showStatusDot={false} />}
        </div>
      )}

      <div className={classNames('flex max-w-[70%] flex-col', isOwn ? 'items-end' : 'items-start')}>
        {!isOwn && showSender && (
          <span className="mb-1 px-1 text-xs font-medium text-secondary">{message.sender.name}</span>
        )}
        <div className="group relative">
          {isEditing ? (
            <div className="min-w-[16rem] rounded-xl border border-accent/40 bg-ink-900 p-3">
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                autoFocus
                rows={3}
                disabled={isSaving}
                className="w-full resize-none rounded-lg border border-token bg-ink-950 px-3 py-2 text-sm text-primary outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                aria-label="Edit message"
              />
              <div className="mt-2 flex justify-end gap-2">
                <button type="button" onClick={() => { setDraft(message.content); setIsEditing(false); }} disabled={isSaving} className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary hover:bg-ink-800 hover:text-primary"><X className="h-3.5 w-3.5" />Cancel</button>
                <button type="button" onClick={handleSave} disabled={isSaving || draft.trim().length === 0} className="flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-ink-950 hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"><Check className="h-3.5 w-3.5" />{isSaving ? 'Saving...' : 'Save changes'}</button>
              </div>
            </div>
          ) : (
            <div className={classNames('whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-6', isOwn ? 'rounded-br-md bg-accent text-ink-950' : 'rounded-bl-md bg-ink-800/70 text-primary')}>
              {message.content}
            </div>
          )}
          {isOwn && !isEditing && (onEdit || onDeleteRequest) && <div className="absolute -top-8 right-0 hidden items-center gap-1 rounded-lg border border-ink-700 bg-ink-900 p-1 shadow-lg group-hover:flex">
            {onEdit && <button type="button" onClick={() => setIsEditing(true)} aria-label="Edit message" title="Edit message" className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-ink-800 hover:text-slate-100"><Pencil className="h-3.5 w-3.5" /></button>}
            {onDeleteRequest && <button type="button" onClick={() => onDeleteRequest(message)} aria-label="Delete message" title="Delete message" className="flex h-7 w-7 items-center justify-center rounded text-slate-400 hover:bg-ink-800 hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>}
          </div>}
          {!isEditing && <div className={classNames('absolute -top-8 hidden items-center gap-1 rounded-lg border border-token bg-raised p-1 shadow-lg group-hover:flex', isOwn ? 'right-0 -translate-x-24' : 'left-0')}>
            {onReply && <button type="button" onClick={() => onReply(message)} aria-label="Reply to message" title="Reply" className="flex h-7 w-7 items-center justify-center rounded text-secondary hover:bg-ink-800 hover:text-accent"><Reply className="h-3.5 w-3.5" /></button>}
            <button type="button" onClick={() => setReaction((current) => current ? null : '👍')} aria-label="React to message" title="React" className="flex h-7 w-7 items-center justify-center rounded text-secondary hover:bg-ink-800 hover:text-accent"><SmilePlus className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={copyMessage} aria-label="Copy message" title="Copy" className="flex h-7 w-7 items-center justify-center rounded text-secondary hover:bg-ink-800 hover:text-accent"><Copy className="h-3.5 w-3.5" /></button>
          </div>}
        </div>
        {reaction && <button type="button" onClick={() => setReaction(null)} className="mt-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent" aria-label="Remove reaction">{reaction}</button>}
        <span className="mt-1 px-1 text-[11px] text-tertiary">{formatMessageTime(message.createdAt)}{message.updatedAt !== message.createdAt && <span className="ml-1">· edited</span>}</span>
      </div>
    </div>
  );
}
