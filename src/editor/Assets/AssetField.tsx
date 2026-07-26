import { useState } from 'react';
import { Film, ImagePlus, Replace, Trash2 } from 'lucide-react';
import type { AssetKind } from '@/model/types';
import { useAssetStore } from '@/state/assetStore';
import { AssetLibraryModal } from './AssetLibraryModal';

interface AssetFieldProps {
  label: string;
  /** מחרוזת ריקה = לא נבחר נכס. אותה מוסכמה כמו ב-assetRefSchema */
  assetId: string;
  onChange: (assetId: string) => void;
  kind?: AssetKind;
  hint?: string;
}

/**
 * בחירת נכס מתוך פאנל ההגדרות.
 *
 * הרכיב מחזיק `assetId` בלבד ומעולם לא כתובת — הכתובת נשלפת כאן רק כדי
 * להציג תצוגה מקדימה. זו אותה מוסכמה שמונעת מנתיבי `blob:` לדלוף לתוצר
 * (ראה `RenderContext.resolveAssetUrl`).
 */
export function AssetField({ label, assetId, onChange, kind = 'image', hint }: AssetFieldProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const asset = useAssetStore((state) => state.assets.find((item) => item.id === assetId));
  const url = useAssetStore((state) => (assetId ? state.urls[assetId] : undefined));

  // נכס שנמחק מהספרייה משאיר הפניה תלויה. עדיף להסביר אותה מאשר להציג
  // ריבוע ריק שנראה כמו באג.
  const missing = Boolean(assetId) && !asset;

  return (
    <div>
      <span className="mb-1 block text-xs font-medium text-fg-soft">{label}</span>

      <div className="overflow-hidden rounded-lg border border-edge">
        <div className="flex h-24 items-center justify-center bg-app">
          {asset && kind === 'image' && url ? (
            <img src={url} alt="" className="size-full object-contain" />
          ) : asset ? (
            <Film className="size-6 text-fg-muted" aria-hidden />
          ) : (
            <span className="px-3 text-center text-[11px] leading-relaxed text-fg-muted">
              {missing
                ? 'הנכס שנבחר אינו קיים עוד'
                : kind === 'video'
                  ? 'לא נבחר סרטון'
                  : 'לא נבחרה תמונה'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 border-t border-edge bg-panel p-1.5">
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-volt transition hover:bg-volt-soft"
          >
            {assetId ? <Replace className="size-3.5" aria-hidden /> : <ImagePlus className="size-3.5" aria-hidden />}
            {assetId ? 'החלפה' : 'בחירה מהספרייה'}
          </button>

          {assetId && (
            <button
              type="button"
              onClick={() => onChange('')}
              aria-label="הסרת הנכס מהבלוק"
              title="הסרת הנכס מהבלוק"
              className="rounded-md p-1.5 text-fg-muted transition hover:bg-panel-2 hover:text-danger"
            >
              <Trash2 className="size-3.5" aria-hidden />
            </button>
          )}
        </div>
      </div>

      {asset && (
        <p className="mt-1 truncate text-[11px] text-fg-muted" title={asset.originalName}>
          {asset.originalName}
        </p>
      )}
      {hint && <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">{hint}</p>}

      <AssetLibraryModal
        open={pickerOpen}
        kind={kind}
        onClose={() => setPickerOpen(false)}
        onPick={(picked) => {
          onChange(picked);
          setPickerOpen(false);
        }}
      />
    </div>
  );
}
