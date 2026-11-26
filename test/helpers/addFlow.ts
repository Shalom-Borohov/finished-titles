import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { expect } from 'vitest'
import { db } from '../../src/data/db'

export const pressButton = async (name: string) => fireEvent.click(await screen.findByRole('button', { name }))

export const openAdd = async () => pressButton('הוספת כותר')

export const typeQuery = async (query: string) =>
  fireEvent.change(await screen.findByLabelText('חיפוש כותר'), { target: { value: query } })

export async function searchStatus() {
  const sheet = (await screen.findByLabelText('חיפוש כותר')).closest('ion-modal')

  if (!sheet) {
    throw new Error('no add sheet')
  }

  return within(sheet).getByRole('status')
}

export async function searchFor(query: string) {
  await openAdd()
  await typeQuery(query)
}

export async function pickResult(name: RegExp) {
  fireEvent.click(await screen.findByRole('button', { name }))
}

export async function savedEntries() {
  await waitFor(async () => expect(await db.entries.count()).toBeGreaterThan(0))

  return db.entries.toArray()
}

export const save = async () => fireEvent.click(await screen.findByText('שמירה'))
