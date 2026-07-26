import { createCard } from '@/blocks/cards/content';
import { createQuizOption } from '@/blocks/quiz/content';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import { bulletList, heading, paragraph, richText } from '@/model/richText';
import { getThemePreset } from '@/model/themes';
import { learnerPathIllustration } from '@/sample/illustrations';
import { createSampleCourse } from '@/sample/sampleCourse';
import type { TemplateResult } from './types';

export type { TemplateResult } from './types';

/**
 * תבניות פתיחה (סעיף 5 באפיון).
 *
 * שלוש, וכולן עובדות. קודם לכן ישבו כאן גם שלוש רשומות בלי `create` שהוצגו
 * במסך הפתיחה כ"בקרוב" — הבטחה שתפסה מקום ולא עשתה דבר. `create` הוא שדה
 * חובה כדי שלא ייווצר שוב מצב של תבנית שאי אפשר לבחור.
 */

export interface CourseTemplate {
  id: string;
  name: string;
  description: string;
  create: () => TemplateResult;
}

/**
 * "מבנה מוכן של שלושה פרקים".
 *
 * הבלוקים כאן מלאים בתוכן ולא נוצרים בברירת מחדל. `createBlock('cards')`
 * מייצר שלושה כרטיסים זהים שכולם אומרים "כותרת הכרטיס", ו-`createBlock('quiz')`
 * מייצר "תשובה ראשונה / שנייה / שלישית" — כלומר תבנית שנפתחת כרשימת מטלות
 * מחיקה. מבנה מוכן אמור להיות דוגמה *לכתוב לפיה*, ולכן הטקסטים כאן הם
 * הדרכה אמיתית על בניית הדרכה: מי שמוחק אותם יודע מה אמור לבוא במקומם.
 */
