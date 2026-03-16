if (typeof document !== 'undefined') {
  const id = 'textbit-keyframes'

  if (!document.getElementById(id)) {
    const style = document.createElement('style')
    style.id = id

    /**
     * Block caret blinking keyframes
     */
    style.textContent = `@keyframes block-caret-blink{0%,100%{opacity:1}50%{opacity:0}}`

    document.head.appendChild(style)
  }
}
