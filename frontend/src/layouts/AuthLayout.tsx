import { ReactNode } from 'react';
import { MessageCircle } from 'lucide-react';

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-ink-950">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-gradient-to-br from-ink-900 via-ink-950 to-ink-900 p-12 lg:flex">
        <div className="flex items-center gap-2 text-slate-200">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-ink-950">
            <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-semibold tracking-tight">Converse</span>
        </div>

        <div className="max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-slate-100">
            Every conversation, in the moment it happens.
          </h1>
          <p className="mt-4 text-slate-400">
            Message friends and teams instantly. See who's online, chat one-on-one
            or in groups, and never lose a thread.
          </p>
        </div>

        <div className="flex gap-6 text-sm text-slate-500">
          <span>Real-time delivery</span>
          <span>Group conversations</span>
          <span>Presence status</span>
        </div>

        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 sm:px-12 lg:w-1/2 lg:px-20">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-ink-950">
              <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-semibold text-slate-100">Converse</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
