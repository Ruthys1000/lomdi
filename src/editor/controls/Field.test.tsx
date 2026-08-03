import { useState } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedField } from './Field';

/**
 * בורר המקטעים מצהיר על עצמו כ-`radiogroup`, ולכן הוא מחויב להתנהגות של
 * בורר: חצים מזיזים את הבחירה, ורק האפשרות הנבחרת נמצאת בסדר ה-Tab. עד
 * שהתנהגות זו נבדקה, ההצהרה ב-ARIA הבטיחה לקורא המסך משהו שלא היה קיים.
 */
const options = [
  { value: 'a', label: 'ראשון' },
  { value: 'b', label: 'שני' },
  { value: 'c', label: 'שלישי' },
];

/** עוטף עם state אמיתי, כי ניווט בחצים נשען על כך שהבחירה באמת זזה */
function Harness({ onChange }: { onChange?: (value: string) => void }) {
  const [value, setValue] = useState('a');

  return (
    <SegmentedField
      label="מצב"
      value={value}
      options={options}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

/** הכיווניות מוצהרת בכל בדיקה במפורש — היא זו שקובעת מה כל חץ עושה */
function renderIn(dir: 'rtl' | 'ltr', onChange?: (value: string) => void) {
  render(
    <div dir={dir}>
      <Harness onChange={onChange} />
    </div>,
  );
  return screen.getAllByRole('radio');
}

describe('SegmentedField', () => {
  it('רק האפשרות הנבחרת נמצאת בסדר ה-Tab', () => {
    const radios = renderIn('rtl');

    expect(radios[0]).toHaveAttribute('tabindex', '0');
    expect(radios[1]).toHaveAttribute('tabindex', '-1');
    expect(radios[2]).toHaveAttribute('tabindex', '-1');
  });

  // בממשק עברי האפשרות הראשונה היא הימנית, ולכן "הבאה" נמצאת שמאלה. חץ
  // שמתעלם מהכיווניות מזיז את הבחירה לכיוון ההפוך ממה שהעין רואה
  it('בממשק RTL חץ שמאלה מתקדם, והפוקוס נודד עם הבחירה', () => {
    const radios = renderIn('rtl');

    radios[0].focus();
    fireEvent.keyDown(radios[0], { key: 'ArrowLeft' });

    expect(radios[1]).toHaveAttribute('aria-checked', 'true');
    // הפוקוס חייב לנדוד, אחרת החץ הבא היה נמדד מהאפשרות הקודמת
    expect(radios[1]).toHaveFocus();

    fireEvent.keyDown(radios[1], { key: 'ArrowLeft' });
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');
  });

  it('בממשק LTR הכיוונים מתהפכים', () => {
    const radios = renderIn('ltr');

    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(radios[1], { key: 'ArrowLeft' });
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('חצי מעלה ומטה עובדים בכל כיווניות', () => {
    const radios = renderIn('rtl');

    fireEvent.keyDown(radios[0], { key: 'ArrowDown' });
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(radios[1], { key: 'ArrowUp' });
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('הבחירה מעגלית בשני הכיוונים', () => {
    const radios = renderIn('rtl');

    // מהראשון אחורה — לאחרון
    fireEvent.keyDown(radios[0], { key: 'ArrowRight' });
    expect(radios[2]).toHaveAttribute('aria-checked', 'true');

    // ומהאחרון קדימה — חזרה לראשון
    fireEvent.keyDown(radios[2], { key: 'ArrowLeft' });
    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('מקש שאינו חץ אינו משנה בחירה', () => {
    const onChange = vi.fn();
    const radios = renderIn('rtl', onChange);

    fireEvent.keyDown(radios[0], { key: 'a' });

    expect(onChange).not.toHaveBeenCalled();
  });

  it('ערך שאינו אחת האפשרויות משאיר נקודת כניסה במקלדת', () => {
    render(
      <SegmentedField label="מצב" value="לא-קיים" options={options} onChange={() => {}} />,
    );

    // בלי זה roving tabindex היה מוציא את כל הבורר מסדר ה-Tab
    expect(screen.getAllByRole('radio')[0]).toHaveAttribute('tabindex', '0');
    expect(screen.getAllByRole('radio').filter((radio) => radio.tabIndex === 0)).toHaveLength(1);
  });
});
