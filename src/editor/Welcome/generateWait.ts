import type { GenerateProgressStage } from '@/ai/generateCourse';

/** אמצע טווח ~1–2 דקות — בסיס לבר ההתקדמות (לא מגיע ל־100% עד שהתוצאה מגיעה). */
export const EXPECTED_SECONDS = 90;

export const WAIT_STEPS = [
  { id: 'read', label: 'קוראים ומבינים את התוכן', afterSec: 0 },
  { id: 'structure', label: 'בונים את מבנה הדף', afterSec: 15 },
  { id: 'write', label: 'כותבים תוכן לכל בלוק', afterSec: 35 },
  { id: 'polish', label: 'מלטשים ומסיימים', afterSec: 65 },
] as const;

const STATUS_LINES: ReadonlyArray<{ afterSec: number; text: string }> = [
  { afterSec: 0, text: 'מפצחים את התוכן ומארגנים פרקים…' },
  { afterSec: 12, text: 'בונים את שלד הדף לפי הפורמט…' },
  { afterSec: 28, text: 'כותבים מלל עשיר לכל בלוק…' },
  { afterSec: 50, text: 'מכינים פרומפטים לתמונות…' },
  { afterSec: 75, text: 'עוד רגע — מלטשים את התוצאה…' },
  { afterSec: 120, text: 'כמעט שם — ממשיכים ללטש…' },
];

export function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** בר התקדמות לפי זמן — מתקרב ל־90% סביב ~1.5 דקות, בלי להגיע לסיום. */
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
