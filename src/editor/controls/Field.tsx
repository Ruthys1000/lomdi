import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** שדות הבקרה של פאנל ההגדרות. כולם עם label אמיתי (סעיף 18). */

export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-edge px-4 py-4 last:border-0">
      <h3 className="mb-3 text-xs font-bold text-fg">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const id = useId();
  const className =
    'w-full rounded-lg border border-edge bg-field px-2.5 py-1.5 text-sm text-fg placeholder:text-fg-muted focus:border-volt-dim focus:ring-1 focus:ring-volt-dim focus:outline-none';

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-fg-soft">
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          rows={3}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={cn(className, 'resize-y')}
        />
      ) : (
        <input
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className={className}
        />
      )}
    </div>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  const id = useId();

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-fg-soft">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-lg border border-edge bg-field px-2.5 py-1.5 text-sm text-fg focus:border-volt-dim focus:ring-1 focus:ring-volt-dim focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * בורר מקטעים. משתמש ב-radiogroup ולא בכפתורים, כדי שניווט במקלדת
 * יתנהג כמו בורר אמיתי ולא כרשימת כפתורים נפרדים.
 */
export function SegmentedField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-fg-soft">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-lg bg-panel-2 p-0.5">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex-1 rounded-md px-2 py-1 text-xs font-medium transition',
              value === option.value
                ? 'bg-panel text-fg shadow-sm'
                : 'text-fg-muted hover:text-fg',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function SwitchField({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  const id = useId();

  return (
    <div className="flex items-start justify-between gap-3">
      <label htmlFor={id} className="text-xs font-medium text-fg-soft">
        {label}
        {hint && <span className="mt-0.5 block text-[11px] font-normal text-fg-muted">{hint}</span>}
      </label>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-edge-strong text-volt-ink focus:ring-volt-dim"
      />
    </div>
  );
}

export function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-xs font-medium text-fg-soft">
        {label}
      </label>
      <span className="flex items-center gap-1.5">
        {/*
          dir="ltr" הכרחי: בתוך ממשק RTL הדפדפן מסדר מחדש מחרוזת שמתחילה
          בסימן ניטרלי, ו-#f59e0b היה מוצג כ-f59e0b#. אותו כלל חל על כל
          ערך לטיני שמוצג בממשק העברי.
        */}
        <output dir="ltr" className="font-mono text-[11px] text-fg-muted tabular-nums">
          {value}
        </output>
        <input
          id={id}
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="size-7 cursor-pointer rounded border border-edge bg-panel p-0.5"
        />
      </span>
    </div>
  );
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: number) => void;
}) {
  const id = useId();

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-medium text-fg-soft">
          {label}
        </label>
        <output className="text-[11px] text-fg-muted tabular-nums">
          {value}
          {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-volt"
      />
    </div>
  );
}

/** הודעת עזר או אזהרה בתוך פאנל ההגדרות */
export function FieldNote({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return (
    <p
      className={cn(
        'rounded-lg px-3 py-2 text-[11px] leading-relaxed',
        tone === 'warning' ? 'bg-warn-soft text-warn' : 'bg-app text-fg-muted',
      )}
    >
      {children}
    </p>
  );
}
