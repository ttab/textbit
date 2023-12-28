import React from 'react' // Necessary for esbuild
import { Node } from "slate"
import { RenderElementProps } from "slate-react"
import { Registry } from '../../../Registry'

type RenderChildElementProps = {
  component: Registry
  rootNode: Node
} & RenderElementProps

/**
 * Render a child element of class text, textblock, block, void)
 *
 * @param props RenderChildElementProps
 * @returns JSX.Element
 */
export const ChildElement = ({ attributes, children, element, component, rootNode }: RenderChildElementProps) => {
  return (
    <div
      className={`child ${component.type}`}
      data-id={element.id}
      {...attributes}
    >
      <div>
        {component.component.render({ element, attributes, children, rootNode })}
      </div>
    </div>
  )
}
