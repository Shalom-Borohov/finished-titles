import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../src/data/db'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { expectInOrder } from '../helpers/ionic'
import { currentPath, renderAt } from '../helpers/renderAt'

describe('type list', () => {
  beforeEach(resetDb)

  it('shows only that type, newest first, with counts', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'Older', type: 'anime', finishedOn: '2020' }),
      entry({ title: 'Newer', type: 'anime', finishedOn: '2026-01-01' }),
      entry({ title: 'A Movie', type: 'movie' }),
    ])
    renderAt('/tabs/home/anime')

    expect(await screen.findByRole('heading', { name: 'אנימה' })).toBeVisible()
    await expectInOrder(['Newer', 'Older'])
    expect(screen.queryByText('A Movie')).not.toBeInTheDocument()
    expect(screen.getByText('2 כותרים')).toBeVisible()
  })

  it('shows the rating and where a show stopped', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'Frieren', type: 'anime', rating: 'favorite' }),
      entry({ title: 'Naruto', type: 'anime', status: 'stopped', stoppedSeason: 3 }),
    ])
    renderAt('/tabs/home/anime')

    expect(await screen.findByText('אהוב במיוחד')).toBeVisible()
    expect(screen.getByText('נעצר בעונה 3')).toBeVisible()
  })

  it('filters by status, showing each count', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'Done', type: 'book' }),
      entry({ title: 'Dropped', type: 'book', status: 'stopped' }),
    ])
    renderAt('/tabs/home/book')

    fireEvent.click(await screen.findByRole('button', { name: 'עצרתי 1' }))

    await waitFor(() => expect(screen.queryByText('Done')).not.toBeInTheDocument())
    expect(screen.getByText('Dropped')).toBeVisible()
    expect(screen.getByRole('button', { name: 'סיימתי 1' })).toBeVisible()
  })

  it('searches inside the list', async () => {
    await db.entries.bulkAdd([entry({ title: 'Dune', type: 'book' }), entry({ title: 'Emma', type: 'book' })])
    renderAt('/tabs/home/book')

    fireEvent.change(await screen.findByLabelText('חיפוש'), { target: { value: 'dun' } })

    await waitFor(() => expect(screen.queryByText('Emma')).not.toBeInTheDocument())
    expect(screen.getByText('Dune')).toBeVisible()
  })

  it('says so when a search finds nothing', async () => {
    await db.entries.add(entry({ title: 'Dune', type: 'book' }))
    renderAt('/tabs/home/book')

    fireEvent.change(await screen.findByLabelText('חיפוש'), { target: { value: 'zzz' } })

    expect(await screen.findByText('לא נמצאו כותרים')).toBeVisible()
  })

  it('says so when a type is still empty', async () => {
    renderAt('/tabs/home/game')

    expect(await screen.findByText('עדיין אין כאן כותרים')).toBeVisible()
  })

  it('shows a placeholder with the title when an entry has no poster', async () => {
    await db.entries.add(entry({ title: 'My Comic', type: 'comic' }))
    renderAt('/tabs/home/comic')

    await screen.findByText('My Comic')

    expect(document.querySelector('.poster-placeholder')).toHaveAttribute('data-title', 'My Comic')
  })

  it('falls back to the placeholder when a poster fails to load', async () => {
    await db.entries.add(entry({ title: 'Gone', type: 'movie', posterUrl: 'https://image.test/gone.jpg' }))
    renderAt('/tabs/home/movie')

    await screen.findByText('Gone')
    fireEvent.error(document.querySelector('.poster img') ?? document.body)

    await waitFor(() => expect(document.querySelector('.poster-placeholder')).toHaveAttribute('data-title', 'Gone'))
  })

  it('goes back home', async () => {
    renderAt('/tabs/home/movie')

    fireEvent.click(await screen.findByRole('link', { name: 'חזרה לבית' }))

    await waitFor(() => expect(currentPath()).toBe('/tabs/home'))
  })
})

describe('all titles', () => {
  beforeEach(resetDb)

  it('shows every type, newest first', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'A Book', type: 'book', finishedOn: '2020' }),
      entry({ title: 'A Game', type: 'game', finishedOn: '2026' }),
    ])
    renderAt('/tabs/home/all')

    expect(await screen.findByRole('heading', { name: 'כל הכותרים' })).toBeVisible()
    await expectInOrder(['A Game', 'A Book'])
  })

  it('finds a title without knowing its type', async () => {
    await db.entries.bulkAdd([entry({ title: 'Dune', type: 'book' }), entry({ title: 'Hades', type: 'game' })])
    renderAt('/tabs/home/all')

    fireEvent.change(await screen.findByLabelText('חיפוש'), { target: { value: 'hades' } })

    await waitFor(() => expect(screen.queryByText('Dune')).not.toBeInTheDocument())
    expect(screen.getByText('Hades')).toBeVisible()
  })
})
