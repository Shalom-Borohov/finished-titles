import { array, type InferOutput, nullish, number, object, string } from 'valibot'
import type { Env, SearchResult, SourcePage } from './types'
import { isUsableTitle, PAGE_SIZE, parseUpstreamJson } from './upstream'

const TOKEN_URL = 'https://id.twitch.tv/oauth2/token'
const GAMES_URL = 'https://api.igdb.com/v4/games'
const COVER_URL = 'https://images.igdb.com/igdb/image/upload/t_cover_big'
const CLIENT_CREDENTIALS_GRANT = 'client_credentials'
const REQUESTED_FIELDS = 'name,cover.image_id,first_release_date'
const ORIGINAL_GAMES_ONLY = 'version_parent = null'
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

function gamesQueryBody(query: string, page: number) {
  const offset = (page - 1) * PAGE_SIZE

  return `search "${escapeForIgdbString(query)}"; fields ${REQUESTED_FIELDS}; where ${ORIGINAL_GAMES_ONLY}; limit ${PAGE_SIZE}; offset ${offset};`
}

function requestGames(body: string, clientId: string, token: string) {
  return fetch(GAMES_URL, {
    method: 'POST',
    headers: { 'Client-ID': clientId, Authorization: `Bearer ${token}` },
    body,
  })
}

function twitchCredentials(env: Env): TwitchCredentials {
  if (!env.TWITCH_CLIENT_ID || !env.TWITCH_CLIENT_SECRET) {
    throw new Error('Twitch credentials are not set')
  }

  return { clientId: env.TWITCH_CLIENT_ID, clientSecret: env.TWITCH_CLIENT_SECRET }
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

export async function searchIgdb(query: string, page: number, env: Env): Promise<SourcePage> {
  const credentials = twitchCredentials(env)
  const body = gamesQueryBody(query, page)
  const token = cachedToken ?? (await refreshToken(credentials))

  let response = await requestGames(body, credentials.clientId, token)

  if (response.status === UNAUTHORIZED_STATUS) {
    response = await requestGames(body, credentials.clientId, await refreshToken(credentials))
  }

  const games = await parseUpstreamJson(response, gamesSchema)

  return { results: games.flatMap(toSearchResults), hasMore: games.length === PAGE_SIZE }
}
