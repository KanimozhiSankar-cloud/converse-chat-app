import { FormEvent, useEffect, useRef, useState } from 'react';
import { FilePlus2, Gift, Laugh, Mic, MicOff, Paperclip, Send, SmilePlus, X } from 'lucide-react';
import { Spinner } from '../common/Spinner';
import { useToast } from '../../context/ToastContext';

interface Props {
  onSend: (content: string) => Promise<void>;
  isSending: boolean;
  onTyping?: (isTyping: boolean) => void;
  disabled?: boolean;
  replyTo?: string | null;
  onClearReply?: () => void;
}
export function MessageInput({ onSend, onTyping, isSending, disabled, replyTo, onClearReply }: Props) {
  const [content, setContent] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerRef = useRef<HTMLFormElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<number | null>(null);
  const { showToast } = useToast();
  const emojis = ['😀', '😂', '😍', '🤔', '😮', '😢', '😡', '👍', '👎', '🙏', '🔥', '✨', '❤️', '🎉', '🤝', '💡', '🚀', '✅'];

  useEffect(() => () => {
    if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
    mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop());
  }, []);

  useEffect(() => {
    if (!showEmojiPicker && !showAttachmentMenu) return;
    const handlePointerDown = (event: MouseEvent) => {
      if (!composerRef.current?.contains(event.target as Node)) {
        setShowEmojiPicker(false);
        setShowAttachmentMenu(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (showEmojiPicker) setShowEmojiPicker(false);
      else setShowAttachmentMenu(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showAttachmentMenu, showEmojiPicker]);

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    const start = textarea?.selectionStart ?? content.length;
    const next = `${content.slice(0, start)}${emoji}${content.slice(textarea?.selectionEnd ?? start)}`;
    setContent(next);
    onTyping?.(true);
    setShowEmojiPicker(false);
    requestAnimationFrame(() => {
      textarea?.focus();
      const position = start + emoji.length;
      textarea?.setSelectionRange(position, position);
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (attachment) {
      showToast('File uploads are not available until media storage is configured.', 'error');
      return;
    }
    if (trimmed.length === 0) {
      setValidationError('Type a message before sending.');
      return;
    }
    setValidationError(null);
    setContent('');
    try {
      onTyping?.(false);
      await onSend(trimmed);
    } catch {
      // Restore the draft so the user doesn't lose it if sending failed.
      setContent(trimmed);
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setAttachment(file);
    setShowAttachmentMenu(false);
    event.target.value = '';
  }

  async function toggleRecording() {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      showToast('Voice recording is not supported in this browser.', 'error');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        if (recordingTimerRef.current) window.clearInterval(recordingTimerRef.current);
        showToast('Voice messages require media storage, which is not configured.', 'error');
      };
      recorder.start();
      setRecordingSeconds(0);
      setIsRecording(true);
      recordingTimerRef.current = window.setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    } catch {
      showToast('Microphone permission was denied.', 'error');
    }
  }

  return (
    <div className="bg-page px-4 pb-4 pt-3 md:px-7 md:pb-6">
      {validationError && <p className="mb-2 px-1 text-xs text-red-400">{validationError}</p>}
      <form ref={composerRef} onSubmit={handleSubmit} className="glass-panel relative flex items-end gap-1.5 rounded-xl p-1.5">
        {replyTo && <div className="absolute bottom-full left-2 right-2 mb-2 flex items-center gap-2 rounded-xl border border-token bg-raised p-2 text-xs text-secondary"><span className="min-w-0 flex-1 truncate">Replying to: {replyTo}</span><button type="button" onClick={onClearReply} aria-label="Cancel reply" title="Cancel reply" className="text-secondary hover:text-primary"><X className="h-4 w-4" /></button></div>}
        <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt" onChange={handleFileChange} className="hidden" />
        <div className="relative"><button type="button" onClick={() => setShowAttachmentMenu((current) => !current)} aria-label="Attach file" title="Attach file" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-secondary transition hover:bg-ink-800 hover:text-accent"><FilePlus2 className="h-4 w-4" /></button>{showAttachmentMenu && <div className="absolute bottom-12 left-0 z-20 w-40 rounded-xl border border-token bg-raised p-1 shadow-xl"><button type="button" onClick={() => fileInputRef.current?.click()} className="menu-item">Image, video or file</button></div>}</div>
        <button type="button" onClick={() => showToast('GIF search is unavailable until a GIF service is configured.', 'error')} aria-label="Add GIF" title="Add GIF" className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl text-secondary transition hover:bg-ink-800 hover:text-accent sm:flex"><Gift className="h-5 w-5" /></button>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            onTyping?.(e.target.value.trim().length > 0);
            setContent(e.target.value);
            if (validationError) setValidationError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          disabled={disabled}
          rows={1}
          placeholder="Write a message..."
          className="max-h-32 min-h-10 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm text-primary placeholder:text-tertiary outline-none disabled:opacity-50"
        />
        {isRecording && <span className="shrink-0 self-center text-xs font-medium text-accent">Recording {recordingSeconds}s</span>}
        {attachment && <div className="absolute bottom-full left-2 right-2 mb-2 flex items-center gap-2 rounded-xl border border-token bg-raised p-2 text-xs text-secondary"><Paperclip className="h-3.5 w-3.5 shrink-0 text-accent" /><span className="min-w-0 flex-1 truncate">{attachment.name} · {(attachment.size / 1024).toFixed(1)} KB</span><button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment" title="Remove attachment" className="text-secondary hover:text-red-300"><X className="h-4 w-4" /></button></div>}
        <div className="relative">
          <button type="button" aria-label="Open emoji picker" title="Add emoji" onClick={() => setShowEmojiPicker((current) => !current)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-secondary transition hover:bg-ink-800 hover:text-accent"><SmilePlus className="h-4 w-4" /></button>
          {showEmojiPicker && <div className="absolute bottom-12 right-0 z-20 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border border-token bg-raised p-3 shadow-2xl backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between"><span className="text-xs font-semibold uppercase tracking-wider text-secondary">Emoji</span><Laugh className="h-4 w-4 text-accent" /></div><input value={emojiSearch} onChange={(event) => setEmojiSearch(event.target.value)} aria-label="Search emoji" placeholder="Search emoji" className="mb-2 w-full rounded-lg border border-token bg-input px-2 py-1.5 text-xs text-primary outline-none focus:border-accent" />
            <p className="mb-1 text-[10px] uppercase tracking-wider text-tertiary">Recently used</p><div className="grid grid-cols-6 gap-1">{emojis.filter((emoji) => !emojiSearch || emoji.includes(emojiSearch)).map((emoji) => <button key={emoji} type="button" onClick={() => insertEmoji(emoji)} aria-label={`Insert ${emoji}`} className="flex h-9 items-center justify-center rounded-lg text-lg transition hover:bg-ink-800">{emoji}</button>)}</div>
          </div>}
        </div>
        <button
          type="submit"
          onClick={(event) => {
            if (!content.trim() && !attachment) {
              event.preventDefault();
              void toggleRecording();
            }
          }}
          disabled={disabled || isSending}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-ink-950 transition hover:bg-accent-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? <Spinner size="sm" className="border-ink-950 border-t-transparent" /> : content.trim() || attachment ? <Send className="h-4 w-4" /> : isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}
