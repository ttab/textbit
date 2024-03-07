import React,  // Necessary for esbuild
{
  PropsWithChildren
} from 'react'
import { useFocused, useSelected } from 'slate-react'

/**
 * Exported Element component that should wrap all parent components in plugins
 */
export const TextbitEditableElement = ({ children, className }: PropsWithChildren & {
  className?: string
}): JSX.Element => {
  const selected = useSelected()

  return <div className={className} data-state={selected ? 'active' : 'inactive'}>
    {children}
  </div>
}
