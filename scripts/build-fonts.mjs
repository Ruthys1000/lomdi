import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * בניית חבילת הגופנים — `public/fonts/`.
 *
 * הגופנים העבריים חייבים להיארז לתוך התוצר: לומדה שרצה מ-file:// בלי
 * אינטרנט לא יכולה לטעון גופן מ-CDN, וגופן שאינו מותקן אצל הלומד פשוט
 * נופל ל-system-ui. כלומר בלי הצעד הזה בורר הגופנים ב-Theme Builder הוא
 * הבטחה ריקה, וגם העורך והתוצר נראים שונה זה מזה.
 *
 * הסקריפט **מעתיק את ה-CSS של @fontsource ואינו כותב @font-face ביד**.
 * ה-unicode-range של כל תת-קבוצה הוא מקור אמת ארוך ורגיש; שכפול ידני שלו
 * נראה בדיוק כמו "העברית עובדת אבל הספרות נשברות". מה שכן נעשה כאן: סינון
 * לתת-הקבוצות שהלומדה צריכה (עברית + לטינית), והפיכת הנתיבים לשטוחים.
 *
 * התוצר אינו נשמר בגיט, בדיוק כמו `public/runtime/` — הוא נבנה מהמקור
 * ב-predev, ב-pretest וב-build.
 */

const FAMILIES = ['heebo', 'assistant', 'rubik'];

/**
 * עברית לטקסט, לטינית לספרות ולמילים באנגלית.
 * latin-ext, math ו-symbols נשארים בחוץ: הם מוסיפים כ-56KB לכל משפחה
 * עבור תווים שלומדה בעברית כמעט לעולם אינה מציגה.
 */
const SUBSETS = ['hebrew', 'latin'];

const OUT_DIR = 'public/fonts';
const packageDir = (family) => join('node_modules', `@fontsource-variable`, family);

/** בלוקי ה-@font-face של תת-הקבוצות שנבחרו, עם נתיב שטוח לקובץ שלצדם */
function fontFaceRules(family, css) {
  const rules = [];

  for (const subset of SUBSETS) {
    const fileName = `${family}-${subset}-wght-normal.woff2`;
    const rule = [...css.matchAll(/@font-face\s*\{[^}]*\}/g)]
      .map((match) => match[0])
      .find((block) => block.includes(`./files/${fileName}`));

    if (!rule) {
      throw new Error(
        `לא נמצא @font-face לתת-הקבוצה "${subset}" של ${family}. ייתכן שמבנה החבילה השתנה.`,
      );
    }

    rules.push({ fileName, css: rule.replace('./files/', '') });
  }

  return rules;
}

function buildFamily(family) {
  const dir = packageDir(family);
  if (!existsSync(dir)) {
    throw new Error(`החבילה @fontsource-variable/${family} אינה מותקנת. הרץ npm install.`);
  }

  const rules = fontFaceRules(family, readFileSync(join(dir, 'index.css'), 'utf8'));

  for (const rule of rules) {
    copyFileSync(join(dir, 'files', rule.fileName), join(OUT_DIR, rule.fileName));
  }

  const header = `/* ${family} — נוצר על ידי scripts/build-fonts.mjs מ-@fontsource-variable/${family}. אין לערוך ידנית. */\n`;
  writeFileSync(join(OUT_DIR, `${family}.css`), header + rules.map((rule) => rule.css).join('\n\n') + '\n');

  return {
    family,
    files: rules.map((rule) => rule.fileName),
    license: readFileSync(join(dir, 'LICENSE'), 'utf8'),
  };
}

function buildLicenses(built) {
  const sections = built.map(
    ({ family, license }) =>
      `${'='.repeat(70)}\n${family} (@fontsource-variable/${family})\n${'='.repeat(70)}\n\n${license.trim()}\n`,
  );

  // OFL 1.1 מחייב שהרישיון ילווה את קבצי הגופן בכל הפצה — כולל ה-ZIP
  // שהמשתמש מוריד, ולכן הקובץ הזה נארז לתוצר ואינו רק פורמליות בריפו.
  writeFileSync(
    join(OUT_DIR, 'OFL.txt'),
    `הגופנים בתיקייה זו מופצים ברישיון SIL Open Font License 1.1.\n\n${sections.join('\n')}`,
  );
}

rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(OUT_DIR, { recursive: true });

const built = FAMILIES.map(buildFamily);
buildLicenses(built);

console.log(
  `נבנו ${built.length} משפחות גופן ל-${OUT_DIR}: ${built
    .map(({ family, files }) => `${family} (${files.length} קבצים)`)
    .join(', ')}`,
);
