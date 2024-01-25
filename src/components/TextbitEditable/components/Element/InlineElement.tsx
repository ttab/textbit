import React from 'react'
import { RenderElementProps } from "slate-react"
import { Plugin } from '@/types'

interface InlineElementProps extends RenderElementProps {
  entry: Plugin.ComponentEntry
}

/**
 * Render an inline child element (class inline)
 *
 * @param props RenderInlineElementProps
 * @returns JSX.Element
 */
export const InlineElement = ({ attributes, children, element, entry }: InlineElementProps) => {
  return (
    <span
      className={`inline ${entry.type}`}
      data-id={element.id}
      {...attributes}
    >
      {entry.component({ element, attributes, children })}
    </span>
  )
}
