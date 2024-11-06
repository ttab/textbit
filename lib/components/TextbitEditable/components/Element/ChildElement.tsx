import { Node } from 'slate'
import type { RenderElementProps } from 'slate-react'
import type { Plugin } from '../../../../types'


interface ChildElementProps extends RenderElementProps {
  entry: Plugin.ComponentEntry
  rootNode: Node
  options?: Record<string, unknown>
}

/**
 * Render a child element of class text, textblock, block, void)
 *
 * @param props RenderChildElementProps
 * @returns JSX.Element
 */
export const ChildElement = ({ attributes, children, element, entry, rootNode, options }: ChildElementProps) => {
  return (
    // FIXME: @ts-expect-error FIXME:
    <div className='child' data-id={element.id} {...attributes}>
      {entry.component({ element, attributes, children, rootNode, options })}
    </div>
  )
}
