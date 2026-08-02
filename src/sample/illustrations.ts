import { buildAssetMeta } from '@/persistence/assetNaming';
import type { AssetMeta, Theme } from '@/model/types';

/**
 * האיורים של התבניות.
 *
 * **למה SVG שנבנה בקוד ולא קובץ בריפו.** תבנית שמגיעה עם תמונות הייתה
 * מחייבת לשמור בינאריים בגיט, לטעון אותם ברשת בזמן יצירת לומדה, ולשבור
 * את ההבטחה שהכלי עובד גם בלי אינטרנט. מחרוזת SVG נבנית בזיכרון, נארזת
 * ל-Blob ונכנסת לספריית הנכסים כמו כל תמונה שהמשתמש העלה — כולל ייצוא
 * ל-ZIP, החלפה ומחיקה.
 *
 * **למה מזהה חדש בכל קריאה.** חנות הנכסים ב-IndexedDB ממופתחת ב-`meta.id`
 * בלבד (`db.ts`), ולא בצירוף של פרויקט ונכס. מזהה קבוע היה גורם ללומדה
 * שנייה שנוצרה מאותה תבנית לדרוס את האיור של הראשונה.
 *
 * **למה הצבעים מגיעים מבחוץ.** האיור יושב בתוך הלומדה, לא בתוך הכלי, ולכן
 * הוא צריך להתאים לערכת העיצוב של הלומדה — ולא לפלטת העורך. צבעים קשיחים
 * היו הופכים לכתם ברגע שמישהו מחליף ערכה, וזה בדיוק מה שפאנל העיצוב
 * מזמין לעשות.
 */

export interface TemplateAsset {
  meta: AssetMeta;
  blob: Blob;
}

type Palette = Theme['colors'];

function svgAsset(originalName: string, width: number, height: number, body: string): TemplateAsset {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">${body}</svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });

  return {
    meta: buildAssetMeta({
      originalName,
      mimeType: 'image/svg+xml',
      size: blob.size,
      width,
      height,
    }),
    blob,
  };
}

/** שלד של לומדה: פרקים מוערמים על ציר אחד, הראשון פעיל */
export function courseOutlineIllustration(c: Palette): TemplateAsset {
  const rows = [
    { y: 96, label: 1, active: true },
    { y: 208, label: 2, active: false },
    { y: 320, label: 3, active: false },
    { y: 432, label: 4, active: false },
  ];

  const body = `
    <rect width="800" height="600" fill="${c.background}"/>
    <line x1="668" y1="128" x2="668" y2="464" stroke="${c.border}" stroke-width="4" stroke-linecap="round"/>
    ${rows
      .map(
        ({ y, label, active }) => `
      <rect x="96" y="${y}" width="512" height="80" rx="16" fill="${active ? c.background : c.surface}" stroke="${active ? c.primary : c.border}" stroke-width="${active ? 3 : 2}"/>
      <rect x="128" y="${y + 26}" width="${active ? 232 : 180}" height="12" rx="6" fill="${active ? c.text : c.textMuted}" opacity="${active ? 0.9 : 0.45}"/>
      <rect x="128" y="${y + 48}" width="${active ? 320 : 264}" height="8" rx="4" fill="${c.textMuted}" opacity="0.32"/>
      <circle cx="668" cy="${y + 40}" r="${active ? 18 : 13}" fill="${active ? c.primary : c.surface}" stroke="${active ? c.primary : c.border}" stroke-width="3"/>
      <text x="668" y="${y + 40}" font-family="Heebo, system-ui, sans-serif" font-size="${active ? 20 : 16}" font-weight="700" fill="${active ? c.background : c.textMuted}" text-anchor="middle" dominant-baseline="central">${label}</text>`,
      )
      .join('')}
  `;

  return svgAsset('שלד-לומדה.svg', 800, 600, body);
}

/** עצירה לתרגול: שאלה ושלוש אפשרויות, אחת מסומנת נכונה */
export function practiceStopIllustration(c: Palette): TemplateAsset {
  const options = [
    { y: 280, correct: true },
    { y: 360, correct: false },
    { y: 440, correct: false },
  ];

  const body = `
    <rect width="800" height="600" fill="${c.background}"/>
    <rect x="112" y="112" width="576" height="376" rx="28" fill="${c.background}" stroke="${c.border}" stroke-width="3"/>
    <rect x="160" y="168" width="304" height="16" rx="8" fill="${c.text}" opacity="0.85"/>
    <rect x="160" y="200" width="208" height="10" rx="5" fill="${c.textMuted}" opacity="0.4"/>
    ${options
      .map(
        ({ y, correct }) => `
      <rect x="160" y="${y}" width="480" height="56" rx="14" fill="${c.surface}" stroke="${correct ? c.primary : c.border}" stroke-width="${correct ? 3 : 2}"/>
      <circle cx="600" cy="${y + 28}" r="14" fill="${correct ? c.primary : c.background}" stroke="${correct ? c.primary : c.border}" stroke-width="3"/>
      ${correct ? `<path d="M593 ${y + 28} l 5 6 l 11 -12" fill="none" stroke="${c.background}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      <rect x="192" y="${y + 22}" width="${correct ? 248 : 192}" height="12" rx="6" fill="${correct ? c.text : c.textMuted}" opacity="${correct ? 0.8 : 0.38}"/>`,
      )
      .join('')}
  `;

  return svgAsset('עצירה-לתרגול.svg', 800, 600, body);
}
