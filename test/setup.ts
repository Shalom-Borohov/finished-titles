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

setupIonicReact({ mode: 'ios' })

afterEach(() => {
  cleanup()
})
