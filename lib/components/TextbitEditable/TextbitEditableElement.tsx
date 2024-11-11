import { type PropsWithChildren } from 'react'
import { useSelected } from 'slate-react'

/**
 * Exported Element component that should wrap all parent components in plugins
 */
export const TextbitEditableElement = ({ children, className, draggable, contentEditable }: PropsWithChildren & {
  className?: string
  draggable?: boolean
  contentEditable?: boolean
}): JSX.Element => {
  const selected = useSelected()

  return (
    <div
      className={className}
      data-state={selected ? 'active' : 'inactive'}
      draggable={draggable ?? undefined}
      contentEditable={contentEditable === false ? false : undefined}
    >
      {children}
    </div>
  )
}
