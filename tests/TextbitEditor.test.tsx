import { render, screen, renderHook } from '@testing-library/react'
import { describe, test, expect, vi } from 'vitest'
import { useSlateStatic } from 'slate-react'
import { PropsWithChildren } from 'react'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable'
import { TextbitEditor } from '../lib/main'
import { basicEditorContent } from './_fixtures'

describe('TextbitEditor', () => {
  // // Mock structuredClone for the test environment
  // beforeAll(() => {
  //   global.structuredClone = vi.fn((val) => {
  //     return JSON.parse(JSON.stringify(val)) as Element
  //   })
  // })

  test('renders the TextbitEditor component', () => {
    const { container } = render(
      <TextbitRoot value={basicEditorContent} onChange={() => { return }}>
        <TextbitEditable />
      </TextbitRoot>
    )

    expect(screen.getByRole('textbox')).toBeInTheDocument()
    expect(container.querySelectorAll('div[data-id="be0ec554-839d-413c-9140-c408cb213f1e"]')).toHaveLength(2)
    expect(container.querySelectorAll('div[data-id="fc542b22-6046-49d8-8eae-56a8597599a3"]')).toHaveLength(2)
    expect(screen.getByText('This is title')).toBeInTheDocument()
    expect(screen.getByText('This is paragraph')).toBeInTheDocument()
  })

  test('inserts a new node at the end of the editor', () => {
    const wrapper = ({ children }: PropsWithChildren) => (
      <TextbitRoot value={basicEditorContent} onChange={() => { return }}>
        <TextbitEditable>
          {children}
        </TextbitEditable>
      </TextbitRoot>
    )

    const { result: { current: editor } } = renderHook(() => useSlateStatic(), { wrapper })

    vi.spyOn(editor, 'onChange').mockImplementation(() => {
      // Do nothing
    })

    TextbitEditor.insertNode(editor, basicEditorContent[0])

    expect(editor.children).toHaveLength(basicEditorContent.length + 1)
    expect(editor.children[0]?.id).not.toEqual(editor.children[basicEditorContent.length]?.id)

    // Expect all children to have unique IDs
    const ids = Array.from(new Set(Object.values(editor.children).map((child) => child.id)))
    expect(ids).toHaveLength(basicEditorContent.length + 1)
  })
})
