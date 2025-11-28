import {
  isValidElement,
  cloneElement
} from 'react'
import { Node } from 'slate'
import { useSlateStatic, type RenderElementProps } from 'slate-react'
import type { ComponentEntry } from '../../types'

interface ChildElementProps extends RenderElementProps {
  entry: ComponentEntry
  rootNode: Node
  options?: Record<string, unknown>
}

export function ChildElement({
  attributes,
  children,
  element,
  entry,
  rootNode,
  options
}: ChildElementProps) {
  const editor = useSlateStatic()
  const { component: Component } = entry
  const lang = element.lang || editor.lang

  // If there's a ref, the component expects to handle attributes itself (no wrapper)
  if (attributes.ref) {
    const childElement = (
      <Component
        element={element}
        attributes={attributes}
        children={children}
        rootNode={rootNode}
        options={options}
        editor={editor}
        ref={attributes.ref}
      />
    )

    if (!childElement || !isValidElement(childElement)) {
      console.error('Child component must return a valid React element')
      return <></>
    }

    // Clone and merge attributes directly into the element
    return cloneElement(childElement, {
      lang,
      'data-id': element.id,
      className: ['child', (childElement.props as React.HTMLAttributes<HTMLDivElement>)?.className].filter(Boolean).join(' '),
      ...attributes
    } as React.HTMLAttributes<HTMLDivElement>)
  }

  // No ref means regular component - use wrapper div
  return (
    <div
      lang={lang}
      data-id={element.id}
      className='child'
      {...attributes}
    >
      <Component element={element} rootNode={rootNode} options={options} editor={editor}>
        {children}
      </Component>
    </div>
  )
}
