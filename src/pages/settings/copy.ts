import { COMMON_COPY } from '../../copy/common'

const BUILD_TIME_FORMAT = new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short' })

export const SETTINGS_COPY = {
  backup: 'גיבוי',
  exportBackup: 'ייצוא גיבוי',
  importBackup: 'ייבוא גיבוי',
  backupFile: 'קובץ גיבוי',
  storageNote: 'הרשימה שמורה רק בטלפון הזה. כדאי לייצא גיבוי מדי פעם.',
  importWarning: 'הגיבוי יחליף את כל הרשימה הנוכחית. אי אפשר לבטל את זה.',
  confirmImport: 'החלפת הרשימה',
  backupRestored: 'הגיבוי שוחזר',
  invalidBackup: 'קובץ הגיבוי לא תקין',
  newerBackup: 'הגיבוי מגרסה חדשה יותר של האפליקציה. צריך לעדכן אותה ולנסות שוב.',
  genres: 'ז׳אנרים',
  fillGenres: 'השלמת ז׳אנרים מ-TMDB',
  genresWaiting: (count: number) =>
    count === 1
      ? 'לכותר אחד מ-TMDB עדיין אין ז׳אנרים, ולכן הסינון לפי ז׳אנר לא מוצא אותו.'
      : `ל-${count} כותרים מ-TMDB עדיין אין ז׳אנרים, ולכן הסינון לפי ז׳אנר לא מוצא אותם.`,
  fillingGenres: (done: number, total: number) => `משלים… ${done} מתוך ${total}`,
  genreFillProgress: 'התקדמות השלמת הז׳אנרים',
  genresFilled: (filled: number, failed: number) => {
    const filledLine = filled === 1 ? 'הושלם כותר אחד.' : `הושלמו ${filled} כותרים.`

    if (failed === 0) {
      return filledLine
    }

    const failedLine = `${failed === 1 ? 'כותר אחד לא הצליח' : `${failed} לא הצליחו`}, ואפשר לנסות שוב.`

    return filled === 0 ? failedLine : `${filledLine} ${failedLine}`
  },
  retryGenres: (count: number) => (count === 1 ? 'ניסיון חוזר לכותר אחד' : `ניסיון חוזר ל-${count} כותרים`),
  feedback: 'משוב',
  reportBugOrIdea: 'דיווח על באג / הצעה',
  report: 'דיווח',
  bug: 'באג',
  idea: 'הצעה',
  description: 'תיאור',
  bugPlaceholder: 'מה קרה, ומה ציפית שיקרה?',
  ideaPlaceholder: 'מה היה עוזר לך?',
  feedbackFooter: 'הדיווח נפתח ב-GitHub, עם סוג הדפדפן והגרסה. רשימת הכותרים לא נשלחת.',
  openInGitHub: 'פתיחה ב-GitHub',
  feedbackOpened: 'אם GitHub לא נפתח, אפשר ללחוץ שוב או להעתיק את הטקסט.',
  feedbackTooLong: 'הדיווח ארוך מדי לקישור. ב-GitHub תופיע רק ההתחלה, ואת השאר אפשר להעתיק מכאן ולהדביק שם.',
  issueCutMarker: '… (הדיווח נחתך כאן)',
  issueBody: (text: string, userAgent: string, version: string, builtAt: string) =>
    `${text}\n\n### מכשיר\n${userAgent}\nגרסה: ${version} (${builtAt})`,
  dataSources: 'מקורות',
  tmdbLogoAlt: 'TMDB',
  tmdbNotice: 'This application uses TMDB and the TMDB APIs but is not endorsed, certified, or otherwise approved by TMDB.',
  version: (version: string, builtAt: string) =>
    [`גרסה ${version}`, `עודכנה ${BUILD_TIME_FORMAT.format(new Date(builtAt))}`].join(COMMON_COPY.separator),
} as const
