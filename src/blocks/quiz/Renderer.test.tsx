import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { createBlock } from '@/model/factory';
import type { BlockOf } from '@/model/types';
import { RenderContext, type RenderContextValue } from '@/renderer/RenderContext';
import { createQuizContent, createQuizOption, quizIssues, type QuizContent } from './content';
import { QuizRenderer } from './Renderer';

function renderQuiz(overrides: Partial<QuizContent> = {}, isEditing = false) {
  const content = createQuizContent({
    question: 'מתי כדאי למקם שאלת תרגול?',
    options: [
      createQuizOption({ id: 'option-a', text: 'מיד אחרי הרעיון', correct: true }),
      createQuizOption({ id: 'option-b', text: 'רק בסוף הלומדה' }),
      createQuizOption({ id: 'option-c', text: 'עדיף בלי שאלות' }),
    ],
    feedbackCorrect: 'בדיוק. שליפה סמוכה לקריאה מחזקת את הזיכרון.',
    feedbackIncorrect: 'לא מדויק. מבחן מסכם בודק מה נשאר.',
    ...overrides,
  });

  const block = { ...createBlock('quiz'), content } as BlockOf<QuizContent>;
  const ctx: RenderContextValue = {
    direction: 'rtl',
    resolveAssetUrl: () => undefined,
    isEditing,
    authoring: isEditing,
  };

  return render(
    <RenderContext value={ctx}>
      <QuizRenderer block={block} />
    </RenderContext>,
  );
}

describe('QuizRenderer — מענה', () => {
  it('מציג את השאלה ואת כל אפשרויות התשובה', () => {
    renderQuiz();

    expect(screen.getByText('מתי כדאי למקם שאלת תרגול?')).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
  });

  it('כפתור הבדיקה מושבת עד שנבחרה תשובה', async () => {
    const user = userEvent.setup();
    renderQuiz();

    const submit = screen.getByRole('button', { name: 'בדיקה' });
    expect(submit).toBeDisabled();

    await user.click(screen.getByRole('radio', { name: /מיד אחרי הרעיון/ }));
    expect(submit).toBeEnabled();
  });

  it('מציג משוב חיובי לתשובה נכונה', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByRole('radio', { name: /מיד אחרי הרעיון/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));

    const status = screen.getByRole('status');
    expect(within(status).getByText(/בדיוק/)).toBeInTheDocument();
    expect(within(status).getByText('נכון.')).toBeInTheDocument();
  });

  it('מציג משוב שלילי לתשובה שגויה', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByRole('radio', { name: /רק בסוף הלומדה/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));

    const status = screen.getByRole('status');
    expect(within(status).getByText(/לא מדויק/)).toBeInTheDocument();
  });

  it('מעביר את התוצאה גם בטקסט ולא רק בצבע (סעיף 18)', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByRole('radio', { name: /מיד אחרי הרעיון/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));

    // aria-live מבטיח שקורא מסך יקריא את התוצאה בלי לחפש אותה
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    // והתשובה עצמה מסומנת באייקון בעל שם נגיש, לא רק במסגרת צבעונית
    expect(screen.getByLabelText('תשובה נכונה')).toBeInTheDocument();
  });

  it('ניסיון נוסף מאפס את השאלה', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByRole('radio', { name: /רק בסוף הלומדה/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));
    await user.click(screen.getByRole('button', { name: 'ניסיון נוסף' }));

    expect(screen.queryByRole('status')).toBeEmptyDOMElement();
    expect(screen.getByRole('button', { name: 'בדיקה' })).toBeDisabled();
  });

  it('בלי ניסיון נוסף, השאלה ננעלת אחרי מענה', async () => {
    const user = userEvent.setup();
    renderQuiz({ allowRetry: false });

    await user.click(screen.getByRole('radio', { name: /רק בסוף הלומדה/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));

    expect(screen.queryByRole('button', { name: 'ניסיון נוסף' })).toBeNull();
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled();
  });

  it('הצגת פתרון חושפת את התשובה הנכונה', async () => {
    const user = userEvent.setup();
    renderQuiz();

    await user.click(screen.getByRole('radio', { name: /עדיף בלי שאלות/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));
    await user.click(screen.getByRole('button', { name: 'הצגת הפתרון' }));

    expect(screen.getByLabelText('תשובה נכונה')).toBeInTheDocument();
  });

  it('כפתור הפתרון אינו מוצג כשהאפשרות כבויה', async () => {
    const user = userEvent.setup();
    renderQuiz({ showSolution: false });

    await user.click(screen.getByRole('radio', { name: /עדיף בלי שאלות/ }));
    await user.click(screen.getByRole('button', { name: 'בדיקה' }));

    expect(screen.queryByRole('button', { name: 'הצגת הפתרון' })).toBeNull();
  });
});

describe('QuizRenderer — ערבוב', () => {
  const optionTexts = () => screen.getAllByRole('radio').map((radio) => radio.closest('label')?.textContent);

  it('שומר על סדר יציב בין רינדורים חוזרים', async () => {
    const user = userEvent.setup();
    const { rerender } = renderQuiz({ shuffle: true });

    const before = optionTexts();

    // כל אינטראקציה מרנדרת מחדש; הסדר לא יכול להשתנות מתחת ליד של הלומד
    await user.click(screen.getAllByRole('radio')[0]);
    expect(optionTexts()).toEqual(before);

    rerender(<div />);
  });

  it('אינו מערבב כלל במצב עריכה', () => {
    renderQuiz({ shuffle: true }, true);

    expect(optionTexts().map((text) => text?.trim())).toEqual([
      'מיד אחרי הרעיון',
      'רק בסוף הלומדה',
      'עדיף בלי שאלות',
    ]);
  });
});

describe('quizIssues', () => {
  it('מאשר שאלה תקינה', () => {
    expect(quizIssues(createQuizContent())).toEqual([]);
  });

  it('מזהה שאלה בלי תשובה נכונה', () => {
    const content = createQuizContent({
      options: [createQuizOption({ text: 'א' }), createQuizOption({ text: 'ב' })],
    });

    expect(quizIssues(content).join(' ')).toContain('לא סומנה תשובה נכונה');
  });

  it('מזהה יותר מתשובה נכונה אחת', () => {
    const content = createQuizContent({
      options: [
        createQuizOption({ text: 'א', correct: true }),
        createQuizOption({ text: 'ב', correct: true }),
      ],
    });

    expect(quizIssues(content).join(' ')).toContain('יותר מתשובה נכונה אחת');
  });

  it('מזהה אפשרות ריקה ושאלה בלי נוסח', () => {
    const content = createQuizContent({
      question: '   ',
      options: [
        createQuizOption({ text: 'א', correct: true }),
        createQuizOption({ text: '  ' }),
      ],
    });

    const issues = quizIssues(content).join(' ');
    expect(issues).toContain('אפשרות תשובה ריקה');
    expect(issues).toContain('נוסח שאלה');
  });

  it('מזהה שאלה עם פחות משתי אפשרויות', () => {
    const content = createQuizContent({
      options: [createQuizOption({ text: 'א', correct: true })],
    });

    expect(quizIssues(content).join(' ')).toContain('שתי אפשרויות');
  });
});
