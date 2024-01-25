import React from 'react' // Necessary for esbuild
import { Node } from 'slate'
import { RenderElementProps } from "slate-react"
import { Plugin } from '@/types'


interface ChildElementProps extends RenderElementProps {
  entry: Plugin.ComponentEntry
  rootNode: Node
}

/**
 * Render a child element of class text, textblock, block, void)
 *
 * @param props RenderChildElementProps
 * @returns JSX.Element
 */
export const ChildElement = ({ attributes, children, element, entry, rootNode }: ChildElementProps) => {
  return (
    <div
      className={`child ${entry.type}`}
      data-id={element.id}
      {...attributes}
    >
      <div>
        {entry.component({ element, attributes, children, rootNode })}
      </div>
    </div>
  )
}
