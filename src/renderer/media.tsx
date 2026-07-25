import type { ReactNode } from 'react';
import { useRenderContext } from './RenderContext';

/** עוזרי מדיה משותפים לבלוקי תמונה, טקסט ותמונה ווידאו */

const ASPECT_RATIOS: Record<string, string | undefined> = {
  auto: undefined,
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '1:1': '1 / 1',
  '3:2': '3 / 2',
  '21:9': '21 / 9',
};

const aspectRatioValue = (ratio: string): string | undefined => ASPECT_RATIOS[ratio];

const roundnessClass = (roundness: string) => `lc-round--${roundness}`;

/**
 * מצב ריק למדיה שטרם הוגדרה.
 *
 * מוצג בעורך בלבד. בתוצר הוא לא מרונדר כלל — לומדה מיוצאת לא צריכה
 * להראות ללומד מסגרת מקווקוות עם הוראות לעורך.
 */
export function MediaPlaceholder({
  label,
  ratio,
  className,
}: {
  label: string;
  ratio?: string;
  className?: string;
}) {
  const { isEditing } = useRenderContext();
  if (!isEditing) return null;

  return (
    <div
      className={['lc-media-placeholder', className].filter(Boolean).join(' ')}
      style={{ aspectRatio: ratio ? aspectRatioValue(ratio) : undefined }}
      role="note"
    >
      {label}
    </div>
  );
}

/**
 * תמונה שמקורה נכס בפרויקט.
 *
 * loading="lazy" נדרש בתוצר (סעיף 19). ה-alt מגיע תמיד מהתוכן — גם כשהוא
 * ריק, כדי שקורא מסך יתייחס לתמונה כדקורטיבית ולא יקריא את שם הקובץ.
 */
export function AssetImage({
  url,
  alt,
  ratio,
  fit = 'cover',
  roundness = 'medium',
  className,
}: {
  url: string;
  alt: string;
  ratio?: string;
  fit?: 'cover' | 'contain';
  roundness?: string;
  className?: string;
}) {
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={['lc-image', roundnessClass(roundness), className].filter(Boolean).join(' ')}
      style={{
        aspectRatio: ratio ? aspectRatioValue(ratio) : undefined,
        objectFit: ratio && ratio !== 'auto' ? fit : undefined,
      }}
    />
  );
}

export function Figure({ caption, children }: { caption?: string; children: ReactNode }) {
  if (!caption) return <>{children}</>;
  return (
    <figure className="lc-figure">
      {children}
      <figcaption className="lc-figure__caption">{caption}</figcaption>
    </figure>
  );
}
