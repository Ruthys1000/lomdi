import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectSummary } from '@/persistence/db';
import { WelcomeScreen } from './WelcomeScreen';

/**
 * מסך הפתיחה נשען על IndexedDB (הלומדות השמורות) ועל טעינת קובץ פרויקט.
 * שניהם ממוקים כאן, כי מה שנבדק הוא המסך: הפעולות שמוצגות, הסדר שלהן
 * ביחס לרשימה, וגרירת קובץ לכל שטח המסך.
 */
const project = (id: string, title: string, savedAt: string): ProjectSummary => ({
  id,
  title,
  savedAt,
  chapterCount: 3,
  blockCount: 7,
});

let projects: ProjectSummary[] = [];
let lastProjectId: string | null = null;

vi.mock('@/persistence/db', () => ({
  listProjects: () => Promise.resolve(projects),
  getLastProjectId: () => Promise.resolve(lastProjectId),
  deleteProject: () => Promise.resolve(),
}));

const openProjectFile = vi.fn((_file: Blob) => Promise.resolve({ ok: true as const }));

vi.mock('@/persistence/session', () => ({
  openProjectFile: (file: Blob) => openProjectFile(file),
  openStoredProject: () => Promise.resolve({ ok: true }),
}));

beforeEach(() => {
  openProjectFile.mockClear();
  projects = [];
  lastProjectId = null;
});

/** ה-await מרוקן את טעינת הלומדות, שאחרת מעדכנת state אחרי סוף הבדיקה */
async function setup() {
  const onStart = vi.fn();
  const onOpened = vi.fn();
  render(<WelcomeScreen onStart={onStart} onOpened={onOpened} />);
  await act(async () => undefined);
  return { onStart, onOpened };
}

