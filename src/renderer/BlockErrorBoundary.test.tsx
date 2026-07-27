import { render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlockErrorBoundary } from './BlockErrorBoundary';

/** רכיב שזורק בזמן רינדור, כדי לדמות רנדרר בלוק פגום */
function Boom(): never {
  throw new Error('רינדור נכשל בכוונה');
}

describe('BlockErrorBoundary', () => {
  beforeEach(() => {
    // גבול שגיאה מדפיס את השגיאה ל-console.error; משתיקים כדי לא ללכלך את הפלט
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('בתוצר מדלג בשקט על בלוק שזרק חריגה', () => {
    render(
      <BlockErrorBoundary blockType="quiz" isEditing={false}>
        <Boom />
      </BlockErrorBoundary>,
    );

    expect(screen.queryByRole('note')).toBeNull();
  });

  it('בעורך מציג הודעת שגיאה עם שם הבלוק במקום להפיל את העץ', () => {
    render(
      <BlockErrorBoundary blockType="quiz" isEditing>
        <Boom />
      </BlockErrorBoundary>,
    );

    expect(screen.getByRole('note')).toHaveTextContent('שאלת בחירה');
  });

  it('מרנדר את הילדים כרגיל כשאין שגיאה', () => {
    render(
      <BlockErrorBoundary blockType="richText" isEditing>
        <p>תוכן תקין</p>
      </BlockErrorBoundary>,
    );

    expect(screen.getByText('תוכן תקין')).toBeInTheDocument();
    expect(screen.queryByRole('note')).toBeNull();
  });
});
