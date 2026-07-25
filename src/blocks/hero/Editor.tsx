import type { BlockOf } from '@/model/types';
import { useRenderContext } from '@/renderer/RenderContext';
import { InlineText } from '@/editor/inline/InlineText';
import type { HeroContent } from './content';

interface HeroEditorProps {
  block: BlockOf<HeroContent>;
  onChange: (content: HeroContent) => void;
}

function backgroundStyle(content: HeroContent, imageUrl: string | undefined) {
  switch (content.backgroundType) {
    case 'color':
      return { background: content.backgroundColor };
    case 'gradient':
      return { background: `linear-gradient(135deg, ${content.gradientFrom}, ${content.gradientTo})` };
    case 'image':
      return imageUrl
        ? { backgroundImage: `url("${imageUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: content.backgroundColor };
  }
}

/**
 * עריכת הכותרת הראשית במקום שבו היא מוצגת.
 *
 * המבנה והקלאסים זהים ל-Renderer, כדי שמה שנערך ייראה בדיוק כמו התוצר.
 * ההבדל היחיד הוא שהטקסטים ניתנים להקלדה — ולכן גם השדות הריקים מוצגים,
 * בעוד שברנדרר הם פשוט לא קיימים.
 */
export function HeroEditor({ block, onChange }: HeroEditorProps) {
  const { content } = block;
  const { resolveAssetUrl } = useRenderContext();
  const imageUrl = content.imageAssetId ? resolveAssetUrl(content.imageAssetId) : undefined;
  const hasImageBackground = content.backgroundType === 'image' && Boolean(imageUrl);

  return (
    <section
      className={[
        'lc-hero',
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
        <InlineText
          as="p"
          className="lc-hero__intro"
          ariaLabel="טקסט פתיחה"
          placeholder="טקסט פתיחה"
          value={content.intro}
          singleLine
          onChange={(intro) => onChange({ ...content, intro })}
        />
        <InlineText
          as="h1"
          className="lc-hero__title"
          ariaLabel="כותרת"
          placeholder="כותרת הלומדה"
          value={content.title}
          singleLine
          onChange={(title) => onChange({ ...content, title })}
        />
        <InlineText
          as="p"
          className="lc-hero__subtitle"
          ariaLabel="כותרת משנה"
          placeholder="כותרת משנה"
          value={content.subtitle}
          onChange={(subtitle) => onChange({ ...content, subtitle })}
        />

        {content.button.enabled && (
          <p className="lc-hero__actions">
            <span className="lc-button lc-button--primary lc-hero__button">
              <InlineText
                ariaLabel="טקסט הכפתור"
                placeholder="טקסט הכפתור"
                value={content.button.label}
                singleLine
                onChange={(label) => onChange({ ...content, button: { ...content.button, label } })}
              />
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
