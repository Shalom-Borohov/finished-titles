import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { openAdd, pressButton, save, savedEntries } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'
import { stubSearchResults } from '../helpers/searchService'

async function addGameByHand(title: string) {
  stubSearchResults([])
  renderAt('/tabs/home/game')
  await openAdd()
  await pressButton('לא מצאתי, הוספה ידנית')
  fireEvent.change(await screen.findByLabelText('שם'), { target: { value: title } })
}

const typeHours = async (typed: string) =>
  fireEvent.change(await screen.findByLabelText('שעות משחק'), { target: { value: typed } })

describe('adding a game', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 19, 21, 30).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('records a game that is still being played, asking since when and how it is', async () => {
    await addGameByHand('Destiny 2')
    await pressButton('ממשיך לשחק')

    expect(await screen.findByText('מתי התחלתי?')).toBeVisible()
    expect(screen.getByText('איך זה?')).toBeVisible()
    expect(screen.queryByLabelText('למה עצרתי?')).not.toBeInTheDocument()

    await save()

    expect((await savedEntries())[0]).toMatchObject({ status: 'ongoing', finishedOn: '2026-11-19' })
  })

  it('records the hours played, keeping only the digits typed', async () => {
    await addGameByHand('Elden Ring')
    await typeHours('12a0')

    expect(screen.getByLabelText('שעות משחק')).toHaveValue('120')

    await save()

    expect((await savedEntries())[0]).toMatchObject({ hours: 120 })
  })

  it('keeps the first five digits of pasted hours', async () => {
    await addGameByHand('Destiny 2')
    await typeHours('1,234,567')

    expect(screen.getByLabelText('שעות משחק')).toHaveValue('12345')
  })

  it('records no hours when zero is typed', async () => {
    await addGameByHand('Tetris')
    await typeHours('0')
    await save()

    expect((await savedEntries())[0].hours).toBeUndefined()
  })

  it('offers neither ongoing nor hours outside games', async () => {
    renderAt('/tabs/home/comic')
    await openAdd()

    expect(await screen.findByRole('button', { name: 'עצרתי באמצע' })).toBeVisible()
    expect(screen.queryByRole('button', { name: 'ממשיך לשחק' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText('שעות משחק')).not.toBeInTheDocument()
  })

  it('turns ongoing into finished when the type changes away from game', async () => {
    await addGameByHand('Hades')
    await pressButton('ממשיך לשחק')
    fireEvent.change(screen.getByLabelText('סוג'), { target: { value: 'book' } })

    expect(await screen.findByRole('button', { name: 'סיימתי' })).toHaveAttribute('aria-pressed', 'true')

    await save()

    expect((await savedEntries())[0].status).toBe('finished')
  })

  it('dates a game finished today when it stops being ongoing', async () => {
    await db.entries.add(entry({ id: 'destiny', title: 'Destiny', type: 'game', status: 'ongoing', finishedOn: '2020' }))
    renderAt('/tabs/home/game')
    fireEvent.click(await screen.findByRole('button', { name: /Destiny/ }))
    await pressButton('סיימתי')

    expect(await screen.findByLabelText('תאריך')).toHaveValue('2026-11-19')

    await save()

    await waitFor(async () => expect((await db.entries.get('destiny'))?.finishedOn).toBe('2026-11-19'))
  })

  it('dates an ongoing game finished today when its type changes away from game', async () => {
    await db.entries.add(entry({ id: 'wow', title: 'World of Warcraft', type: 'game', status: 'ongoing', finishedOn: '2008' }))
    renderAt('/tabs/home/game')
    fireEvent.click(await screen.findByRole('button', { name: /World of Warcraft/ }))
    fireEvent.change(await screen.findByLabelText('סוג'), { target: { value: 'book' } })

    expect(await screen.findByLabelText('תאריך')).toHaveValue('2026-11-19')
  })

  it('dates a finished game as started today when it becomes ongoing', async () => {
    await db.entries.add(entry({ id: 'hades', title: 'Hades', type: 'game', finishedOn: '2021' }))
    renderAt('/tabs/home/game')
    fireEvent.click(await screen.findByRole('button', { name: /Hades/ }))
    await pressButton('ממשיך לשחק')

    expect(await screen.findByLabelText('תאריך')).toHaveValue('2026-11-19')
  })
})
