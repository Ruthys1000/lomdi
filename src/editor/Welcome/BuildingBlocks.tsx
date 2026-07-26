import {
  ChevronsDownUp,
  Columns3,
  Heading1,
  HelpCircle,
  Image,
  Images,
  Minus,
  Text,
  Video,
} from 'lucide-react';
import { blockLabels } from '@/blocks/labels';

/**
 * "אבני הבניין של הלומדה" — בנטו של 9 סוגי הבלוקים (סעיף מסך הפתיחה).
 *
 * מוצג למבקר חדש, כדי לענות על "יש בזה מספיק בשר?". השמות נשלפים מ-
 * `blockLabels` כדי לא לסטות מהעורך. הסדר והגדלים מכוונים כך שהרשת נסגרת
 * ל-3 שורות מלאות (12 תאים) בלי חורים: שני האריחים הגבוהים באים מוקדם.
 */

const ICONS = {
  hero: Heading1,
  richText: Text,
  image: Image,
  textImage: Images,
  cards: Columns3,
  accordion: ChevronsDownUp,
  video: Video,
  quiz: HelpCircle,
  divider: Minus,
} as const;

const TILE =
  'relative flex flex-col justify-between overflow-hidden rounded-[18px] border border-edge bg-panel p-4 transition hover:-translate-y-[3px] hover:border-volt-dim hover:shadow-[0_18px_34px_-22px_rgba(20,24,29,0.35)]';

function Ico({ type }: { type: keyof typeof ICONS }) {
  const Icon = ICONS[type];
  return (
    <span className="flex size-[38px] items-center justify-center rounded-xl bg-volt-soft text-volt-ink">
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

export function BuildingBlocks() {
  return (
    <section className="border-y border-edge bg-panel" aria-labelledby="blocks-heading">
      <div className="mx-auto max-w-5xl px-6 py-14">
        <p className="text-xs font-bold tracking-[0.08em] text-fg-muted uppercase">תשעה בלוקים</p>
        <h2 id="blocks-heading" className="mt-2 text-2xl font-extrabold tracking-tight text-fg md:text-3xl">
          אבני הבניין של הלומדה
        </h2>

        <div className="mt-8 grid auto-rows-auto grid-cols-1 gap-3.5 min-[520px]:grid-cols-2 md:auto-rows-[132px] md:grid-cols-4 md:[grid-auto-flow:row_dense]">
          {/* כותרת ראשית — רחב */}
          <div className={`${TILE} min-[520px]:col-span-2`}>
            <Ico type="hero" />
            <div>
              <div className="font-extrabold">{blockLabels.hero}</div>
              <div className="text-[13px] text-fg-muted">פתיח שמסביר על מה הלומדה</div>
            </div>
          </div>

          {/* טקסט — גבוה, עם תצוגה */}
          <div className={`${TILE} md:row-span-2`}>
            <Ico type="richText" />
            <div>
              <div className="font-extrabold">{blockLabels.richText}</div>
              <div className="text-[13px] text-fg-muted">כותרות, רשימות, הדגשות</div>
              <div className="mt-3 flex flex-col gap-1.5">
                <span className="h-2 rounded bg-edge-strong" />
                <span className="h-2 rounded bg-edge-strong" />
                <span className="h-2 w-3/5 rounded bg-edge-strong opacity-60" />
              </div>
            </div>
          </div>

          {/* שאלת בחירה — גבוה, עם תצוגה */}
          <div className={`${TILE} md:row-span-2`}>
            <Ico type="quiz" />
            <div>
              <div className="font-extrabold">{blockLabels.quiz}</div>
              <div className="text-[13px] text-fg-muted">בודקים שהחומר נקלט</div>
              <div className="mt-3 rounded-[10px] border border-edge bg-field p-2.5">
                <div className="flex items-center gap-2 text-xs text-fg-soft">
                  <span className="size-3 rounded-full border-2 border-volt-dim bg-volt" />
                  תשובה נכונה
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-xs text-fg-soft">
                  <span className="size-3 rounded-full border-2 border-edge-strong" />
                  מסיח
                </div>
              </div>
            </div>
          </div>

          {/* תמונה */}
          <div className={TILE}>
            <Ico type="image" />
            <div className="font-extrabold">{blockLabels.image}</div>
          </div>

          {/* טקסט ותמונה */}
          <div className={TILE}>
            <Ico type="textImage" />
            <div className="font-extrabold">{blockLabels.textImage}</div>
          </div>

          {/* כרטיסים */}
          <div className={TILE}>
            <Ico type="cards" />
            <div className="font-extrabold">{blockLabels.cards}</div>
          </div>

          {/* אקורדיון */}
          <div className={TILE}>
            <Ico type="accordion" />
            <div className="font-extrabold">{blockLabels.accordion}</div>
          </div>

          {/* וידאו */}
          <div className={TILE}>
            <Ico type="video" />
            <div className="font-extrabold">{blockLabels.video}</div>
          </div>

          {/* מפריד — מוטיב קו-ונקודה כדי שלא יהיה אריח ריק */}
          <div className={TILE}>
            <Ico type="divider" />
            <div>
              <div className="font-extrabold">{blockLabels.divider}</div>
              <div className="relative mt-3 h-0.5 rounded bg-edge-strong">
                <span className="absolute left-1/2 top-1/2 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-volt-dim" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
