import { Component, type ErrorInfo, type ReactNode } from 'react';
import { downloadProjectFile } from '@/persistence/session';
import { toast } from '@/state/toastStore';

/**
 * גבול שגיאה עליון סביב שלד העורך.
 *
 * BlockErrorBoundary מכסה רק רינדור של בלוק בודד בתוך התצוגה. גבול זה מכסה את
 * כל השאר — סרגלי הכלים, פאנל ההגדרות, ה-Inspector, הקנבס עצמו — שם חריגה בזמן
 * ריצה הייתה מפילה את כל עץ ה-React ומשאירה מסך לבן בלי דרך התאוששות, ובלי גישה
 * לכפתור הורדת הפרויקט שהיה מציל את העבודה.
 *
 * ה-fallback נותן בדיוק את שתי דרכי המילוט: טעינה מחדש (משחזרת מהשמירה האוטומטית
 * האחרונה) והורדת קובץ גיבוי (קוראת מה-course store שברוב המקרים עדיין שלם —
 * חריגה ברינדור אינה מוחקת את המצב). class component כי אין hook שתופס שגיאות
 * רינדור. חי ב-editor/ ולכן מותר לו לייבא persistence ו-stores.
 */
interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('העורך נכשל בזמן ריצה:', error, info);
  }

  private handleDownload = async () => {
    try {
      await downloadProjectFile();
    } catch {
      toast('הורדת הגיבוי נכשלה. נסו לטעון מחדש.', { tone: 'error' });
    }
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="fixed inset-0 z-50 flex items-center justify-center bg-app p-4 text-right"
      >
        <div className="w-[min(32rem,calc(100vw-2rem))] rounded-2xl border border-edge bg-panel p-8 shadow-xl">
          <h1 className="text-lg font-bold text-fg">משהו השתבש בעורך</h1>
          <p className="mt-3 text-sm leading-relaxed text-fg-soft">
            אירעה שגיאה בלתי צפויה. העבודה שלכם כנראה עדיין שמורה — כדאי להוריד קובץ גיבוי
            ליתר ביטחון, ואז לטעון מחדש כדי לחזור מהשמירה האוטומטית האחרונה.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-volt px-4 py-2 text-sm font-semibold text-on-volt hover:bg-volt-bright"
            >
              טעינה מחדש
            </button>
            <button
              type="button"
              onClick={this.handleDownload}
              className="rounded-lg border border-edge px-4 py-2 text-sm font-semibold text-fg-soft hover:bg-app"
            >
              הורדת קובץ גיבוי
            </button>
          </div>
        </div>
      </div>
    );
  }
}
