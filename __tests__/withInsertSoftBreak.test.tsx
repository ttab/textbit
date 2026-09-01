import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import { Node, type Descendant, type Editor } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import type { PluginDefinition } from '../lib/types'

function textPlugin(allowSoftBreak?: boolean): PluginDefinition {
  return {
    class: 'text',
    name: 'core/text',
    componentEntry: {
      class: 'text',
      component: ({ children, attributes }) => <p {...attributes}>{children}</p>,
      ...(allowSoftBreak === undefined ? {} : { constraints: { allowSoftBreak } })
    }
  }
}

function makeEditor(plugins: PluginDefinition[]): Editor {
  const content: Descendant[] = [
    { type: 'core/text', class: 'text', id: 'a', properties: {}, children: [{ text: 'ab' }] } as Descendant
  ]
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <TextbitRoot value={content} onChange={() => { }} plugins={plugins}>
        <TextbitEditable>{children}</TextbitEditable>
      </TextbitRoot>
    )
  }
  const { result: { current: editor } } = renderHook(() => useSlateStatic(), { wrapper: Wrapper })
  vi.spyOn(editor, 'onChange').mockImplementation(() => { })
  // Collapsed caret between 'a' and 'b'.
  editor.selection = {
    anchor: { path: [0, 0], offset: 1 },
    focus: { path: [0, 0], offset: 1 }
  }
  return editor
}

describe('withInsertSoftBreak', () => {
  test('inserts a newline when a plugin opts in with allowSoftBreak: true', () => {
    const editor = makeEditor([textPlugin(true)])
    editor.insertSoftBreak()
    expect(Node.string(editor.children[0])).toBe('a\nb')
  })

  test('is a no-op when no plugin opts in (opt-in default)', () => {
    const editor = makeEditor([textPlugin(undefined)])
    editor.insertSoftBreak()
    expect(Node.string(editor.children[0])).toBe('ab')
  })

  test('is a no-op when a plugin sets allowSoftBreak: false', () => {
    const editor = makeEditor([textPlugin(false)])
    editor.insertSoftBreak()
    expect(Node.string(editor.children[0])).toBe('ab')
  })
})
