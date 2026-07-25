import type { BlockOf } from '@/model/types';
import { RichTextView } from '@/renderer/RichTextView';
import type { RichTextContent } from './content';

export function RichTextRenderer({ block }: { block: BlockOf<RichTextContent> }) {
  return (
    <div className={`lc-container lc-text lc-text--${block.content.maxWidth}`}>
      <RichTextView doc={block.content.doc} />
    </div>
  );
}
