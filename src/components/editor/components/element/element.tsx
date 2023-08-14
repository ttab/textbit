import { Node } from 'slate'
import { RenderElementProps, ReactEditor, useSlateStatic } from 'slate-react'
import { ChildElement } from './components/child'
import { ParentElement } from './components/parent'
import { InlineElement } from './components/inline'
import { UnknownElement } from './components/unknown'
import { Renderer } from '../../../../types'

/**
 * Render an element
 * 
 * @todo Create type/interface (instead of any[]) for Elements/Element here.
 * 
 * @param props RenderElementProps
 * @param renderers any[]
 * @returns JSX.Element
 */
export const Element = (props: RenderElementProps, renderers: Renderer[]) => {
    const { element } = props
    const renderer = renderers.find(el => el.name === element.name)

    if (!renderer) {
        return UnknownElement(props)
    }

    // Find parent node and pass it with props only if it is a child
    const editor = useSlateStatic()
    const path = ReactEditor.findPath(editor, element)

    // Top parent elements
    if (path.length === 1) {
        return ParentElement({ ...props, renderer })
    }

    // Inline child elements
    if (renderer.class === 'inline') {
        return InlineElement({ ...props, renderer, })
    }

    // Child elements
    const parentNode = Node.get(editor, [path[0]])
    return ChildElement({ ...props, renderer, parent: parentNode })
}
