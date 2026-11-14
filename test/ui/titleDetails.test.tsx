import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { pickResult, pressButton, searchFor } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'
import { detailsCalls, DUNE, jsonReply, SEARCH_URL, SEVERANCE, stubSearchResults } from '../helpers/searchService'
import {
  DUNE_DETAILS,
  identityMeta,
  moreDetailsRow,
  openDetailsOf,
  openFormOf,
  rowValue,
  SEVERANCE_DETAILS,
} from '../helpers/titleDetails'

const PIRANESI = { source: 'openlibrary', sourceId: 'OL20022213W', title: 'Piranesi', type: 'book', year: 2020 } as const

const genresShown = () =>
  Array.from(document.querySelectorAll('.details-genres li'), (genre) => genre.textContent)

describe('more details about a title', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 7, 21, 30).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  describe('the row that opens them', () => {
    it.each([
      ['series', SEVERANCE],
      ['movie', DUNE],
    ])('is offered for a picked TMDB %s', async (_type, result) => {
      stubSearchResults([result])
      await openFormOf(result)

      expect(moreDetailsRow()).toBeInTheDocument()
    })

    it('is offered when editing a saved TMDB title', async () => {
      await db.entries.add(entry({ title: 'Severance', type: 'series', source: 'tmdb', sourceId: 'tv/95396' }))
      stubSearchResults([])
      renderAt('/tabs/home/series')
      await pickResult(/Severance/)
      await screen.findByText('שמירה')

      expect(moreDetailsRow()).toBeInTheDocument()
    })

    it('is not offered for a title added by hand', async () => {
      stubSearchResults([])
      renderAt('/tabs/home')
      await searchFor('obscure film')
      await pressButton('לא מצאתי, הוספה ידנית')
      await screen.findByText('שמירה')

      expect(moreDetailsRow()).not.toBeInTheDocument()
    })

    it('is not offered for a book', async () => {
      stubSearchResults([PIRANESI])
      await openFormOf(PIRANESI)

      expect(moreDetailsRow()).not.toBeInTheDocument()
    })
  })

  it('shows what is known about a picked series', async () => {
    const fetchStub = stubSearchResults([SEVERANCE], { detailsReply: jsonReply(SEVERANCE_DETAILS) })

    await openDetailsOf(SEVERANCE)

    expect(await screen.findByText('Dan Erickson')).toBeInTheDocument()
    expect(detailsCalls(fetchStub)).toEqual([`${SEARCH_URL}/details?title=tv%2F95396`])
    expect(identityMeta()).toHaveTextContent('סדרה · 2022')
    expect(screen.getAllByText('Severance')).toHaveLength(1)
    expect(rowValue('איפה לצפות')).toHaveTextContent('Apple TV+ · Netflix')
    expect(screen.getByText('נתוני צפייה: JustWatch')).toBeInTheDocument()
    expect(rowValue('רשת')).toHaveTextContent('Apple TV+')
    expect(rowValue('הפרק הבא')).toHaveTextContent('12 במרץ 2027')
    expect(rowValue('מספר פרקים')).toHaveTextContent('19')
    expect(rowValue('אורך פרק')).toHaveTextContent('כ-50 דקות')
    expect(rowValue('יצירה')).toHaveTextContent('Dan Erickson')
    expect(rowValue('בהשתתפות')).toHaveTextContent('Adam Scott · Britt Lower')
    expect(genresShown()).toEqual(['דרמה', 'מסתורין', 'Workplace'])
    expect(screen.queryByText('אורך הסרט')).not.toBeInTheDocument()
  })

  it('keeps each name in a list on one line, breaking only between names', async () => {
    stubSearchResults([SEVERANCE], { detailsReply: jsonReply(SEVERANCE_DETAILS) })

    await openDetailsOf(SEVERANCE)
    await screen.findByText('Dan Erickson')

    expect(rowValue('בהשתתפות')?.textContent).toBe('Adam Scott · Britt Lower')
  })

  it('shows what is known about a picked movie', async () => {
    const fetchStub = stubSearchResults([DUNE], { detailsReply: jsonReply(DUNE_DETAILS) })

    await openDetailsOf(DUNE)

    expect(await screen.findByText('Dune: Part One')).toBeInTheDocument()
    expect(detailsCalls(fetchStub)).toEqual([`${SEARCH_URL}/details?title=movie%2F438631`])
    expect(identityMeta()).toHaveTextContent('סרט · 2021')
    expect(rowValue('אורך הסרט')).toHaveTextContent('135 דקות')
    expect(rowValue('בימוי')).toHaveTextContent('Denis Villeneuve')
    expect(rowValue('בהשתתפות')).toHaveTextContent('Timothée Chalamet · Zendaya')
    expect(genresShown()).toEqual(['מדע בדיוני'])
    expect(screen.queryByText('איפה לצפות')).not.toBeInTheDocument()
    expect(screen.queryByText('נתוני צפייה: JustWatch')).not.toBeInTheDocument()
    expect(screen.queryByText('מספר פרקים')).not.toBeInTheDocument()
    expect(screen.queryByText('יצירה')).not.toBeInTheDocument()
  })

  it('says it is loading until the details arrive', async () => {
    let answer: (response: Response) => void = () => {}

    const reply = new Promise<Response>((resolve) => {
      answer = resolve
    })

    stubSearchResults([SEVERANCE], { detailsReply: () => reply })
    await openDetailsOf(SEVERANCE)

    expect(await screen.findByText('טוען פרטים…')).toBeInTheDocument()

    answer(Response.json(SEVERANCE_DETAILS))

    expect(await screen.findByText('Dan Erickson')).toBeInTheDocument()
    expect(screen.queryByText('טוען פרטים…')).not.toBeInTheDocument()
  })

  it.each([
    ['the network is down', () => Promise.reject(new TypeError('offline'))],
    ['the lookup fails', async () => new Response(null, { status: 502 })],
    ['the id is refused', async () => new Response(null, { status: 400 })],
    ['the reply is malformed', async () => Response.json({ genres: 'drama' })],
  ])('says the details are unavailable when %s, and tries again on request', async (_case, failure) => {
    const replies = [failure, jsonReply(SEVERANCE_DETAILS)]
    const fetchStub = stubSearchResults([SEVERANCE], { detailsReply: () => (replies.shift() ?? failure)() })

    await openDetailsOf(SEVERANCE)

    expect(await screen.findByText('הפרטים לא זמינים כרגע')).toBeInTheDocument()

    await pressButton('לנסות שוב')

    expect(await screen.findByText('Dan Erickson')).toBeInTheDocument()
    expect(detailsCalls(fetchStub)).toHaveLength(2)
    expect(screen.queryByText('הפרטים לא זמינים כרגע')).not.toBeInTheDocument()
  })

  it('says there is nothing more when the reply has no details', async () => {
    stubSearchResults([SEVERANCE], { detailsReply: jsonReply({ originalTitle: 'Severance' }) })

    await openDetailsOf(SEVERANCE)

    expect(await screen.findByText('אין פרטים נוספים')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'צפייה' })).not.toBeInTheDocument()
  })

  it.each(['2026-00-15', '2026-02-30'])('leaves out a next episode date of %s, and shows the rest', async (date) => {
    stubSearchResults([SEVERANCE], { detailsReply: jsonReply({ ...SEVERANCE_DETAILS, nextEpisodeDate: date }) })

    await openDetailsOf(SEVERANCE)

    expect(await screen.findByText('Dan Erickson')).toBeInTheDocument()
    expect(screen.queryByText('הפרק הבא')).not.toBeInTheDocument()
  })
})
