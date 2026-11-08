import { describe, expect, it } from 'vitest'
import { APP_ORIGIN, BASE_ENV, callWorker, LOCAL_ORIGIN, OTHER_ORIGIN, stubUpstreams } from './helpers/worker'

const OPEN_LIBRARY_HOST = 'openlibrary.org'
const SEARCH_PATH = '/search?q=dune'

function stubOpenLibrary() {
  return stubUpstreams({ [OPEN_LIBRARY_HOST]: () => Response.json({ docs: [] }) })
}

describe('allowed origins', () => {
  it.each([APP_ORIGIN, LOCAL_ORIGIN])('echoes %s and varies on Origin', async (origin) => {
    stubOpenLibrary()

    const response = await callWorker(SEARCH_PATH, { headers: { Origin: origin } })

    expect(response.status).toBe(200)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(origin)
    expect(response.headers.get('Vary')).toBe('Origin')
  })

  it('tolerates spaces around the configured origins', async () => {
    stubOpenLibrary()

    const response = await callWorker(
      SEARCH_PATH,
      { headers: { Origin: LOCAL_ORIGIN } },
      { ...BASE_ENV, ALLOWED_ORIGINS: ` ${APP_ORIGIN} , ${LOCAL_ORIGIN} ` },
    )

    expect(response.status).toBe(200)
  })

  it.each([
    ['400', '/search?q=a', 400],
    ['404', '/other', 404],
  ])('adds the CORS headers to a %s so the app can read it', async (_description, path, status) => {
    stubOpenLibrary()

    const response = await callWorker(path, { headers: { Origin: APP_ORIGIN } })

    expect(response.status).toBe(status)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Vary')).toBe('Origin')
  })
})

describe('other origins', () => {
  it.each([
    ['another site', OTHER_ORIGIN],
    ['a look-alike with the app origin as a prefix', `${APP_ORIGIN}.attacker.example`],
    ['the opaque null origin', 'null'],
    ['the wrong scheme', 'http://shalom-borohov.github.io'],
    ['the wrong port', 'http://localhost:5174'],
  ])('answers 403 to %s without calling out', async (_description, origin) => {
    const requests = stubOpenLibrary()

    const response = await callWorker(SEARCH_PATH, { headers: { Origin: origin } })

    expect(response.status).toBe(403)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
    expect(response.headers.get('Vary')).toBe('Origin')
    expect(requests).toEqual([])
  })

  it('answers 403 when there is no Origin header', async () => {
    const requests = stubOpenLibrary()

    const response = await callWorker(SEARCH_PATH, {})

    expect(response.status).toBe(403)
    expect(requests).toEqual([])
  })

  it('answers 403 before routing, so an unknown path reveals nothing', async () => {
    const response = await callWorker('/other', { headers: { Origin: OTHER_ORIGIN } })

    expect(response.status).toBe(403)
  })
})

describe('preflight', () => {
  it('answers an allowed OPTIONS with an empty 204 that permits GET', async () => {
    const requests = stubOpenLibrary()

    const response = await callWorker(SEARCH_PATH, { method: 'OPTIONS', headers: { Origin: APP_ORIGIN } })

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(APP_ORIGIN)
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET')
    expect(response.headers.get('Vary')).toBe('Origin')
    expect(requests).toEqual([])
  })

  it('answers an allowed OPTIONS with 204 on any path', async () => {
    const response = await callWorker('/other', { method: 'OPTIONS', headers: { Origin: APP_ORIGIN } })

    expect(response.status).toBe(204)
  })

  it('answers OPTIONS from another origin with 403', async () => {
    const response = await callWorker(SEARCH_PATH, { method: 'OPTIONS', headers: { Origin: OTHER_ORIGIN } })

    expect(response.status).toBe(403)
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull()
  })
})
