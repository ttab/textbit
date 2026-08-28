import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import type { Descendant, Editor, Element } from 'slate'
import { Editor as SlateEditor } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import type { PluginDefinition } from '../lib/types'

// Minimal plugin set: a core/text paragraph (the repair target) and a core/link
// inline element (to prove inline children don't block the repair).
const testTextPlugin: PluginDefinition = {
  class: 'text',
  name: 'core/text',
  componentEntry: {
    class: 'text',
    component: ({ children, attributes }) => <p {...attributes}>{children}</p>
  }
}

const testLinkPlugin: PluginDefinition = {
  class: 'inline',
  name: 'core/link',
  componentEntry: {
    class: 'inline',
    component: ({ children, attributes }) => <a {...attributes}>{children}</a>
  }
}

function makeEditor(
  content: Descendant[],
  plugins: PluginDefinition[] = [testTextPlugin, testLinkPlugin]
): Editor {
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <TextbitRoot value={content} onChange={() => { }} plugins={plugins}>
        <TextbitEditable>{children}</TextbitEditable>
      </TextbitRoot>
    )
  }
  const { result: { current: editor } } = renderHook(() => useSlateStatic(), { wrapper: Wrapper })
  vi.spyOn(editor, 'onChange').mockImplementation(() => { })
  // Slate's initial value is not always normalized in tests; force it.
  SlateEditor.normalize(editor, { force: true })
  return editor
}

describe('withNormalizeNode — typeless top-level element repair', () => {
  test('coerces a typeless top-level block with only text to core/text', () => {
    const editor = makeEditor([
      { id: 'a', children: [{ text: 'body paragraph' }] } as unknown as Descendant
    ])

    const node = editor.children[0] as Element
    expect(node.type).toBe('core/text')
    expect(node.class).toBe('text')
    expect(node.properties).toEqual({})
    // id and text content are preserved
    expect(node.id).toBe('a')
    expect(node.children).toMatchObject([{ text: 'body paragraph' }])
  })

  test('coerces a typeless block that also contains an inline element', () => {
    const editor = makeEditor([
      {
        id: 'a',
        children: [
          { text: 'see ' },
          { type: 'core/link', class: 'inline', id: 'l', children: [{ text: 'here' }] },
          { text: '' }
        ]
      } as unknown as Descendant
    ])

    const node = editor.children[0] as Element
    expect(node.type).toBe('core/text')
    // the inline link survives
    expect(node.children.some((c) => (c as Element).type === 'core/link')).toBe(true)
  })

  test('does NOT coerce a typeless node that contains a block-level child', () => {
    const editor = makeEditor([
      {
        id: 'container',
        children: [
          { id: 'p1', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'nested' }] }
        ]
      } as unknown as Descendant
    ])

    // The container holds a block-level (class 'text') child, so it must be left
    // untouched rather than flattened into a paragraph.
    const node = editor.children[0] as Element
    expect(node.type).toBeUndefined()
  })

  test('does NOT coerce an element with an unknown NAMED type (unregistered plugin)', () => {
    const editor = makeEditor([
      {
        id: 'x',
        type: 'core/unregistered',
        class: 'block',
        children: [{ text: 'keep me' }]
      } as unknown as Descendant
    ])

    // A named-but-unregistered type is preserved — coercing it would destroy
    // content whose plugin merely is not loaded.
    const node = editor.children[0] as Element
    expect(node.type).toBe('core/unregistered')
  })
})