function shortTrainingTemplate(): TemplateResult {
  const path = learnerPathIllustration();

  const course = createCourse({
    title: 'הדרכה קצרה',
    subtitle: 'שלושה פרקים, כרבע שעה',
    description: 'שלד להדרכה ארגונית קצרה: פתיחה, תוכן מרכזי ותרגול מסכם.',
    theme: getThemePreset('warmSand')!.theme,
    chapters: [
      createChapter({
        title: 'פתיחה',
        description: 'למה ההדרכה הזו, ולמי היא מיועדת',
        blocks: [
          createBlock('hero', {
            content: {
              title: 'שם ההדרכה',
              subtitle: 'משפט אחד שמסביר למי ההדרכה מיועדת',
              intro: 'כרבע שעה',
              backgroundType: 'color',
              backgroundColor: '#33261c',
              gradientFrom: '#33261c',
              gradientTo: '#a2543a',
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
                paragraph(
                  'פתחו במשפט אחד שמתאר מה הלומד יידע לעשות בסוף ההדרכה — לא מה יוצג לו, אלא מה הוא יוכל לבצע. זה גם המבחן שלכם: אם קשה לנסח את המשפט, הפרק עדיין לא ממוקד.',
                ),
                bulletList([
                  'למי ההדרכה מיועדת ומה מניחים שהוא כבר יודע.',
                  'כמה זמן היא לוקחת, כדי שאפשר יהיה לתזמן אותה.',
                  'מה הלומד יידע לעשות בסופה.',
                ]),
              ),
            },
          }),
        ],
      }),

      createChapter({
        title: 'התוכן המרכזי',
        description: 'הרעיון המרכזי, בשלושה חלקים',
        blocks: [
          createBlock('textImage', {
            content: {
              layout: 'imageEnd',
              ratio: '50-50',
              verticalAlign: 'center',
              aspectRatio: '4:3',
              roundness: 'medium',
              imageAssetId: path.meta.id,
              alt: 'מסלול עם שלוש תחנות, השתיים הראשונות הושלמו',
              caption: 'החליפו את האיור בתמונה משלכם מספריית הנכסים',
              button: { enabled: false, label: 'קראו עוד', href: '', newTab: true },
              doc: richText(
                heading(2, 'הרעיון המרכזי'),
                paragraph(
                  'הסבירו כאן את הרעיון האחד שההדרכה סובבת סביבו. פסקה או שתיים — לא יותר. כל מה שאפשר להוריד מכאן בלי לפגוע בהבנה, כדאי להוריד.',
                ),
                paragraph(
                  'התמונה משמאל היא איור ברירת מחדל. לחצו עליה בפאנל ההגדרות כדי להחליף אותה בתמונה שלכם, או מחקו את הבלוק ובחרו בלוק טקסט רגיל.',
                ),
              ),
            },
          }),

          createBlock('divider', {
            content: { style: 'line', icon: 'Sparkle', height: 'medium', lineWidth: 'half' },
          }),

          createBlock('cards', {
            content: {
              columns: 3,
              media: 'icon',
              roundness: 'medium',
              textAlign: 'start',
              items: [
                createCard({
                  icon: 'Target',
                  title: 'הנקודה הראשונה',
                  text: 'משפט או שניים. כרטיס עמוס יותר מזה כבר אינו נסרק במבט, וזו כל מטרתם של כרטיסים.',
                }),
                createCard({
                  icon: 'Route',
                  title: 'הנקודה השנייה',
                  text: 'שמרו על אורך דומה בשלושת הכרטיסים — הבדלי אורך גדולים יוצרים רושם שאחד מהם חשוב יותר.',
                }),
                createCard({
                  icon: 'CircleCheck',
                  title: 'הנקודה השלישית',
                  text: 'אם יש לכם רק שתי נקודות, מחקו את הכרטיס הזה ועברו לשתי עמודות בפאנל ההגדרות.',
                }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'תרגול וסיכום',
        description: 'עצירה קצרה לבדיקה, ואז סיכום',
        blocks: [
          createBlock('quiz', {
            content: {
              question: 'מה הדבר הראשון שכדאי לנסח כשבונים הדרכה?',
              hint: 'חשבו על ההבדל בין "מה נציג" לבין "מה הלומד יידע לעשות".',
              options: [
                createQuizOption({
                  text: 'מה הלומד יידע לעשות בסוף ההדרכה',
                  correct: true,
                }),
                createQuizOption({ text: 'אילו נושאים צריך לכסות' }),
                createQuizOption({ text: 'כמה שקופיות יהיו' }),
                createQuizOption({ text: 'מי יאשר את התוכן' }),
              ],
              feedbackCorrect:
                'נכון. מטרה שמנוסחת כיכולת מאפשרת לבדוק בסוף אם ההדרכה עבדה; רשימת נושאים לא מאפשרת את זה.',
              feedbackIncorrect:
                'לא מדויק. כל אלה נחוצים בהמשך, אבל הם נגזרים מהמטרה — ולא להפך. התחילו ממה שהלומד יידע לעשות.',
              shuffle: true,
              allowRetry: true,
              showSolution: true,
              labels: { submit: 'בדיקה', retry: 'ניסיון נוסף', solution: 'הצגת הפתרון' },
            },
          }),

          createBlock('richText', {
            content: {
              maxWidth: 'normal',
              doc: richText(
                heading(2, 'לסיכום'),
                paragraph(
                  'חזרו כאן על הרעיון המרכזי במשפט אחד, והוסיפו מה הלומד אמור לעשות עכשיו — טופס למלא, נוהל לקרוא, איש קשר לפנות אליו.',
                ),
              ),
            },
          }),
        ],
      }),
    ],
  });

  return { course, assets: [path] };
}

export const courseTemplates: CourseTemplate[] = [
  {
    id: 'blank',
    name: 'לומדה ריקה',
    description: 'פרק אחד ריק. מתחילים מאפס.',
    create: () => ({ course: createCourse(), assets: [] }),
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
    description: 'ארבעה פרקים עם תוכן מלא בעברית שמדגים את סוגי הבלוקים.',
    create: createSampleCourse,
  },
];

export function getTemplate(id: string): CourseTemplate | undefined {
  return courseTemplates.find((template) => template.id === id);
}
