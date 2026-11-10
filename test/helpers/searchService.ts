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

export function stubSearchResults(results: StubResult[], unavailable: string[] = []) {
  const fetchStub = vi.fn<typeof fetch>().mockImplementation(async () => Response.json({ results, unavailable }))

  vi.stubEnv('VITE_SEARCH_URL', SEARCH_URL)
  vi.stubGlobal('fetch', fetchStub)

  return fetchStub
}

export function stubSearchFailure() {
  vi.stubEnv('VITE_SEARCH_URL', SEARCH_URL)
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockRejectedValue(new TypeError('offline')))
}
