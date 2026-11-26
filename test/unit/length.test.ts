import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchTitleMinutes } from '../../src/search/length'
import {
  DUNE,
  jsonReply,
  lengthCalls,
  SEARCH_URL,
  seasonsCalls,
  SEVERANCE,
  stubSearchResults,
} from '../helpers/searchService'

const SEASON_MINUTES = new Map<string | null, object>([
  ['1', { minutes: 480 }],
  ['2', {}],
  ['3', { minutes: 510 }],
])

async function minutesBySeason(url: string) {
  return Response.json(SEASON_MINUTES.get(new URL(url).searchParams.get('season')))
}

const signal = () => new AbortController().signal

const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds))

describe('fetchTitleMinutes', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('gives a movie its runtime, without asking for seasons', async () => {
    const fetchStub = stubSearchResults([], { lengthReply: jsonReply({ minutes: 155 }) })

    expect(await fetchTitleMinutes(DUNE.sourceId, signal())).toEqual([155])
    expect(lengthCalls(fetchStub)).toEqual([`${SEARCH_URL}/length?title=movie%2F438631`])
    expect(seasonsCalls(fetchStub)).toEqual([])
  })

  it('gives an empty list for a movie TMDB has no length for', async () => {
    stubSearchResults([], { lengthReply: jsonReply({}) })

    expect(await fetchTitleMinutes(DUNE.sourceId, signal())).toEqual([])
  })

  it('gives a show the minutes of each aired season, season 1 first, and none for a season without a length', async () => {
    const fetchStub = stubSearchResults([], { seasonsReply: jsonReply({ seasons: 3 }), lengthReply: minutesBySeason })

    expect(await fetchTitleMinutes(SEVERANCE.sourceId, signal())).toEqual([480, 0, 510])
    expect(seasonsCalls(fetchStub)).toEqual([`${SEARCH_URL}/seasons?tv=95396`])
    expect(lengthCalls(fetchStub).toSorted()).toEqual([
      `${SEARCH_URL}/length?title=tv%2F95396&season=1`,
      `${SEARCH_URL}/length?title=tv%2F95396&season=2`,
      `${SEARCH_URL}/length?title=tv%2F95396&season=3`,
    ])
  })

  it('keeps season order when later seasons answer first', async () => {
    stubSearchResults([], {
      seasonsReply: jsonReply({ seasons: 3 }),
      lengthReply: async (url) => {
        const season = Number(new URL(url).searchParams.get('season'))

        await pause(4 - season)

        return Response.json({ minutes: season * 100 })
      },
    })

    expect(await fetchTitleMinutes(SEVERANCE.sourceId, signal())).toEqual([100, 200, 300])
  })

  it('gives an empty list for a show with no aired season, without asking for lengths', async () => {
    const fetchStub = stubSearchResults([], { seasonsReply: jsonReply({ seasons: 0 }), lengthReply: minutesBySeason })

    expect(await fetchTitleMinutes(SEVERANCE.sourceId, signal())).toEqual([])
    expect(lengthCalls(fetchStub)).toEqual([])
  })

  it('looks up at most four seasons at a time', async () => {
    let inFlight = 0
    let mostInFlight = 0

    stubSearchResults([], {
      seasonsReply: jsonReply({ seasons: 7 }),
      lengthReply: async () => {
        inFlight += 1
        mostInFlight = Math.max(mostInFlight, inFlight)
        await pause(1)
        inFlight -= 1

        return Response.json({ minutes: 60 })
      },
    })

    expect(await fetchTitleMinutes(SEVERANCE.sourceId, signal())).toEqual([60, 60, 60, 60, 60, 60, 60])
    expect(mostInFlight).toBe(4)
  })

  it('fails when one season fails', async () => {
    stubSearchResults([], {
      seasonsReply: jsonReply({ seasons: 3 }),
      lengthReply: async (url) =>
        url.endsWith('season=2') ? new Response(null, { status: 502 }) : Response.json({ minutes: 60 }),
    })

    await expect(fetchTitleMinutes(SEVERANCE.sourceId, signal())).rejects.toThrow()
  })

  it('stops asking for more seasons once one fails', async () => {
    const fetchStub = stubSearchResults([], {
      seasonsReply: jsonReply({ seasons: 8 }),
      lengthReply: async (url) => {
        if (url.endsWith('season=1')) {
          return new Response(null, { status: 502 })
        }

        await pause(5)

        return Response.json({ minutes: 60 })
      },
    })

    await expect(fetchTitleMinutes(SEVERANCE.sourceId, signal())).rejects.toThrow()
    await pause(20)

    expect(lengthCalls(fetchStub)).toHaveLength(4)
  })

  it('fails when the aired seasons cannot be found', async () => {
    stubSearchResults([], { lengthReply: jsonReply({ minutes: 60 }) })

    await expect(fetchTitleMinutes(SEVERANCE.sourceId, signal())).rejects.toThrow()
  })

  it('fails when the run is stopped, rather than giving a partial list', async () => {
    const controller = new AbortController()

    vi.stubEnv('VITE_SEARCH_URL', SEARCH_URL)
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockImplementation(async (_input, init) => {
        if (init?.signal?.aborted) {
          throw new DOMException('stopped', 'AbortError')
        }

        controller.abort()

        return Response.json({ seasons: 3 })
      }),
    )

    await expect(fetchTitleMinutes(SEVERANCE.sourceId, controller.signal)).rejects.toThrow()
  })
})
