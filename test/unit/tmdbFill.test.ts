import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { allEntries } from '../../src/data/repo'
import type { Entry } from '../../src/domain/types'
import { fillFromTmdb } from '../../src/pages/settings/tmdbFill'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { detailsCalls, DUNE, jsonReply, lengthCalls, SEVERANCE, stubSearchResults } from '../helpers/searchService'
import { DUNE_DETAILS, SEVERANCE_DETAILS } from '../helpers/titleDetails'

const DETAILS_BY_TITLE = new Map<string | null, object>([
  [DUNE.sourceId, DUNE_DETAILS],
  [SEVERANCE.sourceId, SEVERANCE_DETAILS],
  ['movie/1', { genres: [{ id: 10770, name: 'TV Movie' }] }],
])

const LENGTH_BY_TITLE = new Map<string | null, object>([
  [DUNE.sourceId, { minutes: 155 }],
  [SEVERANCE.sourceId, { minutes: 480 }],
  ['movie/1', {}],
])

const replyByTitle = (replies: Map<string | null, object>) => async (url: string) => {
  const reply = replies.get(new URL(url).searchParams.get('title'))

  return reply ? Response.json(reply) : new Response(null, { status: 502 })
}

const detailsByTitle = replyByTitle(DETAILS_BY_TITLE)

const lengthByTitle = replyByTitle(LENGTH_BY_TITLE)

const ONE_AIRED_SEASON = jsonReply({ seasons: 1 })

const stubTmdb = () =>
  stubSearchResults([], { detailsReply: detailsByTitle, lengthReply: lengthByTitle, seasonsReply: ONE_AIRED_SEASON })

const tmdbEntry = (sourceId: string, fields: Partial<Entry> = {}) => entry({ source: 'tmdb', sourceId, ...fields })

async function saved(...entries: Entry[]) {
  await db.entries.bulkPut(entries)

  return entries
}

const storedById = async () => new Map((await allEntries()).map((stored) => [stored.id, stored]))

const noProgress = () => {}

const signal = () => new AbortController().signal

