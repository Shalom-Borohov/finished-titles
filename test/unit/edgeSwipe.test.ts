import { fireEvent } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { blockSystemEdgeSwipe } from '../../src/navigation/edgeSwipe'

const SCREEN_WIDTH = 390

const INSIDE_EDGE = 5

const OUTSIDE_EDGE = 40

const EDGE_STRIP = 20

function element(selector: string) {
  const found = document.querySelector(selector)

  if (!found) {
    throw new Error(`fixture missing ${selector}`)
  }

  return found
}

const isBlocked = (target: Element, clientX: number) =>
  !fireEvent.touchStart(target, { touches: [{ clientX }], changedTouches: [{ clientX }] })

const isSecondFingerBlocked = (target: Element, heldClientX: number, startedClientX: number) =>
  !fireEvent.touchStart(target, {
    touches: [{ clientX: heldClientX }, { clientX: startedClientX }],
    changedTouches: [{ clientX: startedClientX }],
  })

describe('blocking the iPhone’s own edge swipe', () => {
  let release = () => {}

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: SCREEN_WIDTH })
    document.body.innerHTML = '<div class="content"><p>text</p><ion-button>tap</ion-button></div>'
    release = blockSystemEdgeSwipe(document)
  })

  afterEach(() => {
    release()
    document.body.innerHTML = ''
  })

  it.each([
    ['right', SCREEN_WIDTH - INSIDE_EDGE],
    ['left', INSIDE_EDGE],
    ['right strip’s inner', SCREEN_WIDTH - EDGE_STRIP],
    ['left strip’s inner', EDGE_STRIP],
  ])('blocks a touch that starts at the %s edge', (_, clientX) => {
    expect(isBlocked(element('p'), clientX)).toBe(true)
  })

  it.each([SCREEN_WIDTH / 2, SCREEN_WIDTH - OUTSIDE_EDGE, OUTSIDE_EDGE, SCREEN_WIDTH - EDGE_STRIP - 1, EDGE_STRIP + 1])(
    'leaves a touch at x=%d alone',
    (clientX) => {
      expect(isBlocked(element('p'), clientX)).toBe(false)
    },
  )

  it('blocks a second finger that starts at the edge while the first is held mid-screen', () => {
    expect(isSecondFingerBlocked(element('p'), SCREEN_WIDTH / 2, SCREEN_WIDTH - INSIDE_EDGE)).toBe(true)
  })

  it('leaves a second finger mid-screen alone while the first is held at the edge', () => {
    expect(isSecondFingerBlocked(element('p'), SCREEN_WIDTH - INSIDE_EDGE, SCREEN_WIDTH / 2)).toBe(false)
  })

  it('keeps taps on a button at the edge working', () => {
    expect(isBlocked(element('ion-button'), SCREEN_WIDTH - INSIDE_EDGE)).toBe(false)
  })

  it('blocks a touch at the edge on an alert’s backdrop', () => {
    const alert = document.createElement('ion-alert')
    const backdrop = document.createElement('ion-backdrop')

    alert.attachShadow({ mode: 'open' }).append(backdrop)
    document.body.append(alert)

    expect(isBlocked(backdrop, INSIDE_EDGE)).toBe(true)
  })

  it('stops blocking once released', () => {
    release()

    expect(isBlocked(element('p'), SCREEN_WIDTH - INSIDE_EDGE)).toBe(false)
  })
})
