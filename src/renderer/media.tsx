import type { ReactNode } from 'react';
import { Image as ImageIcon } from 'lucide-react';
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
 * מוצג בסביבות היוצר בלבד (עורך + תצוגה מקדימה, `authoring`). בתוצר של
 * הלומד הוא לא מרונדר כלל — לומדה מיוצאת לא צריכה להראות ללומד מסגרת ריקה.
 *
 * כשמועבר `prompt` (הפרומפט המומלץ שה-AI הציע), ה-placeholder מציג אותו
 * עם הזמנה להעתיק אותו למחולל תמונות — כך היוצר רואה בדיוק היכן נועדה
 * תמונה ומה מומלץ ליצור.
 */
export function MediaPlaceholder({
  label,
  ratio,
  className,
  prompt,
}: {
  label: string;
  ratio?: string;
  className?: string;
  prompt?: string;
}) {
  const { authoring } = useRenderContext();
  if (!authoring) return null;

  const hasPrompt = Boolean(prompt?.trim());

  return (
    <div
      className={['lc-media-placeholder', hasPrompt && 'lc-media-placeholder--prompt', className]
        .filter(Boolean)
        .join(' ')}
      style={{ aspectRatio: ratio ? aspectRatioValue(ratio) : undefined }}
      role="note"
    >
      <ImageIcon className="lc-media-placeholder__icon" aria-hidden />
      {hasPrompt ? (
        <span className="lc-media-placeholder__body">
          <span className="lc-media-placeholder__label">תמונה מומלצת</span>
          <span className="lc-media-placeholder__prompt" dir="ltr">
            {prompt}
          </span>
          <span className="lc-media-placeholder__note">
            העתיקו את הפרומפט למחולל תמונות, ואז העלו את התוצאה בפאנל ההגדרות
          </span>
        </span>
      ) : (
        <span className="lc-media-placeholder__body">{label}</span>
      )}
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
