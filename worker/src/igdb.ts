import { array, type InferOutput, nullish, number, object, string } from 'valibot'
import type { Env, SearchResult } from './types'
import { isUsableTitle, parseUpstreamJson } from './upstream'

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const GAMES_URL = 'https://api.igdb.com/v4/games'
const COVER_URL = 'https://images.igdb.com/igdb/image/upload/t_cover_big'
const CLIENT_CREDENTIALS_GRANT = 'client_credentials'
const REQUESTED_FIELDS = 'name,cover.image_id,first_release_date'
const MAX_RESULTS = 5
const UNAUTHORIZED_STATUS = 401
const MILLISECONDS_PER_SECOND = 1000

const tokenSchema = object({ access_token: string() })

const gameSchema = object({
  id: number(),
  name: nullish(string()),
  cover: nullish(object({ image_id: nullish(string()) })),
  first_release_date: nullish(number()),
})

const gamesSchema = array(gameSchema)

type IgdbGame = InferOutput<typeof gameSchema>

type TwitchCredentials = {
  clientId: string
  clientSecret: string
}

let cachedToken: string | null = null

async function refreshToken({ clientId, clientSecret }: TwitchCredentials): Promise<string> {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: CLIENT_CREDENTIALS_GRANT,
    }),
  })

  const { access_token: token } = await parseUpstreamJson(response, tokenSchema)

  cachedToken = token

  return token
}

function escapeForIgdbString(query: string) {
  return query.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

function requestGames(query: string, clientId: string, token: string) {
  return fetch(GAMES_URL, {
    method: 'POST',
    headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}` },
    body: `search "${escapeForIgdbString(query)}"; fields ${REQUESTED_FIELDS}; limit ${MAX_RESULTS};`,
  })
}

const releaseYear = (releaseSeconds: number) => new Date(releaseSeconds * MILLISECONDS_PER_SECOND).getUTCFullYear()

function toSearchResults(game: IgdbGame): SearchResult[] {
  if (!isUsableTitle(game.name)) {
    return []
  }

  const imageId = game.cover?.image_id

  return [
    {
      source: 'igdb',
      sourceId: String(game.id),
      title: game.name,
      type: 'game',
      year: game.first_release_date == null ? undefined : releaseYear(game.first_release_date),
      posterUrl: imageId ? `${COVER_URL}/${imageId}.jpg` : undefined,
    },
  ]
}

export async function searchIgdb(query: string, env: Env): Promise<SearchResult[]> {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    return []
  }

  const credentials = { clientId: env.TWITCH_CLIENT_ID, clientSecret: env.TWITCH_CLIENT_SECRET }
  const token = cachedToken ?? (await refreshToken(credentials))

  let response = await requestGames(query, credentials.clientId, token)

  if (response.status === UNAUTHORIZED_STATUS) {
    response = await requestGames(query, credentials.clientId, await refreshToken(credentials))
  }

  const games = await parseUpstreamJson(response, gamesSchema)

  return games.flatMap(toSearchResults).slice(0, MAX_RESULTS)
}