describe('מסך הפתיחה', () => {
  it('מבקר חדש רואה פעולה ראשית "מתחילים לבנות" וקישור ללומדת דוגמה', async () => {
    await setup();

    // ה-CTA הראשי מופיע גם ב-Hero וגם בסוגר — לכן getAllByRole
    expect(screen.getAllByRole('button', { name: 'מתחילים לבנות' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: 'רואים לומדה לדוגמה' })).toBeInTheDocument();
  });

  it('לחיצה על "מתחילים לבנות" מחזירה לומדה עם פרק, ולא רק שם תבנית', async () => {
    const { onStart } = await setup();

    fireEvent.click(screen.getAllByRole('button', { name: 'מתחילים לבנות' })[0]);

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0][0].course.chapters.length).toBeGreaterThan(0);
  });

  it('"מבנה מוכן" מגיע עם תוכן ועם האיור שלו, ולא עם בלוקים ריקים', async () => {
    // "מבנה מוכן" ו"לומדת הדוגמה" הן נקודות כניסה של המבקר החוזר (המשגר)
    projects = [project('a', 'לומדה', '2026-03-01T10:00:00.000Z')];
    lastProjectId = 'a';
    const { onStart } = await setup();

    fireEvent.click(screen.getByRole('button', { name: /מבנה מוכן/ }));

    const { course, assets } = onStart.mock.calls[0][0];
    expect(assets.length).toBeGreaterThan(0);

    // הבלוקים אינם ברירת המחדל הריקה: אין כרטיס שנשאר "כותרת הכרטיס"
    const cards = course.chapters
      .flatMap((chapter: { blocks: { type: string; content: unknown }[] }) => chapter.blocks)
      .filter((block: { type: string }) => block.type === 'cards');
    expect(cards.length).toBeGreaterThan(0);
    for (const card of cards) {
      for (const item of (card.content as { items: { title: string }[] }).items) {
        expect(item.title).not.toBe('כותרת הכרטיס');
      }
    }
  });

  it('התבניות שטרם מומשו אינן מוצגות כלל', async () => {
    await setup();

    expect(screen.queryByText(/בקרוב/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /נוהל או מדיניות/ })).not.toBeInTheDocument();
  });

  it('הלומדה המובילה נבחרת לפי הלומדה שנפתחה לאחרונה, לא לפי זמן השמירה', async () => {
    projects = [
      project('b', 'נשמרה אחרונה', '2026-03-02T10:00:00.000Z'),
      project('a', 'נפתחה אחרונה', '2026-03-01T10:00:00.000Z'),
    ];
    lastProjectId = 'a';

    await setup();

    const featured = screen.getByRole('region', { name: 'ממשיכים מאיפה שעצרתם' });
    expect(featured).toHaveTextContent('נפתחה אחרונה');
  });

  it('גם עם עשר לומדות שמורות, "מתחילים לבנות" מופיע לפני הרשימה', async () => {
    projects = Array.from({ length: 10 }, (_, index) =>
      project(`p${index}`, `לומדה ${index}`, `2026-03-0${(index % 9) + 1}T10:00:00.000Z`),
    );
    lastProjectId = 'p0';

    await setup();

    // "מתחילים לבנות" מופיע כמה פעמים (רצועת המבקר החוזר, ה-Hero, הסוגר);
    // הראשון הוא זה שברצועה העליונה, והוא זה שצריך להיות מעל הרשימה
    const newButton = screen.getAllByRole('button', { name: 'מתחילים לבנות' })[0];
    const listHeading = screen.getByRole('heading', { name: 'הלומדות שלי' });

    // DOCUMENT_POSITION_FOLLOWING — הכותרת של הרשימה באה *אחרי* הכפתור
    expect(newButton.compareDocumentPosition(listHeading)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it('רשימה ארוכה מקופלת, ונפתחת בלחיצה אחת', async () => {
    projects = Array.from({ length: 10 }, (_, index) =>
      project(`p${index}`, `לומדה ${index}`, '2026-03-01T10:00:00.000Z'),
    );
    lastProjectId = 'p0';

    await setup();

    // אחת מובילה, ארבע ברשימה, וחמש מוסתרות מאחורי "עוד"
    const more = screen.getByRole('button', { name: /עוד 5 לומדות/ });
    fireEvent.click(more);

    expect(screen.queryByRole('button', { name: /עוד 5 לומדות/ })).not.toBeInTheDocument();
    expect(screen.getByText('לומדה 9')).toBeInTheDocument();
  });

  it('הנחיתה ("איך עובדים עם לומדי") מוצגת תמיד — גם למבקר חדש וגם כשיש לומדות שמורות', async () => {
    // מבקר חדש
    await setup();
    expect(screen.getByRole('heading', { name: 'איך עובדים עם לומדי' })).toBeInTheDocument();

    // מבקר חוזר — הנחיתה נשארת נגישה מתחת לרצועת "ממשיכים", ולא נעלמת
    cleanup();
    projects = [project('a', 'לומדה', '2026-03-01T10:00:00.000Z')];
    lastProjectId = 'a';
    await setup();

    expect(screen.getByRole('heading', { name: 'איך עובדים עם לומדי' })).toBeInTheDocument();
    // ועדיין רואים את רצועת ההמשך של המבקר החוזר
    expect(screen.getByRole('region', { name: 'ממשיכים מאיפה שעצרתם' })).toBeInTheDocument();
  });

  it('קובץ שנגרר לכל מקום במסך נטען כפרויקט', async () => {
    const { onOpened } = await setup();
    const file = new File(['zip'], 'course.zip', { type: 'application/zip' });

    fireEvent.drop(screen.getByRole('main'), { dataTransfer: { files: [file] } });

    await waitFor(() => expect(openProjectFile).toHaveBeenCalledWith(file));
    expect(onOpened).toHaveBeenCalled();
  });

  it('גרירה מעל המסך פותחת שכבת יעד על כל המסך', async () => {
    await setup();

    fireEvent.dragOver(screen.getByRole('main'), { dataTransfer: { files: [] } });

    expect(screen.getByText('שחררו. זה נטען לבד.')).toBeInTheDocument();
  });
});
