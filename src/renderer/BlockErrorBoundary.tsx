import { Component, type ErrorInfo, type ReactNode } from 'react';
import { blockLabel } from '@/blocks/labels';

/**
 * גבול שגיאה סביב רינדור של בלוק בודד.
 *
 * BlockRenderer כבר מטפל בבלוק *לא מוכר* — סוג שאין לו רנדרר. גבול השגיאה
 * מכסה את המקרה השני: בלוק *מוכר* שהרנדרר שלו זורק חריגה בזמן ריצה (תוכן
 * קצה שעבר את הסכמה, נכס לא צפוי). בלי גבול, חריגה כזו מפילה את כל עץ
 * ה-React — כלומר בתוצר שרץ מ-`file://`, בלי dev-tools, הלומד מקבל מסך לבן
 * ואין דרך התאוששות.
 *
 * שתי התנהגויות, אותה פילוסופיה שכבר קיימת ב-BlockRenderer ("עדיף לומדה
 * חסרת בלוק אחד על פני לומדה שבורה"):
 *
 * - בתוצר (`isEditing=false`) הבלוק הבעייתי מדולג בשקט. שאר הלומדה נשארת
 *   שלמה ונקראת.
 * - בעורך (`isEditing=true`) מוצגת הודעה במקום הבלוק, כדי שהעורך יראה
 *   שמשהו נשבר ויוכל למחוק או לתקן — במקום מסך לבן שמסתיר את הסיבה.
 *
 * הגבול חייב להיות class component: אין hook שתופס שגיאות רינדור. הוא חי
 * ב-renderer/ ומייבא רק את React ואת התוויות (אפס תלויות), ולכן אינו מפר
 * את גבול ה-Renderer ואינו נכנס לחבילת הלומדה כמשקל מיותר.
 */
interface BlockErrorBoundaryProps {
  blockType: string;
  isEditing: boolean;
  children: ReactNode;
}

interface BlockErrorBoundaryState {
  error: Error | null;
}

export class BlockErrorBoundary extends Component<
  BlockErrorBoundaryProps,
  BlockErrorBoundaryState
> {
  state: BlockErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BlockErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // לוג לקונסול בלבד — שימושי בעורך ובפיתוח, ואינו נראה ללומד
    console.error(`רינדור הבלוק "${this.props.blockType}" נכשל:`, error, info);
  }

  // בלוק אחר עשוי לרנדר תקין אחרי שהקודם נכשל; איפוס לפי מפתח ה-block נעשה
  // ב-BlockRenderer דרך prop key, כך שכל בלוק מקבל גבול משלו

  render() {
    if (this.state.error) {
      if (!this.props.isEditing) return null;

      return (
        <div className="lc-block-error" role="note">
          הצגת הבלוק <strong>{blockLabel(this.props.blockType)}</strong> נכשלה.
          בדקו את תוכן הבלוק או מחקו אותו. בתוצר המיוצא הבלוק יידלג ושאר הלומדה
          תוצג כרגיל.
        </div>
      );
    }

    return this.props.children;
  }
}
