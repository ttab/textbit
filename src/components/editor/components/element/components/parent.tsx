import React from 'react' // Necessary for esbuild
import { RenderElementProps, useSelected, useFocused } from 'slate-react'
import { MimerComponent } from '../../../types'
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
export const ParentElementComponent = ({ element, attributes, children, component }: RenderParentElementProps) => {
    const selected = useSelected()
    const focused = useFocused()

    const style = {
        boxShadow: `${component.class === 'block' && selected && focused ? '0 0 0 3px rgb(117 138 242)' : 'none'}`,
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
                    {component.component.render({ element, attributes, children })}
                </div>
            </div>
        </Droppable>
    )
}

