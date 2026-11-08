import { fireEvent, screen, waitFor } from '@testing-library/react'
import { expect } from 'vitest'

export function ionEvent(el: Element, name: 'ionChange' | 'ionInput' | 'ionReorderEnd', detail: object) {
  fireEvent(el, new CustomEvent(name, { detail, bubbles: true }))
}

export const ionChange = (el: Element, value: string) => ionEvent(el, 'ionChange', { value })

export const ionInput = (el: Element, value: string) => ionEvent(el, 'ionInput', { value })

export async function ionField(label: string) {
  const native = await screen.findByLabelText(label)
  const field = native.closest('ion-input, ion-textarea, ion-searchbar')

  if (!field) {
    throw new Error(`no Ionic field labelled ${label}`)
  }

  return field
}

const VISIBLE_PAGE = '.ion-page:not(.ion-page-hidden)'

export function visibleAll(selector: string) {
  return Array.from(document.querySelectorAll(`${VISIBLE_PAGE} ${selector}`))
}

export function ionElement(selector: string) {
  return waitFor(() => {
    const element = document.querySelector(`${VISIBLE_PAGE} ${selector}`)

    if (!element) {
      throw new Error(`no element ${selector}`)
    }

    return element
  })
}

export const buttonByLabel = (label: string) => ionElement(`ion-button[aria-label="${label}"]`)

export async function expectInOrder(texts: string[]) {
  const elements = await Promise.all(texts.map((text) => screen.findByText(text)))

  elements.slice(1).forEach((element, index) => {
    expect(elements[index].compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
}
