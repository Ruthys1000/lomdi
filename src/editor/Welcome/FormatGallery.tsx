import { ArrowLeft } from 'lucide-react';
import { formatList, type FormatDefinition, type FormatId, type FormatPreviewBlock } from '@/formats';
import { cn } from '@/lib/cn';

/**
 * גלריית הפורמטים — שלב הבחירה אחרי ה-Hero.
 *
 * כרטיסים מותרים כאן כי זו בחירה אינטראקטיבית. יושבת מחוץ ל-Hero כדי
 * שהוויופורט הראשון יישאר קומפוזיציה אחת: מותג, הבטחה, CTA ותוצר.
 */
export function FormatGallery({
  onSelect,
  selectedId,
}: {
  onSelect: (id: FormatId) => void;
  selectedId?: FormatId | null;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {formatList.map((format) => {
        // מסלול למידה הוא הפורמט היחיד שמייצר תהליך של כמה פרקים, ולכן הוא
        // מוצג ככרטיס רחב מעל השאר ולא כעוד משבצת בין פורמטים של עמוד אחד
        const featured = format.id === FEATURED_FORMAT;
        return (
          <li key={format.id} className={cn(featured && 'sm:col-span-2 lg:col-span-3')}>
            <FormatCard
              format={format}
              selected={selectedId === format.id}
              onSelect={onSelect}
              featured={featured}
            />
          </li>
        );
      })}
    </ul>
  );
}

const FEATURED_FORMAT: FormatId = 'journey';

function FormatCard({
  format,
  selected,
  onSelect,
  featured = false,
}: {
  format: FormatDefinition;
  selected: boolean;
  onSelect: (id: FormatId) => void;
  featured?: boolean;
}) {
  const ready = format.status === 'ready';

  return (
    <button
      type="button"
      disabled={!ready}
      aria-pressed={selected}
      onClick={() => ready && onSelect(format.id)}
      className={cn(
        'group flex h-full w-full gap-3 rounded-2xl border p-4 text-start transition',
        featured ? 'flex-col sm:flex-row-reverse sm:items-center sm:gap-6 sm:p-5' : 'flex-col',
        ready
          ? selected
            ? 'border-volt-dim bg-volt-soft shadow-[0_10px_28px_-18px_rgba(63,98,130,0.45)]'
            : 'border-edge-strong bg-field hover:-translate-y-0.5 hover:border-volt-dim'
          : 'cursor-not-allowed border-dashed border-edge bg-panel opacity-60',
      )}
    >
      {featured ? (
        <JourneyPreview active={selected} />
      ) : (
        <FormatPreview blocks={format.preview} active={selected} />
      )}

      <div className={cn('flex min-w-0 flex-col gap-2', featured && 'sm:flex-1')}>
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className={cn('font-bold text-fg', featured ? 'text-lg' : 'text-sm')}>
            {format.label}
          </span>
          {format.labelEn && (
            <span className="text-[11px] font-medium tracking-wide text-fg-muted" dir="ltr">
              {format.labelEn}
            </span>
          )}
          {featured && ready && (
            <span className="rounded-md bg-volt px-1.5 py-0.5 text-[10px] font-bold text-on-volt">
              חדש
            </span>
          )}
          {!ready && <span className="text-[10px] font-semibold text-fg-muted">בקרוב</span>}
        </div>
        <p
          className={cn(
            'leading-relaxed text-fg-muted',
            featured ? 'max-w-prose text-sm' : 'text-xs',
          )}
        >
          {featured ? format.description : format.tagline}
        </p>
      </div>
    </button>
  );
}

/**
 * שלד של מסלול: שלושה פרקים ברצף, הראשון הושלם, השני בעבודה, השלישי נעול —
 * בדיוק מה שהלומד יראה בתפריט הפרקים.
 */
