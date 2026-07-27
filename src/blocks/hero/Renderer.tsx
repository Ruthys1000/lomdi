import type { BlockOf } from '@/model/types';
import { useRenderContext } from '@/renderer/RenderContext';
import type { HeroContent } from './content';

/** רקע הבלוק: צבע, גרדיאנט או תמונה עם שכבת כיסוי שמגנה על הקריאות */
function backgroundStyle(content: HeroContent, imageUrl: string | undefined) {
  switch (content.backgroundType) {
    case 'color':
      return { background: content.backgroundColor };
    case 'gradient':
      return {
        background: `linear-gradient(135deg, ${content.gradientFrom}, ${content.gradientTo})`,
      };
    case 'image':
      return imageUrl
        ? { backgroundImage: `url("${imageUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: content.backgroundColor };
  }
}

export function HeroRenderer({ block }: { block: BlockOf<HeroContent> }) {
  const { content } = block;
  const { resolveAssetUrl } = useRenderContext();
  const imageUrl = content.imageAssetId ? resolveAssetUrl(content.imageAssetId) : undefined;

  const hasImageBackground = content.backgroundType === 'image' && Boolean(imageUrl);

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
