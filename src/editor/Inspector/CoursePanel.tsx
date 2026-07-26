import type { Course, Direction, NavigationMode } from '@/model/types';
import { useCourseStore } from '@/state/courseStore';
import { ThemePanel } from './ThemePanel';
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

      <ThemePanel theme={course.theme} />

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
        <p className="text-[11px] leading-relaxed text-fg-muted">
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
