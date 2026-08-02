import { createCourse } from '@/model/factory';
import { createSampleCourse } from '@/sample/sampleCourse';
import type { TemplateResult } from './types';

export type { TemplateResult } from './types';

/**
 * תבניות פתיחה.
 *
 * שתיים: "לומדה ריקה" (blank) — נקודת הכניסה לבנייה מאפס — ו"לומדת הדוגמה"
 * (sample) שמדגימה את סוגי הבלוקים. `create` הוא שדה חובה כדי שלא תיווצר
 * שוב תבנית שאי אפשר לבחור.
 */

export interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  create: () => TemplateResult;
}

export const courseTemplates: CourseTemplate[] = [
  {
    id: 'blank',
    name: 'לומדה ריקה',
    description: 'פרק אחד ריק. מתחילים מאפס.',
    create: () => ({ course: createCourse(), assets: [] }),
  },
  {
    id: 'sample',
    name: 'לומדת הדוגמה',
    description: 'ארבעה פרקים עם תוכן מלא בעברית שמדגים את סוגי הבלוקים.',
    create: createSampleCourse,
  },
];

export function getTemplate(id: string): CourseTemplate | undefined {
  return courseTemplates.find((template) => template.id === id);
}
