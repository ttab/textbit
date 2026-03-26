if (typeof document !== 'undefined') {
  const id = 'textbit-keyframes'

  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id

    /**
     * Block caret blinking animation
     */

    /**
     * Focus ring shown on block/void elements when the cursor is inside them.
     * Hides automatically when the block caret (adjacent navigation) is active.
     *
     * Customisable via CSS custom properties:
     *   --tb-focus-ring-radius  Border radius of the ring (default: 2px)
     *
     * Example:
     *   .my-editor { --tb-focus-ring-radius: 6px; }
     */
    style.textContent = [
      `@keyframes block-caret-blink{0%,100%{opacity:1}50%{opacity:0}}`,
      `[data-state="active"] .tb-focus-ring{outline:1px solid currentColor;outline-offset:4px;border-radius:var(--tb-focus-ring-radius,5px);opacity:0.3}`
    ].join('')

    document.head.appendChild(style)
  }
}
