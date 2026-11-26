import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../src/data/db'
import { pressButton, save, saveButton } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'

async function openRestoredArrival(finishedOn: string) {
  await db.entries.add(entry({ id: 'arrival', title: 'Arrival', type: 'movie', finishedOn }))
  renderAt('/tabs/home/movie')
  fireEvent.click(await screen.findByRole('button', { name: /Arrival/ }))
}

describe('editing a title kept with a date after today', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 7, 21, 30).getTime())

  it.each(['2026-12-01', '2027'])('saves a rating change and keeps the date %s', async (finishedOn) => {
    await openRestoredArrival(finishedOn)
    await pressButton('אהבתי מאוד')

    expect(screen.queryByText('התאריך לא יכול להיות בעתיד')).not.toBeInTheDocument()
    await waitFor(async () => expect(await saveButton()).toHaveProperty('disabled', false))

    await save()

    await waitFor(async () => expect((await db.entries.get('arrival'))?.rating).toBe('loved'))
    expect((await db.entries.get('arrival'))?.finishedOn).toBe(finishedOn)
  })

  it('blocks a changed future date until it is set back to the kept one', async () => {
    await openRestoredArrival('2026-12-01')

    fireEvent.change(await screen.findByLabelText('תאריך'), { target: { value: '2026-12-02' } })

    expect(await screen.findByText('התאריך לא יכול להיות בעתיד')).toBeVisible()
    expect(await saveButton()).toHaveProperty('disabled', true)

    fireEvent.change(screen.getByLabelText('תאריך'), { target: { value: '2026-12-01' } })

    await waitFor(() => expect(screen.queryByText('התאריך לא יכול להיות בעתיד')).not.toBeInTheDocument())
    expect(await saveButton()).toHaveProperty('disabled', false)
  })

  it('blocks switching a kept future date to only its year', async () => {
    await openRestoredArrival('2027-03-01')
    await pressButton('רק שנה')

    expect(await screen.findByText('התאריך לא יכול להיות בעתיד')).toBeVisible()
    expect(await saveButton()).toHaveProperty('disabled', true)
  })
})
