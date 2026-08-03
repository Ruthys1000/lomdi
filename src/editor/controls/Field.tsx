import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
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
 *
 * שתי ההתנהגויות שהופכות את זה לבורר ולא לשורת כפתורים: מקשי החצים מזיזים
 * את הבחירה, ורק האפשרות הנבחרת נמצאת בסדר ה-Tab (roving tabindex) — כך
 * שהמשתמשת יוצאת מהקבוצה ב-Tab אחד ולא עוברת אחת-אחת על כל האפשרויות.
 * החצים עוקבים אחרי הפריסה: בממשק RTL חץ שמאלה מתקדם לאפשרות הבאה.
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
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  // כשהערך אינו אחת האפשרויות (סחף סכמה, ערך שהוסר), roving tabindex תמים
  // היה משאיר את כל הכפתורים מחוץ לסדר ה-Tab — כלומר בורר שאי אפשר להגיע
  // אליו במקלדת. במצב הזה הראשון הוא נקודת הכניסה.
  const checkedIndex = options.findIndex((option) => option.value === value);
  const tabbableIndex = checkedIndex === -1 ? 0 : checkedIndex;

  const move = (from: number, step: number) => {
    // מעגלי: מהאפשרות האחרונה חוזרים לראשונה, כמו ב-radiogroup נייטיב
    const next = (from + step + options.length) % options.length;
    onChange(options[next].value);
    // הפוקוס נודד עם הבחירה. בלעדיו הוא נשאר על אפשרות שיצאה מסדר ה-Tab,
    // והחץ הבא היה נמדד ממנה — כלומר לחיצה שנייה לא הייתה מזיזה כלום
    buttons.current[next]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    // החצים עוקבים אחרי הפריסה ולא אחרי סדר ה-DOM: בממשק RTL האפשרות
    // הראשונה היא הימנית, ולכן חץ *שמאלה* מתקדם לאפשרות הבאה.
    // נקרא מהמאפיין ולא מ-getComputedStyle כי כיווניות נקבעת כאן ב-`<html
    // dir="rtl">` — ו-`direction` המחושב אינו יורד בירושה בכל סביבה.
    const declared = event.currentTarget.closest('[dir]')?.getAttribute('dir');
    const rtl = (declared ?? document.documentElement.dir) === 'rtl';
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

    if (event.key === forward || event.key === 'ArrowDown') move(index, 1);
    else if (event.key === backward || event.key === 'ArrowUp') move(index, -1);
    else return;

    // מונע גלילת העמוד בחצי מעלה/מטה בתוך הבורר
    event.preventDefault();
  };

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-fg-soft">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex gap-0.5 rounded-lg bg-panel-2 p-0.5">
        {options.map((option, index) => {
          const checked = value === option.value;

          return (
            <button
              key={option.value}
              ref={(node) => {
                buttons.current[index] = node;
              }}
              type="button"
              role="radio"
              aria-checked={checked}
              tabIndex={index === tabbableIndex ? 0 : -1}
              onKeyDown={(event) => onKeyDown(event, index)}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex-1 rounded-md px-2 py-1 text-xs font-medium transition',
                checked ? 'bg-panel text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
              )}
            >
              {option.label}
            </button>
          );
        })}
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