describe('fillFromTmdb', () => {
  beforeEach(resetDb)

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('saves the mapped genres and the lengths of every waiting title', async () => {
    stubTmdb()

    const [dune, severance] = await saved(tmdbEntry(DUNE.sourceId), tmdbEntry(SEVERANCE.sourceId, { type: 'series' }))

    expect(await fillFromTmdb([dune, severance], noProgress, signal())).toEqual({ filled: 2, failed: 0 })

    const stored = await storedById()

    expect(stored.get(dune.id)).toMatchObject({ genres: ['scifi'], lengthMinutes: [155] })
    expect(stored.get(severance.id)).toMatchObject({ genres: ['drama', 'mystery'], lengthMinutes: [480] })
  })

  it('saves empty lists when TMDB gives no genres from the app list and no length, so it is not offered again', async () => {
    stubTmdb()

    const [tvMovie] = await saved(tmdbEntry('movie/1'))

    expect(await fillFromTmdb([tvMovie], noProgress, signal())).toEqual({ filled: 1, failed: 0 })
    expect((await storedById()).get(tvMovie.id)).toMatchObject({ genres: [], lengthMinutes: [] })
  })

  it('looks up only the length of a title that already has genres', async () => {
    const fetchStub = stubTmdb()

    const [dune] = await saved(tmdbEntry(DUNE.sourceId, { genres: ['drama'] }))

    expect(await fillFromTmdb([dune], noProgress, signal())).toEqual({ filled: 1, failed: 0 })
    expect((await storedById()).get(dune.id)).toMatchObject({ genres: ['drama'], lengthMinutes: [155] })
    expect(detailsCalls(fetchStub)).toEqual([])
  })

  it('looks up only the genres of a title that already has a length', async () => {
    const fetchStub = stubTmdb()

    const [dune] = await saved(tmdbEntry(DUNE.sourceId, { lengthMinutes: [150] }))

    expect(await fillFromTmdb([dune], noProgress, signal())).toEqual({ filled: 1, failed: 0 })
    expect((await storedById()).get(dune.id)).toMatchObject({ genres: ['scifi'], lengthMinutes: [150] })
    expect(lengthCalls(fetchStub)).toEqual([])
  })

  it('saves the genres found when the length fails, counts the title as failed, and looks up only the length next time', async () => {
    let lengthFails = true

    const fetchStub = stubSearchResults([], {
      detailsReply: detailsByTitle,
      lengthReply: async (url) => (lengthFails ? new Response(null, { status: 502 }) : lengthByTitle(url)),
    })

    const [dune] = await saved(tmdbEntry(DUNE.sourceId))

    expect(await fillFromTmdb([dune], noProgress, signal())).toEqual({ filled: 0, failed: 1 })

    const [afterFailure] = await allEntries()

    expect(afterFailure).toMatchObject({ genres: ['scifi'] })
    expect(afterFailure.lengthMinutes).toBeUndefined()

    lengthFails = false
    fetchStub.mockClear()

    expect(await fillFromTmdb([afterFailure], noProgress, signal())).toEqual({ filled: 1, failed: 0 })
    expect((await storedById()).get(dune.id)).toMatchObject({ genres: ['scifi'], lengthMinutes: [155] })
    expect(detailsCalls(fetchStub)).toEqual([])
  })

  it('counts a failed lookup and leaves that title waiting', async () => {
    stubTmdb()

    const [dune, unknown] = await saved(tmdbEntry(DUNE.sourceId), tmdbEntry('movie/404'))

    expect(await fillFromTmdb([dune, unknown], noProgress, signal())).toEqual({ filled: 1, failed: 1 })
    expect((await storedById()).get(unknown.id)).not.toHaveProperty('genres')
    expect((await storedById()).get(unknown.id)).not.toHaveProperty('lengthMinutes')
  })

  it('counts a title without a usable TMDB id as failed, without looking it up', async () => {
    const fetchStub = stubTmdb()

    const [broken] = await saved(tmdbEntry('438631'))

    expect(await fillFromTmdb([broken], noProgress, signal())).toEqual({ filled: 0, failed: 1 })
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('reports progress after each title, up to the total', async () => {
    stubTmdb()

    const entries = await saved(tmdbEntry(DUNE.sourceId), tmdbEntry('movie/404'), tmdbEntry('movie/1'))
    const onProgress = vi.fn()

    await fillFromTmdb(entries, onProgress, signal())

    expect(onProgress.mock.calls).toEqual([[1], [2], [3]])
  })

  it('keeps the tags of a title tagged on the form meanwhile', async () => {
    const [dune] = await saved(tmdbEntry(DUNE.sourceId, { lengthMinutes: [155] }))

    stubSearchResults([], {
      detailsReply: async (url) => {
        await db.entries.update(dune.id, { genres: ['comedy'] })

        return detailsByTitle(url)
      },
    })

    expect(await fillFromTmdb([dune], noProgress, signal())).toEqual({ filled: 0, failed: 0 })
    expect((await storedById()).get(dune.id)?.genres).toEqual(['comedy'])
  })

  it('starts no lookups once stopped', async () => {
    const fetchStub = stubTmdb()
    const controller = new AbortController()

    const [dune] = await saved(tmdbEntry(DUNE.sourceId))

    controller.abort()

    expect(await fillFromTmdb([dune], noProgress, controller.signal)).toEqual({ filled: 0, failed: 0 })
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('looks up at most four titles at a time', async () => {
    let inFlight = 0
    let mostInFlight = 0

    stubSearchResults([], {
      detailsReply: async () => {
        inFlight += 1
        mostInFlight = Math.max(mostInFlight, inFlight)
        await new Promise((resolve) => setTimeout(resolve, 1))
        inFlight -= 1

        return Response.json(DUNE_DETAILS)
      },
    })

    const entries = await saved(
      ...Array.from({ length: 7 }, (_, position) => tmdbEntry(`movie/${position + 10}`, { lengthMinutes: [] })),
    )

    expect(await fillFromTmdb(entries, noProgress, signal())).toEqual({ filled: 7, failed: 0 })
    expect(mostInFlight).toBe(4)
  })
})
