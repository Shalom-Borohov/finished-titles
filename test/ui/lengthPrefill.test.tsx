import { act, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { pickResult, pressButton, save, savedEntries, searchFor } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'
import { DUNE, jsonReply, lengthCalls, SEARCH_URL, SEVERANCE, stubSearchResults } from '../helpers/searchService'

const SEASON_MINUTES = new Map<string | null, object>([
  ['1', { minutes: 480 }],
  ['2', { minutes: 510 }],
])

const minutesBySeason = async (url: string) =>
  Response.json(SEASON_MINUTES.get(new URL(url).searchParams.get('season')))

const settleLookup = () => act(() => new Promise((resolve) => setTimeout(resolve)))

describe('looking up the length of a picked title', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 7, 21, 30).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('saves the runtime of a picked movie', async () => {
    const fetchStub = stubSearchResults([DUNE], { lengthReply: jsonReply({ minutes: 155 }) })

    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)
    await waitFor(() => expect(lengthCalls(fetchStub)).toEqual([`${SEARCH_URL}/length?title=movie%2F438631`]))
    await settleLookup()
    await save()

    expect((await savedEntries())[0].lengthMinutes).toEqual([155])
  })

  it('saves the minutes of each aired season of a picked show', async () => {
    const fetchStub = stubSearchResults([SEVERANCE], {
      seasonsReply: jsonReply({ seasons: 2 }),
      lengthReply: minutesBySeason,
    })

    renderAt('/tabs/home')
    await searchFor('severance')
    await pickResult(/Severance/)
    await waitFor(() => expect(lengthCalls(fetchStub)).toHaveLength(2))
    await settleLookup()
    await save()

    expect((await savedEntries())[0].lengthMinutes).toEqual([480, 510])
  })

  it('still saves the title, with no length and no message, when the lookup fails', async () => {
    const fetchStub = stubSearchResults([DUNE], { lengthReply: async () => new Response(null, { status: 502 }) })

    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune/)
    await waitFor(() => expect(lengthCalls(fetchStub)).toHaveLength(1))
    await settleLookup()

    expect(document.querySelector('ion-toast')).toBeNull()

    await save()

    const [saved] = await savedEntries()

    expect(saved.title).toBe('Dune')
    expect(saved.lengthMinutes).toBeUndefined()
  })

  it('makes no length lookup for a title typed by hand', async () => {
    const fetchStub = stubSearchResults([], { lengthReply: jsonReply({ minutes: 155 }) })

    renderAt('/tabs/home')
    await searchFor('Home video')
    await pressButton('לא מצאתי, הוספה ידנית')
    await screen.findByText('שמירה')
    await settleLookup()
    await save()

    expect((await savedEntries())[0].lengthMinutes).toBeUndefined()
    expect(lengthCalls(fetchStub)).toEqual([])
  })

  it('makes no length lookup when a saved title is edited', async () => {
    await db.entries.add(entry({ title: 'Dune', type: 'movie', source: 'tmdb', sourceId: DUNE.sourceId }))

    const fetchStub = stubSearchResults([], { lengthReply: jsonReply({ minutes: 155 }) })

    renderAt('/tabs/home/movie')
    await pickResult(/Dune/)
    await screen.findByText('שמירה')
    await settleLookup()

    expect(lengthCalls(fetchStub)).toEqual([])
  })

  it('makes no length lookup when a picked title is already in the list', async () => {
    await db.entries.add(entry({ title: 'Dune', type: 'movie', source: 'tmdb', sourceId: DUNE.sourceId }))

    const fetchStub = stubSearchResults([DUNE], { lengthReply: jsonReply({ minutes: 155 }) })

    renderAt('/tabs/home')
    await searchFor('dune')
    await pickResult(/Dune.*כבר ברשימה/)
    await screen.findByText('שמירה')
    await settleLookup()

    expect(lengthCalls(fetchStub)).toEqual([])
  })
})
