/**
 * מתאם SCORM 1.2 — הגשר היחיד בין הלומדה ל-LMS.
 *
 * הרנדרר אינו יודע דבר על SCORM: הוא משדר `window` אירוע `lc:progress` עם
 * מצב ההשלמה, הציון ומצב הלומד המלא, והמתאם הזה — שנכנס **רק** לחבילת ה-SCORM — מקשיב
 * ומדווח ל-LMS. כך מוסכמת הגבול נשמרת, וה-`index.html` של חבילת ה-SCORM
 * עדיין נפתח גם לבד מ-`file://` (בלי LMS המתאם פשוט אינו עושה דבר).
 *
 * נכתב ידנית כ-JS קלאסי בלי תלויות, בדיוק כמו חבילת הריצה — הוא נטען
 * כסקריפט קלאסי לפני הריצה, כדי שהמאזין יירשם לפני השידור הראשון — וכדי
 * שמצב הלומד מה-LMS (`cmi.suspend_data`) יחכה ב-`window.__LC_RESUME__`
 * כשהלומדה עולה. כך לומד שהתחיל במחשב אחד ממשיך באחר.
 */

export const SCORM_ADAPTER_FILE = 'scorm-adapter.js';

export function scormAdapterJs(): string {
  return `(function () {
  "use strict";

  // איתור ה-API של SCORM 1.2: מטפסים בשרשרת החלונות (frame/iframe) וגם
  // דרך opener, בדיוק כאלגוריתם התקן. אם אין — הלומדה רצה לבד ואין למי לדווח.
  function findAPI(win) {
    var tries = 0;
    while (win && !win.API && win.parent && win.parent !== win && tries < 20) {
      tries++;
      win = win.parent;
    }
    return win && win.API ? win.API : null;
  }
  function getAPI() {
    var a = findAPI(window);
    if (!a && window.opener) a = findAPI(window.opener);
    return a;
  }

  var api = getAPI();
  if (!api) return;

  // מגבלת התקן ל-cmi.suspend_data ב-SCORM 1.2 היא 4096 תווים; נשאר מרווח
  var SUSPEND_LIMIT = 4000;

  var started = false;
  // סטטוס סופי שכבר דווח ב-LMS — לא מורידים אותו בחזרה ל-incomplete
  var alreadyDone = false;
  function start() {
    if (started) return;
    api.LMSInitialize("");
    started = true;
    var status = api.LMSGetValue("cmi.core.lesson_status");
    alreadyDone = status === "completed" || status === "passed" || status === "failed";
    if (!status || status === "not attempted" || status === "unknown") {
      api.LMSSetValue("cmi.core.lesson_status", "incomplete");
      api.LMSCommit("");
    }

    // המשך מהמקום שבו הלומד עצר: המצב שנשמר ב-LMS מוזרק ללומדה לפני שהיא
    // עולה (המתאם נטען לפני חבילת הריצה). אובייקט ריק מסמן "הפעלה ב-LMS בלי
    // מצב קודם", כדי שהלומדה לא תיפול חזרה למצב של לומד אחר ב-localStorage.
    var resume = {};
    try {
      var raw = api.LMSGetValue("cmi.suspend_data");
      var parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") resume = parsed;
    } catch (e) {
      resume = {};
    }
    window.__LC_RESUME__ = resume;
  }
  start();

  // שומר את מצב הלומד ב-LMS. אם המצב המלא חורג מהמגבלה מוותרים על מצב
  // הבלוקים (תשובות מסומנות) ושומרים את העיקר: מיקום, פרקים שהושלמו וציון.
  function suspend(state) {
    if (!state || typeof state !== "object") return;
    var data = JSON.stringify(state);
    if (data.length > SUSPEND_LIMIT) {
      var slim = {};
      for (var key in state) {
        if (Object.prototype.hasOwnProperty.call(state, key) && key !== "blockState") {
          slim[key] = state[key];
        }
      }
      data = JSON.stringify(slim);
    }
    if (data.length <= SUSPEND_LIMIT) api.LMSSetValue("cmi.suspend_data", data);
  }

  window.addEventListener("lc:progress", function (event) {
    if (!started) return;
    var d = (event && event.detail) || {};
    if (typeof d.score === "number") {
      api.LMSSetValue("cmi.core.score.raw", String(d.score));
      api.LMSSetValue("cmi.core.score.min", "0");
      api.LMSSetValue("cmi.core.score.max", "100");
    }
    if (d.completed) {
      alreadyDone = true;
      // עם ציון מעבר הסטטוס הסופי הוא עבר/נכשל; בלעדיו — "הושלם" בלבד
      var graded = typeof d.passScore === "number" && typeof d.score === "number";
      api.LMSSetValue(
        "cmi.core.lesson_status",
        graded ? (d.score >= d.passScore ? "passed" : "failed") : "completed"
      );
    } else if (!alreadyDone) {
      api.LMSSetValue("cmi.core.lesson_status", "incomplete");
    }
    if (typeof d.location === "string") {
      api.LMSSetValue("cmi.core.lesson_location", d.location);
    }
    suspend(d.state);
    api.LMSCommit("");
  });

  // סיום הפעלה כשעוזבים את הדף — pagehide אמין יותר מ-unload בדפדפנים מודרניים,
  // ושניהם נרשמים ליתר ביטחון. finish מוגן מפני קריאה כפולה.
  function finish() {
    if (!started) return;
    started = false;
    // exit=suspend מורה ל-LMS לשמור את suspend_data לכניסה הבאה
    api.LMSSetValue("cmi.core.exit", "suspend");
    api.LMSCommit("");
    api.LMSFinish("");
  }
  window.addEventListener("pagehide", finish);
  window.addEventListener("unload", finish);
})();
`;
}
