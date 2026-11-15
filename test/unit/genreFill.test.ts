import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { allEntries } from '../../src/data/repo'
import type { Entry } from '../../src/domain/types'
import { fillGenres } from '../../src/pages/settings/genreFill'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { DUNE, SEVERANCE, stubSearchResults } from '../helpers/searchService'
import { DUNE_DETAILS, SEVERANCE_DETAILS } from '../helpers/titleDetails'

const DETAILS_BY_TITLE = new Map<string | null, object>([
  [DUNE.sourceId, DUNE_DETAILS],
  [SEVERANCE.sourceId, SEVERANCE_DETAILS],
  ['movie/1', { genres: [{ id: 10770, name: 'TV Movie' }] }],
])

async function detailsByTitle(url: string) {
  const details = DETAILS_BY_TITLE.get(new URL(url).searchParams.get('title'))

  return details ? Response.json(details) : new Response(null, { status: 502 })
}

const tmdbEntry = (sourceId: string, fields: Partial<Entry> = {}) => entry({ source: 'tmdb', sourceId, ...fields })

async function saved(...entries: Entry[]) {
  await db.entries.bulkPut(entries)

  return entries
}

const genresById = async () => new Map((await allEntries()).map(({ id, genres }) => [id, genres]))

const noProgress = () => {}

const signal = () => new AbortController().signal

describe('fillGenres', () => {
  beforeEach(resetDb)

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('saves the mapped genres of every waiting title', async () => {
    stubSearchResults([], { detailsReply: detailsByTitle })

    const [dune, severance] = await saved(tmdbEntry(DUNE.sourceId), tmdbEntry(SEVERANCE.sourceId, { type: 'series' }))

    expect(await fillGenres([dune, severance], noProgress, signal())).toEqual({ filled: 2, failed: 0 })

    const genres = await genresById()

    expect(genres.get(dune.id)).toEqual(['scifi'])
    expect(genres.get(severance.id)).toEqual(['drama', 'mystery'])
  })

  it('saves an empty list when TMDB gives no genres from the app list, so it is not offered again', async () => {
    stubSearchResults([], { detailsReply: detailsByTitle })

    const [tvMovie] = await saved(tmdbEntry('movie/1'))

    expect(await fillGenres([tvMovie], noProgress, signal())).toEqual({ filled: 1, failed: 0 })
    expect((await genresById()).get(tvMovie.id)).toEqual([])
  })

  it('counts a failed lookup and leaves that title waiting', async () => {
    stubSearchResults([], { detailsReply: detailsByTitle })

    const [dune, unknown] = await saved(tmdbEntry(DUNE.sourceId), tmdbEntry('movie/404'))

    expect(await fillGenres([dune, unknown], noProgress, signal())).toEqual({ filled: 1, failed: 1 })
    expect((await genresById()).get(unknown.id)).toBeUndefined()
  })

  it('counts a title without a usable TMDB id as failed, without looking it up', async () => {
    const fetchStub = stubSearchResults([], { detailsReply: detailsByTitle })

    const [broken] = await saved(tmdbEntry('438631'))

    expect(await fillGenres([broken], noProgress, signal())).toEqual({ filled: 0, failed: 1 })
    expect(fetchStub).not.toHaveBeenCalled()
  })

  it('reports progress after each title, up to the total', async () => {
    stubSearchResults([], { detailsReply: detailsByTitle })

    const entries = await saved(tmdbEntry(DUNE.sourceId), tmdbEntry('movie/404'), tmdbEntry('movie/1'))
    const onProgress = vi.fn()

    await fillGenres(entries, onProgress, signal())

    expect(onProgress.mock.calls).toEqual([[1], [2], [3]])
  })

  it('keeps the tags of a title tagged on the form meanwhile', async () => {
    const [dune] = await saved(tmdbEntry(DUNE.sourceId))

    stubSearchResults([], {
      detailsReply: async (url) => {
        await db.entries.update(dune.id, { genres: ['comedy'] })

        return detailsByTitle(url)
      },
    })

    expect(await fillGenres([dune], noProgress, signal())).toEqual({ filled: 0, failed: 0 })
    expect((await genresById()).get(dune.id)).toEqual(['comedy'])
  })

  it('starts no lookups once stopped', async () => {
    const fetchStub = stubSearchResults([], { detailsReply: detailsByTitle })
    const controller = new AbortController()

    const [dune] = await saved(tmdbEntry(DUNE.sourceId))

    controller.abort()

    expect(await fillGenres([dune], noProgress, controller.signal)).toEqual({ filled: 0, failed: 0 })
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

    const entries = await saved(...Array.from({ length: 7 }, (_, position) => tmdbEntry(`movie/${position + 10}`)))

    expect(await fillGenres(entries, noProgress, signal())).toEqual({ filled: 7, failed: 0 })
    expect(mostInFlight).toBe(4)
  })
})
