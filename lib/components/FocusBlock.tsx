import type { CSSProperties, PropsWithChildren } from 'react'

interface FocusBlockProps {
  className?: string
  style?: CSSProperties
}

/**
 * Wrapper that shows a focus ring (via currentColor outline) when the
 * enclosing Slate block is active (data-state="active"), and hides it
 * when the block caret is displayed instead (data-state="before"/"after").
 *
 * Requires the ancestor ParentElement to carry the "group" class and the
 * appropriate data-state attribute — which textbit sets automatically.
 */
export function FocusBlock({ children, className, style }: PropsWithChildren<FocusBlockProps>) {
  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <div
        contentEditable={false}
        className='tb-focus-ring'
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          borderRadius: '4px'
        }}
      />
      <div style={{ position: 'relative' }}>
        {children}
      </div>
    </div>
  )
}
