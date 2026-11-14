import { array, type InferOutput, nullish, number, object, string } from 'valibot'

const LAST_ORDER = Number.MAX_SAFE_INTEGER

const genreSchema = object({ id: nullish(number()), name: nullish(string()) })
const namedSchema = object({ name: nullish(string()) })
const castMemberSchema = object({ name: nullish(string()), order: nullish(number(), LAST_ORDER) })
const crewMemberSchema = object({ name: nullish(string()), job: nullish(string()) })
const providerSchema = object({ provider_name: nullish(string()), display_priority: nullish(number(), LAST_ORDER) })

export const tvDetailsSchema = object({
  original_name: nullish(string()),
  genres: nullish(array(genreSchema), []),
  created_by: nullish(array(namedSchema), []),
  networks: nullish(array(namedSchema), []),
  number_of_episodes: nullish(number()),
  episode_run_time: nullish(array(number()), []),
  next_episode_to_air: nullish(object({ air_date: nullish(string()) })),
})

export const movieDetailsSchema = object({
  original_title: nullish(string()),
  genres: nullish(array(genreSchema), []),
  runtime: nullish(number()),
})

export const aggregateCreditsSchema = object({ cast: nullish(array(castMemberSchema), []) })

export const movieCreditsSchema = object({
  cast: nullish(array(castMemberSchema), []),
  crew: nullish(array(crewMemberSchema), []),
})

const countryProvidersSchema = object({ flatrate: nullish(array(providerSchema), []) })

export const watchProvidersSchema = object({
  results: nullish(object({ IL: nullish(countryProvidersSchema, { flatrate: [] }) }), { IL: { flatrate: [] } }),
})

export type TmdbGenre = InferOutput<typeof genreSchema>

export type TmdbCastMember = InferOutput<typeof castMemberSchema>

export type TmdbCrewMember = InferOutput<typeof crewMemberSchema>

export type TmdbWatchProviders = InferOutput<typeof watchProvidersSchema>
