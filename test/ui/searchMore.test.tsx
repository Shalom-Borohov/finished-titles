import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pressButton, searchFor, typeQuery } from '../helpers/addFlow'
import { resetDb } from '../helpers/db'
import { hideEndOfResults, revealEndOfResults, stubIntersectionObserver } from '../helpers/intersection'
import { expectInOrder } from '../helpers/ionic'
import { renderAt } from '../helpers/renderAt'
import {
  DUNE,
  failingOnce,
  holdingPage,
  pagesReply,
  SEARCH_URL,
  type SearchReply,
  searchCalls,
  SEVERANCE,
  stubSearchPages,
  stubSearchResults,
} from '../helpers/searchService'

const DUNE_PART_TWO = { source: 'tmdb', sourceId: 'movie/693134', title: 'Dune: Part Two', type: 'movie' } as const

const DUNE_MESSIAH = { source: 'openlibrary', sourceId: 'OL893527W', title: 'Dune Messiah', type: 'book' } as const

const TWO_DUNE_PAGES = [{ results: [DUNE], hasMore: true }, { results: [DUNE_PART_TWO] }]

const LUMON_HANDBOOK = {
  source: 'openlibrary',
  sourceId: 'OL37808640W',
  title: 'Severance: The Lumon Handbook',
  type: 'book',
} as const

const TWO_SEVERANCE_PAGES = [{ results: [SEVERANCE], hasMore: true }, { results: [LUMON_HANDBOOK] }]

const LATE_REPLY_WAIT_MS = 50

const duneOrElse =
  (duneReply: SearchReply, otherReply: SearchReply): SearchReply =>
  async (request) =>
    request.searchParams.get('q') === 'dune' ? duneReply(request) : otherReply(request)

const settle = () => act(() => new Promise((resolve) => setTimeout(resolve, LATE_REPLY_WAIT_MS)))

const HALO_PAGE = [
  { source: 'tmdb', sourceId: 'tv/52814', title: 'Halo', type: 'series' },
  { source: 'tmdb', sourceId: 'movie/75174', title: 'Halo Legends', type: 'movie' },
  { source: 'openlibrary', sourceId: 'OL5735363W', title: 'Halo: The Fall of Reach', type: 'book' },
  { source: 'igdb', sourceId: '740', title: 'Halo: Combat Evolved', type: 'game' },
  { source: 'igdb', sourceId: '986', title: 'Halo 2', type: 'game' },
]

