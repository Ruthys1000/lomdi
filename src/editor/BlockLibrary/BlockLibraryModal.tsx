import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { editorBlockList, type EditorBlockDefinition } from '@/blocks/registry.editor';
import type { BlockCategory } from '@/blocks/registry.shared';
import { cn } from '@/lib/cn';

interface BlockLibraryModalProps {
  open: boolean;
  onClose: () => void;
  onPick: (type: string) => void;
}

const categories: { id: BlockCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'הכול' },
  { id: 'content', label: 'תוכן' },
  { id: 'media', label: 'מדיה' },
  { id: 'interaction', label: 'אינטראקציה' },
  { id: 'structure', label: 'מבנה' },
];

/** בלוקים שטרם נבנו מוצגים מושבתים, כדי שהקטלוג ישקף את התוכנית בלי להטעות */
const isAvailable = (definition: EditorBlockDefinition) =>
  Boolean(definition.SettingsComponent) || Boolean(definition.EditorComponent);

/**
 * ספריית הבלוקים (סעיף 8).
 *
 * בנויה על <dialog> המובנה, ולכן focus trap, סגירה ב-Escape ו-inert על
 * הרקע מגיעים מהדפדפן ולא ממימוש ידני שקל לשכוח בו פרט.
 */
export function BlockLibraryModal({ open, onClose, onPick }: BlockLibraryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<BlockCategory | 'all'>('all');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setQuery('');
      setCategory('all');
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const results = useMemo(() => {
    const term = query.trim();

    return editorBlockList.filter((definition) => {
      if (category !== 'all' && definition.category !== category) return false;
      if (!term) return true;
      return (
        definition.label.includes(term) ||
        definition.description.includes(term) ||
        definition.type.toLowerCase().includes(term.toLowerCase())
      );
    });
  }, [query, category]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      className="m-auto w-[min(46rem,calc(100vw-2rem))] rounded-2xl border border-slate-200 p-0 shadow-2xl backdrop:bg-slate-900/40"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">הוספת בלוק</h2>

        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 my-auto size-4 text-slate-400 start-3"
            aria-hidden
          />
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="חיפוש בלוק"
            aria-label="חיפוש בלוק"
            className="w-full rounded-lg border border-slate-200 py-2 text-sm ps-9 pe-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="סגירה"
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div className="flex gap-1 border-b border-slate-100 px-5 py-2.5" role="tablist">
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={category === item.id}
            onClick={() => setCategory(item.id)}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-semibold transition',
              category === item.id
                ? 'bg-slate-900 text-white'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="max-h-[55vh] overflow-y-auto p-5">
        {results.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">
            לא נמצא בלוק שמתאים ל&quot;{query}&quot;.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {results.map((definition) => {
              const available = isAvailable(definition);
              const Icon = definition.icon;

              return (
                <li key={definition.type}>
                  <button
                    type="button"
                    disabled={!available}
                    onClick={() => onPick(definition.type)}
                    className={cn(
                      'group h-full w-full rounded-xl border p-3 text-start transition',
                      available
                        ? 'border-slate-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md'
                        : 'cursor-not-allowed border-dashed border-slate-200 opacity-55',
                    )}
                  >
                    <span
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg transition',
                        available
                          ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                          : 'bg-slate-100 text-slate-400',
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>

                    <span className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-sm font-semibold text-slate-900">{definition.label}</span>
                      {!available && <span className="text-[10px] text-slate-400">בקרוב</span>}
                    </span>

                    <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                      {definition.description}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </dialog>
  );
}
