export function Gutter({ children, className, style }: {
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}) {
  return (
    <div
      className={className}
      style={{
        position: 'relative',
        flexShrink: 0,
        ...style
      }}
    >
      {children}
    </div>
  )
}
