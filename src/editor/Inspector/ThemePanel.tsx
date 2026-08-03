import { useState } from 'react';
import { ChevronDown, ChevronLeft, RotateCcw } from 'lucide-react';
import { themePresets } from '@/model/themes';
import type { Theme } from '@/model/types';
import { contrastRatio } from '@/renderer/theme/themeToCssVars';
import { useCourseStore } from '@/state/courseStore';
import {
  ColorField,
  FieldGroup,
  FieldNote,
  SegmentedField,
  SelectField,
  SliderField,
  type Option,
} from '../controls/Field';

const fontOptions: Option<Theme['typography']['fontFamily']>[] = [
  { value: 'system', label: 'גופן המערכת' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'heebo', label: 'Heebo' },
  { value: 'rubik', label: 'Rubik' },
];

const headingStyleOptions: Option<Theme['typography']['headingStyle']>[] = [
  { value: 'plain', label: 'רגיל' },
  { value: 'underline', label: 'קו תחתון' },
  { value: 'accentBar', label: 'פס צבע' },
];

const shadowOptions: Option<Theme['shape']['shadow']>[] = [
  { value: 'none', label: 'ללא' },
  { value: 'soft', label: 'עדין' },
  { value: 'medium', label: 'בולט' },
];

const buttonStyleOptions: Option<Theme['shape']['buttonStyle']>[] = [
  { value: 'solid', label: 'מלא' },
  { value: 'soft', label: 'רך' },
  { value: 'outline', label: 'מתאר' },
];

const cardStyleOptions: Option<Theme['shape']['cardStyle']>[] = [
  { value: 'flat', label: 'שטוח' },
  { value: 'bordered', label: 'מסגרת' },
  { value: 'elevated', label: 'מוגבה' },
];

const densityOptions: Option<Theme['layout']['density']>[] = [
  { value: 'compact', label: 'צפוף' },
  { value: 'comfortable', label: 'רגיל' },
  { value: 'spacious', label: 'אוורירי' },
];

const colorLabels: { key: keyof Theme['colors']; label: string }[] = [
  { key: 'primary', label: 'צבע ראשי' },
  { key: 'secondary', label: 'צבע משני' },
  { key: 'accent', label: 'צבע הדגשה' },
  { key: 'background', label: 'רקע' },
  { key: 'surface', label: 'משטחים וכרטיסים' },
  { key: 'text', label: 'טקסט' },
  { key: 'textMuted', label: 'טקסט משני' },
  { key: 'border', label: 'קווי הפרדה' },
];

/**
 * בונה ערכות העיצוב (סעיף 10).
 *
 * הערכות המוכנות למעלה, וכל הבקרות הפרטניות מתחת. כל שינוי ידני
 * מסמן את הערכה כ-custom, כדי שלא ייווצר מצב שבו כתוב "נקי ובהיר" אבל
 * הצבעים כבר אחרים.
 *
 * בדיקת הניגודיות רצה על הערכים בפועל ומזהירה בזמן אמת. זה ההבדל בין
 * "יש בקרות צבע" לבין "אפשר לבנות ערכה ולא לשבור את הקריאות".
 */
