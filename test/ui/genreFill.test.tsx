import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { currentPath, renderAt } from '../helpers/renderAt'
import { DUNE, jsonReply, SEVERANCE, stubSearchResults } from '../helpers/searchService'

const severance = entry({ title: 'Severance', type: 'series', source: 'tmdb', sourceId: SEVERANCE.sourceId })

const DUNE_ID = DUNE.sourceId

const dune = entry({ title: 'Dune', type: 'movie', source: 'tmdb', sourceId: DUNE_ID })

describe('genre fill', () => {
  beforeEach(resetDb)

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('shows no genres card when no TMDB title waits for genres', async () => {
    await db.entries.bulkAdd([entry({ title: 'Notebook' }), { ...dune, genres: [] }])
    renderAt('/tabs/settings')

    await screen.findByRole('heading', { name: 'גיבוי' })

    expect(screen.queryByRole('heading', { name: 'ז׳אנרים' })).not.toBeInTheDocument()
  })

  it('says how many TMDB titles wait for genres', async () => {
    await db.entries.bulkAdd([severance, dune])
    renderAt('/tabs/settings')

    expect(await screen.findByRole('heading', { name: 'ז׳אנרים' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' })).toBeInTheDocument()
    expect(
      screen.getByText('ל-2 כותרים מ-TMDB עדיין אין ז׳אנרים, ולכן הסינון לפי ז׳אנר לא מוצא אותם.'),
    ).toBeInTheDocument()
  })

  it('speaks of a single waiting title in the singular', async () => {
    await db.entries.add(dune)
    renderAt('/tabs/settings')

    expect(
      await screen.findByText('לכותר אחד מ-TMDB עדיין אין ז׳אנרים, ולכן הסינון לפי ז׳אנר לא מוצא אותו.'),
    ).toBeInTheDocument()
  })

  it('fills the waiting titles with their TMDB genres and says how many were filled', async () => {
    await db.entries.bulkAdd([severance, dune])
    stubSearchResults([], { detailsReply: jsonReply({ genres: [{ id: 18, name: 'Drama' }] }) })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' }))

    expect(await screen.findByText('הושלמו 2 כותרים.')).toBeInTheDocument()
    expect(await db.entries.get(severance.id)).toMatchObject({ genres: ['drama'] })
    expect(await db.entries.get(dune.id)).toMatchObject({ genres: ['drama'] })
    expect(screen.getByRole('heading', { name: 'ז׳אנרים' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' })).not.toBeInTheDocument()
  })

  it('counts a failed lookup and fills it on retry', async () => {
    await db.entries.bulkAdd([severance, dune])

    let duneFails = true

    stubSearchResults([], {
      detailsReply: async (url) =>
        duneFails && url.includes(encodeURIComponent(DUNE_ID))
          ? new Response(null, { status: 502 })
          : Response.json({ genres: [{ id: 18, name: 'Drama' }] }),
    })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' }))

    expect(await screen.findByText('הושלם כותר אחד. כותר אחד לא הצליח, ואפשר לנסות שוב.')).toBeInTheDocument()
    expect(await db.entries.get(dune.id)).not.toHaveProperty('genres')

    duneFails = false
    fireEvent.click(screen.getByRole('button', { name: 'ניסיון חוזר לכותר אחד' }))

    expect(await screen.findByText('הושלם כותר אחד.')).toBeInTheDocument()
    expect(await db.entries.get(dune.id)).toMatchObject({ genres: ['drama'] })
  })

  it('goes back to the waiting count once more titles wait than failed', async () => {
    await db.entries.add(dune)
    stubSearchResults([], { detailsReply: async () => new Response(null, { status: 502 }) })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' }))
    await screen.findByText('כותר אחד לא הצליח, ואפשר לנסות שוב.')

    await db.entries.add(severance)

    expect(
      await screen.findByText('ל-2 כותרים מ-TMDB עדיין אין ז׳אנרים, ולכן הסינון לפי ז׳אנר לא מוצא אותם.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' })).toBeInTheDocument()
  })

  it('shows the progress while the lookups run', async () => {
    await db.entries.bulkAdd([severance, dune])

    const pendingReplies: Array<(reply: Response) => void> = []

    stubSearchResults([], {
      detailsReply: () => new Promise((resolve) => pendingReplies.push(resolve)),
    })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' }))

    expect(await screen.findByText('משלים… 0 מתוך 2')).toBeInTheDocument()

    await waitFor(() => expect(pendingReplies).toHaveLength(2))
    pendingReplies[0](Response.json({ genres: [] }))

    expect(await screen.findByText('משלים… 1 מתוך 2')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'התקדמות השלמת הז׳אנרים' })).toHaveAttribute('aria-valuenow', '1')
    expect(screen.queryByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' })).not.toBeInTheDocument()
    expect(
      screen.getByText('ל-2 כותרים מ-TMDB עדיין אין ז׳אנרים, ולכן הסינון לפי ז׳אנר לא מוצא אותם.'),
    ).toBeInTheDocument()

    pendingReplies[1](Response.json({ genres: [] }))

    expect(await screen.findByText('הושלמו 2 כותרים.')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('drops the result once Settings is left', async () => {
    await db.entries.add(dune)
    stubSearchResults([], { detailsReply: jsonReply({ genres: [{ id: 18, name: 'Drama' }] }) })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' }))
    await screen.findByText('הושלם כותר אחד.')

    fireEvent.click(screen.getByText('בית', { selector: 'ion-label' }))
    await waitFor(() => expect(currentPath()).toBe('/tabs/home'))
    fireEvent.click(screen.getByText('הגדרות', { selector: 'ion-label' }))
    await waitFor(() => expect(currentPath()).toBe('/tabs/settings'))

    await waitFor(() => expect(screen.queryByText('הושלם כותר אחד.')).not.toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: 'ז׳אנרים' })).not.toBeInTheDocument()
  })

  it('shows no result for a run that ends after Settings was left', async () => {
    await db.entries.add(dune)

    const pendingReplies: Array<(reply: Response) => void> = []

    stubSearchResults([], {
      detailsReply: () => new Promise((resolve) => pendingReplies.push(resolve)),
    })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: 'השלמת ז׳אנרים מ-TMDB' }))
    await waitFor(() => expect(pendingReplies).toHaveLength(1))

    fireEvent.click(screen.getByText('בית', { selector: 'ion-label' }))
    await waitFor(() => expect(currentPath()).toBe('/tabs/home'))
    pendingReplies[0](Response.json({ genres: [{ id: 18, name: 'Drama' }] }))
    await waitFor(async () => expect(await db.entries.get(dune.id)).toMatchObject({ genres: ['drama'] }))

    fireEvent.click(screen.getByText('הגדרות', { selector: 'ion-label' }))
    await waitFor(() => expect(currentPath()).toBe('/tabs/settings'))

    await waitFor(() => expect(screen.queryByRole('heading', { name: 'ז׳אנרים' })).not.toBeInTheDocument())
    expect(screen.queryByText('הושלם כותר אחד.')).not.toBeInTheDocument()
  })
})
