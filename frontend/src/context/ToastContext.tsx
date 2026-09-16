import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { CheckCircle2, X, XCircle } from 'lucide-react';
import { classNames } from '../utils/format';

type ToastKind = 'success' | 'error';
interface Toast { id: number; kind: ToastKind; message: string }
interface ToastContextValue { showToast: (message: string, kind?: ToastKind) => void }

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((message: string, kind: ToastKind = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, kind, message }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[var(--z-toast)] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-3" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={classNames('pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-xl animate-toast-in', toast.kind === 'success' ? 'border-emerald-400/25 bg-emerald-950/95 text-emerald-100' : 'border-red-400/25 bg-red-950/95 text-red-100')}>
            {toast.kind === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <XCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span className="flex-1 leading-5">{toast.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))} className="text-current/60 hover:text-current"><X className="h-4 w-4" /></button>
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
