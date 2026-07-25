import { createAccordionItem } from '@/blocks/accordion/content';
import { createCard } from '@/blocks/cards/content';
import { createQuizOption } from '@/blocks/quiz/content';
import { createBlock, createChapter, createCourse } from '@/model/factory';
import { bulletList, heading, paragraph, richText } from '@/model/richText';
import { getThemePreset } from '@/model/themes';
import type { Course } from '@/model/types';

/**
 * פרויקט הדוגמה (סעיף 21 באפיון).
 *
 * התוכן אמיתי ובעברית מלאה, לא Lorem Ipsum — כדי שכבר בפתיחה הראשונה
 * אפשר יהיה להתרשם מהתוצר, וכדי שבעיות RTL אמיתיות (סימני פיסוק, מספרים
 * בתוך משפט, מירכאות) יתגלו בפיתוח ולא אצל המשתמש.
 *
 * הערה: התמונות בלומדת הדוגמה יתווספו בשלב 6, כשתיבנה שכבת הנכסים.
 * עד אז בלוקי התמונה מציגים מצב ריק מכוון.
 */
export function createSampleCourse(): Course {
  return createCourse({
    title: 'איך בונים הדרכה דיגיטלית אפקטיבית',
    subtitle: 'מדריך קצר למי שבונה לומדות בארגון',
    description:
      'לומדת דוגמה שמדגימה את סוגי הבלוקים במחולל: כותרת, טקסט, כרטיסים, אקורדיון, וידאו ושאלת תרגול.',
    theme: getThemePreset('clean')!.theme,
    chapters: [openingChapter(), principlesChapter(), practiceChapter(), summaryChapter()],
  });
}

// ─────────────────────────── פרק 1 ───────────────────────────

function openingChapter() {
  return createChapter({
    title: 'למה בכלל הדרכה דיגיטלית',
    description: 'מה מייחד למידה דיגיטלית טובה מקובץ מצגת שנשלח במייל',
    blocks: [
      createBlock('hero', {
        content: {
          title: 'איך בונים הדרכה דיגיטלית אפקטיבית',
          subtitle: 'מדריך קצר למי שבונה לומדות בארגון',
          intro: 'כשמונה דקות קריאה',
          backgroundType: 'gradient',
          backgroundColor: '#2563eb',
          gradientFrom: '#1d4ed8',
          gradientTo: '#7c3aed',
          imageAssetId: '',
          overlayOpacity: 0.45,
          height: 'tall',
          alignment: 'center',
          fullBleed: true,
          button: { enabled: true, label: 'מתחילים', href: '#', newTab: false },
        },
      }),

      createBlock('richText', {
        content: {
          maxWidth: 'normal',
          doc: richText(
            paragraph(
              'רוב ההדרכות הארגוניות נכשלות לא בגלל התוכן, אלא בגלל הצורה. מצגת בת 60 שקופיות שנשלחת במייל אינה הדרכה — היא ארכיון. הדרכה דיגיטלית טובה מובילה את הלומד בקצב שלו, עוצרת אותו במקומות הנכונים, ומבקשת ממנו לעשות משהו ולא רק לקרוא.',
            ),
            heading(2, 'שלושה דברים שמבדילים לומדה טובה'),
            paragraph(
              'ההבדל בין לומדה שנזכרים ממנה למשהו לבין לומדה שנלחצת בה "הבא" עד הסוף נמצא כמעט תמיד בשלושה מקומות:',
            ),
            bulletList([
              'מטרה אחת ברורה לכל פרק, ולא רשימת נושאים.',
              'עצירות לתרגול לפני שהלומד שוכח מה קרא.',
              'שפה אנושית שמדברת אל הלומד ולא אל הרגולטור.',
            ]),
          ),
        },
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
              title: 'מטרה לפני תוכן',
              text: 'לפני שכותבים שקופית אחת, נסחו מה הלומד יידע לעשות בסוף. אם אי אפשר לנסח זאת במשפט — הפרק עוד לא מוכן.',
            }),
            createCard({
              icon: 'Scissors',
              title: 'פחות זה יותר',
              text: 'כל פסקה שלא משרתת את המטרה מורידה את הסיכוי שיגיעו לסוף. מחקו בלי רחמים, ותנו את השאר כקישור לעיון.',
            }),
            createCard({
              icon: 'MessageCircleQuestion',
              title: 'תרגול בזמן אמת',
              text: 'שאלה קצרה אחרי כל רעיון מרכזי מקבעת אותו הרבה יותר מסיכום בסוף הלומדה.',
            }),
          ],
        },
      }),
    ],
  });
}

