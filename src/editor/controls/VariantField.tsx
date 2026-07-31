import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * בורר וריאציה ויזואלי.
 *
 * החליף dropdown שבו אי אפשר לראות וריאנט לפני שבוחרים בו. כל וריאנט הוא
 * אריח לחיץ עם סכמה קטנה (`preview`) ותווית — כל האפשרויות גלויות במבט
 * אחד, ומטרת המגע גדולה יותר מפריט בתפריט. `radiogroup` כמו `SegmentedField`,
 * כדי שניווט המקלדת יתנהג כבורר אמיתי.
 */

export interface VariantOption<T extends string> {
  value: T;
  label: string;
  /** סכמה קטנה שממחישה את הווריאנט. אופציונלית — בלעדיה מוצג האריח עם התווית */
  preview?: ReactNode;
}

export function VariantField<T extends string>({
  label,
  value,
  options,
  onChange,
  columns = 2,
}: {
  label: string;
  value: T;
  options: VariantOption<T>[];
  onChange: (value: T) => void;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-fg-soft">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
        className={cn(
          'grid gap-1.5',
          columns === 2 && 'grid-cols-2',
          columns === 3 && 'grid-cols-3',
          columns === 4 && 'grid-cols-4',
        )}
      >
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex flex-col items-stretch gap-1.5 rounded-lg border p-1.5 text-center transition',
                active
                  ? 'border-volt-dim bg-volt-soft'
                  : 'border-edge bg-field hover:border-edge-strong',
              )}
            >
              {option.preview && (
                <span
                  aria-hidden
                  className={cn(
                    'flex h-10 items-center justify-center overflow-hidden rounded-md',
                    active ? 'bg-panel' : 'bg-panel-2',
                  )}
                >
                  {option.preview}
                </span>
              )}
              <span
                className={cn(
                  'text-[11px] font-medium',
                  active ? 'text-volt-ink' : 'text-fg-soft',
                )}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * פרימיטיבים לסכמות הווריאנטים — צורות אפורות ניטרליות, לא צבעי הערכה.
 * הן ממחישות פריסה, לא עיצוב, ולכן נשארות אחידות בין הבלוקים.
 */
export function Schematic({ children }: { children: ReactNode }) {
  return (
    <svg viewBox="0 0 48 28" width="48" height="28" className="text-fg-muted">
      {children}
    </svg>
  );
}
