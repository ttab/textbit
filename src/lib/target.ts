export function isFromTarget(element: HTMLElement, options: { id?: string, className?: string }) {
  let el: HTMLElement | null = element

  if (options.className) {
    while (el) {
      if (el.classList.contains(options.className)) {
        return true
      }

      el = el.parentElement
    }
  }
  else if (options.id) {
    while (el) {
      if (el.id === options.id) {
        return true
      }

      el = el.parentElement
    }
  }

  return false
}