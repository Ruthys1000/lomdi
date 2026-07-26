import { blockLabel } from '@/blocks/registry.shared';
import { findBlock } from '@/model/operations';
import { useCourseStore } from '@/state/courseStore';
import { useEditorStore } from '@/state/editorStore';
import { BlockSettingsPanel } from './BlockSettingsPanel';
import { CoursePanel } from './CoursePanel';

/**
 * סרגל ההגדרות (סעיף 4.4).
 *
 * כשאין בלוק נבחר מוצגות הגדרות הלומדה; כשנבחר בלוק מוצגות ההגדרות שלו.
 * ההגדרות הייחודיות לכל סוג בלוק מתווספות בשלבים 3 ו-5 — כרגע מוצגות
 * הגדרות הפריסה המשותפות לכל הבלוקים.
 */
export function InspectorPanel() {
  const course = useCourseStore((state) => state.course);
  const selectedBlockId = useEditorStore((state) => state.selectedBlockId);

  if (!course) return null;

  const location = selectedBlockId ? findBlock(course, selectedBlockId) : undefined;

  return (
    <aside className="flex min-h-0 flex-col bg-white" aria-label="הגדרות">
      <div className="border-b border-sand-200 px-4 py-3">
        <h2 className="text-xs font-bold tracking-wide text-sand-500 uppercase">
          {location ? blockLabel(location.block.type) : 'הגדרות הלומדה'}
        </h2>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {location ? <BlockSettingsPanel block={location.block} /> : <CoursePanel course={course} />}
      </div>
    </aside>
  );
}
