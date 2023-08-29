import React from 'react' // Necessary for esbuild
import { RenderElementProps, useSelected, useFocused } from 'slate-react'
import { RenderElementFunction, Renderer } from '../../../../../types'
import { Droppable } from './droppable'

type RenderParentElementProps = {
    renderer: Renderer
} & RenderElementProps

/**
 * Render an ordinary parent element of class text, textblock, block, void)
 * 
 * @param props RenderParentElementProps
 * @returns JSX.Element
 */
export const ParentElementComponent = ({ element, attributes, children, renderer }: RenderParentElementProps) => {
    const selected = useSelected()
    const focused = useFocused()
    const render = renderer.render as RenderElementFunction

    const style = {
        boxShadow: `${renderer.class === 'block' && selected && focused ? '0 0 0 3px rgb(117 138 242)' : 'none'}`,
        overflow: 'hidden'
    }

    return (
        <Droppable element={element}>
            <div
                className={`parent ${element.class} ${element.type}`}
                data-id={element.id}
                {...attributes}
            >
                <div className="editor-block" style={style} >
                    {render({ element, attributes, children })}
                </div>
            </div>
        </Droppable>
    )
}

