import { useSlateStatic, type RenderElementProps } from 'slate-react'
import type { ComponentEntry } from '../../types'

interface InlineElementProps extends RenderElementProps {
  entry: ComponentEntry
  options?: Record<string, unknown>
}

/**
 * Render an inline child element (class inline)
 *
 * @param props RenderInlineElementProps
 * @returns JSX.Element
 */
export function InlineElement({ attributes, children, element, entry, options }: InlineElementProps) {
  const editor = useSlateStatic()
  if (entry.asOwnElement) return null

  return (
    <span className={`inline ${entry.type}`} data-id={element.id} data-type={element.type} {...attributes}>
      <entry.component element={element} options={options} editor={editor}>
        {children}
      </entry.component>
    </span>
  )
}
