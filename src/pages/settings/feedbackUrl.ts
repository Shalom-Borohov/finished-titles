import { SETTINGS_COPY } from './copy'

export const FEEDBACK_KINDS = ['bug', 'idea'] as const

export type FeedbackKind = (typeof FEEDBACK_KINDS)[number]

type FeedbackLink = {
  url: string
  isCut: boolean
}

const ISSUES_URL = 'https://github.com/Shalom-Borohov/finished-titles/issues/new'

const MAX_TITLE = 80

const MAX_LINK_LENGTH = 4300

const ISSUE_LABELS: Record<FeedbackKind, string> = { bug: 'bug', idea: 'feature' }

const graphemes = (text: string) => Array.from(new Intl.Segmenter().segment(text), ({ segment }) => segment)

function title(text: string) {
  const [first] = text.split('\n')
  const characters = graphemes(first)

  return characters.length > MAX_TITLE ? `${characters.slice(0, MAX_TITLE - 1).join('')}…` : first
}

function issueUrl(kind: FeedbackKind, issueTitle: string, text: string) {
  const params = new URLSearchParams({
    title: issueTitle,
    body: SETTINGS_COPY.issueBody(text, navigator.userAgent, __APP_VERSION__, __APP_BUILT_AT__),
    labels: ISSUE_LABELS[kind],
  })

  return `${ISSUES_URL}?${params}`
}

export function feedbackLink(kind: FeedbackKind, text: string): FeedbackLink {
  const report = text.trim()
  const issueTitle = title(report)
  const whole = issueUrl(kind, issueTitle, report)

  if (whole.length <= MAX_LINK_LENGTH) {
    return { url: whole, isCut: false }
  }

  const characters = graphemes(report.slice(0, MAX_LINK_LENGTH))

  const cutAfter = (count: number) =>
    issueUrl(kind, issueTitle, `${characters.slice(0, count).join('')}${SETTINGS_COPY.issueCutMarker}`)

  let fits = 0
  let tooLong = characters.length

  while (tooLong - fits > 1) {
    const middle = Math.floor((fits + tooLong) / 2)

    if (cutAfter(middle).length <= MAX_LINK_LENGTH) {
      fits = middle
    } else {
      tooLong = middle
    }
  }

  return { url: cutAfter(fits), isCut: true }
}
