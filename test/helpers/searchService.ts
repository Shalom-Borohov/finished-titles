import { vi } from 'vitest'

export const SEARCH_URL = 'https://search.test'

export const SEVERANCE = { source: 'tmdb', sourceId: 'tv/95396', title: 'Severance', type: 'series', year: 2022 } as const

export const DUNE = { source: 'tmdb', sourceId: 'movie/438631', title: 'Dune', type: 'movie', year: 2021 } as const

export const jsonReply = (body: object) => async () => Response.json(body)

type StubResult = {
  source: string
  sourceId: string
  title: string
  type?: string
  year?: number
  posterUrl?: string
}

type StubOptions = {
  unavailable?: string[]
  seasonsReply?: () => Promise<Response>
  detailsReply?: () => Promise<Response>
}

const SEASONS_URL = `${SEARCH_URL}/seasons`

const DETAILS_URL = `${SEARCH_URL}/details`

const notFound = async () => new Response(null, { status: 404 })

export function stubSearchResults(
  results: StubResult[],
  { unavailable = [], seasonsReply = notFound, detailsReply = notFound }: StubOptions = {},
) {
  const fetchStub = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    const url = String(input)

    if (url.startsWith(SEASONS_URL)) {
      return seasonsReply()
    }

    return url.startsWith(DETAILS_URL) ? detailsReply() : Response.json({ results, unavailable })
  })

  vi.stubEnv('VITE_SEARCH_URL', SEARCH_URL)
  vi.stubGlobal('fetch', fetchStub)

  return fetchStub
}

const callsTo = (fetchStub: ReturnType<typeof stubSearchResults>, prefix: string) =>
  fetchStub.mock.calls.map(([input]) => String(input)).filter((url) => url.startsWith(prefix))

export const seasonsCalls = (fetchStub: ReturnType<typeof stubSearchResults>) => callsTo(fetchStub, SEASONS_URL)

export const detailsCalls = (fetchStub: ReturnType<typeof stubSearchResults>) => callsTo(fetchStub, DETAILS_URL)

export function stubSearchFailure() {
  vi.stubEnv('VITE_SEARCH_URL', SEARCH_URL)
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')))
}
