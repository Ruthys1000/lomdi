import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { courseIconNames, getCourseIcon } from '@/renderer/icons';

/**
 * בורר אייקונים כרשת ויזואלית.
 *
 * החליף `<select>` שהציג שמות אייקונים באנגלית בלי תצוגה — בורר שאי אפשר
 * לבחור ממנו במבט. הרשת מציגה את האייקונים עצמם; שדה החיפוש מסנן לפי השם
 * (המזהה שמור כמחרוזת ולכן החיפוש הוא באנגלית). הרשימה סגורה (`courseIcons`)
 * ולכן אין כאן ייבוא דינמי של lucide לתוך העורך.
 */

interface IconPickerFieldProps {
  label: string;
  value: string;
  onChange: (name: string) => void;
}

export function IconPickerField({ label, value, onChange }: IconPickerFieldProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const gridId = useId();

  const Selected = getCourseIcon(value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? courseIconNames.filter((name) => name.toLowerCase().includes(q)) : courseIconNames;
  }, [query]);

  // סגירה בלחיצה בחוץ או ב-Escape — התנהגות צפויה מכל פופאובר
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1 block text-xs font-medium text-fg-soft">{label}</span>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 rounded-lg border border-edge bg-field px-2.5 py-1.5 text-sm text-fg hover:border-edge-strong focus:border-volt-dim focus:ring-1 focus:ring-volt-dim focus:outline-none"
      >
        {Selected ? (
          <Selected className="size-4 shrink-0 text-fg-soft" />
        ) : (
          <span className="size-4 shrink-0 rounded bg-panel-2" />
        )}
        <span dir="ltr" className="min-w-0 flex-1 truncate text-start">
          {value || 'בחירת אייקון'}
        </span>
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-full rounded-xl border border-edge bg-panel p-2 shadow-xl">
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="חיפוש אייקון…"
            className="mb-2 w-full rounded-lg border border-edge bg-field px-2.5 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:border-volt-dim focus:ring-1 focus:ring-volt-dim focus:outline-none"
          />
          <div
            role="radiogroup"
            aria-label={label}
            id={gridId}
            className="grid max-h-52 grid-cols-6 gap-1 overflow-y-auto"
          >
            {filtered.map((name) => {
              const Icon = getCourseIcon(name);
              if (!Icon) return null;
              const active = name === value;
              return (
                <button
                  key={name}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  aria-label={name}
                  title={name}
                  onClick={() => pick(name)}
                  className={cn(
                    'flex aspect-square items-center justify-center rounded-lg transition',
                    active
                      ? 'bg-volt-soft text-volt-ink ring-1 ring-volt-dim'
                      : 'text-fg-soft hover:bg-panel-2 hover:text-fg',
                  )}
                >
                  <Icon className="size-4" />
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-6 py-4 text-center text-xs text-fg-muted">אין אייקון תואם</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
