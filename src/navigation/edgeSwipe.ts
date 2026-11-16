const EDGE_PX = 20

const CONTROL_SELECTOR = [
  '.ion-activatable',
  'button',
  'a',
  'input',
  'textarea',
  'select',
  'label',
  '[role="button"]',
  'ion-button',
  'ion-back-button',
  'ion-tab-button',
  'ion-item[button]',
  'ion-segment-button',
  'ion-item-option',
  'ion-toggle',
  'ion-select',
  'ion-checkbox',
].join(', ')

const startsAtEdge = (clientX: number, width: number) => clientX <= EDGE_PX || clientX >= width - EDGE_PX

const startsOnControl = (event: TouchEvent) =>
  event.composedPath().some((node) => node instanceof Element && node.matches(CONTROL_SELECTOR))

export function blockSystemEdgeSwipe(root: Document): () => void {
  function blockAtEdge(event: TouchEvent) {
    const [touch] = event.changedTouches

    if (touch && startsAtEdge(touch.clientX, window.innerWidth) && !startsOnControl(event)) {
      event.preventDefault()
    }
  }

  const listenerOptions = { capture: true, passive: false }

  root.addEventListener('touchstart', blockAtEdge, listenerOptions)

  return () => root.removeEventListener('touchstart', blockAtEdge, listenerOptions)
}
