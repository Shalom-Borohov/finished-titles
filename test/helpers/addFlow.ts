import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'
import { db } from '../../src/data/db'

export const pressButton = async (name: string) => fireEvent.click(await screen.findByRole('button', { name }))

export const openAdd = async () => pressButton('הוספת כותר')

export async function searchFor(query: string) {
  await openAdd()
  fireEvent.change(await screen.findByLabelText('חיפוש כותר'), { target: { value: query } })
}

export async function pickResult(name: RegExp) {
  fireEvent.click(await screen.findByRole('button', { name }))
}

export async function savedEntries() {
  await waitFor(async () => expect(await db.entries.count()).toBeGreaterThan(0))

  return db.entries.toArray()
}

export const save = async () => fireEvent.click(await screen.findByText('שמירה'))