function JourneyPreview({ active }: { active: boolean }) {
  const steps = ['done', 'current', 'locked'] as const;
  return (
    <div
      aria-hidden
      className={cn(
        'flex shrink-0 items-stretch gap-2 rounded-xl border p-3 sm:w-80',
        active ? 'border-volt-dim/40 bg-field' : 'border-edge bg-panel',
      )}
    >
      {steps.map((step, index) => (
        <div
          key={step}
          className={cn(
            'flex flex-1 flex-col gap-1.5 rounded-lg border p-2',
            step === 'current' ? 'border-volt-dim bg-volt-soft' : 'border-edge bg-field',
            step === 'locked' && 'opacity-55',
          )}
        >
          <span
            className={cn(
              'flex size-5 items-center justify-center rounded-full text-[10px] font-bold',
              step === 'done' ? 'bg-volt text-on-volt' : 'bg-fg-muted/20 text-fg-soft',
            )}
          >
            {step === 'done' ? '✓' : index + 1}
          </span>
          <div className={`h-1.5 ${bar}`} />
          <div className={`h-1.5 w-2/3 ${bar}`} />
          <div
            className={cn('mt-1 h-3 rounded', step === 'locked' ? 'bg-fg-muted/15' : 'bg-volt/35')}
          />
        </div>
      ))}
    </div>
  );
}

/** תצוגה מקדימה סכמטית של מבנה הפורמט — שלד במבט אחד */
function FormatPreview({
  blocks,
  active,
}: {
  blocks: FormatPreviewBlock[];
  active: boolean;
}) {
  return (
    <div
      className={cn(
        // גובה מינימלי אחיד: שלדים באורכים שונים הזיזו את הכותרות של הכרטיסים
        // זו ביחס לזו, והשורה נראתה לא מיושרת
        'flex h-32 flex-col justify-center gap-1.5 overflow-hidden rounded-xl border p-3',
        active ? 'border-volt-dim/40 bg-field' : 'border-edge bg-panel',
      )}
    >
      {blocks.map((kind, index) => (
        <PreviewRow key={`${kind}-${index}`} kind={kind} />
      ))}
    </div>
  );
}

const bar = 'rounded-sm bg-fg-muted/25';

function PreviewRow({ kind }: { kind: FormatPreviewBlock }) {
  switch (kind) {
    case 'hero':
      return <div className="h-5 rounded-md bg-volt/45" />;
    case 'text':
      return (
        <div className="flex flex-col gap-1">
          <div className={cn(bar, 'h-1.5 w-full')} />
          <div className={cn(bar, 'h-1.5 w-4/5')} />
        </div>
      );
    case 'cards':
      return (
        <div className="flex gap-1.5">
          <div className="h-5 flex-1 rounded-md bg-fg-muted/15" />
          <div className="h-5 flex-1 rounded-md bg-fg-muted/15" />
          <div className="h-5 flex-1 rounded-md bg-fg-muted/15" />
        </div>
      );
    case 'steps':
      return (
        <div className="flex flex-col gap-1">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="size-3 shrink-0 rounded-full bg-volt/50" />
              <div className={cn(bar, 'h-1.5 w-3/4')} />
            </div>
          ))}
        </div>
      );
    case 'checklist':
      return (
        <div className="flex flex-col gap-1">
          {[0, 1].map((i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="size-2.5 shrink-0 rounded-sm border border-fg-muted/50" />
              <div className={cn(bar, 'h-1.5 w-2/3')} />
            </div>
          ))}
        </div>
      );
    case 'callout':
      return <div className="h-5 rounded-md border-s-2 border-volt-dim bg-volt-soft/80" />;
    case 'quote':
      return <div className="h-5 rounded-md bg-fg-muted/15" />;
    case 'image':
      return <div className="h-6 rounded-md bg-fg-muted/15" />;
    case 'decision':
      return (
        <div className="flex flex-col gap-1">
          <div className={cn(bar, 'h-1.5 w-full')} />
          <div className="flex gap-1.5">
            <div className="h-3 flex-1 rounded bg-volt/35" />
            <div className="h-3 flex-1 rounded bg-fg-muted/20" />
          </div>
        </div>
      );
    case 'challenge':
      return (
        <div className="flex flex-col gap-1">
          <div className={cn(bar, 'h-1.5 w-3/4')} />
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-fg-muted/30" />
            <div className="size-3 rounded-full bg-volt/45" />
            <div className="size-3 rounded-full bg-fg-muted/30" />
          </div>
        </div>
      );
    default:
      return <div className={cn(bar, 'h-1.5 w-full')} />;
  }
}

/** חזרה מהטופס לגלריה */
export function BackToGallery({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-fg-muted transition hover:text-fg"
    >
      <ArrowLeft className="size-4" aria-hidden />
      בחירת פורמט אחר
    </button>
  );
}
