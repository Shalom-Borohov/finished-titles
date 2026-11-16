import { act, waitFor } from '@testing-library/react'
import { expect, vi } from 'vitest'

const FULLY_SHOWN = 1

const NOT_SHOWN = 0

const observers = new Set<StubIntersectionObserver>()

function entryFor(target: Element, isIntersecting: boolean): IntersectionObserverEntry {
  const bounds = target.getBoundingClientRect()

  return {
    boundingClientRect: bounds,
    intersectionRatio: isIntersecting ? FULLY_SHOWN : NOT_SHOWN,
    intersectionRect: bounds,
    isIntersecting,
    rootBounds: null,
    target,
    time: performance.now(),
  }
}

class StubIntersectionObserver implements IntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly scrollMargin = ''
  readonly thresholds: ReadonlyArray<number> = []
  private readonly notify: IntersectionObserverCallback
  private readonly targets = new Set<Element>()

  constructor(notify: IntersectionObserverCallback) {
    this.notify = notify
  }

  observe(target: Element) {
    this.targets.add(target)
    observers.add(this)
  }

  unobserve(target: Element) {
    this.targets.delete(target)
  }

  disconnect() {
    this.targets.clear()
    observers.delete(this)
  }

  takeRecords() {
    return []
  }

  show(isIntersecting: boolean) {
    this.notify(Array.from(this.targets, (target) => entryFor(target, isIntersecting)), this)
  }
}

const showEndOfResults = (isShown: boolean) => act(() => observers.forEach((observer) => observer.show(isShown)))

export function stubIntersectionObserver() {
  observers.clear()
  vi.stubGlobal('IntersectionObserver', StubIntersectionObserver)
}

export async function revealEndOfResults() {
  await waitFor(() => expect(observers.size).toBeGreaterThan(0))
  showEndOfResults(true)
}

export const hideEndOfResults = () => showEndOfResults(false)
