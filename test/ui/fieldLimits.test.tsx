import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import type { Entry } from '../../src/domain/types'
import { pickResult, pressButton, save, saveButton, savedEntries, searchFor } from '../helpers/addFlow'
import { freezeDate } from '../helpers/clock'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { renderAt } from '../helpers/renderAt'
import { DUNE, jsonReply, SEVERANCE, stubSearchResults } from '../helpers/searchService'

const yearsShown = () => document.querySelector('.release-year')

const typeYear = async (year: string) => fireEvent.change(await screen.findByLabelText('שנה'), { target: { value: year } })

async function openSaved(saved: Entry) {
  await db.entries.add(saved)
  renderAt(`/tabs/home/${saved.type}`)
  fireEvent.click(await screen.findByRole('button', { name: new RegExp(saved.title) }))
}

async function pickEndedSeverance() {
  stubSearchResults([SEVERANCE], { seasonsReply: jsonReply({ seasons: 3, endYear: 2025 }) })
  renderAt('/tabs/home')
  await searchFor('severance')
  await pickResult(/Severance/)
  await waitFor(() => expect(yearsShown()).toHaveTextContent('2022–2025'))
}

describe('checking the form against the title it describes', () => {
  beforeEach(resetDb)
  freezeDate(new Date(2026, 10, 7, 21, 30).getTime())

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  describe('the finish date', () => {
    it('refuses a finished show dated before the year it ended', async () => {
      await pickEndedSeverance()
      await pressButton('רק שנה')
      await typeYear('2024')

      expect(await screen.findByText('התאריך לא יכול להיות לפני 2025, השנה שבה נגמר')).toBeVisible()
      expect(await saveButton()).toHaveProperty('disabled', true)
    })

    it('stops the year at the year a finished show ended', async () => {
      await pickEndedSeverance()
      await pressButton('רק שנה')
      await typeYear('2025')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(await screen.findByRole('button', { name: 'שנה אחת פחות' })).toHaveProperty('disabled', true)

      await save()

      expect((await savedEntries())[0].finishedOn).toBe('2025')
    })

    it('lets a show watched partway be dated before it ended', async () => {
      await pickEndedSeverance()
      await waitFor(() => expect(document.querySelector('.stepper-count')).toHaveTextContent('3'))
      await pressButton('עונה אחת פחות')
      await pressButton('רק שנה')
      await typeYear('2023')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      await save()

      expect((await savedEntries())[0]).toMatchObject({ seasons: 2, finishedOn: '2023' })
    })

    it('opens a title released after this year with today’s date and no limit', async () => {
      stubSearchResults([{ source: 'tmdb', sourceId: 'movie/83533', title: 'Avatar: Fire and Ash', type: 'movie', year: 2027 }])
      renderAt('/tabs/home')
      await searchFor('avatar')
      await pickResult(/Avatar/)

      expect(await screen.findByLabelText('תאריך')).not.toHaveAttribute('min')
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      await save()

      expect((await savedEntries())[0].finishedOn).toBe('2026-11-07')
    })

    it('lets a stopped show be dated before it ended, but not before it came out', async () => {
      await pickEndedSeverance()
      await pressButton('עצרתי באמצע')
      await pressButton('רק שנה')
      await typeYear('2023')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()

      await typeYear('2021')

      expect(await screen.findByText('התאריך לא יכול להיות לפני 2022, השנה שבה יצא')).toBeVisible()
      expect(await saveButton()).toHaveProperty('disabled', true)
    })

    it('starts the date picker at the year a movie came out', async () => {
      stubSearchResults([DUNE])
      renderAt('/tabs/home')
      await searchFor('dune')
      await pickResult(/Dune/)

      expect(await screen.findByLabelText('תאריך')).toHaveAttribute('min', '2021-01-01')

      fireEvent.change(await screen.findByLabelText('תאריך'), { target: { value: '2020-06-01' } })

      expect(await screen.findByText('התאריך לא יכול להיות לפני 2021, השנה שבה יצא')).toBeVisible()
      expect(await saveButton()).toHaveProperty('disabled', true)
    })

    it('puts no limit on a title with no years', async () => {
      await openSaved(entry({ id: 'arrival', title: 'Arrival', type: 'movie', finishedOn: '2016' }))
      await typeYear('1950')

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(await saveButton()).toHaveProperty('disabled', false)
    })

    it('saves an old title dated before it came out when the date is left alone', async () => {
      await openSaved(entry({ id: 'arrival', title: 'Arrival', type: 'movie', releaseYear: 2016, finishedOn: '2010' }))
      await pressButton('אהבתי מאוד')
      await save()

      await waitFor(async () => expect((await db.entries.get('arrival'))?.rating).toBe('loved'))
      expect((await db.entries.get('arrival'))?.finishedOn).toBe('2010')
    })

    it('refuses an old title moved to another year before it came out', async () => {
      await openSaved(entry({ id: 'arrival', title: 'Arrival', type: 'movie', releaseYear: 2016, finishedOn: '2010' }))
      await typeYear('2012')

      expect(await screen.findByText('התאריך לא יכול להיות לפני 2016, השנה שבה יצא')).toBeVisible()
      expect(await saveButton()).toHaveProperty('disabled', true)
    })
  })

  describe('the seasons', () => {
    const oneSeasonMore = () => screen.findByRole('button', { name: 'עונה אחת יותר' })

    const seasonsShown = () => document.querySelector('.stepper-count')

    it('stops seasons watched at the seasons aired, and saves no aired count', async () => {
      await pickEndedSeverance()
      await waitFor(() => expect(seasonsShown()).toHaveTextContent('3'))

      expect(await oneSeasonMore()).toHaveProperty('disabled', true)

      await save()

      expect((await savedEntries())[0]).not.toHaveProperty('airedSeasons')
    })

    it('stops the stopped-at season at the seasons aired', async () => {
      await pickEndedSeverance()
      await pressButton('עצרתי באמצע')
      await pressButton('עונה אחת יותר')
      await pressButton('עונה אחת יותר')
      await pressButton('עונה אחת יותר')

      expect(seasonsShown()).toHaveTextContent('3')
      expect(await oneSeasonMore()).toHaveProperty('disabled', true)
    })

    it('refuses more seasons than aired when they were set before the lookup answered', async () => {
      let answer: (response: Response) => void = () => {}

      const lookup = new Promise<Response>((resolve) => {
        answer = resolve
      })

      stubSearchResults([SEVERANCE], { seasonsReply: () => lookup })
      renderAt('/tabs/home')
      await searchFor('severance')
      await pickResult(/Severance/)
      await pressButton('עונה אחת יותר')
      await pressButton('עונה אחת יותר')
      await pressButton('עונה אחת יותר')
      await pressButton('עונה אחת יותר')
      answer(Response.json({ seasons: 3 }))

      expect(await screen.findByText('יצאו רק 3 עונות')).toBeVisible()
      expect(await saveButton()).toHaveProperty('disabled', true)
    })

    it('stops an ended show at its saved seasons on edit', async () => {
      await openSaved(entry({ title: 'Mad Men', type: 'series', seasons: 1, endYear: 2015, lengthMinutes: [600, 620] }))
      await pressButton('עונה אחת יותר')

      expect(seasonsShown()).toHaveTextContent('2')
      expect(await oneSeasonMore()).toHaveProperty('disabled', true)
    })

    it('lets a show still airing go past its saved seasons on edit', async () => {
      await openSaved(entry({ id: 'severance', title: 'Severance', type: 'series', seasons: 2, lengthMinutes: [500, 520] }))
      await pressButton('עונה אחת יותר')
      await save()

      await waitFor(async () => expect((await db.entries.get('severance'))?.seasons).toBe(3))
    })
  })
})
