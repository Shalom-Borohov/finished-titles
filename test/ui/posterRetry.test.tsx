import { fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Poster } from '../../src/components/Poster'

const POSTER_URL = 'https://image.test/poster.jpg'

const OTHER_POSTER_URL = 'https://image.test/other.jpg'

function elementAt(selector: string) {
  const element = document.querySelector(selector)

  if (!element) {
    throw new Error(`Nothing matches ${selector}`)
  }

  return element
}

const shownPoster = () => document.querySelector('.poster img:not([hidden])')

const retryImage = () => document.querySelector('.poster img[hidden]')

const placeholder = () => document.querySelector('.poster-placeholder')

function setPhone({ online, visibility }: { online: boolean; visibility: DocumentVisibilityState }) {
  vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online)
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(visibility)
}

function renderFailedPoster() {
  setPhone({ online: false, visibility: 'visible' })
  render(<Poster title="Gone" posterUrl={POSTER_URL} />)
  fireEvent.error(elementAt('.poster img'))
}

function comeBackOnline() {
  setPhone({ online: true, visibility: 'visible' })
  fireEvent(window, new Event('online'))
}

function comeToForeground({ online }: { online: boolean }) {
  setPhone({ online, visibility: 'visible' })
  fireEvent(document, new Event('visibilitychange'))
}

describe('poster that failed to load', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows the poster once it loads after the phone is back online', () => {
    renderFailedPoster()
    comeBackOnline()
    fireEvent.load(elementAt('.poster img[hidden]'))

    expect(shownPoster()).toHaveAttribute('src', POSTER_URL)
    expect(placeholder()).toBeNull()
    expect(retryImage()).toBeNull()
  })

  it('keeps the placeholder while it tries again', () => {
    renderFailedPoster()
    comeBackOnline()

    expect(placeholder()).toHaveAttribute('data-title', 'Gone')
    expect(retryImage()).toHaveAttribute('src', POSTER_URL)
    expect(shownPoster()).toBeNull()
  })

  it('keeps the placeholder when trying again fails, and tries once more on the next trigger', () => {
    renderFailedPoster()
    comeBackOnline()
    fireEvent.error(elementAt('.poster img[hidden]'))

    expect(retryImage()).toBeNull()
    expect(placeholder()).toHaveAttribute('data-title', 'Gone')

    comeBackOnline()

    expect(retryImage()).toHaveAttribute('src', POSTER_URL)
  })

  it('tries again when the app comes back to the foreground while online', () => {
    renderFailedPoster()
    comeToForeground({ online: true })

    expect(retryImage()).toHaveAttribute('src', POSTER_URL)
  })

  it('waits when the app comes back to the foreground while still offline', () => {
    renderFailedPoster()
    comeToForeground({ online: false })

    expect(retryImage()).toBeNull()
  })

  it('waits for a trigger before trying a new poster that also fails', () => {
    const { rerender } = render(<Poster title="Gone" posterUrl={POSTER_URL} />)

    setPhone({ online: false, visibility: 'visible' })
    fireEvent.error(elementAt('.poster img'))
    comeBackOnline()
    rerender(<Poster title="Gone" posterUrl={OTHER_POSTER_URL} />)
    fireEvent.error(elementAt('.poster img'))

    expect(retryImage()).toBeNull()
    expect(placeholder()).toHaveAttribute('data-title', 'Gone')
  })

  it('drops the attempt when the poster is removed while it tries again', () => {
    const { rerender } = render(<Poster title="Gone" posterUrl={POSTER_URL} />)

    setPhone({ online: false, visibility: 'visible' })
    fireEvent.error(elementAt('.poster img'))
    comeBackOnline()
    rerender(<Poster title="Gone" />)

    expect(document.querySelector('.poster img')).toBeNull()
  })

  it('waits when the app goes to the background', () => {
    renderFailedPoster()
    setPhone({ online: true, visibility: 'hidden' })
    fireEvent(document, new Event('visibilitychange'))

    expect(retryImage()).toBeNull()
  })
})