export function ThemePanel({ theme }: { theme: Theme }) {
  const setTheme = useCourseStore((state) => state.setTheme);
  const [showAdvanced, setShowAdvanced] = useState(false);

  /** כל שינוי ידני מנתק את הערכה מהפריסט שממנו התחילה */
  const patch = (changes: Partial<Theme>) => setTheme({ ...theme, ...changes, preset: 'custom' });

  const textContrast = contrastRatio(theme.colors.text, theme.colors.background);
  const mutedContrast = contrastRatio(theme.colors.textMuted, theme.colors.background);
  const activePreset = themePresets.find((preset) => preset.id === theme.preset);

  return (
    <>
      <FieldGroup title="ערכת עיצוב">
        {/*
          רשת דו-טורית: שמונה ערכות ברשימה חד-טורית הפכו את הפאנל לגלילה
          ארוכה שבה אי אפשר להשוות בין שתי ערכות במבט אחד. התיאור המלא
          עבר ל-title, והכרטיס מציג דגימת צבעים ושם.
        */}
        <div className="grid grid-cols-2 gap-2">
          {themePresets.map((preset) => {
            const isActive = theme.preset === preset.id;
            const { colors } = preset.theme;

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTheme(preset.theme)}
                aria-pressed={isActive}
                title={preset.description}
                className={
                  isActive
                    ? 'overflow-hidden rounded-xl border-2 border-volt-dim text-start transition'
                    : 'overflow-hidden rounded-xl border border-edge text-start transition hover:border-edge-strong'
                }
              >
                {/* דגימה חיה של הערכה, ולא ארבע נקודות צבע: כך רואים גם את
                    יחס הרקע לטקסט ולא רק את הגוונים עצמם */}
                <span
                  className="flex h-12 items-center gap-1 px-2"
                  style={{ background: colors.background }}
                >
                  <span
                    className="h-6 flex-1 rounded"
                    style={{ background: colors.primary }}
                    aria-hidden
                  />
                  <span
                    className="h-6 w-3 rounded"
                    style={{ background: colors.accent }}
                    aria-hidden
                  />
                  <span
                    className="h-6 flex-1 rounded"
                    style={{ background: colors.surface, boxShadow: `inset 0 0 0 1px ${colors.border}` }}
                    aria-hidden
                  />
                </span>
                <span className="block truncate px-2.5 py-2 text-xs font-semibold text-fg">
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>

        {theme.preset === 'custom' && (
          <button
            type="button"
            onClick={() => setTheme(themePresets[0].theme)}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-fg-soft transition hover:bg-app"
          >
            <RotateCcw className="size-3.5" aria-hidden />
            חזרה לערכה מוכנה
          </button>
        )}

        {activePreset === undefined && theme.preset === 'custom' && (
          <FieldNote>ערכה מותאמת אישית.</FieldNote>
        )}
      </FieldGroup>

      <section className="border-b border-edge">
        <button
          type="button"
          onClick={() => setShowAdvanced((open) => !open)}
          aria-expanded={showAdvanced}
          className="flex w-full items-center gap-1.5 px-4 py-3 text-xs font-bold text-fg transition hover:bg-app"
        >
          {showAdvanced ? (
            <ChevronDown className="size-3.5 text-fg-muted" aria-hidden />
          ) : (
            <ChevronLeft className="size-3.5 text-fg-muted" aria-hidden />
          )}
          התאמה אישית
        </button>
      </section>

      {showAdvanced && (
        <>
          <FieldGroup title="צבעים">
            {colorLabels.map(({ key, label }) => (
              <ColorField
                key={key}
                label={label}
                value={theme.colors[key]}
                onChange={(value) => patch({ colors: { ...theme.colors, [key]: value } })}
              />
            ))}

            {textContrast < 4.5 && (
              <FieldNote tone="warning">
                ניגודיות הטקסט מול הרקע היא {textContrast.toFixed(1)}:1, מתחת לסף 4.5:1. הלומדה
                תהיה קשה לקריאה.
              </FieldNote>
            )}
            {textContrast >= 4.5 && mutedContrast < 3 && (
              <FieldNote tone="warning">
                הטקסט המשני בניגודיות {mutedContrast.toFixed(1)}:1 בלבד. כדאי להכהות אותו.
              </FieldNote>
            )}
            {textContrast >= 4.5 && mutedContrast >= 3 && (
              <FieldNote>ניגודיות תקינה: טקסט {textContrast.toFixed(1)}:1.</FieldNote>
            )}
          </FieldGroup>

          <FieldGroup title="טיפוגרפיה">
            <SelectField
              label="משפחת גופן"
              value={theme.typography.fontFamily}
              options={fontOptions}
              onChange={(fontFamily) =>
                patch({
                  typography: {
                    ...theme.typography,
                    fontFamily,
                    // כשבוחרים גופן גוף חדש ולא הוגדר גופן כותרות — משאירים
                    // את pairing הקיים; אם headingFamily זהה לישן, מאפסים כדי
                    // לא לגרור pairing ישן בשקט
                    ...(theme.typography.headingFamily === theme.typography.fontFamily
                      ? { headingFamily: undefined }
                      : {}),
                  },
                })
              }
            />
            <SelectField
              label="גופן כותרות"
              value={theme.typography.headingFamily ?? theme.typography.fontFamily}
              options={fontOptions}
              onChange={(headingFamily) =>
                patch({
                  typography: {
                    ...theme.typography,
                    headingFamily:
                      headingFamily === theme.typography.fontFamily ? undefined : headingFamily,
                  },
                })
              }
            />
            <SliderField
              label="גודל טקסט בסיסי"
              value={theme.typography.baseSize}
              min={14}
              max={22}
              unit="px"
              onChange={(baseSize) => patch({ typography: { ...theme.typography, baseSize } })}
            />
            <SegmentedField
              label="עובי כותרות"
              value={String(theme.typography.headingWeight) as '600' | '700' | '800'}
              options={[
                { value: '600', label: 'קל' },
                { value: '700', label: 'רגיל' },
                { value: '800', label: 'כבד' },
              ]}
              onChange={(value) =>
                patch({
                  typography: {
                    ...theme.typography,
                    headingWeight: Number(value) as 600 | 700 | 800,
                  },
                })
              }
            />
            <SelectField
              label="סגנון כותרות"
              value={theme.typography.headingStyle}
              options={headingStyleOptions}
              onChange={(headingStyle) => patch({ typography: { ...theme.typography, headingStyle } })}
            />
          </FieldGroup>

          <FieldGroup title="צורה">
            <SliderField
              label="עיגול פינות"
              value={theme.shape.radius}
              min={0}
              max={32}
              unit="px"
              onChange={(radius) => patch({ shape: { ...theme.shape, radius } })}
            />
            <SegmentedField
              label="עוצמת צל"
              value={theme.shape.shadow}
              options={shadowOptions}
              onChange={(shadow) => patch({ shape: { ...theme.shape, shadow } })}
            />
            <SegmentedField
              label="סגנון כפתורים"
              value={theme.shape.buttonStyle}
              options={buttonStyleOptions}
              onChange={(buttonStyle) => patch({ shape: { ...theme.shape, buttonStyle } })}
            />
            <SegmentedField
              label="סגנון כרטיסים"
              value={theme.shape.cardStyle}
              options={cardStyleOptions}
              onChange={(cardStyle) => patch({ shape: { ...theme.shape, cardStyle } })}
            />
          </FieldGroup>

          <FieldGroup title="פריסה">
            <SliderField
              label="רוחב מרבי של תוכן"
              value={theme.layout.contentMaxWidth}
              min={560}
              max={1200}
              step={20}
              unit="px"
              onChange={(contentMaxWidth) => patch({ layout: { ...theme.layout, contentMaxWidth } })}
            />
            <SegmentedField
              label="מרווחים"
              value={theme.layout.density}
              options={densityOptions}
              onChange={(density) => patch({ layout: { ...theme.layout, density } })}
            />
          </FieldGroup>
        </>
      )}
    </>
  );
}