describe('loading more search results', () => {
  beforeEach(async () => {
    await resetDb()
    stubIntersectionObserver()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('loads the next page once the end of the results shows, below the first page', async () => {
    const fetchStub = stubSearchPages(pagesReply(TWO_DUNE_PAGES))

    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')

    expect(searchCalls(fetchStub)).toEqual([`${SEARCH_URL}/search?q=dune&page=1`])

    await revealEndOfResults()

    await expectInOrder(['Dune', 'Dune: Part Two'])
    expect(searchCalls(fetchStub)).toEqual([`${SEARCH_URL}/search?q=dune&page=1`, `${SEARCH_URL}/search?q=dune&page=2`])
  })

  it('keeps loading pages while the end of the results stays on screen', async () => {
    stubSearchPages(
      pagesReply([
        { results: [DUNE], hasMore: true },
        { results: [DUNE_PART_TWO], hasMore: true },
        { results: [DUNE_MESSIAH] },
      ]),
    )

    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')
    await revealEndOfResults()
    await screen.findByText('Dune: Part Two')
    await revealEndOfResults()

    await expectInOrder(['Dune', 'Dune: Part Two', 'Dune Messiah'])
  })

  it('loads one page each time the end of the results shows', async () => {
    const fetchStub = stubSearchPages(
      pagesReply([
        { results: [DUNE], hasMore: true },
        { results: [DUNE_PART_TWO], hasMore: true },
        { results: [DUNE_MESSIAH] },
      ]),
    )

    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')
    await revealEndOfResults()
    await screen.findByText('Dune: Part Two')
    await settle()

    expect(searchCalls(fetchStub)).toHaveLength(2)
  })

  it('says nothing about a first page with no results while more are on their way', async () => {
    const fetchStub = stubSearchPages(pagesReply([{ results: [], hasMore: true }, { results: [DUNE] }]))

    renderAt('/tabs/home')
    await searchFor('dune')
    await waitFor(() => expect(searchCalls(fetchStub)).toHaveLength(1))
    await settle()

    expect(screen.queryByText('לא נמצאו תוצאות')).not.toBeInTheDocument()

    await revealEndOfResults()

    expect(await screen.findByText('Dune')).toBeVisible()
  })

  it('keeps offering manual entry as not found while more pages are coming, with a source missing', async () => {
    const fetchStub = stubSearchPages(
      pagesReply([{ results: [], hasMore: true, unavailable: ['igdb'] }, { results: [DUNE], unavailable: ['igdb'] }]),
    )

    renderAt('/tabs/home')
    await searchFor('dune')
    await waitFor(() => expect(searchCalls(fetchStub)).toHaveLength(1))
    await settle()

    expect(screen.getByRole('button', { name: 'לא מצאתי, הוספה ידנית' })).toBeVisible()
    expect(screen.getByText('חלק ממקורות החיפוש לא זמינים כרגע')).toBeVisible()

    await revealEndOfResults()

    expect(await screen.findByText('Dune')).toBeVisible()
  })

  it('asks for no more pages once the search service says there are none', async () => {
    const fetchStub = stubSearchPages(pagesReply(TWO_DUNE_PAGES))

    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')
    await revealEndOfResults()
    await screen.findByText('Dune: Part Two')
    await settle()

    expect(searchCalls(fetchStub)).toHaveLength(2)
    expect(document.querySelector('.load-more')).not.toBeInTheDocument()
  })

  it('says more results are loading while the next page is on its way', async () => {
    const { reply, release } = holdingPage(2, pagesReply(TWO_DUNE_PAGES))

    stubSearchPages(reply)
    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')
    await revealEndOfResults()

    expect(await screen.findByText('טוען עוד…')).toBeVisible()

    release()

    expect(await screen.findByText('Dune: Part Two')).toBeVisible()
    expect(screen.queryByText('טוען עוד…')).not.toBeInTheDocument()
  })

  it('says when the next page failed, stops asking, and loads it again on retry', async () => {
    const fetchStub = stubSearchPages(failingOnce(2, pagesReply(TWO_DUNE_PAGES)))

    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')
    await revealEndOfResults()

    expect(await screen.findByText('לא הצלחנו לטעון עוד')).toBeVisible()

    hideEndOfResults()
    await revealEndOfResults()

    expect(searchCalls(fetchStub)).toHaveLength(2)

    await pressButton('נסו שוב')

    await expectInOrder(['Dune', 'Dune: Part Two'])
    expect(screen.queryByText('לא הצלחנו לטעון עוד')).not.toBeInTheDocument()
  })

  it('announces loading the next page, and its failure, from the same status line', async () => {
    const { reply, release } = holdingPage(2, failingOnce(2, pagesReply(TWO_DUNE_PAGES)))

    stubSearchPages(reply)
    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')
    await revealEndOfResults()

    const line = await screen.findByText('טוען עוד…')

    expect(line).toHaveRole('status')

    release()

    await waitFor(() => expect(line).toHaveTextContent('לא הצלחנו לטעון עוד'))
  })

  it('drops the earlier pages on a new search, and pages it from the start', async () => {
    const fetchStub = stubSearchPages(duneOrElse(pagesReply(TWO_DUNE_PAGES), pagesReply(TWO_SEVERANCE_PAGES)))

    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')
    await revealEndOfResults()
    await screen.findByText('Dune: Part Two')
    await typeQuery('severance')
    await screen.findByText('Severance')
    await revealEndOfResults()

    await expectInOrder(['Severance', 'Severance: The Lumon Handbook'])
    expect(screen.queryByText('Dune')).not.toBeInTheDocument()
    expect(screen.queryByText('Dune: Part Two')).not.toBeInTheDocument()
    expect(searchCalls(fetchStub).slice(2)).toEqual([
      `${SEARCH_URL}/search?q=severance&page=1`,
      `${SEARCH_URL}/search?q=severance&page=2`,
    ])
  })

  it('never shows a page of an earlier search that arrives late', async () => {
    const { reply, release } = holdingPage(2, pagesReply(TWO_DUNE_PAGES))

    stubSearchPages(duneOrElse(reply, pagesReply([{ results: [SEVERANCE] }])))
    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')
    await revealEndOfResults()
    await screen.findByText('טוען עוד…')
    await typeQuery('severance')
    await screen.findByText('Severance')
    release()
    await settle()

    expect(screen.queryByText('Dune: Part Two')).not.toBeInTheDocument()
    expect(screen.getByText('Severance')).toBeVisible()
  })

  it('offers manual entry right under the search field, above the results', async () => {
    stubSearchResults([DUNE])
    renderAt('/tabs/home')
    await searchFor('dune')
    await screen.findByText('Dune')

    await expectInOrder(['לא מצאתי, הוספה ידנית', 'Dune'])
    expect(screen.getByPlaceholderText('שם של סרט, סדרה, ספר, משחק…')).toBeVisible()
  })

  it('shows games first when searching from the games list, then the rest mixed by rank', async () => {
    stubSearchResults(HALO_PAGE)
    renderAt('/tabs/home/game')
    await searchFor('halo')

    await expectInOrder(['Halo: Combat Evolved', 'Halo 2', 'Halo', 'Halo: The Fall of Reach', 'Halo Legends'])
  })

  it('mixes every source by rank when searching from home', async () => {
    stubSearchResults(HALO_PAGE)
    renderAt('/tabs/home')
    await searchFor('halo')

    await expectInOrder(['Halo', 'Halo: The Fall of Reach', 'Halo: Combat Evolved', 'Halo Legends', 'Halo 2'])
  })
})
