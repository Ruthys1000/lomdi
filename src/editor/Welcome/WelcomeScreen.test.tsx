import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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

const listProjects = vi.fn(() => Promise.resolve(projects));

vi.mock('@/persistence/db', () => ({
  listProjects: () => listProjects(),
  getLastProjectId: () => Promise.resolve(lastProjectId),
  deleteProject: () => Promise.resolve(),
}));

const openProjectFile = vi.fn((_file: Blob) => Promise.resolve({ ok: true as const }));
type OpenResult = { ok: true } | { ok: false; errors: string[] };
const openStoredProject = vi.fn(
  (_id: string): Promise<OpenResult> => Promise.resolve({ ok: true }),
);

vi.mock('@/persistence/session', () => ({
  openProjectFile: (file: Blob) => openProjectFile(file),
  openStoredProject: (id: string) => openStoredProject(id),
}));

beforeEach(() => {
  openProjectFile.mockClear();
  listProjects.mockClear();
  listProjects.mockImplementation(() => Promise.resolve(projects));
  openStoredProject.mockClear();
  openStoredProject.mockImplementation(() => Promise.resolve({ ok: true }));
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
  it('מציג פעולה משנית "התחילו מדף ריק"', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'התחילו מדף ריק' })).toBeInTheDocument();
  });

  it('לחיצה על "התחילו מדף ריק" מחזירה לומדה עם פרק, ולא רק שם תבנית', async () => {
    const { onStart } = await setup();

    fireEvent.click(screen.getByRole('button', { name: 'התחילו מדף ריק' }));

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart.mock.calls[0][0].course.chapters.length).toBeGreaterThan(0);
  });

  it('גלריית הפורמטים מציגה את הפורמטים המוכנים כלחיצים', async () => {
    await setup();

    // כל ששת הפורמטים מוכנים — כרטיסים לחיצים בעברית, בלי "בקרוב"
    const onePager = screen.getByRole('button', { name: /עמוד אחד/ });
    expect(onePager).toBeInTheDocument();
    expect(onePager).not.toBeDisabled();

    expect(screen.getByRole('button', { name: /תהליך/ })).not.toBeDisabled();
    expect(screen.queryByText(/בקרוב/)).not.toBeInTheDocument();
  });

  /*
   * הכרעת המוצר שהמסך הזה מקבע: הנחיתה היא AI-first, עם בנייה מדף ריק
   * כאפשרות משנית, ובלי מסלול "המשך מהמקום שבו הפסקת". לומדה שמורה נגישה
   * מהמגירה בלבד. הבדיקה קיימת כדי שהחזרה לכרטיס המשך תהיה החלטה מפורשת
   * ולא סחף.
   */
  it('גם עם עבודה שמורה, הנחיתה אינה מציעה המשך עבודה', async () => {
    projects = [project('a', 'קליטת חייל חדש', '2026-03-01T10:00:00.000Z')];
    lastProjectId = 'a';

    await setup();

    // שתי הדרכים להתחיל, שתיהן על הנחיתה
    expect(screen.getByRole('heading', { name: /מטקסט ללומדה/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'התחילו מדף ריק' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /צרו עם AI/ })).toBeInTheDocument();

    // אין כרטיס "ממשיכים" בנחיתה
    expect(screen.queryByText(/ממשיכים/)).not.toBeInTheDocument();

    // הלומדה השמורה קיימת ב-DOM (המגירה מורכבת תמיד) אך אינה נראית: הגישה
    // אליה עוברת דרך הכפתור בפס העליון, ולא דרך הנחיתה
    expect(screen.getByText(/קליטת חייל חדש/)).not.toBeVisible();
    expect(screen.getByRole('button', { name: /הלומדות שלי/ })).toBeVisible();
  });

  it('הנחיתה (ה-Hero) מוצגת תמיד — גם למבקר חדש וגם עם לומדות שמורות', async () => {
    await setup();
    expect(screen.getByRole('heading', { name: /מטקסט ללומדה/ })).toBeInTheDocument();
    // בלי לומדות שמורות אין כפתור "הלומדות שלי"
    expect(screen.queryByRole('button', { name: /הלומדות שלי/ })).not.toBeInTheDocument();

    cleanup();
    projects = [project('a', 'לומדה', '2026-03-01T10:00:00.000Z')];
    lastProjectId = 'a';
    await setup();

    // הנחיתה נשארת זהה, ונוסף כפתור הגישה ללומדות השמורות
    expect(screen.getByRole('heading', { name: /מטקסט ללומדה/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /הלומדות שלי/ })).toBeInTheDocument();
  });

  it('כפתור "הלומדות שלי" פותח מגירה עם הלומדות השמורות', async () => {
    projects = [project('a', 'קליטת חייל חדש', '2026-03-01T10:00:00.000Z')];
    lastProjectId = 'a';
    await setup();

    // לא על הנחיתה עצמה — נפתח מהפס העליון
    fireEvent.click(screen.getByRole('button', { name: /הלומדות שלי/ }));

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
    fireEvent.click(screen.getByRole('button', { name: /הלומדות שלי/ }));

    // מחפשים בתוך המגירה בלבד: לכרטיסי הגלריה יש גם הם "פרקים" בתיאור
    const drawer = screen.getByRole('dialog', { name: 'הלומדות שלי' });
    // שורות הרשימה נושאות את מטא-הנתונים ("פרקים"); הראשונה היא האחרונה שנפתחה
    const rows = within(drawer).getAllByRole('button', { name: /פרקים/ });
    expect(rows[0]).toHaveTextContent('נפתחה אחרונה');
  });

  it('במגירה, רשימה ארוכה מקופלת ונפתחת בלחיצה אחת', async () => {
    projects = Array.from({ length: 10 }, (_, index) =>
      project(`p${index}`, `לומדה ${index}`, '2026-03-01T10:00:00.000Z'),
    );
    lastProjectId = 'p0';

    await setup();
    fireEvent.click(screen.getByRole('button', { name: /הלומדות שלי/ }));

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

  /*
   * כשלי אחסון ופתיחה. עד כה ה-hook חישב `error` ומסך הפתיחה לא קרא אותו,
   * כלומר אחסון חסום נראה כמו לומדות שנעלמו — ופתיחה איטית נראתה כמו לחיצה
   * שלא נרשמה.
   */
  it('כשל בטעינת הלומדות השמורות מוצג במסך ולא נבלע', async () => {
    listProjects.mockImplementation(() => Promise.reject(new Error('האחסון חסום')));

    await setup();

    expect(screen.getByRole('alert')).toHaveTextContent('האחסון חסום');
  });

  it('פתיחת לומדה מציגה מצב טעינה ונועלת את הרשימה עד לסיום', async () => {
    projects = [project('a', 'קליטת חייל חדש', '2026-03-01T10:00:00.000Z')];
    lastProjectId = 'a';

    let release = () => {};
    openStoredProject.mockImplementation(
      () =>
        new Promise<OpenResult>((resolve) => {
          release = () => resolve({ ok: true });
        }),
    );

    const { onOpened } = await setup();
    fireEvent.click(screen.getByRole('button', { name: /הלומדות שלי/ }));

    // לפי /פרקים/ ולא לפי השם: כפתור המחיקה נושא גם הוא את שם הלומדה
    const drawer = screen.getByRole('dialog', { name: 'הלומדות שלי' });
    fireEvent.click(within(drawer).getByRole('button', { name: /פרקים/ }));

    // בזמן הפתיחה: חיווי על השורה, והשורה עצמה חסומה בפני לחיצה נוספת
    const row = within(drawer).getByRole('button', { name: /פותח…/ });
    expect(row).toBeDisabled();
    expect(row).toHaveAttribute('aria-busy', 'true');
    expect(onOpened).not.toHaveBeenCalled();

    await act(async () => {
      release();
    });
    expect(onOpened).toHaveBeenCalledTimes(1);
  });

  it('כשל פתיחה מוצג בתוך המגירה, שם המשתמש נמצא', async () => {
    projects = [project('a', 'לומדה', '2026-03-01T10:00:00.000Z')];
    lastProjectId = 'a';
    openStoredProject.mockImplementation(() =>
      Promise.resolve({ ok: false, errors: ['הפרויקט לא נמצא באחסון המקומי.'] }),
    );

    await setup();
    fireEvent.click(screen.getByRole('button', { name: /הלומדות שלי/ }));

    const drawer = screen.getByRole('dialog', { name: 'הלומדות שלי' });
    await act(async () => {
      fireEvent.click(within(drawer).getByRole('button', { name: /פרקים/ }));
    });

    // ההתראה חייבת לחיות בתוך המגירה: היא `<dialog>` מודאלי, וטקסט מאחוריה
    // אינו נגיש בזמן שהיא פתוחה
    expect(within(drawer).getByRole('alert')).toHaveTextContent('הפרויקט לא נמצא');
  });
});
