import type { TypeFilter } from '../domain/entries'

const TABS_PATH = '/tabs'

export const HOME_PATH = `${TABS_PATH}/home`

export const STATS_PATH = `${TABS_PATH}/stats`

export const SETTINGS_PATH = `${TABS_PATH}/settings`

export const listPath = (type: TypeFilter) => `${HOME_PATH}/${type}`
