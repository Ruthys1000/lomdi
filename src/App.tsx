import { PreviewOverlay } from './editor/Preview/PreviewOverlay';
import { EditorLayout } from './editor/Shell/EditorLayout';
import { ToastHost } from './editor/ui/ToastHost';
import { WelcomeScreen } from './editor/Welcome/WelcomeScreen';
import type { Course } from './model/types';
import { useCourseStore } from './state/courseStore';
import { useEditorStore } from './state/editorStore';

export function App() {
  const course = useCourseStore((state) => state.course);
  const loadCourse = useCourseStore((state) => state.loadCourse);
  const selectChapter = useEditorStore((state) => state.selectChapter);
  const resetEditor = useEditorStore((state) => state.reset);

  const handleStart = (newCourse: Course) => {
    resetEditor();
    loadCourse(newCourse);
    // בחירת הפרק הראשון מיד, כדי שהקנבס לא ייפתח ריק
    selectChapter(newCourse.chapters[0]?.id ?? null);
  };

  if (!course) return <WelcomeScreen onStart={handleStart} />;

  return (
    <>
      <EditorLayout />
      <PreviewOverlay />
      <ToastHost />
    </>
  );
}
