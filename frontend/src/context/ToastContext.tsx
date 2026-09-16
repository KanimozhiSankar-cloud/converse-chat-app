import { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { Avatar } from '../components/common/Avatar';
import { Message } from '../types';
import { classNames, formatMessageTime } from '../utils/format';

type ToastKind = 'success' | 'error';
interface Toast { id: number; kind: ToastKind; message: string; incomingMessage?: Message; onOpen?: () => void }
interface ToastContextValue { showToast: (message: string, kind?: ToastKind) => void; showMessageToast: (message: Message, onOpen: () => void) => void }

function getMessagePreview(message: Message): string {
  const preview = message.content?.trim() || 'New message';
  return preview.length > 90 ? `${preview.slice(0, 87)}...` : preview;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);
  const showMessageToast = useCallback((message: Message, onOpen: () => void) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind: 'success', message: '', incomingMessage: message, onOpen }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 6000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showMessageToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[var(--z-toast)] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} role={toast.incomingMessage ? 'button' : undefined} tabIndex={toast.incomingMessage ? 0 : undefined} onClick={() => { if (toast.onOpen) { toast.onOpen(); setToasts((current) => current.filter((item) => item.id !== toast.id)); } }} onKeyDown={(event) => { if (toast.incomingMessage && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); toast.onOpen?.(); setToasts((current) => current.filter((item) => item.id !== toast.id)); } }} className={classNames('pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl animate-toast-in', toast.incomingMessage ? 'cursor-pointer border-token bg-raised text-primary' : toast.kind === 'success' ? 'border-emerald-400/25 bg-emerald-950/95 text-emerald-100' : 'border-red-400/25 bg-red-950/95 text-red-100')}>
            {toast.incomingMessage ? <Avatar name={toast.incomingMessage.sender.name} src={toast.incomingMessage.sender.avatar} size="sm" showStatusDot={false} /> : toast.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            {toast.incomingMessage ? <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><strong className="truncate text-sm">{toast.incomingMessage.sender.name}</strong><time className="shrink-0 text-[11px] text-tertiary">{formatMessageTime(toast.incomingMessage.createdAt)}</time></span><span className="mt-1 block truncate text-xs text-secondary">{getMessagePreview(toast.incomingMessage)}</span></span> : <span className="flex-1 leading-5">{toast.message}</span>}
            <button type="button" aria-label="Dismiss notification" onClick={(event) => { event.stopPropagation(); setToasts((current) => current.filter((item) => item.id !== toast.id)); }} className="text-current/60 hover:text-current"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
