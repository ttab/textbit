import { Node } from 'slate'
import { RenderElementProps, ReactEditor, useSlateStatic } from 'slate-react'
import { ChildElementComponent } from './components/child'
import { ParentElementComponent } from './components/parent'
import { InlineElementComponent } from './components/inline'
import { UnknownElementComponent } from './components/unknown'
import { MimerRegistryComponent } from '../../registry'

/**
 * Render a custom Slate element
 */
export const ElementComponent = (props: RenderElementProps, components: Map<string, MimerRegistryComponent>) => {
    const { element } = props
    const component = components.get(element.type)

    if (!component) {
        return UnknownElementComponent(props)
    }

    // Get the path for this element
    const editor = useSlateStatic()
    const path = ReactEditor.findPath(editor, element)

    // No parents found in path, render a root element
    if (path.length === 1) {
        return ParentElementComponent({ ...props, component })
    }

    // Render an inline child element
    if (component.class === 'inline') {
        return InlineElementComponent({ ...props, component, })
    }

    // Render a child element and pass it the rootNode for reference
    const rootNode = Node.get(editor, [path[0]])
    return ChildElementComponent({ ...props, component, rootNode })
}
