import {
  isValidElement,
  cloneElement,
  type ReactNode,
  type ForwardRefExoticComponent,
  type ForwardRefRenderFunction
} from 'react'
import { Node } from 'slate'
import { useSlateStatic, type ReactEditor, type RenderElementProps } from 'slate-react'
import type { ComponentEntry } from '../../types'

interface ChildElementProps extends RenderElementProps {
  entry: ComponentEntry
  rootNode: Node
  options?: Record<string, unknown>
}

type ForwardRefComponent<P> = ForwardRefExoticComponent<P> & {
  render: ForwardRefRenderFunction<HTMLElement, P>
}

// Type for component props
interface ComponentProps {
  element: Node
  attributes?: Record<string, unknown>
  rootNode: Node
  options?: Record<string, unknown>
  children?: ReactNode
  editor: ReactEditor
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

  // Check if the component is forwardRef
  if (isForwardRefComponent<ComponentProps>(Component)) {
    try {
      const childElement = Component.render({
        element,
        attributes,
        children,
        rootNode,
        options,
        editor
      }, attributes.ref)

      if (!childElement || !isValidElement(childElement)) {
        console.error('entry.component must return a valid React element')
        return <></>
      }

      // Clone element and merge props
      return cloneElement(childElement, {
        lang,
        'data-id': element.id,
        className: ['child', (childElement.props as React.HTMLAttributes<HTMLDivElement>)?.className].filter(Boolean).join(' '),
        ...attributes
      } as React.HTMLAttributes<HTMLDivElement>)
    } catch (error) {
      console.error('Error rendering forwardRef component:', error)
      return <></>
    }
  }

  // Regular function component
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


// Improved type-safe forwardRef component check
const isForwardRefComponent = <P,>(
  component: unknown
): component is ForwardRefComponent<P> => {
  return (
    typeof component === 'object'
    && component !== null
    && (component as Record<string, unknown>).$$typeof === Symbol.for('react.forward_ref')
  )
}
