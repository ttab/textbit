import { Children, type PropsWithChildren, useContext } from 'react'
import { useSlateStatic } from 'slate-react'
import { ItemContext } from './Item'

export const Icon = ({ children, className }: PropsWithChildren & {
  className?: string
}) => {
  const editor = useSlateStatic()
  const { isActive, action } = useContext(ItemContext)
  const Tool = Array.isArray(action?.tool) ? action.tool[0] || null : action?.tool || null

  if (Tool && !Children.count(children)) {
    return (
      <div className={className}>
        {isActive && '✓'}
        {!isActive && Tool && <Tool editor={editor} />}
      </div>
    )
  }

  return (
    <div className={className}>
      {children}
    </div>
  )
}
