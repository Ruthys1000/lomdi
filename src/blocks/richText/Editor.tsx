import type { BlockOf, RichTextDoc } from '@/model/types';
import { RichTextEditor } from '@/editor/richText/RichTextEditor';
import type { RichTextContent } from './content';

interface RichTextBlockEditorProps {
  block: BlockOf<RichTextContent>;
  onChange: (content: RichTextContent) => void;
}

export function RichTextBlockEditor({ block, onChange }: RichTextBlockEditorProps) {
  const { content } = block;

  return (
    <div className={`lc-container lc-text lc-text--${content.maxWidth}`}>
      <RichTextEditor
        doc={content.doc}
        onChange={(doc: RichTextDoc) => onChange({ ...content, doc })}
        placeholder="כתבו כאן את התוכן…"
      />
    </div>
  );
}
