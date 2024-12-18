import {
  isValidElement,
  cloneElement,
  type ReactElement,
  type ReactNode,
  type ForwardRefExoticComponent,
  type ForwardRefRenderFunction,
  type ForwardedRef
} from 'react'
import { Node } from 'slate'
import type { RenderElementProps } from 'slate-react'
import type { Plugin } from '../../../../types'

interface ChildElementProps extends RenderElementProps {
  entry: Plugin.ComponentEntry
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
}

export const ChildElement = ({
  attributes,
  children,
  element,
  entry,
  rootNode,
  options
}: ChildElementProps): ReactElement => {
  const { component: Component } = entry

  // Check if the component is forwardRef
  if (isForwardRefComponent<ComponentProps>(Component)) {
    try {
      const childElement = Component.render({
        element,
        attributes,
        children,
        rootNode,
        options
      }, attributes.ref as ForwardedRef<HTMLElement>) as ReactElement

      if (!isValidElement(childElement as unknown)) {
        console.error('entry.component must return a valid React element')
        return <></>
      }

      // Clone element and merge props
      return cloneElement(childElement, {
        'data-id': element.id,
        className: ['child', childElement.props?.className].filter(Boolean).join(' '),
        ...attributes
      })
    } catch (error) {
      console.error('Error rendering forwardRef component:', error)
      return <></>
    }
  }

  // Regular function component
  return (
    <div className='child' data-id={element.id} {...attributes}>
      <Component element={element} rootNode={rootNode} options={options}>
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
