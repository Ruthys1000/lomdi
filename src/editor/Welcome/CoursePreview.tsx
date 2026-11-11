import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * ויזואל ה-Hero — מיני-לומדה סטטית שממחישה את התוצר.
 *
 * לא רנדרר חי ולא כרטיסים: מישור ויזואלי אחד שמראה את מה שמבדיל את המוצר —
 * מסלול של פרקים שנפתחים בזה אחר זה, התקדמות שנשמרת, ושאלה עם משוב. כך
 * הנחיתה נראית כמו כלי לתהליכי למידה ולא כמו גלריית תבניות.
 */

type ChapterState = 'done' | 'current' | 'locked';

const chapters: { title: string; note: string; state: ChapterState }[] = [
  { title: 'למה משוב נכשל', note: 'הושלם', state: 'done' },
  { title: 'עובדה לפני פרשנות', note: 'הושלם', state: 'done' },
  { title: 'שלושת הצעדים', note: 'הפרק הנוכחי · 4 דקות', state: 'current' },
  { title: 'סיכום ובדיקה', note: 'ייפתח אחרי הפרק הקודם', state: 'locked' },
];

export function CoursePreview() {
  return (
    <div className="lc-landing-preview" aria-hidden>
      <div className="lc-landing-preview__sheet">
        <div className="lc-landing-preview__hero">
          <p className="lc-landing-preview__eyebrow">מסלול למידה · 4 פרקים · 15 דקות</p>
          <p className="lc-landing-preview__title">משוב שמקדם</p>

          <div className="mt-3.5 flex items-center gap-2.5">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/70">
              <div className="h-full w-1/2 rounded-full bg-volt" />
            </div>
            <span className="text-[11px] font-semibold text-fg-soft tabular-nums">2 מתוך 4</span>
          </div>
        </div>

        <ol className="px-3 pt-2.5">
          {chapters.map((chapter, index) => (
            <li
              key={chapter.title}
              className={cn(
                'flex items-center gap-3 rounded-xl px-2.5 py-2',
                chapter.state === 'current' && 'bg-volt-soft',
                chapter.state === 'locked' && 'opacity-55',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                  chapter.state === 'done' && 'bg-volt text-on-volt',
                  chapter.state === 'current' && 'bg-field text-volt-ink ring-2 ring-volt',
                  chapter.state === 'locked' && 'bg-panel-2 text-fg-muted',
                )}
              >
                {chapter.state === 'done' ? (
                  <Check className="size-3.5" strokeWidth={3} />
                ) : chapter.state === 'locked' ? (
                  <Lock className="size-3" />
                ) : (
                  index + 1
                )}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    'block truncate text-[13px] leading-tight text-fg',
                    chapter.state === 'current' ? 'font-bold' : 'font-semibold',
                  )}
                >
                  {chapter.title}
                </span>
                <span className="block text-[11px] leading-snug text-fg-muted">{chapter.note}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="m-3 mt-2.5 rounded-xl border border-edge bg-field p-3">
          <p className="text-[12.5px] leading-snug font-bold text-fg">
            איזה משפט פותח משוב בעובדה?
          </p>
          <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-2 rounded-lg border border-volt bg-volt-soft px-2.5 py-1.5 text-[11.5px] font-semibold text-volt-ink">
              <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-volt text-on-volt">
                <Check className="size-2.5" strokeWidth={3.5} />
              </span>
              "בישיבה אתמול נכנסת לדברי דנה שלוש פעמים"
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-edge px-2.5 py-1.5 text-[11.5px] text-fg-muted">
              <span className="size-4 shrink-0 rounded-full border border-edge-strong" />
              "אתה לא מכבד את החברים בצוות"
            </div>
          </div>
          <p className="mt-2 text-[11px] leading-snug text-fg-soft">
            <strong className="text-volt-ink">נכון.</strong> התנהגות שאפשר לראות, ולכן קשה להתווכח
            איתה.
          </p>
        </div>
      </div>
    </div>
  );
}
