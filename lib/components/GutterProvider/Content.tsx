export function Content({children, style, className}: {
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <div style={style} className={className}>
      {children}
    </div>
  )
}
