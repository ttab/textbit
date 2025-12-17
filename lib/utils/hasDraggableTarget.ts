/**
 * Check if the target DOM element or one of its ancestors is explicitly set to be draggable.
 */
export function hasDraggableDOMTarget(event: React.DragEvent<HTMLDivElement>): boolean {
  let domElement = event.target as HTMLElement | null

  while (domElement && domElement !== event.currentTarget) {
    const draggableAttr = domElement.getAttribute('draggable')
    if (draggableAttr === 'true') {
      return true
    }

    domElement = domElement.parentElement
  }

  return false
}
