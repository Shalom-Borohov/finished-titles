import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { currentPath, renderAt } from '../helpers/renderAt'

const tile = (name: RegExp) => screen.findByRole('link', { name })

describe('home', () => {
  beforeEach(resetDb)

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows no zero counts until the list has loaded', async () => {
    vi.spyOn(db.entries, 'toArray').mockReturnValue(new Dexie.Promise(() => {}))
    renderAt('/tabs/home')

    expect(await screen.findByRole('heading', { name: 'סיימתי' })).toBeVisible()
    expect(screen.queryByRole('link', { name: /מה שראיתי/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /אנימה/ })).not.toBeInTheDocument()
  })

  it('opens on home from the root path', async () => {
    renderAt('/')

    expect(await screen.findByRole('heading', { name: 'סיימתי' })).toBeVisible()
    expect(currentPath()).toBe('/tabs/home')
  })

  it('shows a tile per type with its count', async () => {
    await db.entries.bulkAdd([entry({ type: 'anime' }), entry({ type: 'anime' }), entry({ type: 'book' })])
    renderAt('/tabs/home')

    expect(await within(await tile(/^אנימה/)).findByText('2')).toBeVisible()
    expect(await within(await tile(/^ספרים/)).findByText('1')).toBeVisible()
    expect(within(await tile(/^משחקים/)).getByText('0')).toBeVisible()
    expect(within(await tile(/^קומיקס/)).getByText('0')).toBeVisible()
    expect(within(await tile(/^אחר/)).getByText('0')).toBeVisible()
  })

  it('shows what the app is and the total', async () => {
    await db.entries.bulkAdd([entry(), entry(), entry()])
    renderAt('/tabs/home')

    expect(await screen.findByRole('link', { name: 'מה שראיתי, קראתי ושיחקתי · 3' })).toBeVisible()
  })

  it('shows a poster fan of the most recent posters on a tile', async () => {
    await db.entries.bulkAdd([
      entry({ type: 'anime', finishedOn: '2025', posterUrl: 'https://image.test/older.jpg' }),
      entry({ type: 'anime', finishedOn: '2026', posterUrl: 'https://image.test/newer.jpg' }),
    ])
    renderAt('/tabs/home')

    const animeTile = await tile(/^אנימה/)

    await waitFor(() =>
      expect(Array.from(animeTile.querySelectorAll('img'), (image) => image.getAttribute('src'))).toEqual([
        'https://image.test/newer.jpg',
        'https://image.test/older.jpg',
      ]),
    )
  })

  it('shows a colored poster for a title with no poster', async () => {
    await db.entries.add(entry({ title: 'My Comic', type: 'comic' }))
    renderAt('/tabs/home')

    const comicTile = await tile(/^קומיקס/)

    await waitFor(() => expect(comicTile.querySelector('.poster-placeholder')).toHaveAttribute('data-title', 'My Comic'))
  })

  it('draws no empty poster cards on a type with no titles', async () => {
    await db.entries.add(entry({ type: 'comic' }))
    renderAt('/tabs/home')

    const comicTile = await tile(/^קומיקס/)

    await waitFor(() => expect(comicTile.querySelectorAll('.fan-slot')).toHaveLength(1))
    expect((await tile(/^משחקים/)).querySelectorAll('.fan-slot')).toHaveLength(0)
  })

  it('opens a type list from its tile', async () => {
    renderAt('/tabs/home')

    fireEvent.click(await tile(/^סדרות/))

    await waitFor(() => expect(currentPath()).toBe('/tabs/home/series'))
  })

  it('opens the all-titles list from the total', async () => {
    renderAt('/tabs/home')

    fireEvent.click(await screen.findByRole('link', { name: /^מה שראיתי/ }))

    await waitFor(() => expect(currentPath()).toBe('/tabs/home/all'))
  })

  it('opens the all-titles list from the search field', async () => {
    renderAt('/tabs/home')

    fireEvent.click(await screen.findByRole('link', { name: 'חיפוש בכל הכותרים' }))

    await waitFor(() => expect(currentPath()).toBe('/tabs/home/all'))
  })

  it('has the three tabs', async () => {
    renderAt('/tabs/home')

    expect(await screen.findByText('בית')).toBeInTheDocument()
    expect(screen.getByText('סטטיסטיקה')).toBeInTheDocument()
    expect(screen.getByText('הגדרות')).toBeInTheDocument()
  })
})
