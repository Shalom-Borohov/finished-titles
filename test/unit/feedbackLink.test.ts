import { describe, expect, it } from 'vitest'
import { feedbackLink } from '../../src/pages/settings/feedbackUrl'

const LINK_LIMIT = 4300
const HEBREW_LETTER_IN_LINK = 6
const CUT_MARKER = '… (הדיווח נחתך כאן)'

const deviceDetails = () => `\n\n### מכשיר\n${navigator.userAgent}\nגרסה: ${__APP_VERSION__} (${__APP_BUILT_AT__})`

const params = (url: string) => new URL(url).searchParams

function bodyOf(url: string) {
  const body = params(url).get('body')

  if (body === null) {
    throw new Error('no body in the link')
  }

  return body
}

function longestReportThatFits() {
  let report = 'א'

  while (!feedbackLink('bug', `${report}א`).isCut) {
    report += 'א'
  }

  return report
}

describe('feedbackLink', () => {
  it('sends a short report whole, as a new issue on finished-titles', () => {
    const { url, isCut } = feedbackLink('bug', '  הכותר לא נשמר\nבחרתי סרט מהחיפוש  ')
    const { origin, pathname } = new URL(url)

    expect(isCut).toBe(false)
    expect(`${origin}${pathname}`).toBe('https://github.com/Shalom-Borohov/finished-titles/issues/new')
    expect(bodyOf(url)).toBe(`הכותר לא נשמר\nבחרתי סרט מהחיפוש${deviceDetails()}`)
    expect(params(url).get('title')).toBe('הכותר לא נשמר')
    expect(params(url).get('labels')).toBe('bug')
  })

  it('cuts a long report to fit the limit, marks the cut and keeps the device details', () => {
    const report = 'שלום עולם\n' + 'כתבתי דיווח ארוך מאוד '.repeat(150)
    const { url, isCut } = feedbackLink('idea', report)
    const body = bodyOf(url)
    const [kept, afterMarker] = body.split(CUT_MARKER)

    expect(isCut).toBe(true)
    expect(url.length).toBeLessThanOrEqual(LINK_LIMIT)
    expect(report.startsWith(kept)).toBe(true)
    expect(kept.length).toBeGreaterThan(500)
    expect(afterMarker).toBe(deviceDetails())
    expect(params(url).get('title')).toBe('שלום עולם')
    expect(params(url).get('labels')).toBe('feature')
  })

  it('keeps the 80-character title rule when the whole report is one long line', () => {
    const { url, isCut } = feedbackLink('bug', 'א'.repeat(2000))

    expect(isCut).toBe(true)
    expect(params(url).get('title')).toBe(`${'א'.repeat(79)}…`)
  })

  it('does not break an emoji at the title cut', () => {
    const family = '👨‍👩‍👧'
    const { url } = feedbackLink('bug', `${'א'.repeat(78)}${family}${'ב'.repeat(10)}`)

    expect(params(url).get('title')).toBe(`${'א'.repeat(78)}${family}…`)
  })

  it('cuts only once a report no longer fits, and then uses all the room', () => {
    const report = longestReportThatFits()
    const whole = feedbackLink('bug', report)
    const cut = feedbackLink('bug', `${report}א`)

    expect(whole.url.length).toBeLessThanOrEqual(LINK_LIMIT)
    expect(bodyOf(whole.url)).toBe(`${report}${deviceDetails()}`)
    expect(cut.isCut).toBe(true)
    expect(cut.url.length).toBeLessThanOrEqual(LINK_LIMIT)
    expect(cut.url.length).toBeGreaterThan(LINK_LIMIT - HEBREW_LETTER_IN_LINK)
  })

  it.each([
    { name: 'an emoji', character: '😀' },
    { name: 'a flag', character: '🇮🇱' },
    { name: 'a family emoji', character: '👨‍👩‍👧' },
    { name: 'a letter with its vowel points', character: 'בְּ' },
  ])('does not break $name at the cut', ({ character }) => {
    const { url, isCut } = feedbackLink('bug', character.repeat(1000))
    const [kept] = bodyOf(url).split(CUT_MARKER)

    expect(isCut).toBe(true)
    expect(kept.replaceAll(character, '')).toBe('')
  })

  it('uses all the room when a pasted report is far over the limit', () => {
    const { url, isCut } = feedbackLink('bug', 'a'.repeat(50_000))

    expect(isCut).toBe(true)
    expect(url.length).toBe(LINK_LIMIT)
  })
})
