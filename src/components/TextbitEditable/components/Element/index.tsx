import { Node } from 'slate'
import { RenderElementProps, ReactEditor, useSlateStatic } from 'slate-react'
import { ChildElement } from './ChildElement'
import { ParentElement } from './ParentElement'
import { InlineElement } from './InlineElement'
import { UnknownElement } from './UnknownElement'
import { Registry } from '@/components/Registry'

/**
 * Render a custom Slate element
 */
export const ElementComponent = (props: RenderElementProps, components: Map<string, Registry>) => {
  const { element } = props
  const component = components.get(element.type)

  if (!component) {
    return UnknownElement(props)
  }

  // Get the path for this element
  const editor = useSlateStatic()
  const path = ReactEditor.findPath(editor, element)

  // No parents found in path, render a root element
  if (path.length === 1) {
    return ParentElement({ ...props, component })
  }

  // Render an inline child element
  if (component.class === 'inline') {
    return InlineElement({ ...props, component, })
  }

  // Render a child element and pass it the rootNode for reference
  const rootNode = Node.get(editor, [path[0]])
  return ChildElement({ ...props, component, rootNode })
}
