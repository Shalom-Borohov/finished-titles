import { describe, expect, it } from 'vitest'
import { GENRE_LABELS } from '../../src/copy/labels'
import { GENRES } from '../../src/domain/types'

describe('GENRES', () => {
  it('lists the 21 genres in Hebrew alphabetical order', () => {
    expect(GENRES.map((genre) => GENRE_LABELS[genre])).toEqual([
      'אימה',
      'אנימציה',
      'אקשן',
      'דרמה',
      'היסטוריה',
      'הרפתקאות',
      'ילדים',
      'מדע בדיוני',
      'מוזיקה',
      'מותחן',
      'מלחמה',
      'מסתורין',
      'מערבון',
      'משפחה',
      'פוליטיקה',
      'פנטזיה',
      'פשע',
      'קומדיה',
      'ריאליטי',
      'רומנטיקה',
      'תיעודי',
    ])
  })
})
