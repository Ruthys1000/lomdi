import type { BlockOf } from '@/model/types';
import type { QuoteContent } from './content';

/**
 * בלוק ציטוט/המלצה.
 *
 * הווריאציה היא קלאס `.lc-quote--v-*` בלבד — כל ההבדל החזותי חי ב-course.css,
 * בלי לוגיקה כאן (אותו דפוס כמו שאר הבלוקים). סימן הציטוט הגדול נוצר ב-CSS
 * כ-`::before` ולכן אינו נקרא על ידי קורא מסך.
 */
export function QuoteRenderer({ block }: { block: BlockOf<QuoteContent> }) {
  const { content } = block;

  return (
    <div className="lc-container">
      <figure className={`lc-quote lc-quote--v-${content.variant || 'emphasis'}`}>
        <blockquote className="lc-quote__text">{content.text}</blockquote>
        {(content.author || content.role) && (
          <figcaption className="lc-quote__cite">
            {content.author && <span className="lc-quote__author">{content.author}</span>}
            {content.role && <span className="lc-quote__role">{content.role}</span>}
          </figcaption>
        )}
      </figure>
    </div>
  );
}
