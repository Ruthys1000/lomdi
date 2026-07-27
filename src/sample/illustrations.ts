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

/** מסע הלומד: שלוש תחנות על מסלול אחד, האחרונה היא היעד */
export function learnerPathIllustration(c: Palette): TemplateAsset {
  const stops = [
    { x: 176, y: 424, filled: true },
    { x: 400, y: 300, filled: true },
    { x: 624, y: 176, filled: false },
  ];

  const body = `
    <rect width="800" height="600" fill="${c.background}"/>
    <path d="M176 424 C 288 424, 288 300, 400 300 S 512 176, 624 176" fill="none" stroke="${c.border}" stroke-width="10" stroke-linecap="round"/>
    <path d="M176 424 C 288 424, 288 300, 400 300" fill="none" stroke="${c.primary}" stroke-width="10" stroke-linecap="round" opacity="0.45"/>
    ${stops
      .map(
        ({ x, y, filled }) => `
      <circle cx="${x}" cy="${y}" r="30" fill="${c.background}" stroke="${filled ? c.primary : c.border}" stroke-width="6"/>
      ${filled ? `<circle cx="${x}" cy="${y}" r="12" fill="${c.primary}"/>` : ''}`,
      )
      .join('')}
    <rect x="600" y="88" width="8" height="72" rx="4" fill="${c.text}"/>
    <path d="M608 96 L 692 112 L 608 132 Z" fill="${c.accent}"/>
    <rect x="112" y="480" width="128" height="10" rx="5" fill="${c.textMuted}" opacity="0.3"/>
    <rect x="336" y="356" width="128" height="10" rx="5" fill="${c.textMuted}" opacity="0.3"/>
    <rect x="560" y="232" width="128" height="10" rx="5" fill="${c.textMuted}" opacity="0.3"/>
  `;

  return svgAsset('מסע-הלומד.svg', 800, 600, body);
}

/**
 * defs של גרדיאנט מותג (primary→accent) לשימוש בתוך איור.
 * המזהה מקומי ל-SVG הזה (מוגש כ-`<img>`, מסמך מבודד), ולכן אין התנגשות
 * בין איורים שונים באותו עמוד.
 */
function brandGradient(id: string, c: Palette): string {
  return `<defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.primary}"/>
      <stop offset="1" stop-color="${c.accent}"/>
    </linearGradient>
  </defs>`;
}

/** קבלת פנים: פאנל גרדיאנט, אווטרים חופפים, תג ברוך-הבא וקונפטי עדין */
export function welcomeIllustration(c: Palette): TemplateAsset {
  const avatars = [
    { x: 300, y: 300, r: 64, fill: c.primary },
    { x: 400, y: 300, r: 64, fill: c.accent },
    { x: 500, y: 300, r: 64, fill: c.secondary },
  ];
  const confetti = [
    { x: 150, y: 140, fill: c.accent },
    { x: 660, y: 160, fill: c.primary },
    { x: 120, y: 420, fill: c.secondary },
    { x: 690, y: 440, fill: c.accent },
    { x: 240, y: 500, fill: c.primary },
  ];

  const body = `
    ${brandGradient('g-welcome', c)}
    <rect width="800" height="600" fill="${c.surface}"/>
    <rect x="96" y="120" width="608" height="360" rx="40" fill="url(#g-welcome)" opacity="0.14"/>
    ${confetti
      .map(({ x, y, fill }) => `<rect x="${x}" y="${y}" width="18" height="18" rx="5" fill="${fill}" opacity="0.5" transform="rotate(20 ${x} ${y})"/>`)
      .join('')}
    ${avatars
      .map(
        ({ x, y, r, fill }) => `
      <circle cx="${x}" cy="${y}" r="${r}" fill="${c.background}"/>
      <circle cx="${x}" cy="${y}" r="${r - 8}" fill="${fill}"/>
      <circle cx="${x}" cy="${y - 18}" r="20" fill="${c.background}" opacity="0.92"/>
      <path d="M${x - 30} ${y + 40} a30 30 0 0 1 60 0 Z" fill="${c.background}" opacity="0.92"/>`,
      )
      .join('')}
    <circle cx="560" cy="240" r="40" fill="url(#g-welcome)"/>
    <path d="M544 240 l 10 12 l 22 -24" fill="none" stroke="${c.background}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="300" y="404" width="200" height="16" rx="8" fill="${c.text}" opacity="0.8"/>
    <rect x="336" y="436" width="128" height="10" rx="5" fill="${c.textMuted}" opacity="0.4"/>
  `;

  return svgAsset('קבלת-פנים.svg', 800, 600, body);
}

