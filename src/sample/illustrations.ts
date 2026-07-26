import { buildAssetMeta } from '@/persistence/assetNaming';
import type { AssetMeta } from '@/model/types';

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
 * הצבעים הם אותם צבעים של פלטת העורך — כך שהאיור יושב על הקנבס בלי
 * להתנגש בו, וממשיך להיראות סביר גם אחרי החלפת ערכת העיצוב של הלומדה.
 */

const CREAM = '#faf9f6';
const SHELL = '#f2f0ea';
const LINE = '#e5e2da';
const INK = '#2b3a38';
const MUTED = '#7c857f';
const CLAY = '#dc7e5b';
const CLAY_SOFT = '#f3c9a8';
const SAGE = '#7e948a';

export interface TemplateAsset {
  meta: AssetMeta;
  blob: Blob;
}

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
export function courseOutlineIllustration(): TemplateAsset {
  const rows = [
    { y: 96, label: 1, active: true },
    { y: 208, label: 2, active: false },
    { y: 320, label: 3, active: false },
    { y: 432, label: 4, active: false },
  ];

  const body = `
    <rect width="800" height="600" fill="${CREAM}"/>
    <line x1="668" y1="128" x2="668" y2="464" stroke="${LINE}" stroke-width="4" stroke-linecap="round"/>
    ${rows
      .map(
        ({ y, label, active }) => `
      <rect x="96" y="${y}" width="512" height="80" rx="16" fill="${active ? '#ffffff' : SHELL}" stroke="${active ? CLAY_SOFT : LINE}" stroke-width="${active ? 3 : 2}"/>
      <rect x="128" y="${y + 26}" width="${active ? 232 : 180}" height="12" rx="6" fill="${active ? INK : MUTED}" opacity="${active ? 0.9 : 0.45}"/>
      <rect x="128" y="${y + 48}" width="${active ? 320 : 264}" height="8" rx="4" fill="${MUTED}" opacity="0.32"/>
      <circle cx="668" cy="${y + 40}" r="${active ? 18 : 13}" fill="${active ? CLAY : SHELL}" stroke="${active ? CLAY : LINE}" stroke-width="3"/>
      <text x="668" y="${y + 40}" font-family="Heebo, system-ui, sans-serif" font-size="${active ? 20 : 16}" font-weight="700" fill="${active ? '#ffffff' : MUTED}" text-anchor="middle" dominant-baseline="central">${label}</text>`,
      )
      .join('')}
  `;

  return svgAsset('שלד-לומדה.svg', 800, 600, body);
}

/** מסע הלומד: שלוש תחנות על מסלול אחד, האחרונה היא היעד */
export function learnerPathIllustration(): TemplateAsset {
  const stops = [
    { x: 176, y: 424, filled: true },
    { x: 400, y: 300, filled: true },
    { x: 624, y: 176, filled: false },
  ];

  const body = `
    <rect width="800" height="600" fill="${CREAM}"/>
    <path d="M176 424 C 288 424, 288 300, 400 300 S 512 176, 624 176" fill="none" stroke="${LINE}" stroke-width="10" stroke-linecap="round"/>
    <path d="M176 424 C 288 424, 288 300, 400 300" fill="none" stroke="${CLAY_SOFT}" stroke-width="10" stroke-linecap="round"/>
    ${stops
      .map(
        ({ x, y, filled }) => `
      <circle cx="${x}" cy="${y}" r="30" fill="#ffffff" stroke="${filled ? CLAY : LINE}" stroke-width="6"/>
      ${filled ? `<circle cx="${x}" cy="${y}" r="12" fill="${CLAY}"/>` : ''}`,
      )
      .join('')}
    <rect x="600" y="88" width="8" height="72" rx="4" fill="${INK}"/>
    <path d="M608 96 L 692 112 L 608 132 Z" fill="${SAGE}"/>
    <rect x="112" y="480" width="128" height="10" rx="5" fill="${MUTED}" opacity="0.3"/>
    <rect x="336" y="356" width="128" height="10" rx="5" fill="${MUTED}" opacity="0.3"/>
    <rect x="560" y="232" width="128" height="10" rx="5" fill="${MUTED}" opacity="0.3"/>
  `;

  return svgAsset('מסע-הלומד.svg', 800, 600, body);
}

/** עצירה לתרגול: שאלה ושלוש אפשרויות, אחת מסומנת נכונה */
export function practiceStopIllustration(): TemplateAsset {
  const options = [
    { y: 280, correct: true },
    { y: 360, correct: false },
    { y: 440, correct: false },
  ];

  const body = `
    <rect width="800" height="600" fill="${CREAM}"/>
    <rect x="112" y="112" width="576" height="376" rx="28" fill="#ffffff" stroke="${LINE}" stroke-width="3"/>
    <rect x="160" y="168" width="304" height="16" rx="8" fill="${INK}" opacity="0.85"/>
    <rect x="160" y="200" width="208" height="10" rx="5" fill="${MUTED}" opacity="0.4"/>
    ${options
      .map(
        ({ y, correct }) => `
      <rect x="160" y="${y}" width="480" height="56" rx="14" fill="${correct ? '#fbede4' : SHELL}" stroke="${correct ? CLAY : LINE}" stroke-width="${correct ? 3 : 2}"/>
      <circle cx="600" cy="${y + 28}" r="14" fill="${correct ? CLAY : '#ffffff'}" stroke="${correct ? CLAY : LINE}" stroke-width="3"/>
      ${correct ? `<path d="M593 ${y + 28} l 5 6 l 11 -12" fill="none" stroke="#ffffff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      <rect x="192" y="${y + 22}" width="${correct ? 248 : 192}" height="12" rx="6" fill="${correct ? INK : MUTED}" opacity="${correct ? 0.8 : 0.38}"/>`,
      )
      .join('')}
  `;

  return svgAsset('עצירה-לתרגול.svg', 800, 600, body);
}
