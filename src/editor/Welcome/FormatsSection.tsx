import type { FormatDefinition, FormatId } from '@/formats';
import { FormatGallery } from './FormatGallery';
import { GenerateForm } from './GenerateForm';

/**
 * שלב בחירת הפורמט + טופס ההדבקה.
 *
 * מחוץ ל-Hero בכוונה: הבחירה היא אינטראקציה (כרטיסים), וה-Hero צריך
 * להישאר הבטחה אחת עם ויזואל תוצר.
 */
export function FormatsSection({
  selected,
  onSelect,
  onClear,
}: {
  selected: FormatDefinition | null;
  onSelect: (id: FormatId) => void;
  onClear: () => void;
}) {
  return (
    <section id="formats" className="scroll-mt-6 bg-app py-12 md:py-16" aria-labelledby="formats-heading">
      <div className="mx-auto max-w-6xl px-6">
        <div className="max-w-2xl">
          <h2 id="formats-heading" className="text-2xl font-extrabold tracking-tight text-fg md:text-3xl">
            איזה סוג לומדה בונים?
          </h2>
          <p className="mt-2 max-w-[46ch] text-sm leading-relaxed text-fg-muted md:text-base">
            כל פורמט מגיע עם שלד משלו. אחרי הבחירה מדביקים תוכן — וה‑AI ממלא את השלד.
          </p>
        </div>

        <div className="mt-8">
          {selected ? (
            <div className="mx-auto max-w-2xl">
              <GenerateForm format={selected} onBack={onClear} tone="light" />
            </div>
          ) : (
            <FormatGallery onSelect={onSelect} />
          )}
        </div>
      </div>
    </section>
  );
}
