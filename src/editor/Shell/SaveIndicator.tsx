import { useEffect, useState } from 'react';
import { AlertTriangle, Check, Cloud, RefreshCw } from 'lucide-react';
import { saveNow } from '@/persistence/autosave';
import { useSaveStore } from '@/state/saveStore';

/**
 * מחוון השמירה האוטומטית.
 *
 * מציג מצב ולא רק אייקון: משתמש שרואה "נשמר · לפני דקה" יודע שאפשר לסגור
 * את הדפדפן, ומשתמש שרואה "השמירה נכשלה" יודע שהוא חייב להוריד קובץ
 * פרויקט. שתי ההודעות האלה הן כל מה שמפריד בין המשתמש לאיבוד עבודה.
 */

/** מרענן את "לפני X" בלי לתלות את הרינדור בזמן — טיימר אחד לכל הרכיב */
function useRelativeTime(timestamp: number | null): string {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (timestamp === null) return;
    const timer = setInterval(() => setTick((value) => value + 1), 30_000);
    return () => clearInterval(timer);
  }, [timestamp]);

  if (timestamp === null) return '';

  const minutes = Math.floor((Date.now() - timestamp) / 60_000);
  if (minutes < 1) return 'הרגע';
  if (minutes === 1) return 'לפני דקה';
  if (minutes < 60) return `לפני ${minutes} דקות`;
  return 'לפני שעה ויותר';
}

export function SaveIndicator() {
  const status = useSaveStore((state) => state.status);
  const lastSavedAt = useSaveStore((state) => state.lastSavedAt);
  const error = useSaveStore((state) => state.error);
  const relative = useRelativeTime(lastSavedAt);

  if (status === 'error') {
    return (
      <button
        type="button"
        onClick={() => void saveNow()}
        title={error ?? 'השמירה נכשלה — נסו שוב'}
        className="inline-flex items-center gap-1.5 rounded-lg bg-danger-soft px-1.5 py-1 text-xs font-semibold text-danger transition hover:bg-danger-soft sm:px-2"
      >
        <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
        <span className="hidden sm:inline">השמירה נכשלה — נסו שוב</span>
        <span className="sm:hidden">שגיאה</span>
      </button>
    );
  }

  const { icon: Icon, text } =
    status === 'saving'
      ? { icon: RefreshCw, text: 'שומר…' }
      : status === 'dirty'
        ? { icon: Cloud, text: 'שינויים לא שמורים' }
        : status === 'saved'
          ? { icon: Check, text: relative ? `נשמר · ${relative}` : 'נשמר' }
          : { icon: Cloud, text: 'שמירה אוטומטית פעילה' };

  return (
    <span
      className="inline-flex max-w-none items-center gap-1.5 whitespace-nowrap px-1 text-xs text-shell-muted sm:px-2"
      role="status"
      aria-live="polite"
      title={text}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {/*
        במובייל הטקסט הארוך ("שמירה אוטומטית פעילה") דחק את Preview/Save
        מחוץ לסרגל. האייקון + title מספיקים; הטקסט חוזר מ-sm ומעלה.
      */}
      <span className="hidden sm:inline">{text}</span>
      <span className="sr-only sm:hidden">{text}</span>
    </span>
  );
}
