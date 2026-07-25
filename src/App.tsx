import { openCourse } from './persistence/session';
import { PreviewOverlay } from './editor/Preview/PreviewOverlay';
import { EditorLayout } from './editor/Shell/EditorLayout';
import { ToastHost } from './editor/ui/ToastHost';
import { WelcomeScreen } from './editor/Welcome/WelcomeScreen';
import type { Course } from './model/types';
import { useCourseStore } from './state/courseStore';

/**
 * פתיחת לומדה עוברת דרך `persistence/session` ולא דרך ה-stores ישירות:
 * החלפת פרויקט חייבת לאפס גם את הנכסים, גם את מצב העורך וגם את מצב
 * השמירה, ופיזור שלושת האיפוסים ברכיבים הוא בדיוק איך שתמונות של פרויקט
 * אחד נשארות תלויות בפרויקט הבא.
 */
export function App() {
  const course = useCourseStore((state) => state.course);

  const handleStart = (newCourse: Course) => openCourse(newCourse);

  if (!course) {
    // onOpened אינו צריך לעשות דבר: הפרויקט כבר נטען ל-store, והרינדור
    // מחדש בגללו הוא מה שמחליף את מסך הפתיחה בעורך
    return <WelcomeScreen onStart={handleStart} onOpened={() => undefined} />;
  }

  return (
    <>
      <EditorLayout />
      <PreviewOverlay />
      <ToastHost />
    </>
  );
}
