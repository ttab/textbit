import React from 'react' // Necessary for esbuild
import { RenderElementProps, useSelected, useFocused } from 'slate-react'
import { Droppable } from './droppable'
import { RegistryComponent } from '../../../registry'

type RenderParentElementProps = {
    component: RegistryComponent
} & RenderElementProps

/**
 * Render an ordinary parent element of class text, textblock, block, void)
 * 
 * @param props RenderParentElementProps
 * @returns JSX.Element
 */
export const ParentElementComponent = (renderProps: RenderParentElementProps) => {
    const selected = useSelected()
    const focused = useFocused()

    const { element, attributes, component } = renderProps

    const style = {
        boxShadow: `${component.class === 'block' && selected && focused ? 'rgba(117, 117, 117, 0.3) 0px 0px 0px 2px' : 'none'}`,
        overflow: 'hidden',
        padding: '5px',
        margin: '-5px',
        borderRadius: '3px'
    }

    const elementTypeClass = `${element.type.replace('/', '--')}`
    return (
        <Droppable element={element}>
            <div
                className={`parent ${element.class} ${elementTypeClass}`}
                data-id={element.id}
                {...attributes}
            >
                <div className="editor-block" style={style} >
                    {component.component.render(renderProps)}
                </div>
            </div>
        </Droppable>
    )
}

