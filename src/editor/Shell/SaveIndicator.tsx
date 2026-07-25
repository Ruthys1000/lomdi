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
        title={error ?? undefined}
        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
      >
        <AlertTriangle className="size-3.5" aria-hidden />
        השמירה נכשלה — נסו שוב
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
      className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 text-xs text-slate-400"
      role="status"
      aria-live="polite"
    >
      <Icon className="size-3.5" aria-hidden />
      {text}
    </span>
  );
}