// ─────────────────────────── פרק 2 ───────────────────────────

function principlesChapter() {
  return createChapter({
    title: 'עקרונות בנייה',
    description: 'איך מארגנים את התוכן כך שיהיה אפשר ללמוד ממנו',
    blocks: [
      createBlock('textImage', {
        content: {
          layout: 'imageEnd',
          ratio: '50-50',
          verticalAlign: 'center',
          aspectRatio: '4:3',
          roundness: 'medium',
          imageAssetId: '',
          alt: 'שרטוט של מבנה לומדה מחולק לפרקים',
          caption: 'מבנה של לומדה בת ארבעה פרקים',
          button: { enabled: false, label: 'קראו עוד', href: '', newTab: true },
          doc: richText(
            heading(2, 'בנו את השלד לפני התוכן'),
            paragraph(
              'הטעות הנפוצה היא להתחיל לכתוב ורק אחר כך לחשוב על החלוקה. התוצאה היא פרק ראשון ארוך מאוד ושלושה פרקים קצרים בסוף.',
            ),
            paragraph(
              'התחילו הפוך: כתבו את שמות הפרקים, ולצד כל אחד משפט אחד שמתאר מה הלומד ידע בסופו. רק כשהשלד הגיוני — מלאו אותו.',
            ),
          ),
        },
      }),

      createBlock('divider', {
        content: { style: 'line', icon: 'Sparkle', height: 'medium', lineWidth: 'half' },
      }),

      createBlock('richText', {
        content: {
          maxWidth: 'normal',
          doc: richText(
            heading(2, 'כמה זמן צריך לקחת פרק'),
            paragraph(
              'הכלל המעשי: פרק שדורש יותר משבע דקות רצופות הוא כנראה שני פרקים. חלוקה קצרה יותר גם משפרת את היכולת לחזור לנקודה מסוימת בהמשך.',
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
              title: 'כמה טקסט זה יותר מדי במסך אחד?',
              doc: richText(
                paragraph(
                  'אם הלומד צריך לגלול יותר משני מסכים כדי לסיים רעיון אחד — פצלו. עדיף שני בלוקים קצרים עם כותרת ביניים מאשר בלוק אחד ארוך.',
                ),
              ),
            }),
            createAccordionItem({
              title: 'האם חייבים וידאו בכל לומדה?',
              doc: richText(
                paragraph(
                  'לא. וידאו עוזר כשצריך להראות תהליך או ממשק. לתוכן שהוא בעיקרו הגדרות ונהלים, טקסט מובנה עם דוגמאות עדיף — אפשר לסרוק אותו, לחפש בו ולחזור אליו.',
                ),
              ),
            }),
            createAccordionItem({
              title: 'איך יודעים שהלומדה עובדת?',
              doc: richText(
                paragraph(
                  'הריצו אותה מול שלושה אנשים מקהל היעד לפני ההפצה, ובקשו מהם לחשוב בקול רם. שלוש בדיקות כאלה מגלות יותר מסקר שביעות רצון של מאתיים משיבים.',
                ),
              ),
            }),
          ],
        },
      }),
    ],
  });
}

// ─────────────────────────── פרק 3 ───────────────────────────

