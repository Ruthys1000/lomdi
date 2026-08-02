import { createAccordionItem } from '@/blocks/accordion/content';
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
  const theme = getThemePreset('vivid')!.theme;
  const path = learnerPathIllustration(theme.colors);

  const course = createCourse({
    title: 'הדרכה קצרה',
    subtitle: 'שלושה פרקים, כרבע שעה',
    description: 'שלד להדרכה ארגונית קצרה: פתיחה, תוכן מרכזי ותרגול מסכם.',
    theme,
    chapters: [
      createChapter({
        title: 'פתיחה',
        description: 'למה ההדרכה הזו, ולמי היא מיועדת',
        blocks: [
          createBlock('hero', {
            content: {
              variant: 'spotlight',
              title: 'שם ההדרכה',
              subtitle: 'משפט אחד שמסביר למי ההדרכה מיועדת',
              intro: 'כרבע שעה',
              backgroundType: 'color',
              backgroundColor: '#1e1b32',
              gradientFrom: '#1e1b32',
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
              variant: 'gradient',
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

/**
 * "נוהל ומדיניות".
 *
 * תבנית לתרחיש הארגוני הנפוץ ביותר: הסבר נוהל והחתמה על הבנתו. בנויה
 * כולה מבלוקים ללא נכסים חיצוניים (רקע צבע, אקורדיון, שאלה) — כך שהיא
 * נפתחת ומיוצאת בלי אזהרות על נכס חסר, והמשתמש רק מחליף טקסט.
 */
function policyTemplate(): TemplateResult {
  const theme = getThemePreset('forest')!.theme;

  const course = createCourse({
    title: 'שם הנוהל',
    subtitle: 'מדיניות ונוהל עבודה',
    description: 'הצגת נוהל ארגוני ובדיקת הבנה, לקראת אישור הלומד שקרא והבין.',
    theme,
    chapters: [
      createChapter({
        title: 'רקע ומטרה',
        description: 'למה הנוהל קיים ועל מי הוא חל',
        blocks: [
          createBlock('hero', {
            content: {
              variant: 'panel',
              title: 'שם הנוהל',
              subtitle: 'משפט אחד שמסביר מה הנוהל בא להסדיר',
              intro: 'קריאה חובה',
              backgroundType: 'color',
              backgroundColor: '#14532d',
              gradientFrom: '#14532d',
              gradientTo: '#166534',
              imageAssetId: '',
              overlayOpacity: 0.45,
              height: 'medium',
              alignment: 'center',
              fullBleed: true,
              button: { enabled: false, label: '', href: '', newTab: false },
            },
          }),
          createBlock('richText', {
            content: {
              maxWidth: 'normal',
              doc: richText(
                heading(2, 'מטרת הנוהל'),
                paragraph(
                  'פתחו במשפט אחד: מה הנוהל בא למנוע או להבטיח. נוהל שאי אפשר לנסח את מטרתו במשפט אחד הוא בדרך כלל שני נהלים.',
                ),
                bulletList([
                  'על מי הנוהל חל — אילו תפקידים או מחלקות.',
                  'ממתי הוא בתוקף, ומה מחליף אותו אם היה נוהל קודם.',
                  'מה קורה במקרה של חריגה, ולמי פונים בשאלות.',
                ]),
              ),
            },
          }),
        ],
      }),

      createChapter({
        title: 'עיקרי הנוהל',
        description: 'הכללים עצמם, סעיף-סעיף',
        blocks: [
          createBlock('richText', {
            content: {
              maxWidth: 'normal',
              doc: richText(
                heading(2, 'מה מותר ומה אסור'),
                paragraph(
                  'האקורדיון למטה מפרק את הנוהל לסעיפים. כל סעיף הוא כלל אחד — כך הלומד קורא רק את מה שרלוונטי לו כרגע, ולא מסך טקסט אחד ארוך.',
                ),
              ),
            },
          }),
          createBlock('accordion', {
            content: {
              mode: 'single',
              openFirstByDefault: true,
              items: [
                createAccordionItem({
                  title: 'סעיף ראשון — הכלל המרכזי',
                  doc: richText(
                    paragraph(
                      'נסחו כאן את הכלל כפעולה: "יש לעשות X לפני Y". הימנעו מניסוח כללי כמו "יש לנהוג באחריות" — הוא נשמע טוב ולא ניתן ליישום.',
                    ),
                  ),
                }),
                createAccordionItem({
                  title: 'סעיף שני — מקרי קצה',
                  doc: richText(
                    paragraph(
                      'כאן מתארים את החריגים: מה קורה כשלא ניתן לפעול לפי הכלל הרגיל, ומי מוסמך לאשר חריגה.',
                    ),
                  ),
                }),
                createAccordionItem({
                  title: 'סעיף שלישי — אחריות ודיווח',
                  doc: richText(
                    paragraph(
                      'מי אחראי על מה, ואיך מדווחים על אירוע. ציינו ערוץ דיווח אחד ברור — טופס, כתובת או איש קשר.',
                    ),
                  ),
                }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'בדיקת הבנה ואישור',
        description: 'שאלה קצרה, ואז אישור קריאה',
        blocks: [
          createBlock('quiz', {
            content: {
              question: 'לפי הנוהל, למי פונים כשמתעורר ספק לגבי מקרה חריג?',
              hint: 'התשובה נמצאת בסעיף האחריות והדיווח.',
              options: [
                createQuizOption({ text: 'לגורם המוסמך לאשר חריגה, כפי שמופיע בנוהל', correct: true }),
                createQuizOption({ text: 'מחליטים לבד לפי שיקול דעת' }),
                createQuizOption({ text: 'ממתינים עד שמישהו ישאל' }),
              ],
              feedbackCorrect:
                'נכון. נוהל טוב תמיד מפנה לגורם מוסמך — כך חריגה מטופלת ולא מוסתרת.',
              feedbackIncorrect:
                'לא מדויק. החלטה עצמאית על חריגה היא בדיוק מה שהנוהל בא למנוע. חזרו לסעיף האחריות והדיווח.',
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
                heading(2, 'אישור קריאה'),
                paragraph(
                  'סכמו במשפט מה מצופה מהלומד מעכשיו, והוסיפו את דרך האישור — טופס לחתום עליו, או הודעה לשלוח למנהל. זכרו שהכלי אינו שומר הרשמות; האישור עצמו מתבצע במערכת שלכם.',
                ),
              ),
            },
          }),
        ],
      }),
    ],
  });

  return { course, assets: [] };
}

/**
 * "קליטת עובד חדש".
 *
 * מסלול פתיחה לעובד ביום הראשון: קבלת פנים, מה צפוי בשבוע הראשון,
 * ושאלות נפוצות. גם היא ללא נכסים חיצוניים.
 */
function onboardingTemplate(): TemplateResult {
  const theme = getThemePreset('warmSand')!.theme;

  const course = createCourse({
    title: 'ברוכים הבאים',
    subtitle: 'קליטת עובד חדש',
    description: 'מסלול קליטה קצר לעובד חדש: קבלת פנים, השבוע הראשון ושאלות נפוצות.',
    theme,
    chapters: [
      createChapter({
        title: 'קבלת פנים',
        description: 'ברוכים הבאים, וכמה מילים על הדרך',
        blocks: [
          createBlock('hero', {
            content: {
              variant: 'spotlight',
              title: 'ברוכים הבאים לצוות',
              subtitle: 'שמחים שהצטרפתם. הלומדה הקצרה הזו תעזור לכם להתחיל.',
              intro: 'כעשר דקות',
              backgroundType: 'color',
              backgroundColor: '#7c2d12',
              gradientFrom: '#7c2d12',
              gradientTo: '#c2410c',
              imageAssetId: '',
              overlayOpacity: 0.4,
              height: 'medium',
              alignment: 'center',
              fullBleed: true,
              button: { enabled: false, label: '', href: '', newTab: false },
            },
          }),
          createBlock('richText', {
            content: {
              maxWidth: 'normal',
              doc: richText(
                paragraph(
                  'החליפו את הפסקה הזו בכמה מילים אישיות מהמנהל או מהצוות. פתיחה חמה שווה יותר מרשימת נהלים — לזה יגיעו בהמשך.',
                ),
              ),
            },
          }),
        ],
      }),

      createChapter({
        title: 'השבוע הראשון',
        description: 'שלושה דברים שכדאי לדעת מיד',
        blocks: [
          createBlock('cards', {
            content: {
              variant: 'gradient',
              columns: 3,
              media: 'icon',
              roundness: 'medium',
              textAlign: 'start',
              items: [
                createCard({
                  icon: 'Users',
                  title: 'עם מי מדברים',
                  text: 'מי המנהל הישיר, מי איש הקשר בכל תחום, ואיפה מוצאים את שאר הצוות.',
                }),
                createCard({
                  icon: 'Settings',
                  title: 'הכלים שלכם',
                  text: 'אילו מערכות צריך להתחבר אליהן ביום הראשון, ולמי פונים אם משהו לא עובד.',
                }),
                createCard({
                  icon: 'Compass',
                  title: 'איך עובדים כאן',
                  text: 'שעות, ישיבות קבועות והרגלים קטנים שנעים לדעת מראש.',
                }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'שאלות נפוצות',
        description: 'התשובות שכל עובד חדש מחפש',
        blocks: [
          createBlock('accordion', {
            content: {
              mode: 'multiple',
              openFirstByDefault: false,
              items: [
                createAccordionItem({
                  title: 'למי פונים בנושאי שכר ותנאים?',
                  doc: richText(paragraph('ציינו כאן את איש הקשר או המערכת הרלוונטית.')),
                }),
                createAccordionItem({
                  title: 'איך מבקשים חופשה?',
                  doc: richText(paragraph('תארו את התהליך בקצרה, ואת מי צריך לאשר.')),
                }),
                createAccordionItem({
                  title: 'מה עושים אם נתקעים?',
                  doc: richText(
                    paragraph('עודדו לשאול. ציינו ערוץ ברור — צ׳אט, פגישת אחד-על-אחד או איש קשר.'),
                  ),
                }),
              ],
            },
          }),
        ],
      }),
    ],
  });

  return { course, assets: [] };
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
    id: 'policy',
    name: 'נוהל ומדיניות',
    description: 'הצגת נוהל ארגוני, פירוק לסעיפים באקורדיון ובדיקת הבנה.',
    create: policyTemplate,
  },
  {
    id: 'onboarding',
    name: 'קליטת עובד חדש',
    description: 'קבלת פנים, מה צפוי בשבוע הראשון ושאלות נפוצות.',
    create: onboardingTemplate,
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
