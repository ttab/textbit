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

  const blockMargin = ['block', 'textblock'].includes(component.class) ? '0px' : '-8px'
  const style = {
    overflow: 'hidden',
    padding: '8px',
    margin: `${blockMargin}, -8px`
  }
  const borderClass = ['block', 'textblock'].includes(component.class) && selected && focused ? 'textbit-active' : ''

  return (
    <Droppable element={element}>
      <div
        className={`textbit-parent ${element.class} ${element.type}`}
        data-id={element.id}
        {...attributes}
      >
        <div className={`textbit-block r-less ${borderClass}`} style={style} >
          {component.component.render(renderProps)}
        </div>
      </div>
    </Droppable>
  )
}
