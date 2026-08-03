import type { BlockOf } from '@/model/types';
import { useRenderContext } from '@/renderer/RenderContext';
import type { HeroContent } from './content';

const heroGradient = (content: HeroContent) =>
  `linear-gradient(135deg, ${content.gradientFrom}, ${content.gradientTo})`;

/**
 * רקע הבלוק: לפי הערכה, צבע, גרדיאנט או תמונה עם שכבת כיסוי שמגנה על הקריאות.
 *
 * `theme` אינו מחזיר style כלל — הרקע מגיע מ-`--lc-gradient-hero` ב-CSS, ולכן
 * הוא מתחלף עם הערכה בלי שהתוכן יישמר צבעים משלו.
 */
function backgroundStyle(content: HeroContent, imageUrl: string | undefined) {
  switch (content.backgroundType) {
    case 'theme':
      return undefined;
    case 'color':
      return { background: content.backgroundColor };
    case 'gradient':
      return { background: heroGradient(content) };
    case 'image':
      // עם תמונה — היא הרקע. בלי תמונה (Lomdi לא מייצר) — נופלים לרקע הערכה
      // ולא לצבע אחיד שטוח, כדי שה-hero לעולם לא ייראה קופסה ריקה.
      return imageUrl
        ? { backgroundImage: `url("${imageUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : undefined;
  }
}

export function HeroRenderer({ block }: { block: BlockOf<HeroContent> }) {
  const { content } = block;
  const { resolveAssetUrl, authoring } = useRenderContext();
  const imageUrl = content.imageAssetId ? resolveAssetUrl(content.imageAssetId) : undefined;

  const hasImageBackground = content.backgroundType === 'image' && Boolean(imageUrl);
  // רמז ליוצר: hero שנועד לתמונה אך עדיין ריק — מציג תג עם הפרומפט המומלץ,
  // רק בסביבות היוצר (לא בתוצר של הלומד).
  const showImageHint =
    authoring && content.backgroundType === 'image' && !imageUrl && Boolean(content.imagePrompt?.trim());

  return (
    <section
      className={[
        'lc-hero',
        // fallback ל-centered גם לתוכן ישן/ידני שלא עבר אימות עם ברירת המחדל
        `lc-hero--v-${content.variant || 'centered'}`,
        `lc-hero--h-${content.height}`,
        `lc-hero--align-${content.alignment}`,
        content.fullBleed ? 'lc-hero--full' : 'lc-hero--contained',
      ].join(' ')}
      style={backgroundStyle(content, imageUrl)}
    >
      {hasImageBackground && (
        <div className="lc-hero__overlay" style={{ opacity: content.overlayOpacity }} aria-hidden />
      )}

      {showImageHint && (
        <div className="lc-hero__image-hint" role="note">
          <span className="lc-hero__image-hint-label">תמונת רקע מומלצת</span>
          <span className="lc-hero__image-hint-prompt" dir="ltr">
            {content.imagePrompt}
          </span>
        </div>
      )}

      <div className="lc-hero__inner lc-container">
        {content.intro && <p className="lc-hero__intro">{content.intro}</p>}
        {content.title && <h1 className="lc-hero__title">{content.title}</h1>}
        {content.subtitle && <p className="lc-hero__subtitle">{content.subtitle}</p>}

        {content.button.enabled && content.button.label && (
          <p className="lc-hero__actions">
            <a
              className="lc-button lc-button--primary lc-hero__button"
              href={content.button.href || '#'}
              {...(content.button.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              {content.button.label}
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
