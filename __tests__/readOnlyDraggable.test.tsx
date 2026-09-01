import { describe, test, expect } from 'vitest'
import { render } from '@testing-library/react'
import type { Descendant } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import type { PluginDefinition } from '../lib/types'

function renderEditor(value: Descendant[], options?: { readOnly?: boolean }) {
  return render(
    <TextbitRoot
      value={value}
      onChange={() => {}}
      plugins={[captionBlockPlugin]}
      readOnly={options?.readOnly}
    >
      <TextbitEditable />
    </TextbitRoot>
  )
}

// A block plugin with a text-class child, mirroring the structure of a factbox
// or an image with a caption. Needed because only Text/Bold/Italic/Underline are
// registered by default, and an unregistered type renders through UnknownElement
// which has no element to derive the draggable attribute from.
const captionBlockPlugin: PluginDefinition = {
  class: 'block',
  name: 'test/caption-block',
  componentEntry: {
    class: 'block',
    component: ({ children }) => <div>{children}</div>,
    children: [
      {
        type: 'caption',
        class: 'text',
        component: ({ children }) => <>{children}</>,
        constraints: { min: 1, max: 1 }
      }
    ]
  }
}

const blockWithCaption: Descendant[] = [
  {
    type: 'core/text',
    class: 'text',
    id: 'paragraph',
    properties: {},
    children: [{ text: 'Paragraph' }]
  },
  {
    type: 'test/caption-block',
    class: 'block',
    id: 'caption-block',
    children: [
      {
        type: 'test/caption-block/caption',
        class: 'text',
        id: 'caption',
        properties: {},
        children: [{ text: 'Caption text' }]
      }
    ]
  }
]

/**
 * The Droppable wrapper is the parent of the slate element node. Both carry
 * data-id, hence the more specific query for the slate node itself.
 */
function droppableWrapper(container: HTMLElement, id: string): HTMLElement | null {
  const element = container.querySelector(`[data-slate-node="element"][data-id="${id}"]`)
  return element?.parentElement ?? null
}

describe('Droppable draggable attribute', () => {
  test('does not make block elements draggable when read only', () => {
    // A draggable ancestor makes the browser start a native drag instead of
    // marking text, and in read only mode nothing cancels that drag.
    const { container } = renderEditor(blockWithCaption, { readOnly: true })

    expect(droppableWrapper(container, 'caption-block')?.getAttribute('draggable')).toBe('false')
  })

  test('makes block elements draggable when editable', () => {
    const { container } = renderEditor(blockWithCaption)

    expect(droppableWrapper(container, 'caption-block')?.getAttribute('draggable')).toBe('true')
  })

  test('never makes text elements draggable', () => {
    const { container: editable } = renderEditor(blockWithCaption)
    const { container: readOnly } = renderEditor(blockWithCaption, { readOnly: true })

    expect(droppableWrapper(editable, 'paragraph')?.getAttribute('draggable')).toBe('false')
    expect(droppableWrapper(readOnly, 'paragraph')?.getAttribute('draggable')).toBe('false')
  })
})
