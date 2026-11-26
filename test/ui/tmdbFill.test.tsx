import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '../../src/data/db'
import { resetDb } from '../helpers/db'
import { entry } from '../helpers/entries'
import { currentPath, renderAt } from '../helpers/renderAt'
import { detailsCalls, DUNE, jsonReply, lengthCalls, SEVERANCE, stubSearchResults } from '../helpers/searchService'

const severance = entry({ title: 'Severance', type: 'series', source: 'tmdb', sourceId: SEVERANCE.sourceId })

const DUNE_ID = DUNE.sourceId

const dune = entry({ title: 'Dune', type: 'movie', source: 'tmdb', sourceId: DUNE_ID })

const HEADING = 'השלמה מ-TMDB'

const FILL_ACTION = 'השלמת ז׳אנרים ואורכים'

const ONE_WAITING = 'לכותר אחד מ-TMDB חסרים ז׳אנרים או אורך, ולכן הסינון לפי ז׳אנר והשעות בסטטיסטיקה לא כוללים אותו.'

const TWO_WAITING = 'ל-2 כותרים מ-TMDB חסרים ז׳אנרים או אורך, ולכן הסינון לפי ז׳אנר והשעות בסטטיסטיקה לא כוללים אותם.'

const DRAMA_REPLY = jsonReply({ genres: [{ id: 18, name: 'Drama' }] })

const LENGTH_REPLIES = { seasonsReply: jsonReply({ seasons: 1 }), lengthReply: jsonReply({ minutes: 60 }) }

const failedReply = async () => new Response(null, { status: 502 })

