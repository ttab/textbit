import { Node } from 'slate'
import { RenderElementProps, ReactEditor, useSlateStatic } from 'slate-react'
import { ChildElementComponent } from './components/child'
import { ParentElementComponent } from './components/parent'
import { InlineElementComponent } from './components/inline'
import { UnknownElementComponent } from './components/unknown'
import { Renderer } from '../../../../types'

/**
 * Render a custom Slate element
 */
export const ElementComponent = (props: RenderElementProps, renderers: Renderer[]): JSX.Element => {
    const { element } = props
    const renderer = renderers.find(renderer => renderer.type === element.type)

    if (!renderer) {
        return UnknownElementComponent(props)
    }

    // Get the path for this element
    const editor = useSlateStatic()
    const path = ReactEditor.findPath(editor, element)

    // No parents found in path, render a root element
    if (path.length === 1) {
        return ParentElementComponent({ ...props, renderer })
    }

    // Render an inline child element
    if (renderer.class === 'inline') {
        return InlineElementComponent({ ...props, renderer, })
    }

    // Render a child element and pass it the rootNode for reference
    const rootNode = Node.get(editor, [path[0]])
    return ChildElementComponent({ ...props, renderer, rootNode })
}
