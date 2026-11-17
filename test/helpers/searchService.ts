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
  genreIds?: number[]
}

type SearchPage = { results: StubResult[]; hasMore?: boolean; unavailable?: string[] }

export type SearchReply = (request: URL) => Promise<Response>

type OtherReplies = {
  seasonsReply?: () => Promise<Response>
  detailsReply?: (url: string) => Promise<Response>
}

type StubOptions = OtherReplies & { unavailable?: string[] }

const SEARCH_PAGES_URL = `${SEARCH_URL}/search`

const SEASONS_URL = `${SEARCH_URL}/seasons`

const DETAILS_URL = `${SEARCH_URL}/details`

const notFound = async () => new Response(null, { status: 404 })

const serverError = async () => new Response(null, { status: 500 })

export const searchPageReply = async ({ results, hasMore = false, unavailable = [] }: SearchPage) =>
  Response.json({ results, hasMore, unavailable })

const pageOf = (request: URL) => Number(request.searchParams.get('page'))

export const pagesReply = (pages: SearchPage[]) => async (request: URL) => searchPageReply(pages[pageOf(request) - 1])

export function failingOnce(failingPage: number, reply: SearchReply): SearchReply {
  let hasFailed = false

  return async (request) => {
    if (hasFailed || pageOf(request) !== failingPage) {
      return reply(request)
    }

    hasFailed = true

    return serverError()
  }
}

export function holdingPage(heldPage: number, reply: SearchReply) {
  let open: () => void

  const opened = new Promise<void>((resolve) => {
    open = resolve
  })

  const heldReply: SearchReply = async (request) => {
    if (pageOf(request) === heldPage) {
      await opened
    }

    return reply(request)
  }

  return { reply: heldReply, release: () => open() }
}

export function stubSearchPages(
  searchReply: SearchReply,
  { seasonsReply = notFound, detailsReply = notFound }: OtherReplies = {},
) {
  const fetchStub = vi.fn<typeof fetch>().mockImplementation(async (input) => {
    const url = String(input)

    if (url.startsWith(SEASONS_URL)) {
      return seasonsReply()
    }

    return url.startsWith(DETAILS_URL) ? detailsReply(url) : searchReply(new URL(url))
  })

  vi.stubEnv('VITE_SEARCH_URL', SEARCH_URL)
  vi.stubGlobal('fetch', fetchStub)

  return fetchStub
}

export const stubSearchResults = (results: StubResult[], { unavailable = [], ...otherReplies }: StubOptions = {}) =>
  stubSearchPages(async () => searchPageReply({ results, unavailable }), otherReplies)

type FetchStub = ReturnType<typeof stubSearchPages>

const callsTo = (fetchStub: FetchStub, prefix: string) =>
  fetchStub.mock.calls.map(([input]) => String(input)).filter((url) => url.startsWith(prefix))

export const searchCalls = (fetchStub: FetchStub) => callsTo(fetchStub, SEARCH_PAGES_URL)

export const seasonsCalls = (fetchStub: FetchStub) => callsTo(fetchStub, SEASONS_URL)

export const detailsCalls = (fetchStub: FetchStub) => callsTo(fetchStub, DETAILS_URL)

export function stubSearchFailure() {
  vi.stubEnv('VITE_SEARCH_URL', SEARCH_URL)
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')))
}
