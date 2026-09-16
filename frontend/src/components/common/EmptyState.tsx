import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
}

export function EmptyState({ icon, title, description }: EmptyStateProps) {
  return (
    <div className="app-shell flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="glass-panel flex h-16 w-16 items-center justify-center rounded-2xl text-accent">
        {icon}
      </div>
      <p className="text-base font-semibold text-primary">{title}</p>
      {description && <p className="max-w-sm text-sm text-secondary">{description}</p>}
    </div>
  );
}
