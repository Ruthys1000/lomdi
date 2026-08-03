import type { GenerateProgressStage } from '@/ai/generateCourse';

/** אמצע טווח 2–3 דקות — בסיס לבר ההתקדמות (לא מגיע ל־100% עד שהתוצאה מגיעה). */
export const EXPECTED_SECONDS = 150;

export const WAIT_STEPS = [
  { id: 'read', label: 'קוראים ומבינים את התוכן', afterSec: 0 },
  { id: 'structure', label: 'בונים את מבנה הדף', afterSec: 25 },
  { id: 'write', label: 'כותבים תוכן לכל בלוק', afterSec: 55 },
  { id: 'polish', label: 'מלטשים ומסיימים', afterSec: 110 },
] as const;

const STATUS_LINES: ReadonlyArray<{ afterSec: number; text: string }> = [
  { afterSec: 0, text: 'מפצחים את התוכן ומארגנים פרקים…' },
  { afterSec: 20, text: 'בונים את שלד הדף לפי הפורמט…' },
  { afterSec: 45, text: 'כותבים מלל עשיר לכל בלוק…' },
  { afterSec: 80, text: 'מכינים פרומפטים לתמונות…' },
  { afterSec: 120, text: 'עוד רגע — לומדות איכותיות לוקחות זמן…' },
  { afterSec: 180, text: 'כמעט שם — ממשיכים ללטש…' },
];

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** בר התקדמות לפי זמן — מתקרב ל־90% סביב 2.5 דקות, בלי להגיע לסיום. */
export function estimateProgressPercent(elapsedSec: number): number {
  const t = Math.min(1, Math.max(0, elapsedSec) / EXPECTED_SECONDS);
  return Math.round((1 - (1 - t) ** 1.35) * 90);
}

export function statusLineFor(elapsedSec: number, stage: GenerateProgressStage | null): string {
  if (stage === 'retrying') return 'מדייקים את התוצאה — מנסים שוב…';
  let text = STATUS_LINES[0].text;
  for (const line of STATUS_LINES) {
    if (elapsedSec >= line.afterSec) text = line.text;
  }
  return text;
}

export function activeStepIndex(elapsedSec: number): number {
  let index = 0;
  for (let i = 0; i < WAIT_STEPS.length; i += 1) {
    if (elapsedSec >= WAIT_STEPS[i].afterSec) index = i;
  }
  return index;
}
