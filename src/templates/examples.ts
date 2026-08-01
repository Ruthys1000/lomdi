import { createAccordionItem } from '@/blocks/accordion/content';
import { createCard } from '@/blocks/cards/content';
import { createQuizOption } from '@/blocks/quiz/content';
import { createStat } from '@/blocks/stats/content';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import { bulletList, heading, paragraph, richText } from '@/model/richText';
import { getThemePreset } from '@/model/themes';
import {
  courseOutlineIllustration,
  featureMockupIllustration,
  learnerPathIllustration,
  practiceStopIllustration,
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

// ─────────────────────────── מודעות סייבר ───────────────────────────

function cyberExample(): TemplateResult {
  const theme = getThemePreset('darkElegant')!.theme;
  const shield = practiceStopIllustration(theme.colors);

  const course = createCourse({
    title: 'מודעות סייבר',
    subtitle: 'ההגנה הכי טובה זה אתה',
    description: 'איך מזהים פישינג, שומרים על סיסמאות, ומגיבים נכון כשמשהו נראה חשוד.',
    theme,
    chapters: [
      createChapter({
        title: 'האיום קרוב מכפי שנדמה',
        description: '',
        blocks: [
          hero({
            variant: 'panel',
            title: 'סייבר מתחיל בך',
            subtitle: 'רוב הפריצות לא שוברות קוד — הן מבקשות יפה. שבע דקות שיחסכו לך יום שלם של צרות.',
            intro: 'מודעות · 7 דקות',
            gradientFrom: '#0f172a',
            gradientTo: '#1e3a8a',
            height: 'tall',
          }),
          createBlock('richText', {
            settings: { background: 'gradientSoft', spacingTop: 'large', spacingBottom: 'large' },
            content: {
              maxWidth: 'normal',
              doc: richText(
                heading(2, 'למה דווקא אנחנו'),
                paragraph(
                  'תוקפים לא מחפשים את המערכת הכי חזקה — הם מחפשים את האדם העסוק ביותר. הודעה דחופה, קישור מוכר, בקשה קטנה: כל מה שצריך זה שנייה אחת של היסח דעת.',
                ),
              ),
            },
          }),
          createBlock('stats', {
            content: {
              variant: 'gradient',
              columns: 3,
              items: [
                createStat({ value: '1 מ-3', label: 'מיילים חשודים', sub: 'מגיעים לתיבה של עובד ממוצע בחודש' }),
                createStat({ value: '90%', label: 'מהפריצות', sub: 'מתחילות בהודעה, לא בקוד' }),
                createStat({ value: '8 שנ׳', label: 'זה כל מה שצריך', sub: 'לעצור ולבדוק לפני שלוחצים' }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'שלושה הרגלים שמגנים',
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
              imageAssetId: shield.meta.id,
              alt: 'עצירה ובדיקה לפני לחיצה',
              caption: '',
              button: { enabled: false, label: '', href: '', newTab: false },
              doc: richText(
                heading(2, 'עצור. חשוב. ואז לחץ.'),
                paragraph('הכלל האחד ששווה את כל השאר: כשמשהו דחוף, מפתה או מפחיד מדי — זה בדיוק הרגע לעצור שנייה ולבדוק מי באמת שלח.'),
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
                createCard({ icon: 'Lock', title: 'סיסמאות', text: 'סיסמה ייחודית לכל מערכת, ומנהל סיסמאות שיזכור במקומך. אימות דו-שלבי בכל מקום שאפשר.' }),
                createCard({ icon: 'Mail', title: 'פישינג', text: 'בדוק את כתובת השולח, לא רק את השם. קישור חשוד? העבר עליו את העכבר לפני שאתה לוחץ.' }),
                createCard({ icon: 'Shield', title: 'עדכונים', text: 'עדכון שמופיע הוא לרוב תיקון של חור אבטחה. אל תדחה אותו לשבוע הבא — זה בדיוק החלון של התוקף.' }),
              ],
            },
          }),
          createBlock('quote', {
            settings: { width: 'full', background: 'gradientSoft', spacingTop: 'large', spacingBottom: 'large' },
            content: {
              variant: 'band',
              text: 'הדיווח על מייל חשוד שהתברר כלא-כלום עדיף פי אלף על השתיקה שהתבררה כפריצה.',
              author: 'צוות אבטחת המידע',
              role: '',
            },
          }),
          createBlock('quiz', {
            content: {
              question: 'קיבלת מייל דחוף מ״המנהל״ שמבקש להעביר תשלום מיד. מה עושים?',
              hint: 'חשוב על הערוץ, לא רק על התוכן.',
              options: [
                createQuizOption({ text: 'עוצרים, ומאמתים בערוץ אחר — טלפון או צ׳אט — לפני כל פעולה', correct: true }),
                createQuizOption({ text: 'מעבירים מיד, כי המנהל ביקש והזמן דוחק' }),
                createQuizOption({ text: 'משיבים למייל ושואלים אם זה אמיתי' }),
              ],
              feedbackCorrect: 'נכון. אימות בערוץ נפרד הוא ההגנה היחידה שעובדת נגד התחזות — דחיפות היא בדיוק הפיתיון.',
              feedbackIncorrect: 'לא מדויק. תשובה לאותו מייל מגיעה לתוקף עצמו. מאמתים תמיד בערוץ אחר.',
              shuffle: true,
              allowRetry: true,
              showSolution: true,
              labels: { submit: 'בדיקה', retry: 'ניסיון נוסף', solution: 'הצגת הפתרון' },
            },
          }),
        ],
      }),
    ],
  });

  return { course, assets: [shield] };
}

// ─────────────────────────── שירות לקוחות ───────────────────────────

function serviceExample(): TemplateResult {
  const theme = getThemePreset('vivid')!.theme;
  const path = learnerPathIllustration(theme.colors);

  const course = createCourse({
    title: 'שירות שלקוחות זוכרים',
    subtitle: 'מיומנויות שירות מצוין',
    description: 'איך הופכים פנייה רגילה — ואפילו תלונה — לרגע שהלקוח מספר עליו לטובה.',
    theme,
    chapters: [
      createChapter({
        title: 'כל פנייה היא הזדמנות',
        description: '',
        blocks: [
          hero({
            title: 'הלקוח זוכר איך גרמת לו להרגיש',
            subtitle: 'לא את זמן ההמתנה ולא את הנוהל — את התחושה. הנה איך יוצרים אותה שוב ושוב.',
            intro: 'שירות · 8 דקות',
            gradientFrom: '#0e7490',
            gradientTo: '#0891b2',
            height: 'tall',
          }),
          createBlock('richText', {
            settings: { background: 'gradientSoft', spacingTop: 'large', spacingBottom: 'large' },
            content: {
              maxWidth: 'normal',
              doc: richText(
                heading(2, 'העיקרון האחד'),
                paragraph(
                  'לקוח שפונה לא באמת מחפש רק פתרון — הוא מחפש להרגיש שמישהו הבין אותו. תפתור את הבעיה בלי זה, ותאבד אותו; תוסיף את זה, והוא ימחל לך גם על תקלה.',
                ),
              ),
            },
          }),
          createBlock('stats', {
            content: {
              variant: 'gradient',
              columns: 3,
              items: [
                createStat({ value: 'פי 5', label: 'עולה יותר', sub: 'להשיג לקוח חדש מלשמר קיים' }),
                createStat({ value: '70%', label: 'מהלקוחות', sub: 'חוזרים אחרי תלונה שטופלה היטב' }),
                createStat({ value: '1 רגע', label: 'זה כל מה שצריך', sub: 'כדי להפוך תסכול להערכה' }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'ארבעה צעדים בכל שיחה',
        description: '',
        blocks: [
          createBlock('textImage', {
            content: {
              variant: 'feature',
              layout: 'imageStart',
              ratio: '50-50',
              verticalAlign: 'center',
              aspectRatio: '4:3',
              roundness: 'large',
              imageAssetId: path.meta.id,
              alt: 'מסלול השיחה בארבעה שלבים',
              caption: '',
              button: { enabled: false, label: '', href: '', newTab: false },
              doc: richText(
                heading(2, 'להקשיב לפני שפותרים'),
                paragraph('רוב אנשי השירות קופצים ישר לפתרון. אבל שלושים השניות הראשונות של הקשבה אמיתית שוות יותר מכל תשובה מהירה — הן אלה שמרגיעות.'),
              ),
            },
          }),
          createBlock('cards', {
            content: {
              variant: 'numbered',
              columns: 2,
              media: 'icon',
              roundness: 'medium',
              textAlign: 'start',
              items: [
                createCard({ icon: 'MessageCircleQuestion', title: 'מקשיבים עד הסוף', text: 'לא קוטעים, לא מניחים. נותנים ללקוח לסיים, ומשקפים במילים שלנו כדי לוודא שהבנו.' }),
                createCard({ icon: 'Heart', title: 'מכירים ברגש', text: '״אני מבין/ה שזה מתסכל״ — משפט אחד שמוריד את הלחץ ומאותת שיש כאן בן אדם, לא נוהל.' }),
                createCard({ icon: 'CircleCheck', title: 'פותרים או מסבירים', text: 'אם אפשר לפתור — פותרים. אם לא — מסבירים בדיוק מה כן יקרה ומתי, בלי הבטחות באוויר.' }),
                createCard({ icon: 'ThumbsUp', title: 'סוגרים יפה', text: 'מוודאים שהכול טופל, מודים על הסבלנות, ומשאירים דלת פתוחה להמשך.' }),
              ],
            },
          }),
          createBlock('quote', {
            settings: { width: 'full', background: 'gradientSoft', spacingTop: 'large', spacingBottom: 'large' },
            content: {
              variant: 'band',
              text: 'לא נצחת בשיחה כשהוכחת שצדקת. ניצחת כשהלקוח הרגיש ששמעת אותו.',
              author: 'מנהלת שירות',
              role: '',
            },
          }),
          createBlock('quiz', {
            content: {
              question: 'לקוח מתקשר כועס על תקלה שאינה באשמתך. מה הצעד הראשון?',
              hint: 'מה הלקוח צריך לפני פתרון?',
              options: [
                createQuizOption({ text: 'להקשיב עד הסוף ולהכיר בתסכול לפני שמסבירים', correct: true }),
                createQuizOption({ text: 'להבהיר מיד שזו לא אשמתך' }),
                createQuizOption({ text: 'להעביר את השיחה למחלקה אחרת' }),
              ],
              feedbackCorrect: 'נכון. הכרה ברגש קודמת לכל פתרון — היא מה שמאפשר ללקוח בכלל לשמוע אותך.',
              feedbackIncorrect: 'לא מדויק. התגוננות או העברה מיד רק מגבירות את הכעס. קודם מקשיבים ומכירים.',
              shuffle: true,
              allowRetry: true,
              showSolution: true,
              labels: { submit: 'בדיקה', retry: 'ניסיון נוסף', solution: 'הצגת הפתרון' },
            },
          }),
        ],
      }),
    ],
  });

  return { course, assets: [path] };
}

// ─────────────────────────── סביבת עבודה מכבדת ───────────────────────────

function respectExample(): TemplateResult {
  const theme = getThemePreset('warmSand')!.theme;
  const outline = courseOutlineIllustration(theme.colors);

  const course = createCourse({
    title: 'סביבת עבודה מכבדת',
    subtitle: 'כבוד מתחיל בכל אחד מאיתנו',
    description: 'מה יוצר אווירה בטוחה ומכבדת, איך מזהים חצייה של גבול, ומה עושים כשזה קורה.',
    theme,
    chapters: [
      createChapter({
        title: 'למה זה חשוב לכולם',
        description: '',
        blocks: [
          hero({
            variant: 'panel',
            title: 'כבוד מתחיל בי',
            subtitle: 'סביבה מכבדת היא לא מובן מאליו — היא תוצאה של הרגלים קטנים שכולנו בוחרים בהם כל יום.',
            intro: 'תרבות ארגונית · 6 דקות',
            gradientFrom: '#9a3412',
            gradientTo: '#c2410c',
            height: 'medium',
          }),
          createBlock('textImage', {
            content: {
              variant: 'feature',
              layout: 'imageEnd',
              ratio: '50-50',
              verticalAlign: 'center',
              aspectRatio: '4:3',
              roundness: 'medium',
              imageAssetId: outline.meta.id,
              alt: 'צוות מגוון עובד יחד',
              caption: '',
              button: { enabled: false, label: '', href: '', newTab: false },
              doc: richText(
                heading(2, 'מה נותנת סביבה מכבדת'),
                paragraph('כשאנשים מרגישים בטוחים, הם מדברים בפתיחות, מבקשים עזרה, ומעזים להציע רעיונות. כבוד הוא לא רק ערך — הוא מה שמאפשר לצוות לעבוד טוב באמת.'),
              ),
            },
          }),
          createBlock('stats', {
            settings: { width: 'wide', background: 'gradientSoft', spacingTop: 'large', spacingBottom: 'large' },
            content: {
              variant: 'plain',
              columns: 3,
              items: [
                createStat({ value: 'פי 3', label: 'יותר מעורבות', sub: 'בצוותים שבהם מרגישים בטוחים לדבר' }),
                createStat({ value: '2 מ-3', label: 'מהאירועים', sub: 'לא מדווחים — כי לא ברור למי ואיך' }),
                createStat({ value: 'עֵד אחד', label: 'זה כל מה שצריך', sub: 'כדי לעצור מצב לא נעים בזמן' }),
              ],
            },
          }),
        ],
      }),

      createChapter({
        title: 'לזהות, להגיב, לפנות',
        description: '',
        blocks: [
          createBlock('cards', {
            content: {
              variant: 'gradient',
              columns: 3,
              media: 'icon',
              roundness: 'medium',
              textAlign: 'start',
              items: [
                createCard({ icon: 'Users', title: 'המבחן הפשוט', text: 'הקובע הוא לא הכוונה אלא ההשפעה: אם התנהגות גורמת למישהו אי-נוחות, זה מספיק כדי לעצור אותה.' }),
                createCard({ icon: 'Heart', title: 'עֵד שמדבר', text: 'משפט קטן — ״בוא נעצור עם זה״ — עוצר אירוע. שתיקה מאותתת שזה בסדר, וזה כמעט תמיד לא.' }),
                createCard({ icon: 'MessageCircleQuestion', title: 'אפשר רק להתייעץ', text: 'לא חייבים להגיש תלונה כדי לדבר. אפשר לפנות לגורם המקצועי רק כדי להבין את האפשרויות.' }),
              ],
            },
          }),
          createBlock('accordion', {
            content: {
              mode: 'single',
              openFirstByDefault: true,
              items: [
                createAccordionItem({
                  title: 'מה נחשב חציית גבול?',
                  doc: richText(paragraph('כל התנהגות בעלת אופי פוגעני שאינה רצויה לצד השני — הערה, בדיחה, מגע או הודעה. אם אינך בטוח, זו כבר סיבה טובה לעצור ולשאול.')),
                }),
                createAccordionItem({
                  title: 'אני עֵד למצב לא נעים — מה עושים?',
                  doc: richText(paragraph('אפשר להעיר בעדינות בזמן אמת, לשאול בפרטיות את מי שנפגע אם הכול בסדר, ולעדכן גורם מוסמך אם זה חוזר.')),
                }),
                createAccordionItem({
                  title: 'למי פונים?',
                  doc: richText(paragraph('החליפו כאן בכתובת הפנייה הארגונית שלכם — ממונה, גורם משאבי אנוש או ערוץ דיווח ייעודי. ציינו ערוץ אחד ברור.')),
                }),
              ],
            },
          }),
          createBlock('quote', {
            settings: { width: 'full', background: 'gradient', spacingTop: 'large', spacingBottom: 'large' },
            content: {
              variant: 'band',
              text: 'סביבה מכבדת נבנית לא ברגעים הגדולים, אלא באלף ההחלטות הקטנות של איך אנחנו מדברים זה עם זה.',
              author: 'סיכום ההדרכה',
              role: '',
            },
          }),
          createBlock('quiz', {
            content: {
              question: 'לפי המבחן שראינו, מה קובע אם התנהגות חצתה גבול?',
              hint: 'לא מה התכוונת — אלא מה קרה.',
              options: [
                createQuizOption({ text: 'ההשפעה על מי שספג אותה, גם אם הכוונה הייתה תמימה', correct: true }),
                createQuizOption({ text: 'רק אם התכוונת לפגוע' }),
                createQuizOption({ text: 'רק אם היו עדים' }),
              ],
              feedbackCorrect: 'נכון. המבחן הוא ההשפעה, לא הכוונה — ולכן ״לא התכוונתי״ אינו פוטר מאחריות לעצור.',
              feedbackIncorrect: 'לא מדויק. הקובע הוא איך ההתנהגות התקבלה, לא מה עמד מאחוריה.',
              shuffle: true,
              allowRetry: true,
              showSolution: true,
              labels: { submit: 'בדיקה', retry: 'ניסיון נוסף', solution: 'הצגת הפתרון' },
            },
          }),
        ],
      }),
    ],
  });

  return { course, assets: [outline] };
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
  {
    id: 'example-cyber',
    name: 'מודעות סייבר',
    description: 'זיהוי פישינג, סיסמאות והרגלים — עם מספרים גדולים ותרחיש אמיתי.',
    create: cyberExample,
  },
  {
    id: 'example-service',
    name: 'שירות לקוחות מצוין',
    description: 'ארבעה צעדים בכל שיחה, כרטיסים ממוספרים ותרחיש התמודדות.',
    create: serviceExample,
  },
  {
    id: 'example-respect',
    name: 'סביבת עבודה מכבדת',
    description: 'מה יוצר אווירה מכבדת, איך מזהים חצייה של גבול, ולמי פונים.',
    create: respectExample,
  },
] as const;
