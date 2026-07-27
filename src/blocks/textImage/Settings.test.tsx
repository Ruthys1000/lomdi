import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createBlock } from '@/model/factory';
import type { BlockOf } from '@/model/types';
import { createTextImageContent, type TextImageContent } from './content';
import { TextImageSettings } from './Settings';

/**
 * מזהיר על תמונה בלי טקסט חלופי — בדיוק כמו בלוק התמונה. תוכן שנוצר דינמית
 * (בעתיד ע"י AI) עלול להשמיט alt, וזו נגישות שנשברת בשקט לקורא מסך.
 */
function renderSettings(content: Partial<TextImageContent>) {
  const block = createBlock('textImage', {
    content: createTextImageContent(content),
  }) as BlockOf<TextImageContent>;
  return render(<TextImageSettings block={block} onChange={() => undefined} />);
}

const WARNING = /קורא מסך/;

describe('TextImageSettings — התראת טקסט חלופי', () => {
  it('מזהיר כשיש תמונה אבל אין טקסט חלופי', () => {
    renderSettings({ imageAssetId: 'asset-1234567890', alt: '' });
    expect(screen.getByText(WARNING)).toBeInTheDocument();
  });

  it('לא מזהיר כשיש טקסט חלופי', () => {
    renderSettings({ imageAssetId: 'asset-1234567890', alt: 'תרשים זרימה' });
    expect(screen.queryByText(WARNING)).toBeNull();
  });

  it('לא מזהיר כשעדיין לא נבחרה תמונה', () => {
    renderSettings({ imageAssetId: '', alt: '' });
    expect(screen.queryByText(WARNING)).toBeNull();
  });
});
