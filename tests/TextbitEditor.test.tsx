import { renderHook, act } from '@testing-library/react'
import 'jest'
import type { Descendant } from 'slate'
import { TextbitEditable, TextbitRoot } from '../lib/components'
import { TextbitEditor } from '../lib'
import { useSlateStatic } from 'slate-react'
import { PropsWithChildren } from 'react'
import { Editor, Element } from 'slate'

describe('TextbitEditor', () => {
  // Mocked (simplified) structuredClone() that works for this purpose
  global.structuredClone = jest.fn((val) => {
    return JSON.parse(JSON.stringify(val)) as Element
  })

  const initialValue: Descendant[] = [
    {
      type: 'core/text',
      id: 'be0ec554-839d-413c-9140-c408cb213f1e',
      class: 'text',
      children: [
        { text: 'This is title' }
      ],
      properties: {
        type: 'h1'
      }
    },
    {
      type: 'core/text',
      class: 'text',
      id: 'fc542b22-6046-49d8-8eae-56a8597599a3',
      children: [{ text: 'This is paragraph' }]
    }
  ]

  test('inserts a new node at the end of the editor', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TextbitRoot>
        <TextbitEditable value={initialValue}>
          {children}
        </TextbitEditable>
      </TextbitRoot>
    )

    const { result: { current: editor } } = renderHook(() => useSlateStatic(), { wrapper })

    act(() => {
      if (Editor.isEditor(editor)) {
        jest.spyOn(editor, 'onChange').mockImplementation(() => {
          // Do nothing
        })
        TextbitEditor.insertNode(editor, initialValue[0])
      }
    })

    expect(editor.children).toHaveLength(initialValue.length + 1)
    expect(editor.children[0]?.id).not.toEqual(editor.children[initialValue.length]?.id)

    // Expect all children to have unique IDs
    const ids = Array.from(new Set(Object.values(editor.children).map((child) => child.id)))
    expect(ids).toHaveLength(initialValue.length + 1)
  })
})
