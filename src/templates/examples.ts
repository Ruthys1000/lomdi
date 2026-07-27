import { createAccordionItem } from '@/blocks/accordion/content';
import { createCard } from '@/blocks/cards/content';
import { createQuizOption } from '@/blocks/quiz/content';
import { createStat } from '@/blocks/stats/content';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import { bulletList, heading, paragraph, richText } from '@/model/richText';
import { getThemePreset } from '@/model/themes';
import {
  featureMockupIllustration,
  safetyChecklistIllustration,
  welcomeIllustration,
} from '@/sample/illustrations';
import type { TemplateResult } from './types';

/**
 * דוגמאות הדגל של דף הבית.
 *
 * בניגוד לתבניות-השלד, אלה לומדות מוגמרות: תוכן עברי אמיתי, פלטה נועזת,
 * שימוש בוריאציות ובבלוקים הפרימיום (stats/quote/textImage feature) ואיור
 * ייעודי. מטרתן להראות "איך נראית לומדה טובה" ולשמש נקודת פתיחה מהירה.
 * הן נצרכות דרך אותו `courseTemplates` ב-`index.ts`.
 */

/** hero מלא — הרבה שדות, לכן עוזר קטן שמונע חזרה */
function hero(overrides: Record<string, unknown>) {
  return createBlock('hero', {
    content: {
      variant: 'spotlight',
      title: '',
      subtitle: '',
      intro: '',
      backgroundType: 'gradient',
      backgroundColor: '#1e1b32',
      gradientFrom: '#1e1b32',
      gradientTo: '#7c3aed',
      imageAssetId: '',
      overlayOpacity: 0.45,
      height: 'tall',
      alignment: 'center',
      fullBleed: true,
      button: { enabled: false, label: '', href: '', newTab: false },
      ...overrides,
    },
  });
}

// ─────────────────────────── אונבורדינג ───────────────────────────

