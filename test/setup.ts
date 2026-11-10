import 'fake-indexeddb/auto'
import '@testing-library/jest-dom/vitest'
import { setupIonicReact } from '@ionic/react'
import { cleanup, configure } from '@testing-library/react'
import { afterEach } from 'vitest'

configure({ defaultHidden: true })

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

function removeIonicStylesThatSlowRoleQueries() {
  const removeAddedStyles = (records: MutationRecord[]) =>
    records
      .flatMap((record) => Array.from(record.addedNodes))
      .forEach((node) => {
        if (node instanceof HTMLStyleElement) {
          node.remove()
        }
      })

  const styleRemover = new MutationObserver(removeAddedStyles)

  const watchStyles = (root: Node) => styleRemover.observe(root, { childList: true })

  const attachShadow = Element.prototype.attachShadow

  Element.prototype.attachShadow = function attachWatchedShadow(init) {
    const shadowRoot = attachShadow.call(this, init)

    watchStyles(shadowRoot)

    return shadowRoot
  }

  watchStyles(document.head)
}

removeIonicStylesThatSlowRoleQueries()
setupIonicReact({ mode: 'ios' })

afterEach(() => {
  cleanup()
})