/** מוקאפ מוצר: חלון אפליקציה עם סרגל צד, כרטיסים וגרף עמודות בגרדיאנט */
export function featureMockupIllustration(c: Palette): TemplateAsset {
  const bars = [
    { x: 470, h: 70 },
    { x: 520, h: 120 },
    { x: 570, h: 96 },
    { x: 620, h: 150 },
  ];

  const body = `
    ${brandGradient('g-feature', c)}
    <rect width="800" height="600" fill="${c.surface}"/>
    <rect x="96" y="112" width="608" height="376" rx="24" fill="${c.background}" stroke="${c.border}" stroke-width="3"/>
    <rect x="96" y="112" width="608" height="56" rx="24" fill="url(#g-feature)"/>
    <rect x="96" y="150" width="608" height="18" fill="url(#g-feature)"/>
    <circle cx="128" cy="140" r="7" fill="${c.background}" opacity="0.9"/>
    <circle cx="150" cy="140" r="7" fill="${c.background}" opacity="0.7"/>
    <circle cx="172" cy="140" r="7" fill="${c.background}" opacity="0.5"/>
    <rect x="120" y="192" width="140" height="272" rx="16" fill="${c.surface}"/>
    ${[0, 1, 2, 3]
      .map((i) => `<rect x="140" y="${216 + i * 44}" width="${i === 0 ? 100 : 84}" height="12" rx="6" fill="${i === 0 ? c.primary : c.textMuted}" opacity="${i === 0 ? 0.9 : 0.4}"/>`)
      .join('')}
    <rect x="288" y="192" width="180" height="110" rx="16" fill="${c.surface}"/>
    <rect x="312" y="222" width="90" height="12" rx="6" fill="${c.text}" opacity="0.75"/>
    <rect x="312" y="250" width="132" height="10" rx="5" fill="${c.textMuted}" opacity="0.4"/>
    <rect x="312" y="270" width="112" height="10" rx="5" fill="${c.textMuted}" opacity="0.35"/>
    <rect x="450" y="322" width="222" height="142" rx="16" fill="${c.surface}"/>
    ${bars
      .map(({ x, h }) => `<rect x="${x}" y="${440 - h}" width="30" height="${h}" rx="8" fill="url(#g-feature)"/>`)
      .join('')}
    <rect x="490" y="192" width="182" height="110" rx="16" fill="url(#g-feature)" opacity="0.12"/>
    <text x="581" y="238" font-family="Heebo, system-ui, sans-serif" font-size="40" font-weight="800" fill="${c.primary}" text-anchor="middle">+48%</text>
    <rect x="521" y="258" width="120" height="10" rx="5" fill="${c.textMuted}" opacity="0.45"/>
  `;

  return svgAsset('מוקאפ-מוצר.svg', 800, 600, body);
}

/** בטיחות/ציות: מגן בגרדיאנט וצ'קליסט עם סימוני וי */
export function safetyChecklistIllustration(c: Palette): TemplateAsset {
  const rows = [
    { y: 210, done: true },
    { y: 274, done: true },
    { y: 338, done: true },
    { y: 402, done: false },
  ];

  const body = `
    ${brandGradient('g-safety', c)}
    <rect width="800" height="600" fill="${c.surface}"/>
    <path d="M232 120 l 120 -40 l 120 40 v 150 c 0 90 -60 150 -120 190 c -60 -40 -120 -100 -120 -190 Z"
      fill="url(#g-safety)" opacity="0.16"/>
    <rect x="392" y="150" width="304" height="330" rx="24" fill="${c.background}" stroke="${c.border}" stroke-width="3"/>
    ${rows
      .map(
        ({ y, done }) => `
      <circle cx="432" cy="${y}" r="16" fill="${done ? 'url(#g-safety)' : c.background}" stroke="${done ? 'none' : c.border}" stroke-width="3"/>
      ${done ? `<path d="M424 ${y} l 6 7 l 12 -14" fill="none" stroke="${c.background}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
      <rect x="464" y="${y - 6}" width="${done ? 180 : 140}" height="12" rx="6" fill="${done ? c.text : c.textMuted}" opacity="${done ? 0.8 : 0.4}"/>`,
      )
      .join('')}
    <path d="M232 120 l 120 -40 l 120 40 v 150 c 0 90 -60 150 -120 190 c -60 -40 -120 -100 -120 -190 Z"
      fill="none" stroke="url(#g-safety)" stroke-width="6"/>
    <path d="M300 250 l 34 38 l 66 -78" fill="none" stroke="url(#g-safety)" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  `;

  return svgAsset('בטיחות-צ׳קליסט.svg', 800, 600, body);
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
