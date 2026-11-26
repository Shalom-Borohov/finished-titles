import { vi } from 'vitest'

export const pwa = { needRefresh: true, updateServiceWorker: vi.fn(async () => {}) }

export const useRegisterSW = () => ({
  needRefresh: [pwa.needRefresh, vi.fn()],
  updateServiceWorker: pwa.updateServiceWorker,
})
