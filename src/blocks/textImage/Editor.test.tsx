import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createBlock } from '@/model/factory';
import type { BlockOf } from '@/model/types';
import { createTextImageContent, type TextImageContent } from './content';
import { TextImageEditor } from './Editor';

/**
 * שומר מפני סחף: מחלקת הווריאציה הראשית חייבת להופיע גם ב-Editor (הקנבס מציג
 * אותו במקום ה-Renderer בזמן עריכה). בלי זה שינוי וריאציה נראה רק בתצוגה המקדימה.
 */
function renderEditor(variant: TextImageContent['variant']) {
  const block = createBlock('textImage', {
    content: createTextImageContent({ variant }),
  }) as BlockOf<TextImageContent>;
  return render(<TextImageEditor block={block} onChange={() => undefined} />);
}

describe('TextImageEditor — מחלקת וריאציה', () => {
  it('מחיל את מחלקת הווריאציה הראשית על השורש (זהה ל-Renderer)', () => {
    const { container } = renderEditor('feature');
    expect(container.querySelector('.lc-text-image--v-feature')).not.toBeNull();
  });
});
