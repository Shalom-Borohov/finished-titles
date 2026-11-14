import { act, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { pickResult, pressButton, save, savedEntries, searchFor } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'
import { DUNE, jsonReply, SEARCH_URL, seasonsCalls, SEVERANCE, stubSearchResults } from '../helpers/searchService'

const FRIEREN = { source: 'tmdb', sourceId: 'tv/209867', title: 'Frieren', type: 'anime', year: 2023 } as const

const seasonsReply = (seasons: number) => jsonReply({ seasons })

const seasonsShown = () => screen.getByText('עונות שראיתי').closest('.stepper')?.querySelector('.stepper-count')

const settleLookup = () => act(() => new Promise((resolve) => setTimeout(resolve)))

function deferredSeasons() {
  let resolveReply: (response: Response) => void = () => {}

  const reply = new Promise<Response>((resolve) => {
    resolveReply = resolve
  })

  return {
    reply: () => reply,
    answer: (seasons: number) => resolveReply(Response.json({ seasons })),
  }
}

describe('prefilling seasons watched', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 7, 21, 30).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it.each([
    ['series', SEVERANCE, '95396'],
    ['anime', FRIEREN, '209867'],
  ])('fills in the seasons aired so far for a picked %s', async (_type, result, tvId) => {
    const fetchStub = stubSearchResults([result], { seasonsReply: seasonsReply(3) })

    renderAt('/tabs/home')
    await searchFor(result.title)
    await pickResult(new RegExp(result.title))

    await waitFor(() => expect(seasonsShown()).toHaveTextContent('3'))
    expect(seasonsCalls(fetchStub)).toEqual([`${SEARCH_URL}/seasons?tv=${tvId}`])

    await save()

    expect((await savedEntries())[0].seasons).toBe(3)
  })

  it('keeps a count pressed before the lookup answers', async () => {
    const lookup = deferredSeasons()

    stubSearchResults([SEVERANCE], { seasonsReply: lookup.reply })
    renderAt('/tabs/home')
    await searchFor('severance')
    await pickResult(/Severance/)
    await pressButton('עונה אחת יותר')
    lookup.answer(3)
    await settleLookup()

    expect(seasonsShown()).toHaveTextContent('1')

    await save()

    expect((await savedEntries())[0].seasons).toBe(1)
  })

  it.each([
    ['the network is down', () => Promise.reject(new TypeError('offline'))],
    ['the lookup fails', async () => new Response(null, { status: 502 })],
    ['the reply is malformed', async () => Response.json({ seasons: 'three' })],
    ['no season has aired yet', seasonsReply(0)],
  ])('leaves seasons empty, without a message, when %s', async (_case, reply) => {
    const fetchStub = stubSearchResults([SEVERANCE], { seasonsReply: reply })

    renderAt('/tabs/home')
    await searchFor('severance')
    await pickResult(/Severance/)
    await waitFor(() => expect(seasonsCalls(fetchStub)).toHaveLength(1))
    await settleLookup()

    expect(seasonsShown()).toHaveTextContent('—')
    expect(document.querySelector('ion-toast')).toBeNull()

    await save()

    expect((await savedEntries())[0].seasons).toBeUndefined()
  })

  it.each([
    ['a movie', DUNE],
    ['a show whose id does not name its type', { ...SEVERANCE, sourceId: '95396' }],
  ])('does not look up seasons for %s', async (_case, result) => {
    const fetchStub = stubSearchResults([result], { seasonsReply: seasonsReply(3) })

    renderAt('/tabs/home')
    await searchFor(result.title)
    await pickResult(new RegExp(result.title))
    await screen.findByText('שמירה')
    await settleLookup()

    expect(seasonsCalls(fetchStub)).toEqual([])
  })

  it.each([
    [
      'opened from its poster',
      async () => {
        renderAt('/tabs/home/series')
        await pickResult(/Severance/)
      },
    ],
    [
      'picked again from search',
      async () => {
        renderAt('/tabs/home')
        await searchFor('severance')
        await pickResult(/Severance.*כבר ברשימה/)
      },
    ],
  ])('does not look up seasons for a show already in the list, %s', async (_case, open) => {
    await db.entries.add(entry({ title: 'Severance', type: 'series', source: 'tmdb', sourceId: 'tv/95396' }))

    const fetchStub = stubSearchResults([SEVERANCE], { seasonsReply: seasonsReply(3) })

    await open()
    await screen.findByText('שמירה')
    await settleLookup()

    expect(seasonsShown()).toHaveTextContent('—')
    expect(seasonsCalls(fetchStub)).toEqual([])
  })

  describe('the years a show ran', () => {
    const showReply = (seasons: number, endYear?: number) => jsonReply({ seasons, endYear })

    const releaseYearShown = () => document.querySelector('.release-year')

    it('shows the years an ended show ran and saves its end year', async () => {
      stubSearchResults([SEVERANCE], { seasonsReply: showReply(3, 2025) })
      renderAt('/tabs/home')
      await searchFor('severance')
      await pickResult(/Severance/)

      await waitFor(() => expect(releaseYearShown()).toHaveTextContent('2022–2025'))
      expect(releaseYearShown()).toHaveAttribute('dir', 'ltr')
      expect(seasonsShown()).toHaveTextContent('3')

      await save()

      expect((await savedEntries())[0]).toMatchObject({ seasons: 3, endYear: 2025 })
    })

    it('shows only the start year for a show still running', async () => {
      const fetchStub = stubSearchResults([SEVERANCE], { seasonsReply: showReply(3) })

      renderAt('/tabs/home')
      await searchFor('severance')
      await pickResult(/Severance/)
      await waitFor(() => expect(seasonsShown()).toHaveTextContent('3'))

      expect(seasonsCalls(fetchStub)).toHaveLength(1)
      expect(releaseYearShown()).toHaveTextContent(/^2022$/)

      await save()

      expect((await savedEntries())[0].endYear).toBeUndefined()
    })

    it('shows one year for a show that started and ended the same year', async () => {
      stubSearchResults([SEVERANCE], { seasonsReply: showReply(1, 2022) })
      renderAt('/tabs/home')
      await searchFor('severance')
      await pickResult(/Severance/)
      await waitFor(() => expect(seasonsShown()).toHaveTextContent('1'))

      expect(releaseYearShown()).toHaveTextContent(/^2022$/)
    })

    it('keeps the end year when no season has aired', async () => {
      const fetchStub = stubSearchResults([SEVERANCE], { seasonsReply: showReply(0, 2025) })

      renderAt('/tabs/home')
      await searchFor('severance')
      await pickResult(/Severance/)
      await waitFor(() => expect(seasonsCalls(fetchStub)).toHaveLength(1))
      await waitFor(() => expect(releaseYearShown()).toHaveTextContent('2022–2025'))

      expect(seasonsShown()).toHaveTextContent('—')

      await save()

      const [saved] = await savedEntries()

      expect(saved.endYear).toBe(2025)
      expect(saved.seasons).toBeUndefined()
    })

    it('shows only the start year after switching to a type that keeps no end year', async () => {
      stubSearchResults([SEVERANCE], { seasonsReply: showReply(3, 2025) })
      renderAt('/tabs/home')
      await searchFor('severance')
      await pickResult(/Severance/)
      await waitFor(() => expect(releaseYearShown()).toHaveTextContent('2022–2025'))

      fireEvent.change(screen.getByLabelText('סוג'), { target: { value: 'movie' } })

      expect(releaseYearShown()).toHaveTextContent(/^2022$/)
    })

    it('shows the years a saved show ran when it is edited', async () => {
      await db.entries.add(entry({ title: 'Breaking Bad', type: 'series', releaseYear: 2008, endYear: 2013 }))
      stubSearchResults([])
      renderAt('/tabs/home/series')
      await pickResult(/Breaking Bad/)
      await screen.findByText('שמירה')

      expect(releaseYearShown()).toHaveTextContent('2008–2013')
    })
  })

  describe('after the count is filled in', () => {
    beforeEach(async () => {
      stubSearchResults([SEVERANCE], { seasonsReply: seasonsReply(3) })
      renderAt('/tabs/home')
      await searchFor('severance')
      await pickResult(/Severance/)
      await waitFor(() => expect(seasonsShown()).toHaveTextContent('3'))
      await pressButton('עצרתי באמצע')
    })

    it('does not save it for a show marked as stopped', async () => {
      await save()

      const [saved] = await savedEntries()

      expect(saved.status).toBe('stopped')
      expect(saved.seasons).toBeUndefined()
      expect(saved.stoppedSeason).toBeUndefined()
    })

    it('shows it again when the show is switched back to finished', async () => {
      await pressButton('סיימתי')

      expect(seasonsShown()).toHaveTextContent('3')
    })
  })
})
