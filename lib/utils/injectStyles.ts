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
    /**
     * Soft break (newline) chip. Marks a `\n` inside a text leaf so authors can
     * see it. Colours derive from currentColor so it works on any field
     * background and in dark mode.
     *
     * Customisable via CSS custom properties:
     *   --tb-newline-background  Fill (default: tinted currentColor)
     *   --tb-newline-border      Inset outline colour (default: tinted currentColor)
     *   --tb-newline-radius      Corner radius (default: 2px)
     *   --tb-newline-symbol      Symbol shown before the break (default: '\21B5')
     */
    style.textContent = [
      `@keyframes block-caret-blink{0%,100%{opacity:1}50%{opacity:0}}`,
      `[data-state="active"] .tb-focus-ring{outline:1px solid currentColor;outline-offset:4px;border-radius:var(--tb-focus-ring-radius,5px);opacity:0.3}`,
      `.tb-newline{background:var(--tb-newline-background,color-mix(in srgb,currentColor 18%,transparent));box-shadow:inset 0 0 0 1px var(--tb-newline-border,color-mix(in srgb,currentColor 45%,transparent));border-radius:var(--tb-newline-radius,2px)}`,
      `.tb-newline::before{content:var(--tb-newline-symbol,'\\21B5');opacity:0.6;user-select:none;-webkit-user-select:none;pointer-events:none}`
    ].join('')

    document.head.appendChild(style)
  }
}
