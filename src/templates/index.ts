import { createBlock, createChapter, createCourse } from '@/model/factory';
import { heading, paragraph, richText } from '@/model/richText';
import type { Course } from '@/model/types';
import { createSampleCourse } from '@/sample/sampleCourse';

/**
 * תבניות פתיחה (סעיף 5 באפיון).
 *
 * ל-POC תבנית אחת מפותחת היטב — "הדרכה קצרה" — והשאר מסומנות כבקרוב.
 * הן מוצגות במסך הפתיחה אבל אינן ניתנות לבחירה, כדי שלא ייווצר רושם
 * שקיימת יכולת שאינה עובדת.
 */

export interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  /** תבנית ללא create היא placeholder שיושלם בהמשך */
  create?: () => Course;
}

function shortTrainingTemplate(): Course {
  return createCourse({
    title: 'הדרכה קצרה',
    subtitle: 'שלושה פרקים, כרבע שעה',
    chapters: [
      createChapter({
        title: 'פתיחה',
        blocks: [
          createBlock('hero', {
            content: {
              title: 'שם ההדרכה',
              subtitle: 'משפט אחד שמסביר למי ההדרכה מיועדת',
              intro: '',
              backgroundType: 'gradient',
              backgroundColor: '#2563eb',
              gradientFrom: '#1d4ed8',
              gradientTo: '#7c3aed',
              imageAssetId: '',
              overlayOpacity: 0.45,
              height: 'medium',
              alignment: 'center',
              fullBleed: true,
              button: { enabled: false, label: 'מתחילים', href: '', newTab: false },
            },
          }),
          createBlock('richText', {
            content: {
              maxWidth: 'normal',
              doc: richText(
                heading(2, 'מה נלמד כאן'),
                paragraph('כתבו כאן במשפט אחד מה הלומד ידע לעשות בסוף ההדרכה.'),
              ),
            },
          }),
        ],
      }),
      createChapter({
        title: 'התוכן המרכזי',
        blocks: [
          createBlock('textImage'),
          createBlock('divider'),
          createBlock('cards'),
        ],
      }),
      createChapter({
        title: 'תרגול וסיכום',
        blocks: [createBlock('quiz'), createBlock('richText')],
      }),
    ],
  });
}

export const courseTemplates: CourseTemplate[] = [
  {
    id: 'blank',
    name: 'לומדה ריקה',
    description: 'פרק אחד ריק. מתחילים מאפס.',
    create: () => createCourse(),
  },
  {
    id: 'shortTraining',
    name: 'הדרכה קצרה',
    description: 'שלושה פרקים: פתיחה, תוכן ותרגול. הבסיס לרוב ההדרכות.',
    create: shortTrainingTemplate,
  },
  {
    id: 'sample',
    name: 'לומדת הדוגמה',
    description: 'ארבעה פרקים עם תוכן מלא בעברית שמדגים את כל סוגי הבלוקים.',
    create: createSampleCourse,
  },
  { id: 'process', name: 'תהליך', description: 'הצגת תהליך שלב אחר שלב.' },
  { id: 'topic', name: 'היכרות עם נושא', description: 'מבוא לנושא חדש בארגון.' },
  { id: 'policy', name: 'נוהל או מדיניות', description: 'נוהל ארגוני עם שאלות בקרה.' },
];

export function getTemplate(id: string): CourseTemplate | undefined {
  return courseTemplates.find((template) => template.id === id);
}
