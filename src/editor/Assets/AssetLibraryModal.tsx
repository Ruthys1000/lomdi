import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, Film, ImageIcon, Search, Trash2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { collectCourseAssetIds } from '@/model/assets';
import type { AssetKind, AssetMeta } from '@/model/types';
import { deleteAsset, putAsset } from '@/persistence/db';
import { formatBytes } from '@/persistence/assetNaming';
import { importAssetFile } from '@/persistence/importAsset';
import { useAssetStore } from '@/state/assetStore';
import { useCourseStore } from '@/state/courseStore';
import { toast } from '@/state/toastStore';

interface AssetLibraryModalProps {
  open: boolean;
  onClose: () => void;
  /**
   * מוגדר במצב בחירה. בלי הפונקציה הזו הספרייה היא מסך ניהול בלבד —
   * אותו רכיב, שני תפקידים, כדי שלא יהיו שתי רשימות נכסים שצריך לסנכרן.
   */
  onPick?: (assetId: string) => void;
  /** מסנן את הרשימה כשהבורר נפתח מתוך בלוק שמצפה לסוג מסוים */
  kind?: AssetKind;
}

const kindLabels: Record<AssetKind, string> = {
  image: 'תמונה',
  video: 'סרטון',
  file: 'קובץ',
};

const acceptFor = (kind?: AssetKind) =>
  kind === 'image' ? 'image/*' : kind === 'video' ? 'video/*' : 'image/*,video/*';

/**
 * ספריית הנכסים (סעיף 11).
 *
 * בנויה על `<dialog>` המובנה כמו ספריית הבלוקים, ולכן focus trap, סגירה
 * ב-Escape ו-inert על הרקע מגיעים מהדפדפן ולא ממימוש ידני.
 *
 * ההעלאה כותבת את ה-Blob ל-IndexedDB מיד ולא ממתינה לשמירה האוטומטית:
 * השמירה האוטומטית כותבת JSON בלבד, וקובץ שנשמר רק בזיכרון היה נעלם
 * ברענון והבלוק היה נשאר עם הפניה לנכס שאינו קיים.
 */
