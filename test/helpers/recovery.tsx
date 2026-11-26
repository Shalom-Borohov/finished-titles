import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import { App } from '../../src/App'
import { db } from '../../src/data/db'
import type { Entry } from '../../src/domain/types'
import { resetDb } from './db'
import { entry } from './entries'

const HOME_HASH = '#/tabs/home'

const UNTITLED_CREATED_AT = 2_000

const FIRST_DRAW_TIMEOUT_MS = 5_000

export const soundEntry = entry({ title: 'Dune', finishedOn: '2024' })

export const untitledEntry: Omit<Entry, 'title'> = {
  id: 'untitled',
  type: 'movie',
  status: 'finished',
  createdAt: UNTITLED_CREATED_AT,
}

const storeUnchecked = (records: object[]) => db.table(db.entries.name).bulkPut(records)

export function prepareRecoveryScreen() {
  beforeEach(async () => {
    await resetDb()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.location.hash = ''
  })
}

export function renderAppAtHome() {
  window.location.hash = HOME_HASH
  render(<App />)
}

export const findRecoveryHeading = () =>
  screen.findByRole('heading', { name: 'משהו השתבש' }, { timeout: FIRST_DRAW_TIMEOUT_MS })

export async function openRecoveryScreen() {
  await storeUnchecked([soundEntry, untitledEntry])
  renderAppAtHome()

  return findRecoveryHeading()
}
