import { useState } from 'react';
import { BookOpen, FileUp, FolderOpen, Loader2 } from 'lucide-react';
import { openProjectFile } from '@/persistence/session';
import { getTemplate } from '@/templates';
import type { TemplateResult } from '@/templates';
import { APP_NAME, APP_VERSION } from '@/version';
import { Alert } from '../ui/Alert';
import { Hero } from './Hero';
import { MyCoursesDrawer } from './MyCoursesDrawer';
import { useRecentProjects } from './useRecentProjects';

interface WelcomeScreenProps {
  onStart: (result: TemplateResult) => void;
  /** נקרא כשפרויקט קיים נטען ישירות ל-stores, בלי לעבור דרך onStart */
  onOpened: () => void;
}

/**
 * מסך הפתיחה — הדלת הראשית של הכלי.
 *
 * **נחיתה אחת לכולם, AI-first.** אותו דף בדיוק למבקר חדש ולחוזר: Hero עם
 * מחולל הלומדות בלבו, ולצדו בנייה מדף ריק כאפשרות משנית. הדף *הוא* ה-landing,
 * ואפשר לחזור אליו מהעורך גם אחרי שכבר נבנו לומדות.
 *
 * **הנחיתה אינה מציעה "המשך מהמקום שבו הפסקת".** זו הכרעה ולא פספוס: היצירה
 * היא הפעולה שהדף מוכר, וכרטיס המשך היה מתחרה בה על אותו מקום. הלומדות
 * השמורות חיות בחוצץ נפרד (MyCoursesDrawer) שנפתח מכפתור בפס העליון, והכפתור
 * מופיע רק כשיש לומדות — כך שמי שכבר עבד כאן מגיע אליהן בלחיצה, בלי שהנחיתה
 * תשתנה מתחתיו.
 *
 * **קובץ פרויקט אינו חלק מהשיווק של הדף.** אין רצועת "יש לכם קובץ?", אבל
 * גרירת `.course.zip` על *כל* המסך עדיין נטענת ומקבלת שכבת יעד — היכולת
 * נשמרה בלי לתפוס מקום, ופתיחה מפורשת יושבת בעורך.
 */
export function WelcomeScreen({ onStart, onOpened }: WelcomeScreenProps) {
  const { projects, error, openingId, open, remove } = useRecentProjects(onOpened);

  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);

  const hasProjects = projects.length > 0;

  const handleFile = async (file: File) => {
    setLoading(true);
    setFileErrors([]);

    const result = await openProjectFile(file);
    setLoading(false);

    if (result.ok) onOpened();
    else setFileErrors(result.errors);
  };

  const startTemplate = (id: string) => {
    const create = getTemplate(id)?.create;
    if (create) onStart(create());
  };

  return (
    <main
      className="relative min-h-full overflow-y-auto bg-app"
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        // dragleave נורה גם במעבר בין אלמנטים פנימיים; בלי הבדיקה הזו
        // שכבת היעד מהבהבת בזמן שגוררים מעל התוכן
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files?.[0];
        if (file) void handleFile(file);
      }}
    >
      <Header hasProjects={hasProjects} onOpenCourses={() => setCoursesOpen(true)} />

      {/*
        כשל אחסון מוצג כאן ולא נבלע: משתמשת שהעבודה שלה אינה מופיעה צריכה
        לדעת שזו תקלת דפדפן ולא לומדה שנעלמה. מעל ה-Hero כדי שלא יפספסו אותו
      */}
      {error && !coursesOpen && (
        <div className="mx-auto max-w-5xl px-6 pt-4">
          <Alert messages={[error]} />
        </div>
      )}

      {/* נחיתה אחת לכולם — מוצגת תמיד, גם אחרי שנבנו לומדות */}
      <Hero onBuild={() => startTemplate('blank')} />
      <Closer fileErrors={fileErrors} />

      {/* חוצץ "הלומדות שלי" — נפתח מהפס העליון, מחוץ לגלילת הנחיתה */}
      <MyCoursesDrawer
        open={coursesOpen}
        onClose={() => setCoursesOpen(false)}
        projects={projects}
        openingId={openingId}
        error={error}
        onOpen={(id) => void open(id)}
        onRemove={(project) => void remove(project)}
      />

      {/*
        שכבת היעד. על כל המסך ולא על קופסה אחת, וגם משמשת כחיווי הטעינה —
        משהו חייב לענות על השחרור, אחרת הגרירה נראית כאילו לא קרה בה דבר
      */}
      {(dragging || loading) && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-app/85 p-8">
          <div className="flex w-full max-w-xl flex-col items-center gap-3 rounded-3xl border-2 border-dashed border-volt-dim bg-panel/90 px-8 py-12">
            {loading ? (
              <>
                <Loader2 className="size-8 animate-spin text-volt-ink" aria-hidden />
                <p className="text-lg font-bold text-fg" role="status">
                  טוען את הלומדה…
                </p>
              </>
            ) : (
              <>
                <FileUp className="size-8 text-volt-ink" aria-hidden />
                <p className="text-lg font-bold text-fg">שחררו. זה נטען לבד.</p>
                <p className="text-sm text-fg-muted">‎.course.zip‎</p>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

interface HeaderProps {
  /** יש לומדות שמורות — רק אז מוצג כפתור "הלומדות שלי" */
  hasProjects: boolean;
  onOpenCourses: () => void;
}

/** הפס העליון הכהה. כשיש עבודה שמורה, נוסף כפתור לפתיחת חוצץ "הלומדות שלי". */
function Header({ hasProjects, onOpenCourses }: HeaderProps) {
  return (
    <header className="lc-shell border-b border-shell-edge bg-shell">
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
        <span className="flex size-9 items-center justify-center rounded-xl bg-volt text-on-volt">
          <BookOpen className="size-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <h1 className="text-base font-bold tracking-tight text-shell-fg">{APP_NAME}</h1>
          <p className="text-xs text-shell-muted">מטקסט ללומדה, עם AI</p>
        </div>

        {hasProjects && (
          <button
            type="button"
            onClick={onOpenCourses}
            className="ms-auto inline-flex shrink-0 items-center gap-2 rounded-xl border border-shell-edge px-3.5 py-2 text-sm font-semibold text-shell-fg transition hover:border-volt-dim hover:text-volt"
          >
            <FolderOpen className="size-4" aria-hidden />
            הלומדות שלי
          </button>
        )}
      </div>
    </header>
  );
}

/**
 * סוגר הדף: שורת אמון בלבד.
 *
 * רצועת "יש לכם קובץ לומדה?" הוסרה מהנחיתה בכוונה — הדף מוכר יצירה, ורצועה
 * מנוקדת שמדברת על קבצים התחרתה על אותו מקום. היכולת נשמרה: גרירת קובץ על
 * *כל* המסך עדיין נטענת (עם שכבת יעד), ובתוך העורך יש פתיחת קובץ מפורשת.
 * כשל ייבוא מוצג כאן, כי אין לו יותר רצועה משלו.
 */
function Closer({ fileErrors }: { fileErrors: string[] }) {
  return (
    <section className="mx-auto max-w-5xl px-6 pt-10 pb-11">
      {fileErrors.length > 0 && <Alert messages={fileErrors} />}

      <Footer />
    </section>
  );
}

/** שורת האמון והגרסה */
function Footer() {
  return (
    <p className="mt-8 text-center text-xs text-fg-muted">
      {APP_NAME} {APP_VERSION} · העריכה נשמרת אצלכם בדפדפן.
    </p>
  );
}
