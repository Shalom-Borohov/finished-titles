export const COMMON_COPY = {
  appName: 'כותרים',
  home: 'בית',
  stats: 'סטטיסטיקה',
  settings: 'הגדרות',
  cancel: 'ביטול',
  addTitle: 'הוספת כותר',
  actionFailed: 'הפעולה לא הצליחה',
  separator: ' · ',
  titleCount: (count: number) => (count === 1 ? 'כותר אחד' : `${count} כותרים`),
} as const