function onboardingExample(): TemplateResult {
  const theme = getThemePreset('sunset')!.theme;
  const welcome = welcomeIllustration(theme.colors);

  const course = createCourse({
    title: 'ברוכים הבאים לצוות',
    subtitle: 'קליטת עובד/ת חדש/ה',
    description: 'מסלול קליטה חם: קבלת פנים, מה צפוי בשבוע הראשון, ושאלות נפוצות.',
    theme,
    chapters: [
      createChapter({
        title: 'קבלת פנים',
        description: '',
        blocks: [
          hero({
            title: 'שמחים שהצטרפת 👋',
            subtitle: 'הכנו לך התחלה רכה — כל מה שחשוב לדעת בימים הראשונים, במקום אחד.',
            intro: 'כעשר דקות',
            gradientFrom: '#be185d',
            gradientTo: '#f59e0b',
            height: 'tall',
          }),
          createBlock('textImage', {
            content: {
              variant: 'feature',
              layout: 'imageStart',
              ratio: '50-50',
              verticalAlign: 'center',
              aspectRatio: '4:3',
              roundness: 'large',
              imageAssetId: welcome.meta.id,
              alt: 'צוות מקבל את פניך',
              caption: '',
              button: { enabled: false, label: '', href: '', newTab: false },
              doc: richText(
                heading(2, 'הגעת למקום טוב'),
                paragraph(
                  'הצטרפת לצוות שמאמין שקליטה טובה מתחילה מיחס, לא מטפסים. בדקות הקרובות נראה לך מי סביבך, מה קורה השבוע, ואיך מוצאים תשובה כשצריך.',
                ),
              ),
            },
          }),
          createBlock('richText', {
            content: {
              maxWidth: 'normal',
              doc: richText(
                heading(2, 'מה מחכה לך כאן'),
                paragraph(
                  'הלומדה הקצרה הזו מחולקת לשלושה חלקים, וכולם יחד לוקחים כעשר דקות. אין כאן מה לשנן — רק להכיר את הקרקע לפני שמתחילים.',
                ),
                bulletList([
                  'מי האנשים סביבך, ואל מי לפנות בכל נושא.',
                  'איך נראה השבוע הראשון, יום אחר יום.',
                  'התשובות לשאלות שכל מי שהתחיל כאן שאל.',
                ]),
              ),
            },
          }),
        ],
      }),

      createChapter({
        title: 'השבוע הראשון',
        description: 'מה מחכה לך, במספרים ובצעדים',
        blocks: [
          createBlock('stats', {
            settings: { width: 'full', background: 'gradientSoft', spacingTop: 'large', spacingBottom: 'large' },
            content: {
              variant: 'plain',
              columns: 3,
              items: [
                createStat({ value: '3', label: 'ימי חפיפה', sub: 'עם המנהל/ת והצוות הקרוב' }),
                createStat({ value: '1', label: 'מנטור/ית אישי/ת', sub: 'כתובת לכל שאלה, גדולה כקטנה' }),
                createStat({ value: '12', label: 'אנשי צוות', sub: 'שישמחו להכיר אותך' }),
              ],
            },
          }),
          createBlock('cards', {
            content: {
              variant: 'numbered',
              columns: 3,
              media: 'none',
              roundness: 'medium',
              textAlign: 'start',
              items: [
                createCard({ title: 'יום ראשון — היכרות', text: 'פגישה עם המנהל/ת, סיור בצוות, והגדרת הכלים והגישות.' }),
                createCard({ title: 'אמצע השבוע — צלילה', text: 'משימה קטנה ואמיתית, עם ליווי צמוד — כדי ללמוד תוך עשייה.' }),
                createCard({ title: 'סוף השבוע — סיכום', text: 'שיחת משוב קצרה: מה עבד, מה חסר, ומה היעד לשבוע הבא.' }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'שאלות שכולם שואלים',
        description: '',
        blocks: [
          createBlock('accordion', {
            content: {
              mode: 'multiple',
              openFirstByDefault: true,
              items: [
                createAccordionItem({
                  title: 'למי פונים בשאלות שכר ותנאים?',
                  doc: richText(paragraph('צרו קשר עם מדור משאבי אנוש בכתובת המופיעה בפורטל הפנימי — הם עונים תוך יום עבודה.')),
                }),
                createAccordionItem({
                  title: 'איך מבקשים חופשה?',
                  doc: richText(paragraph('דרך מערכת הנוכחות, לאישור המנהל/ת הישיר/ה. מומלץ לתאם מראש חופשות ארוכות.')),
                }),
                createAccordionItem({
                  title: 'מה עושים כשנתקעים?',
                  doc: richText(paragraph('שואלים. עדיף מוקדם מאשר מאוחר — פנו למנטור/ית או לצ׳אט הצוות, אף שאלה אינה מובנת מאליה.')),
                }),
              ],
            },
          }),
          createBlock('quote', {
            settings: { width: 'full', background: 'gradientSoft', spacingTop: 'large', spacingBottom: 'medium' },
            content: {
              variant: 'emphasis',
              text: 'בשבוע הראשון הרגשתי שמישהו באמת חשב עליי מראש. זה נשאר איתי.',
              author: 'עובדת בצוות',
              role: 'שנה וחצי אצלנו',
            },
          }),
          createBlock('richText', {
            content: {
              maxWidth: 'normal',
              doc: richText(
                heading(2, 'הצעד הראשון שלך'),
                paragraph(
                  'זהו — אלה כל היסודות. עכשיו, לפני שממשיכים: שלח הודעה קצרה למנטור/ית שלך ותיאמו קפה ראשון. ההיכרות האישית הזו שווה יותר מכל מסמך, ומשם הכול נפתח.',
                ),
              ),
            },
          }),
        ],
      }),
    ],
  });

  return { course, assets: [welcome] };
}

// ─────────────────────────── מוצר / פיצר ───────────────────────────

function productExample(): TemplateResult {
  const theme = getThemePreset('midnight')!.theme;
  const mockup = featureMockupIllustration(theme.colors);

  const course = createCourse({
    title: 'מכירים את היכולת החדשה',
    subtitle: 'הדרכת מוצר קצרה',
    description: 'הצגת פיצ׳ר חדש: מה הוא נותן, איך הוא עובד, ומה אומרים מי שכבר משתמשים.',
    theme,
    chapters: [
      createChapter({
        title: 'מה חדש',
        description: '',
        blocks: [
          hero({
            title: 'עכשיו זה פשוט מהיר יותר',
            subtitle: 'היכולת החדשה חוסכת לך צעדים בכל פעם שאתה עובד — הנה מה שכדאי לדעת.',
            intro: 'עדכון מוצר',
            gradientFrom: '#0a0f1e',
            gradientTo: '#4f46e5',
            height: 'tall',
          }),
          createBlock('richText', {
            content: {
              maxWidth: 'normal',
              doc: richText(
                paragraph(
                  'עד היום, כדי לבצע את הפעולה הזו היה צריך לעבור בין שלושה מסכים ולזכור איפה כל דבר יושב. שמענו את התסכול, ובנינו מחדש את כל הזרימה סביב שאלה אחת: מה הכי חשוב לך לעשות מהר.',
                ),
                paragraph(
                  'התוצאה היא יכולת אחת שמרכזת את מה שהיה מפוזר — פחות קליקים, פחות מעברים, ואותה עבודה בשליש מהזמן. בפרק הבא נראה בדיוק איך היא עובדת.',
                ),
              ),
            },
          }),
          createBlock('stats', {
            settings: { width: 'wide', background: 'transparent', spacingTop: 'large', spacingBottom: 'medium' },
            content: {
              variant: 'plain',
              columns: 3,
              items: [
                createStat({ value: '+48%', label: 'מהירות', sub: 'זמן קצר יותר למשימה נפוצה' }),
                createStat({ value: '‎−30%', label: 'פחות קליקים', sub: 'פחות צעדים לאותה תוצאה' }),
                createStat({ value: '24/7', label: 'זמין', sub: 'עובד גם לא מחוברים לרשת' }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'איך זה עובד',
        description: '',
        blocks: [
          createBlock('textImage', {
            content: {
              variant: 'feature',
              layout: 'imageEnd',
              ratio: '50-50',
              verticalAlign: 'center',
              aspectRatio: '4:3',
              roundness: 'large',
              imageAssetId: mockup.meta.id,
              alt: 'מסך המוצר עם היכולת החדשה',
              caption: '',
              button: { enabled: true, label: 'לניסיון', href: '#', newTab: false },
              doc: richText(
                heading(2, 'הכול במקום אחד'),
                paragraph('היכולת יושבת בדיוק היכן שהעבודה קורית — בלי לעבור מסך ובלי הגדרות. פותחים, מקלידים, וזה שם.'),
              ),
            },
          }),
          createBlock('cards', {
            content: {
              variant: 'gradient',
              columns: 3,
              media: 'icon',
              roundness: 'medium',
              textAlign: 'start',
              items: [
                createCard({ icon: 'Zap', title: 'מהיר', text: 'תוצאה מיידית, בלי המתנה ובלי טעינה מיותרת.' }),
                createCard({ icon: 'Shield', title: 'בטוח', text: 'הנתונים שלך נשארים אצלך — כלום לא עוזב את הדפדפן.' }),
                createCard({ icon: 'Sparkles', title: 'פשוט', text: 'ממשק אחד ברור. אם ידעת להשתמש קודם, כבר יודע עכשיו.' }),
              ],
            },
          }),
          createBlock('accordion', {
            content: {
              mode: 'single',
              openFirstByDefault: false,
              items: [
                createAccordionItem({
                  title: 'צריך להתקין משהו?',
                  doc: richText(
                    paragraph('לא. היכולת כבר זמינה בממשק הקיים — בפעם הבאה שתיכנס פשוט תמצא אותה במקום העבודה הרגיל, בלי עדכון ובלי הגדרה.'),
                  ),
                }),
                createAccordionItem({
                  title: 'מה קורה לדרך הישנה שהכרתי?',
                  doc: richText(
                    paragraph('היא עדיין כאן. הדרך החדשה היא קיצור, לא החלפה — אפשר להמשיך לעבוד כרגיל בזמן שמתרגלים אותה בקצב שלך.'),
                  ),
                }),
                createAccordionItem({
                  title: 'זה עובד גם בלי חיבור לרשת?',
                  doc: richText(
                    paragraph('כן. הפעולה מתבצעת מקומית בדפדפן, כך שהיא זמינה גם כשאין אינטרנט — והתוצאה מסתנכרנת כשהחיבור חוזר.'),
                  ),
                }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'מה אומרים',
        description: 'מי שכבר עבר לדרך החדשה, ומה יצא לו מזה',
        blocks: [
          createBlock('quote', {
            settings: { width: 'full', background: 'gradient', spacingTop: 'large', spacingBottom: 'medium' },
            content: {
              variant: 'plain',
              text: 'חשבתי שזה עוד כפתור. בפועל זה חסך לי חצי שעה כבר ביום הראשון.',
              author: 'משתמש מוקדם',
              role: 'צוות התפעול',
            },
          }),
          createBlock('stats', {
            settings: { width: 'wide', background: 'transparent', spacingTop: 'medium', spacingBottom: 'medium' },
            content: {
              variant: 'plain',
              columns: 3,
              items: [
                createStat({ value: '9 מתוך 10', label: 'ממליצים', sub: 'מתוך מי שהתנסו בשבועיים הראשונים' }),
                createStat({ value: '2 דקות', label: 'זמן הסתגלות', sub: 'עד שהיכולת הפכה להרגל' }),
                createStat({ value: '1,200+', label: 'משתמשים פעילים', sub: 'כבר עברו לדרך החדשה' }),
              ],
            },
          }),
          createBlock('quote', {
            settings: { width: 'full', background: 'gradientSoft', spacingTop: 'medium', spacingBottom: 'large' },
            content: {
              variant: 'emphasis',
              text: 'הצוות שלי הפסיק לשאול אותי איפה הכפתור. עכשיו הם פשוט עובדים.',
              author: 'ראש צוות',
              role: 'תמיכת לקוחות',
            },
          }),
          createBlock('richText', {
            content: {
              maxWidth: 'normal',
              doc: richText(
                heading(2, 'איך מתחילים'),
                paragraph('אין מה להתכונן — היכולת כבר מחכה לך. שלושה צעדים קטנים והיא נכנסת לשגרה:'),
                bulletList([
                  'פתח את המסך שבו אתה עובד בדרך כלל — היכולת יושבת שם.',
                  'נסה אותה פעם אחת על משימה אמיתית וקטנה.',
                  'שים לב כמה צעדים חסכת, ותן לזה להפוך להרגל.',
                ]),
              ),
            },
          }),
        ],
      }),
    ],
  });

  return { course, assets: [mockup] };
}

// ─────────────────────────── בטיחות / ציות ───────────────────────────

function safetyExample(): TemplateResult {
  const theme = getThemePreset('forest')!.theme;
  const checklist = safetyChecklistIllustration(theme.colors);

  const course = createCourse({
    title: 'בטיחות במקום העבודה',
    subtitle: 'הדרכת חובה',
    description: 'עקרונות בטיחות, הכללים המרכזיים, בדיקת הבנה ואישור קריאה.',
    theme,
    chapters: [
      createChapter({
        title: 'למה זה חשוב',
        description: '',
        blocks: [
          hero({
            variant: 'panel',
            title: 'בטיחות מתחילה בך',
            subtitle: 'חמש דקות עכשיו יכולות למנוע פציעה אחר כך. נעבור יחד על מה שחשוב.',
            intro: 'קריאה חובה',
            gradientFrom: '#14532d',
            gradientTo: '#166534',
            height: 'medium',
          }),
          createBlock('textImage', {
            content: {
              variant: 'feature',
              layout: 'imageStart',
              ratio: '50-50',
              verticalAlign: 'center',
              aspectRatio: '4:3',
              roundness: 'medium',
              imageAssetId: checklist.meta.id,
              alt: 'צ׳קליסט בטיחות',
              caption: '',
              button: { enabled: false, label: '', href: '', newTab: false },
              doc: richText(
                heading(2, 'שלוש דקות שמצילות'),
                paragraph('רוב התאונות קורות ברגעים שגרתיים, לא בחריגים. הכללים הבאים הם הרגלים קטנים שהופכים את המקום לבטוח יותר לכולם.'),
              ),
            },
          }),
          createBlock('stats', {
            settings: { width: 'wide', background: 'gradientSoft', spacingTop: 'large', spacingBottom: 'large' },
            content: {
              variant: 'plain',
              columns: 3,
              items: [
                createStat({ value: '8 מתוך 10', label: 'תאונות נמנעות', sub: 'כשמדווחים על כמעט-תאונה בזמן' }),
                createStat({ value: '3 דקות', label: 'זה כל מה שצריך', sub: 'לעבור על הכללים לפני המשמרת' }),
                createStat({ value: '0', label: 'היעד שלנו', sub: 'אירועים שאפשר היה למנוע' }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'הכללים המרכזיים',
        description: '',
        blocks: [
          createBlock('accordion', {
            content: {
              mode: 'single',
              openFirstByDefault: true,
              items: [
                createAccordionItem({
                  title: 'ציוד מגן — לפני שמתחילים',
                  doc: richText(paragraph('חובשים את ציוד המגן המתאים למשימה עוד לפני הכניסה לאזור העבודה, לא תוך כדי.')),
                }),
                createAccordionItem({
                  title: 'סדר וניקיון — תוך כדי',
                  doc: richText(paragraph('שומרים על מעברים פנויים ומחזירים כלים למקומם. משטח נקי הוא משטח בטוח.')),
                }),
                createAccordionItem({
                  title: 'אירוע חריג — מיד',
                  doc: richText(paragraph('מדווחים על כל תקלה או כמעט-תאונה לממונה הבטיחות מיד, גם אם לא קרה נזק.')),
                }),
              ],
            },
          }),
          createBlock('quote', {
            settings: { width: 'full', background: 'gradientSoft', spacingTop: 'large', spacingBottom: 'large' },
            content: {
              variant: 'band',
              text: 'הדיווח שנראה מיותר הוא בדיוק זה שמונע את התאונה הבאה.',
              author: 'ממונה בטיחות',
              role: '',
            },
          }),
        ],
      }),

      createChapter({
        title: 'בדיקת הבנה',
        description: '',
        blocks: [
          createBlock('quiz', {
            content: {
              question: 'מתי מדווחים על כמעט-תאונה שלא גרמה לנזק?',
              hint: 'חשבו על המטרה של הדיווח.',
              options: [
                createQuizOption({ text: 'מיד — גם בלי נזק, כדי למנוע את הפעם הבאה', correct: true }),
                createQuizOption({ text: 'רק אם מישהו נפגע' }),
                createQuizOption({ text: 'בסוף המשמרת, אם נזכרים' }),
              ],
              feedbackCorrect: 'נכון. דיווח מוקדם הוא הדרך העיקרית ללמוד ולמנוע — גם כשלא קרה כלום.',
              feedbackIncorrect: 'לא מדויק. מדווחים מיד גם ללא נזק — כמעט-תאונה היא בדיוק ההזדמנות ללמוד.',
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
                bulletList([
                  'קראתי והבנתי את כללי הבטיחות.',
                  'אני יודע/ת למי לפנות בשאלה או בדיווח.',
                  'אאשר את ההדרכה במערכת הארגונית.',
                ]),
              ),
            },
          }),
        ],
      }),
    ],
  });

  return { course, assets: [checklist] };
}

export const exampleTemplates = [
  {
    id: 'example-onboarding',
    name: 'קליטת עובד/ת חדש/ה',
    description: 'קבלת פנים חמה, השבוע הראשון במספרים, ושאלות נפוצות.',
    create: onboardingExample,
  },
  {
    id: 'example-product',
    name: 'הדרכת מוצר / פיצ׳ר',
    description: 'הצגת יכולת חדשה עם מספרים גדולים, מוקאפ והמלצה.',
    create: productExample,
  },
  {
    id: 'example-safety',
    name: 'בטיחות וציות',
    description: 'עקרונות, כללים באקורדיון, בדיקת הבנה ואישור קריאה.',
    create: safetyExample,
  },
] as const;
