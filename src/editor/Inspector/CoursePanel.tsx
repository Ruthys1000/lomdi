import type { Course, Direction, NavigationMode, SequenceMode } from '@/model/types';
import { useCourseStore } from '@/state/courseStore';
import { ThemePanel } from './ThemePanel';
import {
  FieldGroup,
  SegmentedField,
  SliderField,
  SwitchField,
  TextField,
  type Option,
} from '../controls/Field';

const navigationOptions: Option<NavigationMode>[] = [
  { value: 'chapters', label: 'פרקים' },
  { value: 'scroll', label: 'גלילה רציפה' },
];

const sequenceOptions: Option<SequenceMode>[] = [
  { value: 'free', label: 'חופשי' },
  { value: 'linear', label: 'לפי הסדר' },
];

const directionOptions: Option<Direction>[] = [
  { value: 'rtl', label: 'עברית (RTL)' },
  { value: 'ltr', label: 'אנגלית (LTR)' },
];

/** הגדרות הלומדה — מוצגות כשלא נבחר בלוק */
export function CoursePanel({ course }: { course: Course }) {
  const updateCourse = useCourseStore((state) => state.updateCourse);
  const nav = course.navigation;
  const passScore = nav.passScore ?? 0;

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
        <SwitchField
          label="מעקב התקדמות"
          hint="חידוש המיקום האחרון, זכירת תשובות ומסך סיום — בתוצר ובתצוגה המקדימה."
          checked={course.navigation.trackProgress}
          onChange={(trackProgress) =>
            updateCourse({ navigation: { ...course.navigation, trackProgress } })
          }
        />
        <p className="text-[11px] leading-relaxed text-fg-muted">
          מצב הניווט משפיע על התוצר ועל התצוגה המקדימה. בקנבס תמיד מוצג פרק אחד, לנוחות העריכה.
        </p>
      </FieldGroup>

      <FieldGroup title="רצף למידה">
        {!nav.trackProgress ? (
          <p className="text-[11px] leading-relaxed text-fg-muted">
            הגדרות הרצף דורשות מעקב התקדמות. הפעילו אותו למעלה כדי לקבוע סדר פרקים וציון מעבר.
          </p>
        ) : (
          <>
            {nav.mode === 'chapters' && (
              <SegmentedField
                label="מעבר בין פרקים"
                value={nav.sequence}
                options={sequenceOptions}
                onChange={(sequence) => updateCourse({ navigation: { ...nav, sequence } })}
              />
            )}
            {nav.mode === 'chapters' && (
              <SwitchField
                label="חובה לענות כדי להמשיך"
                hint="כפתור ״הבא״ ננעל עד שהלומד עונה על כל השאלות והאתגרים בפרק."
                checked={nav.requireAnswersToAdvance}
                onChange={(requireAnswersToAdvance) =>
                  updateCourse({ navigation: { ...nav, requireAnswersToAdvance } })
                }
              />
            )}
            <SwitchField
              label="ציון מעבר"
              hint="מסך הסיום יציג עבר / לא עבר, וחבילת SCORM תדווח זאת ל-LMS. הציון מחושב משאלות הבחירה."
              checked={passScore > 0}
              onChange={(on) =>
                updateCourse({ navigation: { ...nav, passScore: on ? 70 : undefined } })
              }
            />
            {passScore > 0 && (
              <SliderField
                label="סף המעבר"
                value={passScore}
                min={10}
                max={100}
                step={5}
                unit="%"
                onChange={(value) => updateCourse({ navigation: { ...nav, passScore: value } })}
              />
            )}
            {nav.mode !== 'chapters' && (
              <p className="text-[11px] leading-relaxed text-fg-muted">
                פתיחה הדרגתית של פרקים זמינה במצב ניווט ״פרקים״.
              </p>
            )}
          </>
        )}
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
