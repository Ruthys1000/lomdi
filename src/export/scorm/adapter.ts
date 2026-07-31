/**
 * מתאם SCORM 1.2 — הגשר היחיד בין הלומדה ל-LMS.
 *
 * הרנדרר אינו יודע דבר על SCORM: הוא משדר `window` אירוע `lc:progress` עם
 * מצב ההשלמה והציון, והמתאם הזה — שנכנס **רק** לחבילת ה-SCORM — מקשיב
 * ומדווח ל-LMS. כך מוסכמת הגבול נשמרת, וה-`index.html` של חבילת ה-SCORM
 * עדיין נפתח גם לבד מ-`file://` (בלי LMS המתאם פשוט אינו עושה דבר).
 *
 * נכתב ידנית כ-JS קלאסי בלי תלויות, בדיוק כמו חבילת הריצה — הוא נטען
 * כסקריפט קלאסי לפני הריצה, כדי שהמאזין יירשם לפני השידור הראשון.
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

  var started = false;
  function start() {
    if (started) return;
    api.LMSInitialize("");
    started = true;
    var status = api.LMSGetValue("cmi.core.lesson_status");
    if (!status || status === "not attempted" || status === "unknown") {
      api.LMSSetValue("cmi.core.lesson_status", "incomplete");
      api.LMSCommit("");
    }
  }
  start();

  window.addEventListener("lc:progress", function (event) {
    if (!started) return;
    var d = (event && event.detail) || {};
    if (typeof d.score === "number") {
      api.LMSSetValue("cmi.core.score.raw", String(d.score));
      api.LMSSetValue("cmi.core.score.min", "0");
      api.LMSSetValue("cmi.core.score.max", "100");
    }
    api.LMSSetValue("cmi.core.lesson_status", d.completed ? "completed" : "incomplete");
    api.LMSCommit("");
  });

  // סיום הפעלה כשעוזבים את הדף — pagehide אמין יותר מ-unload בדפדפנים מודרניים,
  // ושניהם נרשמים ליתר ביטחון. finish מוגן מפני קריאה כפולה.
  function finish() {
    if (!started) return;
    started = false;
    api.LMSCommit("");
    api.LMSFinish("");
  }
  window.addEventListener("pagehide", finish);
  window.addEventListener("unload", finish);
})();
`;
}
