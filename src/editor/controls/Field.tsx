import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** שדות הבקרה של פאנל ההגדרות. כולם עם label אמיתי (סעיף 18). */

export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-slate-100 px-4 py-4 last:border-0">
      <h3 className="mb-3 text-xs font-bold text-slate-900">{title}</h3>
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
    'w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none';

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
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
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as T)}
        className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
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
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
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
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800',
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
      <label htmlFor={id} className="text-xs font-medium text-slate-600">
        {label}
        {hint && <span className="mt-0.5 block text-[11px] font-normal text-slate-400">{hint}</span>}
      </label>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
      />
    </div>
  );
}