function practiceChapter() {
  return createChapter({
    title: 'תרגול ובדיקה',
    description: 'איך בודקים שהמסר עבר',
    blocks: [
      createBlock('richText', {
        content: {
          maxWidth: 'normal',
          doc: richText(
            heading(2, 'שאלה טובה מלמדת, לא רק בודקת'),
            paragraph(
              'שאלת תרגול אינה מבחן. תפקידה לגרום ללומד לעצור ולשלוף את מה שקרא. לכן המשוב חשוב לא פחות מהשאלה: גם תשובה שגויה צריכה להסביר למה, ולא רק לסמן איקס אדום.',
            ),
          ),
        },
      }),

      createBlock('video', {
        content: {
          source: 'youtube',
          // ריק בכוונה: לומדת דוגמה לא צריכה לגרור תלות בסרטון של מישהו
          // אחר. הדבקת קישור בפאנל ההגדרות תציג נגן מיד.
          url: '',
          assetId: '',
          posterAssetId: '',
          caption: 'הדביקו קישור לסרטון בפאנל ההגדרות כדי לראות נגן כאן',
          aspectRatio: '16:9',
          roundness: 'medium',
          autoplay: false,
          controls: true,
          loop: false,
          muted: false,
        },
      }),

      createBlock('quiz', {
        content: {
          question: 'מתי כדאי למקם שאלת תרגול בלומדה?',
          hint: '',
          options: [
            createQuizOption({
              text: 'מיד אחרי כל רעיון מרכזי, בזמן שהוא עדיין טרי',
              correct: true,
            }),
            createQuizOption({ text: 'רק בסוף הלומדה, כמבחן מסכם' }),
            createQuizOption({ text: 'לפני התוכן, כדי לבדוק ידע קודם' }),
            createQuizOption({ text: 'עדיף בלי שאלות — הן מאריכות את הלומדה' }),
          ],
          feedbackCorrect:
            'בדיוק. שליפה סמוכה לקריאה מחזקת את הזיכרון הרבה יותר ממבחן מרוכז בסוף.',
          feedbackIncorrect:
            'לא מדויק. מבחן מסכם בודק מה נשאר, אבל שאלה סמוכה לתוכן היא זו שגורמת לו להישאר.',
          shuffle: true,
          allowRetry: true,
          showSolution: true,
          labels: { submit: 'בדיקה', retry: 'ניסיון נוסף', solution: 'הצגת הפתרון' },
        },
      }),
    ],
  });
}

// ─────────────────────────── פרק 4 ───────────────────────────

function summaryChapter() {
  return createChapter({
    title: 'סיכום',
    description: 'מה לוקחים מכאן',
    blocks: [
      createBlock('richText', {
        content: {
          maxWidth: 'normal',
          doc: richText(
            heading(2, 'ארבעה דברים שכדאי לזכור'),
            bulletList([
              'התחילו מהמטרה, לא מהתוכן הקיים.',
              'פרק אחד — רעיון אחד.',
              'תרגלו סמוך לתוכן, לא רק בסוף.',
              'בדקו מול שלושה לומדים אמיתיים לפני ההפצה.',
            ]),
            paragraph(
              'הלומדה הזו נבנתה במחולל עצמו, וניתן לערוך אותה: החליפו טקסטים, הוסיפו בלוקים, שנו את ערכת העיצוב ואז ייצאו אותה כקובץ HTML עצמאי.',
            ),
          ),
        },
      }),

      createBlock('cards', {
        content: {
          columns: 2,
          media: 'icon',
          roundness: 'medium',
          textAlign: 'start',
          items: [
            createCard({
              icon: 'ClipboardList',
              title: 'לפני שמתחילים לכתוב',
              text: 'נסחו את מטרת הפרק במשפט אחד. אם זה לא מצליח — הפרק עוד לא בשל.',
              button: { enabled: false, label: '', href: '', newTab: true },
            }),
            createCard({
              icon: 'Users',
              title: 'לפני שמפיצים',
              text: 'הריצו את הלומדה מול שלושה אנשים מקהל היעד ובקשו מהם לחשוב בקול רם.',
              button: { enabled: false, label: '', href: '', newTab: true },
            }),
          ],
        },
      }),

      createBlock('divider', {
        content: { style: 'gradient', icon: 'Sparkle', height: 'large', lineWidth: 'full' },
      }),
    ],
  });
}
