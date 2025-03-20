import { useSlateStatic, type RenderElementProps } from 'slate-react'
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
  const editor = useSlateStatic()

  return (
    <span className={`inline ${entry.type}`} data-id={element.id} {...attributes}>
      <entry.component element={element} options={options} editor={editor}>
        {children}
      </entry.component>
    </span>
  )
}
