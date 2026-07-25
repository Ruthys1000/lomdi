import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WelcomeScreen } from './WelcomeScreen';

/**
 * מסך הפתיחה נשען על IndexedDB (פרויקטים אחרונים) ועל טעינת קובץ פרויקט.
 * שניהם ממוקים כאן, כי מה שנבדק הוא המסך: התבניות שמוצגות, הבחירה בהן,
 * וגרירת קובץ לכל שטח המסך — היכולת שהוחלפה בקופסה קטנה בתחתית.
 */
vi.mock('@/persistence/db', () => ({
  listProjects: () => Promise.resolve([]),
  deleteProject: () => Promise.resolve(),
}));

const openProjectFile = vi.fn((_file: Blob) => Promise.resolve({ ok: true as const }));

vi.mock('@/persistence/session', () => ({
  openProjectFile: (file: Blob) => openProjectFile(file),
  openStoredProject: () => Promise.resolve({ ok: true }),
}));

beforeEach(() => {
  openProjectFile.mockClear();
});

/** ה-await מרוקן את טעינת הפרויקטים האחרונים, שאחרת מעדכנת state אחרי סוף הבדיקה */
async function setup() {
  const onStart = vi.fn();
  const onOpened = vi.fn();
  render(<WelcomeScreen onStart={onStart} onOpened={onOpened} />);
  await act(async () => undefined);
  return { onStart, onOpened };
}

describe('מסך הפתיחה', () => {
  it('מציג את שלוש התבניות שאפשר להתחיל מהן', async () => {
    await setup();

    expect(screen.getByRole('button', { name: /לומדה ריקה/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /הדרכה קצרה/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /לומדת הדוגמה/ })).toBeInTheDocument();
  });

  it('לחיצה על תבנית פותחת לומדה חדשה עם התוכן שלה', async () => {
    const { onStart } = await setup();

    fireEvent.click(screen.getByRole('button', { name: /הדרכה קצרה/ }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0][0].chapters.length).toBeGreaterThan(0);
  });

  it('התבניות שטרם מומשו מוצגות כשורת טקסט ולא ככפתורים מתים', async () => {
    await setup();

    expect(screen.getByText(/בקרוב:/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /נוהל או מדיניות/ })).not.toBeInTheDocument();
  });

  it('קובץ שנגרר לכל מקום במסך נטען כפרויקט', async () => {
    const { onOpened } = await setup();
    const file = new File(['zip'], 'course.zip', { type: 'application/zip' });

    fireEvent.drop(screen.getByRole('main'), { dataTransfer: { files: [file] } });

    await waitFor(() => expect(openProjectFile).toHaveBeenCalledWith(file));
    expect(onOpened).toHaveBeenCalled();
  });

  it('גרירה מעל המסך משנה את ההודעה, כדי שיהיה ברור שהשחרור יעבוד', async () => {
    await setup();

    fireEvent.dragOver(screen.getByRole('main'), { dataTransfer: { files: [] } });

    expect(screen.getByText('שחררו כאן את הקובץ')).toBeInTheDocument();
  });
});
