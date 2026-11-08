import { fireEvent } from '@testing-library/react'

function last(selector: string) {
  const elements = document.querySelectorAll(selector)
  const element = elements.item(elements.length - 1)

  if (!element) {
    throw new Error(`no element ${selector}`)
  }

  return element
}

const buttonTexts = (overlay: string, button: string) =>
  Array.from(last(overlay).querySelectorAll(button), (element) => element.textContent?.trim())

function buttonIn(overlay: string, button: string, text: string) {
  const match = Array.from(last(overlay).querySelectorAll(button)).find(
    (element) => element.textContent?.trim() === text,
  )

  if (!match) {
    throw new Error(`no ${overlay} button ${text}`)
  }

  return match
}

export const sheetHeader = () => last('ion-action-sheet .action-sheet-title').textContent

export const sheetButtons = () => buttonTexts('ion-action-sheet', '.action-sheet-button')

export const sheetButton = (text: string) => buttonIn('ion-action-sheet', '.action-sheet-button', text)

export const clickSheetButton = (text: string) => fireEvent.click(sheetButton(text))

const overlayEvent = (
  name: 'ionActionSheetDidPresent' | 'ionActionSheetDidDismiss' | 'ionAlertDidPresent' | 'ionAlertDidDismiss',
) =>
  new Promise((resolve) => {
    document.addEventListener(name, resolve, { once: true })
  })

export const actionSheetPresented = () => overlayEvent('ionActionSheetDidPresent')

export const actionSheetDismissed = () => overlayEvent('ionActionSheetDidDismiss')

export const alertShown = () => overlayEvent('ionAlertDidPresent')

export const alertDismissed = () => overlayEvent('ionAlertDidDismiss')

export const alertHeader = () => last('ion-alert .alert-title').textContent

export const typeInAlert = (value: string) => fireEvent.input(last('ion-alert input'), { target: { value } })

export const clickAlertButton = (text: string) => fireEvent.click(buttonIn('ion-alert', '.alert-button', text))
