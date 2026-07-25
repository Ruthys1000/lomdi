import { BookOpen, Layers, PackageCheck, ShieldCheck } from 'lucide-react';

/**
 * שלב 1 — שלד בלבד.
 * מסך ה-Welcome ומבנה שלושת האזורים נבנים בשלב 2.
 */

const wiredUp = [
  {
    icon: Layers,
    title: 'שני build targets',
    body: 'העורך והלומדה נבנים בנפרד מאותו קוד מקור, ושניהם מרנדרים את אותו CourseRenderer.',
  },
  {
    icon: ShieldCheck,
    title: 'גבול Renderer ↔ Editor',
    body: 'כלל ESLint מפיל את ה-build אם קוד עורך, TipTap או dnd-kit ידלפו לחבילת הלומדה.',
  },
  {
    icon: PackageCheck,
    title: 'runtime עצמאי',
    body: 'חבילת הלומדה נבנית אל public/runtime ונארזת ל-ZIP בשלב 7, ללא תלות ב-CDN.',
  },
];

export function App() {
  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <BookOpen className="size-6" aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">LearnIt</h1>
            <p className="text-sm text-slate-500">מחולל לומדות HTML מבוסס בלוקים</p>
          </div>
        </div>

        <p className="mt-8 text-slate-600">
          שלד הפרויקט הוקם. השלב הבא: מודל הנתונים, מסך הפתיחה, מבנה שלושת האזורים ופרויקט הדוגמה.
        </p>

        <ul className="mt-6 space-y-3">
          {wiredUp.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-3 rounded-2xl bg-slate-50 p-4">
              <Icon className="mt-0.5 size-5 shrink-0 text-blue-600" aria-hidden />
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
                <p className="mt-0.5 text-sm text-slate-600">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
