import { screen, waitFor, within } from '@testing-library/react'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'

const section = async (heading: string) => {
  const title = await screen.findByRole('heading', { name: heading })
  const container = title.closest('section')

  if (!container) {
    throw new Error(`no section ${heading}`)
  }

  return within(container)
}

const countBeside = (label: HTMLElement) => label.closest('div')?.querySelector('dd')?.textContent

describe('stats', () => {
  beforeEach(resetDb)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('claims nothing about the list until it has loaded', async () => {
    vi.spyOn(db.entries, 'toArray').mockReturnValue(new Dexie.Promise(() => {}))
    renderAt('/tabs/stats')

    expect(await screen.findByRole('heading', { name: 'סטטיסטיקה' })).toBeVisible()
    expect(screen.queryByText('עדיין אין כותרים עם תאריך')).not.toBeInTheDocument()
    expect(screen.queryByText('0 כותרים · 0 סיימתי · 0 עצרתי')).not.toBeInTheDocument()
  })

  it('shows totals by status', async () => {
    await db.entries.bulkAdd([entry(), entry(), entry({ status: 'stopped' })])
    renderAt('/tabs/stats')

    expect(await screen.findByText('3 כותרים · 2 סיימתי · 1 עצרתי')).toBeVisible()
  })

  it('shows every type with its count', async () => {
    await db.entries.bulkAdd([entry({ type: 'anime' }), entry({ type: 'anime' }), entry({ type: 'comic' })])
    renderAt('/tabs/stats')

    const types = await section('לפי סוג')

    await waitFor(() => expect(countBeside(types.getByText('אנימה'))).toBe('2'))
    expect(countBeside(types.getByText('קומיקס'))).toBe('1')
    expect(countBeside(types.getByText('אחר'))).toBe('0')
  })

  it('shows titles per year, and says what the chart leaves out', async () => {
    const olderYears = ['2010', '2011', '2012', '2013', '2014', '2015', '2016']

    await db.entries.bulkAdd([...olderYears.map((finishedOn) => entry({ finishedOn })), entry({ finishedOn: '2016-05-01' }), entry()])
    renderAt('/tabs/stats')

    const years = await section('לפי שנה')

    expect(await years.findByText('2016')).toBeVisible()
    expect(years.getByRole('img', { name: '2016: 2 כותרים' })).toBeVisible()
    expect(years.queryByText('2010')).not.toBeInTheDocument()
    expect(years.getByText('לא בגרף: כותר אחד משנים קודמות וכותר אחד בלי תאריך')).toBeVisible()
  })

  it('shows the rating breakdown', async () => {
    await db.entries.bulkAdd([entry({ rating: 'favorite' }), entry({ rating: 'favorite' }), entry({ rating: 'okay' })])
    renderAt('/tabs/stats')

    const ratings = await section('איך היה')

    await waitFor(() => expect(countBeside(ratings.getByText('אהוב במיוחד'))).toBe('2'))
    expect(countBeside(ratings.getByText('היה בסדר'))).toBe('1')
    expect(countBeside(ratings.getByText('לא אהבתי'))).toBe('0')
  })

  it('says so when there is nothing to chart yet', async () => {
    renderAt('/tabs/stats')

    const years = await section('לפי שנה')

    expect(years.getByText('עדיין אין כותרים עם תאריך')).toBeVisible()
  })
})
