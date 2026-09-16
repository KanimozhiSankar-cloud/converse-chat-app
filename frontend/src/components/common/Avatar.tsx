import { classNames, getAvatarColor, getInitials } from '../../utils/format';
import { useEffect, useState } from 'react';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
  isOnline?: boolean;
  showStatusDot?: boolean;
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

const dotPosition: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-2 w-2 right-0 bottom-0',
  md: 'h-2.5 w-2.5 right-0 bottom-0',
  lg: 'h-3.5 w-3.5 right-0.5 bottom-0.5',
};

export function Avatar({ name, src, size = 'md', isOnline, showStatusDot = true }: AvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const fallbackColor = getAvatarColor(name);
  useEffect(() => setImageFailed(false), [src]);
  return (
    <div className="relative shrink-0">
      {src && !imageFailed ? (
        <img
          src={src}
          alt={name}
          onError={() => setImageFailed(true)}
          className={classNames('rounded-full object-cover bg-ink-700', sizeClasses[size])}
        />
      ) : (
        <div
          style={{ backgroundColor: fallbackColor }}
          className={classNames(
            'flex items-center justify-center rounded-full font-semibold text-slate-50',
            sizeClasses[size]
          )}
        >
          {getInitials(name)}
        </div>
      )}
      {showStatusDot && isOnline !== undefined && (
        <span
          className={classNames(
            'absolute rounded-full border-2 border-[var(--page-raised)]',
            dotPosition[size],
            isOnline ? 'bg-accent' : 'bg-ink-600'
          )}
        />
      )}
    </div>
  );
}