export function AssetLibraryModal({ open, onClose, onPick, kind }: AssetLibraryModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const course = useCourseStore((state) => state.course);
  const assets = useAssetStore((state) => state.assets);
  const urls = useAssetStore((state) => state.urls);
  const addAsset = useAssetStore((state) => state.addAsset);
  const removeAsset = useAssetStore((state) => state.removeAsset);

  const [query, setQuery] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AssetMeta | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setQuery('');
      setErrors([]);
      setPendingDelete(null);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const usedIds = useMemo(
    () => (course ? collectCourseAssetIds(course) : new Set<string>()),
    [course],
  );

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return assets
      .filter((asset) => (kind ? asset.kind === kind : true))
      .filter((asset) => (term ? asset.originalName.toLowerCase().includes(term) : true))
      .slice()
      .reverse();
  }, [assets, kind, query]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length || !course) return;

    setBusy(true);
    const failures: string[] = [];
    let added = 0;

    for (const file of Array.from(files)) {
      const result = await importAssetFile(file);
      if (!result.ok) {
        failures.push(result.error);
        continue;
      }

      try {
        await putAsset(course.id, result.meta, result.blob);
        addAsset(result.meta, result.blob);
        added++;
      } catch (error) {
        failures.push(error instanceof Error ? error.message : `שמירת "${file.name}" נכשלה.`);
      }
    }

    setErrors(failures);
    setBusy(false);
    if (added > 0) toast(added === 1 ? 'הנכס נוסף' : `${added} נכסים נוספו`, { tone: 'success' });
  };

  const confirmDelete = async (asset: AssetMeta) => {
    try {
      await deleteAsset(asset.id);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : 'מחיקת הנכס נכשלה.']);
      return;
    }
    removeAsset(asset.id);
    setPendingDelete(null);
    toast('הנכס נמחק');
  };

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void handleFiles(event.dataTransfer.files);
      }}
      aria-label="ספריית הנכסים"
      className="m-auto w-[min(52rem,calc(100vw-2rem))] rounded-2xl border border-edge bg-panel text-fg p-0 shadow-2xl backdrop:bg-scrim/40"
    >
      <div className="flex items-center gap-3 border-b border-edge px-5 py-4">
        <h2 className="text-sm font-bold text-fg">
          {onPick ? `בחירת ${kind ? kindLabels[kind] : 'נכס'}` : 'ספריית הנכסים'}
        </h2>

        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute inset-y-0 my-auto size-4 text-fg-muted start-3"
            aria-hidden
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="חיפוש לפי שם הקובץ"
            aria-label="חיפוש נכס"
            className="w-full rounded-lg border border-edge py-1.5 ps-9 pe-3 text-sm bg-field text-fg placeholder:text-fg-muted focus:border-volt-dim focus:ring-1 focus:ring-volt focus:outline-none"
          />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-volt px-3 py-1.5 text-sm font-semibold text-on-volt transition hover:bg-volt-bright disabled:opacity-50"
        >
          <Upload className="size-4" aria-hidden />
          {busy ? 'מעלה…' : 'העלאה'}
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="סגירת ספריית הנכסים"
          className="rounded-lg p-1.5 text-fg-muted transition hover:bg-panel-2 hover:text-fg-soft"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptFor(kind)}
        className="hidden"
        onChange={(event) => {
          void handleFiles(event.target.files);
          // איפוס הערך מאפשר לבחור שוב את אותו קובץ אחרי מחיקה
          event.target.value = '';
        }}
      />

      {errors.length > 0 && (
        <ul className="border-b border-warn bg-warn-soft px-5 py-3 text-xs leading-relaxed text-warn">
          {errors.map((error) => (
            <li key={error} className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {error}
            </li>
          ))}
        </ul>
      )}

      <div
        className={cn(
          'max-h-[60vh] min-h-[16rem] overflow-y-auto p-5 transition',
          dragging && 'bg-volt-soft/60 ring-2 ring-inset ring-volt',
        )}
      >
        {visible.length === 0 ? (
          <div className="flex h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-edge text-center">
            <ImageIcon className="size-8 text-fg-muted" aria-hidden />
            <p className="text-sm font-semibold text-fg-muted">
              {assets.length === 0 ? 'עדיין אין נכסים בפרויקט' : 'אין נכס שתואם את החיפוש'}
            </p>
            <p className="max-w-sm text-xs leading-relaxed text-fg-muted">
              גררו לכאן תמונות או סרטונים, או לחצו על "העלאה". הקבצים נשמרים בתוך הפרויקט ונארזים
              איתו לקובץ ולתוצר המיוצא.
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {visible.map((asset) => {
              const url = urls[asset.id];
              const unused = !usedIds.has(asset.id);

              return (
                <li key={asset.id} className="group relative">
                  <button
                    type="button"
                    onClick={() => onPick?.(asset.id)}
                    disabled={!onPick}
                    className={cn(
                      'block w-full overflow-hidden rounded-xl border border-edge bg-panel text-start transition',
                      onPick
                        ? 'hover:-translate-y-0.5 hover:border-volt-dim hover:shadow-md'
                        : 'cursor-default',
                    )}
                  >
                    <span className="flex h-28 items-center justify-center bg-app">
                      {asset.kind === 'image' && url ? (
                        <img
                          src={url}
                          alt=""
                          className="size-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <Film className="size-7 text-fg-muted" aria-hidden />
                      )}
                    </span>

                    <span className="block px-2.5 py-2">
                      <span className="block truncate text-xs font-semibold text-fg">
                        {asset.originalName}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-fg-muted">
                        <span dir="ltr">{formatBytes(asset.size)}</span>
                        {asset.width && asset.height && (
                          <span dir="ltr">
                            {asset.width}×{asset.height}
                          </span>
                        )}
                      </span>
                      {unused && (
                        <span className="mt-1.5 inline-block rounded-md bg-panel-2 px-1.5 py-0.5 text-[10px] font-medium text-fg-muted">
                          לא בשימוש
                        </span>
                      )}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPendingDelete(asset)}
                    aria-label={`מחיקת ${asset.originalName}`}
                    className="absolute end-1.5 top-1.5 rounded-lg bg-panel/90 p-1.5 text-fg-muted opacity-0 shadow-sm transition group-hover:opacity-100 hover:text-danger focus:opacity-100"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {pendingDelete && (
        <DeleteAssetConfirm
          asset={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void confirmDelete(pendingDelete)}
        />
      )}
    </dialog>
  );
}

/**
 * אישור מחיקה.
 *
 * מוצג בתוך אותו `<dialog>` ולא כחלון מודאלי שני: `showModal` מקונן שובר
 * את מחסנית ה-inert של הדפדפן, והתוצאה היא חלון שנסגר ומשאיר את הרקע
 * חסום. ההפניות בבלוקים אינן מנוקות — הרנדרר כבר מטפל בנכס חסר, וניקוי
 * היה מחייב פונקציית "נקה assetId" בכל תשעת סוגי הבלוקים.
 */
function DeleteAssetConfirm({
  asset,
  onCancel,
  onConfirm,
}: {
  asset: AssetMeta;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const course = useCourseStore((state) => state.course);
  const usage = useMemo(
    () => (course ? collectCourseAssetIds(course).has(asset.id) : false),
    [course, asset.id],
  );

  return (
    <div
      role="alertdialog"
      aria-label="אישור מחיקת נכס"
      className="border-t border-edge bg-app px-5 py-4"
    >
      <p className="text-sm font-semibold text-fg">מחיקת "{asset.originalName}"?</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-soft">
        {usage
          ? 'הנכס מופיע בלומדה. אחרי המחיקה הבלוקים שמשתמשים בו יציגו מצב ריק, ותצטרכו לבחור בהם נכס אחר.'
          : 'הנכס אינו בשימוש באף בלוק. המחיקה תפנה את המקום שהוא תופס.'}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-danger px-3 py-1.5 text-xs font-semibold text-on-danger hover:opacity-90"
        >
          מחיקה
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-edge bg-panel px-3 py-1.5 text-xs font-semibold text-fg-soft hover:bg-app"
        >
          ביטול
        </button>
      </div>
    </div>
  );
}
