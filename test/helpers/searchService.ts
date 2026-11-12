import { vi } from 'vitest'

export const SEARCH_URL = 'https://search.test'

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
}

const SEASONS_URL = `${SEARCH_URL}/seasons`

const seasonsNotFound = async () => new Response(null, { status: 404 })

export function stubSearchResults(results: StubResult[], { unavailable = [], seasonsReply = seasonsNotFound }: StubOptions = {}) {
  const fetchStub = vi
    .fn<typeof fetch>()
    .mockImplementation(async (input) =>
      String(input).startsWith(SEASONS_URL) ? seasonsReply() : Response.json({ results, unavailable }),
    )

  vi.stubEnv('VITE_SEARCH_URL', SEARCH_URL)
  vi.stubGlobal('fetch', fetchStub)

  return fetchStub
}

export const seasonsCalls = (fetchStub: ReturnType<typeof stubSearchResults>) =>
  fetchStub.mock.calls.map(([input]) => String(input)).filter((url) => url.startsWith(SEASONS_URL))

export function stubSearchFailure() {
  vi.stubEnv('VITE_SEARCH_URL', SEARCH_URL)
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')))
}
