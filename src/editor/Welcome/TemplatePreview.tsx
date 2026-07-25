import type { Course, Theme } from '@/model/types';

/**
 * סקיצה מוקטנת של תבנית.
 *
 * מרנדרת את **המבנה האמיתי** של הפרק הראשון — הירו אם יש, שורות טקסט,
 * שורת כרטיסים, מפריד — בצבעי הערכה של אותה תבנית. כך שלושת כרטיסי
 * הבחירה במסך הפתיחה מפסיקים להיראות זהים, ומי שבוחר "לומדה ריקה" רואה
 * שהיא באמת ריקה לפני שהוא לוחץ.
 *
 * **לא `CourseRenderer`.** רינדור לומדה מלאה בגובה 96 פיקסלים הוא עותק
 * שלם של כל בלוק בעמוד, כולל אקורדיונים ושאלות, בשביל תמונה שאי אפשר
 * לקרוא בה מילה. כאן כמה `span` בצבעי הערכה.
 */

/** כמה שורות סקיצה כל סוג בלוק שווה. סוג שאינו ברשימה מצויר כשורת טקסט */
type SketchRow = 'hero' | 'text' | 'cards' | 'divider' | 'media';

const ROW_BY_TYPE: Record<string, SketchRow> = {
  hero: 'hero',
  richText: 'text',
  cards: 'cards',
  accordion: 'cards',
  quiz: 'cards',
  divider: 'divider',
  image: 'media',
  textImage: 'media',
  video: 'media',
};

function sketchRows(course: Course): SketchRow[] {
  const blocks = course.chapters.flatMap((chapter) => chapter.blocks);
  return blocks.slice(0, 4).map((block) => ROW_BY_TYPE[block.type] ?? 'text');
}

export function TemplatePreview({ course }: { course: Course }) {
  const { colors, shape } = course.theme;
  const radius = `${Math.round(shape.radius * 0.35)}px`;
  const rows = sketchRows(course);

  return (
    <span
      aria-hidden
      className="flex h-24 w-full flex-col gap-1.5 overflow-hidden p-2"
      style={{ background: colors.background }}
    >
      {rows.length === 0 && (
        <span
          className="flex flex-1 items-center justify-center"
          style={{
            borderRadius: radius,
            boxShadow: `inset 0 0 0 1px ${colors.border}`,
            color: colors.textMuted,
          }}
        >
          <span className="text-[10px]">פרק ריק</span>
        </span>
      )}

      {rows.map((row, index) => (
        <SketchRowView key={index} row={row} colors={colors} radius={radius} />
      ))}
    </span>
  );
}

function SketchRowView({
  row,
  colors,
  radius,
}: {
  row: SketchRow;
  colors: Theme['colors'];
  radius: string;
}) {
  if (row === 'hero') {
    return (
      <span
        className="flex h-7 shrink-0 items-center justify-center"
        style={{ background: colors.primary, borderRadius: radius }}
      >
        <span
          className="block h-1.5 w-10 rounded-full"
          style={{ background: colors.background, opacity: 0.85 }}
        />
      </span>
    );
  }

  if (row === 'divider') {
    return <span className="h-px shrink-0" style={{ background: colors.border }} />;
  }

  if (row === 'cards') {
    return (
      <span className="flex h-5 shrink-0 gap-1">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="flex-1"
            style={{
              background: colors.surface,
              boxShadow: `inset 0 0 0 1px ${colors.border}`,
              borderRadius: radius,
            }}
          />
        ))}
        <span className="w-2" style={{ background: colors.accent, borderRadius: radius }} />
      </span>
    );
  }

  if (row === 'media') {
    return (
      <span className="flex h-6 shrink-0 gap-1">
        <span
          className="w-2/5"
          style={{ background: colors.surface, boxShadow: `inset 0 0 0 1px ${colors.border}`, borderRadius: radius }}
        />
        <span className="flex flex-1 flex-col justify-center gap-1">
          <span className="block h-1" style={{ background: colors.text, opacity: 0.7 }} />
          <span className="block h-1 w-2/3" style={{ background: colors.textMuted, opacity: 0.6 }} />
        </span>
      </span>
    );
  }

  return (
    <span className="flex shrink-0 flex-col gap-1">
      <span className="block h-1 w-3/4" style={{ background: colors.text, opacity: 0.75 }} />
      <span className="block h-1" style={{ background: colors.textMuted, opacity: 0.5 }} />
      <span className="block h-1 w-1/2" style={{ background: colors.textMuted, opacity: 0.5 }} />
    </span>
  );
}
