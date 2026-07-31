import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { CourseRenderer } from '@/renderer/CourseRenderer';
import { featuredTemplates } from '@/templates';
import type { TemplateResult } from '@/templates';

/** רוחב העיצוב הלוגי שאליו מרונדרת התצוגה, לפני ההקטנה */
const DESIGN_WIDTH = 1100;

interface ExamplesGalleryProps {
  onStart: (result: TemplateResult) => void;
}

/**
 * גלריית דוגמאות הדגל בדף הבית.
 *
 * כל כרטיס מציג **תצוגה חיה** — הלומדה האמיתית מרונדרת דרך `CourseRenderer`
 * (אותו רנדרר של התוצר), מוקטנת ב-transform. כך התצוגה תמיד מדויקת, בלי
 * צילומי מסך לתחזק. `create()` נקרא פעם אחת לכל דוגמה, ואותה תוצאה משמשת
 * גם לתצוגה וגם לטעינה בלחיצה — כך מזהי הנכסים תואמים.
 */
export function ExamplesGallery({ onStart }: ExamplesGalleryProps) {
  const examples = useMemo(
    () => featuredTemplates.map((template) => ({ template, result: template.create() })),
    [],
  );

  if (examples.length === 0) return null;

  return (
    <section aria-labelledby="examples-heading" className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-7 text-center">
        <p className="text-xs font-bold tracking-widest text-volt-ink uppercase">דוגמאות מוכנות</p>
        <h2 id="examples-heading" className="mt-1 text-2xl font-extrabold text-balance text-fg md:text-3xl">
          מתחילים מלומדה שכבר נראית טוב
        </h2>
        <p className="mt-2 text-sm text-fg-muted">בחרו דוגמה, והיא נפתחת בעורך מוכנה לעריכה — הכול ניתן לשינוי.</p>
      </div>

      <ul className="grid list-none grid-cols-1 gap-6 p-0 sm:grid-cols-2 lg:grid-cols-3">
        {examples.map(({ template, result }) => (
          <li key={template.id}>
            <button
              type="button"
              onClick={() => onStart(result)}
              className="group flex w-full flex-col overflow-hidden rounded-2xl border border-edge bg-panel text-start transition hover:border-volt-dim hover:shadow-lg focus:ring-2 focus:ring-volt-dim focus:outline-none"
            >
              <LivePreview result={result} />
              <div className="flex flex-1 flex-col gap-1 p-4">
                <h3 className="font-bold text-fg">{template.name}</h3>
                <p className="text-sm leading-relaxed text-fg-muted">{template.description}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-volt-ink">
                  פותחים דוגמה זו
                  <ArrowLeft className="size-4 transition group-hover:-translate-x-1" aria-hidden />
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * תצוגה חיה מוקטנת של הפרק הראשון. מרנדרת ברוחב DESIGN_WIDTH ומוקטנת
 * ב-scale שנמדד לפי רוחב המיכל, כדי שתמיד תמלא את הכרטיס. אינטראקטיבית
 * מנוטרלת (pointer-events) ומוסתרת מקוראי מסך.
 */
function LivePreview({ result }: { result: TemplateResult }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.32);

  // אובייקט-URL לכל נכס של הדוגמה, בלי לכתוב ל-IndexedDB.
  //
  // היצירה והשחרור חיים באותו useEffect בכוונה: ב-StrictMode (פיתוח) React
  // ממנטב פעמיים, וכשה-URLs נבנו ב-useMemo הריצה הכפולה שחררה אותם בעוד
  // ה-memo כבר לא בונה אותם מחדש — מה שהותיר src ל-blob משוחרר ו-404
  // בקונסולה. יצירה ב-effect עם state בונה מחדש בכל mount ונקייה משחרור כפול.
  const [urls, setUrls] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    const map = new Map<string, string>();
    for (const asset of result.assets) map.set(asset.meta.id, URL.createObjectURL(asset.blob));
    setUrls(map);
    return () => {
      map.forEach((url) => URL.revokeObjectURL(url));
      setUrls(new Map());
    };
  }, [result]);

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const update = () => setScale(box.clientWidth / DESIGN_WIDTH);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={boxRef}
      aria-hidden
      className="relative h-56 w-full overflow-hidden border-b border-edge bg-white"
    >
      <div
        className="pointer-events-none absolute top-0 origin-top-right"
        style={{ width: DESIGN_WIDTH, transform: `scale(${scale})` }}
      >
        <CourseRenderer
          course={result.course}
          resolveAssetUrl={(id) => urls.get(id)}
          isEditing
          forcedChapterIndex={0}
        />
      </div>
    </div>
  );
}
