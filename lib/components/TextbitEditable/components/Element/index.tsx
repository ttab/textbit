import { Node, Path } from 'slate'
import { type RenderElementProps, ReactEditor, useSlateStatic } from 'slate-react'
import { ChildElement } from './ChildElement'
import { ParentElement } from './ParentElement'
import { InlineElement } from './InlineElement'
import { UnknownElement } from './UnknownElement'
import { usePluginRegistry } from '../../../../components/PluginRegistry'

/**
 * Render a custom Slate element
 */
export const ElementComponent = (props: RenderElementProps & {
  selectedBlockPath?: Path
}) => {
  const editor = useSlateStatic()
  const { element } = props
  const { components } = usePluginRegistry()
  const component = components.get(element.type)
  if (!component) {
    return <UnknownElement {...props} />
  }

  // Get the path for this element
  const path = ReactEditor.findPath(editor, element)

  // No parents found in path, render a root element
  if (path.length === 1) {
    return (
      <ParentElement
        {...props}
        entry={component.componentEntry}
        options={component.pluginOptions}
      />
    )
  }

  // Render an inline child element
  if (component.class === 'inline') {
    return (
      <InlineElement
        {...props}
        entry={component.componentEntry}
        options={component.pluginOptions}
      />
    )
  }

  // Render a child element and pass it the rootNode for reference
  const rootNode = Node.get(editor, [path[0]])
  return (
    <ChildElement
      {...props}
      entry={component.componentEntry}
      rootNode={rootNode}
      options={component.pluginOptions}
    />
  )
}
