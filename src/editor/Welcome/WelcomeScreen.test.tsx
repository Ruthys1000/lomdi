import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ProjectSummary } from '@/persistence/db';
import { WelcomeScreen } from './WelcomeScreen';

/**
 * מסך הפתיחה נשען על IndexedDB (הלומדות השמורות) ועל טעינת קובץ פרויקט.
 * שניהם ממוקים כאן, כי מה שנבדק הוא המסך: שהנחיתה מוצגת תמיד, שהלומדות
 * השמורות חיות בחוצץ נפרד (מגירה), וגרירת קובץ לכל שטח המסך.
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
  it('מציג פעולה ראשית "מתחילים לבנות" וקישור ללומדת דוגמה', async () => {
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

  it('"מבנה מוכן" (מה-Hero) מגיע עם תוכן ועם האיור שלו, ולא עם בלוקים ריקים', async () => {
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

  it('הנחיתה ("איך עובדים עם לומדי") מוצגת תמיד — גם למבקר חדש וגם עם לומדות שמורות', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: 'איך עובדים עם לומדי' })).toBeInTheDocument();
    // בלי לומדות שמורות אין כפתור "הלומדות שלי"
    expect(screen.queryByRole('button', { name: 'הלומדות שלי' })).not.toBeInTheDocument();

    cleanup();
    projects = [project('a', 'לומדה', '2026-03-01T10:00:00.000Z')];
    lastProjectId = 'a';
    await setup();

    // הנחיתה נשארת זהה, ונוסף כפתור הגישה ללומדות השמורות
    expect(screen.getByRole('heading', { name: 'איך עובדים עם לומדי' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'הלומדות שלי' })).toBeInTheDocument();
  });

  it('כפתור "הלומדות שלי" פותח מגירה עם הלומדות השמורות', async () => {
    projects = [project('a', 'קליטת חייל חדש', '2026-03-01T10:00:00.000Z')];
    lastProjectId = 'a';
    await setup();

    // לא על הנחיתה עצמה — נפתח מהפס העליון
    fireEvent.click(screen.getByRole('button', { name: 'הלומדות שלי' }));

    const drawer = screen.getByRole('dialog', { name: 'הלומדות שלי' });
    expect(drawer).toBeInTheDocument();
    // getByText ולא getByRole: לכל שורה יש גם כפתור פתיחה וגם כפתור מחיקה
    // ששניהם נושאים את שם הלומדה
    expect(screen.getByText(/קליטת חייל חדש/)).toBeInTheDocument();
  });

  it('במגירה, הלומדה שנפתחה לאחרונה מופיעה ראשונה (לא לפי זמן השמירה)', async () => {
    projects = [
      project('b', 'נשמרה אחרונה', '2026-03-02T10:00:00.000Z'),
      project('a', 'נפתחה אחרונה', '2026-03-01T10:00:00.000Z'),
    ];
    lastProjectId = 'a';

    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'הלומדות שלי' }));

    // שורות הרשימה נושאות את מטא-הנתונים ("פרקים"); הראשונה היא האחרונה שנפתחה
    const rows = screen.getAllByRole('button', { name: /פרקים/ });
    expect(rows[0]).toHaveTextContent('נפתחה אחרונה');
  });

  it('במגירה, רשימה ארוכה מקופלת ונפתחת בלחיצה אחת', async () => {
    projects = Array.from({ length: 10 }, (_, index) =>
      project(`p${index}`, `לומדה ${index}`, '2026-03-01T10:00:00.000Z'),
    );
    lastProjectId = 'p0';

    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'הלומדות שלי' }));

    // המגירה מציגה את *כל* הלומדות: ארבע גלויות, ושש מאחורי "עוד"
    const more = screen.getByRole('button', { name: /עוד 6 לומדות/ });
    fireEvent.click(more);

    expect(screen.queryByRole('button', { name: /עוד 6 לומדות/ })).not.toBeInTheDocument();
    expect(screen.getByText(/לומדה 9/)).toBeInTheDocument();
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
