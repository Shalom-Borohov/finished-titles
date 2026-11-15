import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../src/data/db'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'

describe('list filters', () => {
  beforeEach(resetDb)

  it('narrows the list to one rating', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'Severance', type: 'series', rating: 'favorite' }),
      entry({ title: 'The Bear', type: 'series', rating: 'loved' }),
    ])
    renderAt('/tabs/home/series')
    await screen.findByText('The Bear')

    fireEvent.change(screen.getByLabelText('סינון לפי דירוג'), { target: { value: 'favorite' } })

    await waitFor(() => expect(screen.queryByText('The Bear')).not.toBeInTheDocument())
    expect(screen.getByText('Severance')).toBeVisible()
  })

  it('shows every title again when all ratings is chosen', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'Severance', type: 'series', rating: 'favorite' }),
      entry({ title: 'The Bear', type: 'series', rating: 'loved' }),
    ])
    renderAt('/tabs/home/series')
    await screen.findByText('The Bear')
    const ratingSelect = screen.getByLabelText('סינון לפי דירוג')
    fireEvent.change(ratingSelect, { target: { value: 'favorite' } })
    await waitFor(() => expect(screen.queryByText('The Bear')).not.toBeInTheDocument())

    fireEvent.change(ratingSelect, { target: { value: '' } })

    expect(await screen.findByText('The Bear')).toBeVisible()
    expect(screen.getByRole('option', { name: 'כל הדירוגים', selected: true })).toBeInTheDocument()
  })

  it('narrows the list to titles that have a genre', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'Dark', type: 'series', genres: ['crime', 'mystery'] }),
      entry({ title: 'Fleabag', type: 'series', genres: ['comedy', 'drama'] }),
      entry({ title: 'Untagged', type: 'series' }),
    ])
    renderAt('/tabs/home/series')
    await screen.findByText('Fleabag')

    fireEvent.change(screen.getByLabelText('סינון לפי ז׳אנר'), { target: { value: 'mystery' } })

    await waitFor(() => expect(screen.queryByText('Fleabag')).not.toBeInTheDocument())
    expect(screen.queryByText('Untagged')).not.toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeVisible()
  })

  it('combines rating and genre with the status pill and search', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'Dark', type: 'series', rating: 'favorite', genres: ['mystery'] }),
      entry({ title: 'Dark Matter', type: 'series', rating: 'favorite', genres: ['mystery'], status: 'stopped' }),
      entry({ title: 'Dark Winds', type: 'series', rating: 'loved', genres: ['mystery'] }),
      entry({ title: 'Darkly Funny', type: 'series', rating: 'favorite', genres: ['comedy'] }),
      entry({ title: 'Severance', type: 'series', rating: 'favorite', genres: ['mystery'] }),
    ])
    renderAt('/tabs/home/series')
    await screen.findByText('Severance')

    fireEvent.change(screen.getByLabelText('סינון לפי דירוג'), { target: { value: 'favorite' } })
    fireEvent.change(screen.getByLabelText('סינון לפי ז׳אנר'), { target: { value: 'mystery' } })
    fireEvent.click(screen.getByRole('button', { name: 'סיימתי 4' }))
    fireEvent.change(screen.getByLabelText('חיפוש'), { target: { value: 'dark' } })

    await waitFor(() => expect(screen.queryByText('Severance')).not.toBeInTheDocument())
    expect(screen.getByText('Dark')).toBeVisible()
    expect(screen.queryByText('Dark Matter')).not.toBeInTheDocument()
    expect(screen.queryByText('Dark Winds')).not.toBeInTheDocument()
    expect(screen.queryByText('Darkly Funny')).not.toBeInTheDocument()
  })

  it('offers only the ratings and genres this list has, in their usual order', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'Okay One', type: 'series', rating: 'okay', genres: ['romance', 'drama'] }),
      entry({ title: 'Favorite One', type: 'series', rating: 'favorite', genres: ['horror'] }),
      entry({ title: 'A Movie', type: 'movie', rating: 'liked', genres: ['western'] }),
    ])
    renderAt('/tabs/home/series')
    await screen.findByText('Okay One')

    const ratingOptions = Array.from(screen.getByLabelText('סינון לפי דירוג').querySelectorAll('option'))
    const genreOptions = Array.from(screen.getByLabelText('סינון לפי ז׳אנר').querySelectorAll('option'))

    expect(ratingOptions.map((option) => option.textContent)).toEqual(['כל הדירוגים', 'אהוב במיוחד', 'היה בסדר'])
    expect(genreOptions.map((option) => option.textContent)).toEqual(['כל הז׳אנרים', 'אימה', 'דרמה', 'רומנטיקה'])
  })

  it('leaves out the rating menu when no title is rated, and the row when nothing is offered', async () => {
    await db.entries.bulkAdd([
      entry({ title: 'Tagged', type: 'series', genres: ['drama'] }),
      entry({ title: 'Bare Book', type: 'book' }),
    ])
    const { unmount } = renderAt('/tabs/home/series')
    await screen.findByText('Tagged')

    expect(screen.queryByLabelText('סינון לפי דירוג')).not.toBeInTheDocument()
    expect(screen.getByLabelText('סינון לפי ז׳אנר')).toBeInTheDocument()

    unmount()
    renderAt('/tabs/home/book')
    await screen.findByText('Bare Book')

    expect(screen.queryByLabelText('סינון לפי ז׳אנר')).not.toBeInTheDocument()
    expect(document.querySelector('.menu-pills')).not.toBeInTheDocument()
  })

  it('drops a chosen genre once no title in the list has it', async () => {
    const dark = entry({ title: 'Dark', type: 'series', genres: ['mystery'] })
    await db.entries.bulkAdd([dark, entry({ title: 'Fleabag', type: 'series', genres: ['comedy'] })])
    renderAt('/tabs/home/series')
    await screen.findByText('Fleabag')
    fireEvent.change(screen.getByLabelText('סינון לפי ז׳אנר'), { target: { value: 'mystery' } })
    await waitFor(() => expect(screen.queryByText('Fleabag')).not.toBeInTheDocument())

    await db.entries.delete(dark.id)

    expect(await screen.findByText('Fleabag')).toBeVisible()
    expect(screen.getByRole('option', { name: 'כל הז׳אנרים', selected: true })).toBeInTheDocument()
    expect(screen.queryByRole('option', { name: 'מסתורין' })).not.toBeInTheDocument()
  })

  it('keeps a dropped genre cleared when a title gets it again', async () => {
    const dark = entry({ title: 'Dark', type: 'series', genres: ['mystery'] })
    await db.entries.bulkAdd([dark, entry({ title: 'Fleabag', type: 'series', genres: ['comedy'] })])
    renderAt('/tabs/home/series')
    await screen.findByText('Fleabag')
    fireEvent.change(screen.getByLabelText('סינון לפי ז׳אנר'), { target: { value: 'mystery' } })
    await waitFor(() => expect(screen.queryByText('Fleabag')).not.toBeInTheDocument())
    await db.entries.delete(dark.id)
    await screen.findByText('Fleabag')

    await db.entries.add(entry({ title: 'Mindhunter', type: 'series', genres: ['mystery'] }))

    expect(await screen.findByText('Mindhunter')).toBeVisible()
    expect(screen.getByText('Fleabag')).toBeVisible()
  })
})
