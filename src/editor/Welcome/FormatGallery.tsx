import { ArrowLeft } from 'lucide-react';
import { formatList, type FormatDefinition, type FormatId, type FormatPreviewBlock } from '@/formats';
import { cn } from '@/lib/cn';

/**
 * גלריית הפורמטים — נקודת הכניסה החדשה של Lomdi.
 *
 * במקום "הדבק טקסט → קבל קורס", המשתמש בוחר קודם *סוג* של דף (One Pager,
 * Process…), וה-AI מפצח את התוכן לתוך המבנה של אותו פורמט. פורמט 'soon'
 * מוצג מושבת כדי לתקשר את מפת הדרכים בלי להטעות.
 */
export function FormatGallery({ onSelect }: { onSelect: (id: FormatId) => void }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {formatList.map((format) => (
        <li key={format.id}>
          <FormatCard format={format} onSelect={onSelect} />
        </li>
      ))}
    </ul>
  );
}

function FormatCard({
  format,
  onSelect,
}: {
  format: FormatDefinition;
  onSelect: (id: FormatId) => void;
}) {
  const ready = format.status === 'ready';

  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => ready && onSelect(format.id)}
      className={cn(
        'group flex h-full w-full flex-col gap-3 rounded-2xl border p-4 text-start transition',
        ready
          ? 'border-shell-edge bg-shell-2 hover:-translate-y-0.5 hover:border-volt-dim hover:shadow-lg'
          : 'cursor-not-allowed border-dashed border-shell-edge bg-shell/40 opacity-60',
      )}
    >
      <FormatPreview blocks={format.preview} />

      <div className="flex items-baseline gap-2">
        <span className="text-sm font-bold text-shell-fg">{format.label}</span>
        {!ready && <span className="text-[10px] font-semibold text-shell-muted">בקרוב</span>}
      </div>
      <p className="text-xs leading-relaxed text-shell-muted">{format.tagline}</p>
    </button>
  );
}

/**
 * תצוגה מקדימה סכמטית של מבנה הפורמט — קופסאות פשוטות, לא render חי.
 * מטרתה להמחיש את השלד במבט אחד.
 */
function FormatPreview({ blocks }: { blocks: FormatPreviewBlock[] }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-xl border border-shell-edge bg-shell/60 p-3">
      {blocks.map((kind, index) => (
        <PreviewRow key={`${kind}-${index}`} kind={kind} />
      ))}
    </div>
  );
}

const bar = 'rounded-full bg-shell-muted/50';

function PreviewRow({ kind }: { kind: FormatPreviewBlock }) {
  switch (kind) {
    case 'hero':
      return <div className="h-5 rounded-md bg-volt/40" />;
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
          <div className="h-5 flex-1 rounded-md bg-shell-muted/30" />
          <div className="h-5 flex-1 rounded-md bg-shell-muted/30" />
          <div className="h-5 flex-1 rounded-md bg-shell-muted/30" />
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
              <span className="size-2.5 shrink-0 rounded-sm border border-shell-muted/60" />
              <div className={cn(bar, 'h-1.5 w-2/3')} />
            </div>
          ))}
        </div>
      );
    case 'callout':
      return <div className="h-5 rounded-md border-s-2 border-volt/60 bg-shell-muted/25" />;
    case 'quote':
      return <div className="h-5 rounded-md bg-shell-muted/25" />;
    case 'image':
      return <div className="h-6 rounded-md bg-shell-muted/25" />;
    case 'decision':
      return (
        <div className="flex flex-col gap-1">
          <div className={cn(bar, 'h-1.5 w-full')} />
          <div className="flex gap-1.5">
            <div className="h-3 flex-1 rounded bg-volt/30" />
            <div className="h-3 flex-1 rounded bg-shell-muted/30" />
          </div>
        </div>
      );
    case 'challenge':
      return (
        <div className="flex flex-col gap-1">
          <div className={cn(bar, 'h-1.5 w-3/4')} />
          <div className="flex gap-1.5">
            <div className="size-3 rounded-full bg-shell-muted/40" />
            <div className="size-3 rounded-full bg-volt/40" />
            <div className="size-3 rounded-full bg-shell-muted/40" />
          </div>
        </div>
      );
    default:
      return <div className={cn(bar, 'h-1.5 w-full')} />;
  }
}

/** כותרת חזרה מהטופס לגלריה */
export function BackToGallery({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-shell-muted transition hover:text-shell-fg"
    >
      <ArrowLeft className="size-4" aria-hidden />
      בחירת פורמט אחר
    </button>
  );
}
