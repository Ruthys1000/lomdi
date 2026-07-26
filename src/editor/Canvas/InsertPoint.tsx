import { Plus } from 'lucide-react';

/**
 * נקודת הוספה בין בלוקים.
 *
 * הקו מופיע רק בריחוף כדי לא להפוך את הקנבס לרשת של קווים, אבל הכפתור
 * עצמו נשאר בעץ הנגישות תמיד — כך שניווט במקלדת מגיע אליו גם בלי עכבר.
 */
export function InsertPoint({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <div className="group/insert relative h-0">
      {/* top-0.5 ולא -top-3: נקודת ההוספה חיה במרזב של הבלוק שאחריה, יחד
          עם התווית וסרגל הפעולות, ולא נתלית מעל הבלוק שלפניה */}
      <div className="absolute inset-x-0 top-0.5 flex h-6 items-center justify-center opacity-0 transition focus-within:opacity-100 hover:opacity-100 group-hover/insert:opacity-100">
        <span className="absolute inset-x-6 h-px bg-clay-300" aria-hidden />
        <button
          type="button"
          onClick={onClick}
          aria-label={label}
          title={label}
          className="relative z-10 flex size-6 items-center justify-center rounded-full bg-clay-600 text-white shadow-sm transition hover:bg-clay-700"
        >
          <Plus className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
