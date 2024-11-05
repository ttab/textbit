import type { RenderElementProps } from 'slate-react'
import type { Plugin } from '../../../../types'

interface InlineElementProps extends RenderElementProps {
  entry: Plugin.ComponentEntry
  options?: Record<string, unknown>
}

/**
 * Render an inline child element (class inline)
 *
 * @param props RenderInlineElementProps
 * @returns JSX.Element
 */
export const InlineElement = ({ attributes, children, element, entry, options }: InlineElementProps) => {
  return (
    <span
      className={`inline ${entry.type}`}
      data-id={element.id}
      {...attributes}
    >
      {entry.component({ element, attributes, children, options })}
    </span>
  )
}
