export function clearFailedPage() {
  window.location.hash = ''
}

export function reloadAtStart() {
  clearFailedPage()
  window.location.reload()
}
