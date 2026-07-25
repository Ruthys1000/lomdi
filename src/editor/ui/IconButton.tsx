import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface IconButtonProps {
  icon: ComponentType<{ className?: string }>;
  /** משמש גם כ-aria-label וגם כ-tooltip — אייקון בלי שם אינו נגיש */
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  variant?: 'ghost' | 'solid';
  children?: ReactNode;
}

export function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  active,
  variant = 'ghost',
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={children ? undefined : label}
      aria-pressed={active}
      title={label}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-40',
        variant === 'solid'
          ? 'bg-blue-600 text-white hover:bg-blue-700'
          : active
            ? 'bg-blue-50 text-blue-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
      )}
    >
      <Icon className="size-4 shrink-0" />
      {children}
    </button>
  );
}
