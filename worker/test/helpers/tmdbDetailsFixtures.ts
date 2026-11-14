export const TV_DETAILS = {
  id: 1396,
  name: 'Breaking Bad',
  original_name: 'Breaking Bad',
  genres: [
    { id: 18, name: 'Drama' },
    { id: 80, name: 'Crime' },
  ],
  created_by: [
    { id: 66633, name: 'Vince Gilligan', credit_id: '52542286760ee31328001a7b' },
    { id: 1223, name: 'Peter Gould', credit_id: '52542286760ee31328001a7c' },
  ],
  networks: [
    { id: 174, name: 'AMC', logo_path: '/pmvRmATOCaDykE6JrVoeYxlFHw3.png', origin_country: 'US' },
    { id: 213, name: 'Netflix', logo_path: '/wwemzKWzjKYJFfCeiB57q3r4Bcm.png', origin_country: '' },
  ],
  number_of_episodes: 62,
  episode_run_time: [45, 47],
  next_episode_to_air: { id: 1, name: 'Pilot', air_date: '2026-12-01', episode_number: 1, season_number: 6 },
  status: 'Returning Series',
}

export const TV_AGGREGATE_CREDITS = {
  id: 1396,
  cast: [
    { name: 'Aaron Paul', order: 1, roles: [{ character: 'Jesse Pinkman', episode_count: 62 }], total_episode_count: 62 },
    { name: 'Bryan Cranston', order: 0, roles: [{ character: 'Walter White', episode_count: 62 }], total_episode_count: 62 },
    { name: 'Anna Gunn', order: 2, roles: [{ character: 'Skyler White', episode_count: 62 }], total_episode_count: 62 },
  ],
  crew: [],
}

export const TV_PROVIDERS = {
  id: 1396,
  results: {
    IL: {
      link: 'https://www.themoviedb.org/tv/1396-breaking-bad/watch?locale=IL',
      flatrate: [
        { provider_name: 'Disney Plus', provider_id: 337, logo_path: '/a.jpg', display_priority: 4 },
        { provider_name: 'Netflix', provider_id: 8, logo_path: '/b.jpg', display_priority: 1 },
      ],
      buy: [{ provider_name: 'Apple TV', provider_id: 2, logo_path: '/c.jpg', display_priority: 2 }],
    },
    US: {
      link: 'https://www.themoviedb.org/tv/1396-breaking-bad/watch?locale=US',
      flatrate: [{ provider_name: 'AMC Plus', provider_id: 526, logo_path: '/d.jpg', display_priority: 0 }],
    },
  },
}

export const MOVIE_DETAILS = {
  id: 603,
  title: 'The Matrix',
  original_title: 'The Matrix',
  genres: [
    { id: 28, name: 'Action' },
    { id: 878, name: 'Science Fiction' },
  ],
  runtime: 136,
}

export const MOVIE_CREDITS = {
  id: 603,
  cast: [
    { name: 'Keanu Reeves', character: 'Neo', order: 0 },
    { name: 'Laurence Fishburne', character: 'Morpheus', order: 1 },
  ],
  crew: [
    { name: 'Lana Wachowski', job: 'Director', department: 'Directing' },
    { name: 'Lilly Wachowski', job: 'Director', department: 'Directing' },
    { name: 'Lana Wachowski', job: 'Screenplay', department: 'Writing' },
    { name: 'Joel Silver', job: 'Producer', department: 'Production' },
    { name: 'Lana Wachowski', job: 'Director', department: 'Directing' },
  ],
}

export const MOVIE_PROVIDERS = {
  id: 603,
  results: {
    IL: {
      link: 'https://www.themoviedb.org/movie/603-the-matrix/watch?locale=IL',
      flatrate: [{ provider_name: 'HBO Max', provider_id: 1899, logo_path: '/e.jpg', display_priority: 3 }],
    },
  },
}
