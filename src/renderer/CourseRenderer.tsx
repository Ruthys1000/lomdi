import type { Course } from '@/model/types';
import { RenderContext, type RenderContextValue } from './RenderContext';
import { BlockRenderer } from './BlockRenderer';
import './styles/course.css';

export interface CourseRendererProps {
  course: Course;
  resolveAssetUrl: (assetId: string) => string | undefined;
  /** true כשהרנדרר מוצג בתוך קנבס העריכה ולא בתצוגה מקדימה/בתוצר */
  isEditing?: boolean;
}

/**
 * שורש הלומדה — הרכיב היחיד שגם התצוגה המקדימה בעורך וגם הלומדה המיוצאת
 * מרנדרות. זו הסיבה שאין ולא יכול להיות פער בין מה שהעורך מציג לבין התוצר
 * (סעיף 15 באפיון).
 *
 * בשלב 1 זהו שלד: הוא מרנדר את הפרקים ברצף. מצבי הניווט (גלילה רציפה
 * ומצב פרקים) נוספים בשלב 2, והבלוקים עצמם בשלבים 3 ו-5.
 */
export function CourseRenderer({ course, resolveAssetUrl, isEditing = false }: CourseRendererProps) {
  const ctx: RenderContextValue = { direction: course.direction, resolveAssetUrl, isEditing };

  return (
    <RenderContext value={ctx}>
      <div className="lc-course" dir={course.direction} lang={course.language}>
        {course.chapters.map((chapter) => (
          <section key={chapter.id} className="lc-chapter" aria-label={chapter.title}>
            {chapter.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} isEditing={isEditing} />
            ))}
          </section>
        ))}
      </div>
    </RenderContext>
  );
}
