import type { ReactNode } from 'react';
import { blockLabel } from '@/blocks/registry.shared';
import { cn } from '@/lib/cn';
import type { Block } from '@/model/types';

interface BlockFrameProps {
  block: Block;
  selected: boolean;
  onSelect: () => void;
  children: ReactNode;
}

/**
 * המסגרת שהעורך עוטף בה כל בלוק בקנבס.
 *
 * היא מוזרקת לרנדרר מבחוץ (renderBlockWrapper) ולא חיה בתוכו, כדי שקוד
 * העריכה יישאר מחוץ לחבילת הלומדה המיוצאת.
 *
 * המסגרת עדינה בכוונה (סעיף 4.3): קו דק וסימון פינה, בלי רקע שמשנה את
 * מראה הבלוק — אחרת העורך מפסיק להראות את מה שהלומד יראה.
 *
 * סרגל הפעולות המלא (גרירה, שכפול, הזזה, מחיקה) מתווסף בשלב 4.
 */
export function BlockFrame({ block, selected, onSelect, children }: BlockFrameProps) {
  return (
    <div
      className={cn(
        'group relative transition',
        'before:pointer-events-none before:absolute before:inset-0 before:rounded-lg before:transition',
        selected
          ? 'before:ring-2 before:ring-blue-500'
          : 'before:ring-1 before:ring-transparent hover:before:ring-slate-300',
      )}
    >
      {/*
        כפתור שקוף מעל הבלוק לצורך בחירה. בשלב 4, כשתתווסף עריכה ישירה
        בתוך הבלוק, הוא יוחלף בשכבה שמפנה אירועים לתוכן.
      */}
      <button
        type="button"
        onClick={onSelect}
        aria-label={`בחירת בלוק ${blockLabel(block.type)}`}
        className="absolute inset-0 z-10 cursor-pointer"
      />

      <span
        className={cn(
          'absolute -top-2.5 z-20 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition',
          'end-2',
          selected
            ? 'bg-blue-600 text-white opacity-100'
            : 'bg-slate-700 text-white opacity-0 group-hover:opacity-100',
        )}
      >
        {blockLabel(block.type)}
      </span>

      {children}
    </div>
  );
}
