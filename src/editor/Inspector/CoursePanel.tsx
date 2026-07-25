import { themePresets } from '@/model/themes';
import type { Course, Direction, NavigationMode } from '@/model/types';
import { contrastRatio } from '@/renderer/theme/themeToCssVars';
import { useCourseStore } from '@/state/courseStore';
import { FieldGroup, SegmentedField, SwitchField, TextField, type Option } from '../controls/Field';

const navigationOptions: Option<NavigationMode>[] = [
  { value: 'chapters', label: 'פרקים' },
  { value: 'scroll', label: 'גלילה רציפה' },
];

const directionOptions: Option<Direction>[] = [
  { value: 'rtl', label: 'עברית (RTL)' },
  { value: 'ltr', label: 'אנגלית (LTR)' },
];

/** הגדרות הלומדה — מוצגות כשלא נבחר בלוק */
export function CoursePanel({ course }: { course: Course }) {
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const setTheme = useCourseStore((state) => state.setTheme);

  return (
    <>
      <FieldGroup title="פרטי הלומדה">
        <TextField
          label="כותרת"
          value={course.title}
          onChange={(title) => updateCourse({ title })}
        />
        <TextField
          label="כותרת משנה"
          value={course.subtitle}
          onChange={(subtitle) => updateCourse({ subtitle })}
        />
        <TextField
          label="תיאור"
          value={course.description}
          onChange={(description) => updateCourse({ description })}
          multiline
        />
      </FieldGroup>

      <FieldGroup title="ערכת עיצוב">
        <div className="grid gap-2">
          {themePresets.map((preset) => {
            const isActive = course.theme.preset === preset.id;
            const { colors } = preset.theme;
            // מוצג לצד הערכה כדי שבחירה לא תיצור לומדה לא קריאה
            const ratio = contrastRatio(colors.text, colors.background);

            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTheme(preset.theme)}
                aria-pressed={isActive}
                className={
                  isActive
                    ? 'rounded-xl border-2 border-blue-500 bg-blue-50/40 p-3 text-start transition'
                    : 'rounded-xl border border-slate-200 p-3 text-start transition hover:border-slate-300'
                }
              >
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">
                    {[colors.primary, colors.accent, colors.surface, colors.text].map((color) => (
                      <span
                        key={color}
                        className="size-3.5 rounded-full ring-1 ring-black/10"
                        style={{ background: color }}
                      />
                    ))}
                  </span>
                  <span className="text-xs font-semibold text-slate-900">{preset.name}</span>
                </span>
                <span className="mt-1.5 block text-[11px] leading-relaxed text-slate-500">
                  {preset.description}
                </span>
                <span className="mt-1 block text-[10px] text-slate-400">
                  ניגודיות טקסט {ratio.toFixed(1)}:1
                </span>
              </button>
            );
          })}
        </div>
      </FieldGroup>

      <FieldGroup title="ניווט בלומדה">
        <SegmentedField
          label="מצב ניווט"
          value={course.navigation.mode}
          options={navigationOptions}
          onChange={(mode) =>
            updateCourse({ navigation: { ...course.navigation, mode } })
          }
        />
        <SwitchField
          label="פס התקדמות"
          checked={course.navigation.showProgress}
          onChange={(showProgress) =>
            updateCourse({ navigation: { ...course.navigation, showProgress } })
          }
        />
        <SwitchField
          label="תפריט פרקים"
          checked={course.navigation.showChapterMenu}
          onChange={(showChapterMenu) =>
            updateCourse({ navigation: { ...course.navigation, showChapterMenu } })
          }
        />
        <SwitchField
          label="מספר הפרק"
          checked={course.navigation.showChapterNumber}
          onChange={(showChapterNumber) =>
            updateCourse({ navigation: { ...course.navigation, showChapterNumber } })
          }
        />
        <p className="text-[11px] leading-relaxed text-slate-400">
          מצב הניווט משפיע על התוצר ועל התצוגה המקדימה. בקנבס תמיד מוצג פרק אחד, לנוחות העריכה.
        </p>
      </FieldGroup>

      <FieldGroup title="שפה וכיוון">
        <SegmentedField
          label="כיוון הלומדה"
          value={course.direction}
          options={directionOptions}
          onChange={(direction) =>
            updateCourse({ direction, language: direction === 'rtl' ? 'he' : 'en' })
          }
        />
      </FieldGroup>
    </>
  );
}