describe('filling from TMDB', () => {
  beforeEach(resetDb)

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('shows no TMDB card when no TMDB title waits for genres or a length', async () => {
    await db.entries.bulkAdd([entry({ title: 'Notebook' }), { ...dune, genres: [], lengthMinutes: [] }])
    renderAt('/tabs/settings')

    await screen.findByRole('heading', { name: 'גיבוי' })

    expect(screen.queryByRole('heading', { name: HEADING })).not.toBeInTheDocument()
  })

  it('says how many TMDB titles wait for genres or a length', async () => {
    await db.entries.bulkAdd([severance, dune])
    renderAt('/tabs/settings')

    expect(await screen.findByRole('heading', { name: HEADING })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: FILL_ACTION })).toBeInTheDocument()
    expect(screen.getByText(TWO_WAITING)).toBeInTheDocument()
  })

  it('speaks of a single waiting title in the singular', async () => {
    await db.entries.add(dune)
    renderAt('/tabs/settings')

    expect(await screen.findByText(ONE_WAITING)).toBeInTheDocument()
  })

  it('fills the genres and lengths of the waiting titles and says how many were filled', async () => {
    await db.entries.bulkAdd([severance, dune])
    stubSearchResults([], { detailsReply: DRAMA_REPLY, ...LENGTH_REPLIES })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: FILL_ACTION }))

    expect(await screen.findByText('הושלמו 2 כותרים.')).toBeInTheDocument()
    expect(await db.entries.get(severance.id)).toMatchObject({ genres: ['drama'], lengthMinutes: [60] })
    expect(await db.entries.get(dune.id)).toMatchObject({ genres: ['drama'], lengthMinutes: [60] })
    expect(screen.getByRole('heading', { name: HEADING })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: FILL_ACTION })).not.toBeInTheDocument()
  })

  it('offers a title missing only a length, and looks up only its length', async () => {
    await db.entries.add({ ...dune, genres: ['scifi'] })

    const fetchStub = stubSearchResults([], { detailsReply: DRAMA_REPLY, ...LENGTH_REPLIES })

    renderAt('/tabs/settings')

    expect(await screen.findByText(ONE_WAITING)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: FILL_ACTION }))

    expect(await screen.findByText('הושלם כותר אחד.')).toBeInTheDocument()
    expect(await db.entries.get(dune.id)).toMatchObject({ genres: ['scifi'], lengthMinutes: [60] })
    expect(detailsCalls(fetchStub)).toEqual([])
  })

  it('keeps the genres found when the length fails, and the retry looks up only the length', async () => {
    await db.entries.add(dune)

    let lengthFails = true

    const fetchStub = stubSearchResults([], {
      detailsReply: DRAMA_REPLY,
      lengthReply: async () => (lengthFails ? failedReply() : Response.json({ minutes: 155 })),
    })

    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: FILL_ACTION }))

    expect(await screen.findByText('כותר אחד לא הצליח, ואפשר לנסות שוב.')).toBeInTheDocument()
    expect(await db.entries.get(dune.id)).toMatchObject({ genres: ['drama'] })
    expect((await db.entries.get(dune.id))?.lengthMinutes).toBeUndefined()

    lengthFails = false
    fetchStub.mockClear()
    fireEvent.click(screen.getByRole('button', { name: 'ניסיון חוזר לכותר אחד' }))

    expect(await screen.findByText('הושלם כותר אחד.')).toBeInTheDocument()
    expect(await db.entries.get(dune.id)).toMatchObject({ genres: ['drama'], lengthMinutes: [155] })
    expect(detailsCalls(fetchStub)).toEqual([])
    expect(lengthCalls(fetchStub)).toHaveLength(1)
  })

  it('counts a failed lookup and fills it on retry', async () => {
    await db.entries.bulkAdd([severance, dune])

    let duneFails = true

    stubSearchResults([], {
      ...LENGTH_REPLIES,
      detailsReply: async (url) =>
        duneFails && url.includes(encodeURIComponent(DUNE_ID)) ? failedReply() : DRAMA_REPLY(),
    })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: FILL_ACTION }))

    expect(await screen.findByText('הושלם כותר אחד. כותר אחד לא הצליח, ואפשר לנסות שוב.')).toBeInTheDocument()
    expect((await db.entries.get(dune.id))?.genres).toBeUndefined()

    duneFails = false
    fireEvent.click(screen.getByRole('button', { name: 'ניסיון חוזר לכותר אחד' }))

    expect(await screen.findByText('הושלם כותר אחד.')).toBeInTheDocument()
    expect(await db.entries.get(dune.id)).toMatchObject({ genres: ['drama'] })
  })

  it('goes back to the waiting count once more titles wait than failed', async () => {
    await db.entries.add(dune)
    stubSearchResults([], { detailsReply: failedReply })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: FILL_ACTION }))
    await screen.findByText('כותר אחד לא הצליח, ואפשר לנסות שוב.')

    await db.entries.add(severance)

    expect(await screen.findByText(TWO_WAITING)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: FILL_ACTION })).toBeInTheDocument()
  })

  it('shows the progress while the lookups run', async () => {
    await db.entries.bulkAdd([severance, dune])

    const pendingReplies: Array<(reply: Response) => void> = []

    stubSearchResults([], {
      ...LENGTH_REPLIES,
      detailsReply: () => new Promise((resolve) => pendingReplies.push(resolve)),
    })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: FILL_ACTION }))

    expect(await screen.findByText('משלים… 0 מתוך 2')).toBeInTheDocument()

    await waitFor(() => expect(pendingReplies).toHaveLength(2))
    pendingReplies[0](Response.json({ genres: [] }))

    expect(await screen.findByText('משלים… 1 מתוך 2')).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: 'התקדמות ההשלמה מ-TMDB' })).toHaveAttribute('aria-valuenow', '1')
    expect(screen.queryByRole('button', { name: FILL_ACTION })).not.toBeInTheDocument()
    expect(screen.getByText(TWO_WAITING)).toBeInTheDocument()

    pendingReplies[1](Response.json({ genres: [] }))

    expect(await screen.findByText('הושלמו 2 כותרים.')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('drops the result once Settings is left', async () => {
    await db.entries.add(dune)
    stubSearchResults([], { detailsReply: DRAMA_REPLY, ...LENGTH_REPLIES })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: FILL_ACTION }))
    await screen.findByText('הושלם כותר אחד.')

    fireEvent.click(screen.getByText('בית', { selector: 'ion-label' }))
    await waitFor(() => expect(currentPath()).toBe('/tabs/home'))
    fireEvent.click(screen.getByText('הגדרות', { selector: 'ion-label' }))
    await waitFor(() => expect(currentPath()).toBe('/tabs/settings'))

    await waitFor(() => expect(screen.queryByText('הושלם כותר אחד.')).not.toBeInTheDocument())
    expect(screen.queryByRole('heading', { name: HEADING })).not.toBeInTheDocument()
  })

  it('shows no result for a run that ends after Settings was left', async () => {
    await db.entries.add(dune)

    const pendingReplies: Array<(reply: Response) => void> = []

    stubSearchResults([], {
      ...LENGTH_REPLIES,
      detailsReply: () => new Promise((resolve) => pendingReplies.push(resolve)),
    })
    renderAt('/tabs/settings')

    fireEvent.click(await screen.findByRole('button', { name: FILL_ACTION }))
    await waitFor(() => expect(pendingReplies).toHaveLength(1))

    fireEvent.click(screen.getByText('בית', { selector: 'ion-label' }))
    await waitFor(() => expect(currentPath()).toBe('/tabs/home'))
    pendingReplies[0](Response.json({ genres: [{ id: 18, name: 'Drama' }] }))
    await waitFor(async () => expect(await db.entries.get(dune.id)).toMatchObject({ genres: ['drama'] }))

    fireEvent.click(screen.getByText('הגדרות', { selector: 'ion-label' }))
    await waitFor(() => expect(currentPath()).toBe('/tabs/settings'))

    await waitFor(() => expect(screen.queryByRole('heading', { name: HEADING })).not.toBeInTheDocument())
    expect(screen.queryByText('הושלם כותר אחד.')).not.toBeInTheDocument()
  })
})
