import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import type { Descendant, Editor } from 'slate'
import { Editor as SlateEditor, Transforms, Element } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import { emptyEditorContent } from './_fixtures'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeClipboard(text: string): DataTransfer {
  return {
    types: ['text/plain'],
    getData: (type: string) => (type === 'text/plain' ? text : '')
  } as unknown as DataTransfer
}

function makeEditor(content: Descendant[] = emptyEditorContent): Editor {
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <TextbitRoot value={content} onChange={() => { }}>
        <TextbitEditable>{children}</TextbitEditable>
      </TextbitRoot>
    )
  }
  const { result: { current: editor } } = renderHook(() => useSlateStatic(), { wrapper: Wrapper })
  vi.spyOn(editor, 'onChange').mockImplementation(() => { })
  return editor
}

function paragraphTexts(editor: Editor): string[] {
  return editor.children.map((node) =>
    Element.isElement(node)
      ? node.children.map((child) => ('text' in child ? child.text : '')).join('')
      : ''
  )
}

// ---------------------------------------------------------------------------
// Paste without formatting (text/plain only) — stacked-newline collapsing
// ---------------------------------------------------------------------------

describe('withInsertHtml — text/plain-only paste (paste without formatting)', () => {
  test('stacked newlines between paragraphs collapse to a single paragraph break', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } })

    editor.insertData(makeClipboard('First paragraph\n\n\nSecond paragraph'))

    expect(paragraphTexts(editor)).toEqual(['First paragraph', 'Second paragraph'])
  })

  test('lone single newline still splits into two paragraphs', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } })

    editor.insertData(makeClipboard('Line one\nLine two'))

    expect(paragraphTexts(editor)).toEqual(['Line one', 'Line two'])
  })

  test('lone Windows CRLF newline still splits into two paragraphs', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } })

    editor.insertData(makeClipboard('Line one\r\nLine two'))

    expect(paragraphTexts(editor)).toEqual(['Line one', 'Line two'])
  })

  test('lone classic Mac CR still splits into two paragraphs', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } })

    editor.insertData(makeClipboard('Line one\rLine two'))

    expect(paragraphTexts(editor)).toEqual(['Line one', 'Line two'])
  })

  test('stacked CRLF newlines between paragraphs collapse to a single paragraph break', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } })

    editor.insertData(makeClipboard('First paragraph\r\n\r\nSecond paragraph'))

    expect(paragraphTexts(editor)).toEqual(['First paragraph', 'Second paragraph'])
  })

  test('single-line paste with an active mark still applies the mark', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } })
    SlateEditor.addMark(editor, 'bold', true)

    editor.insertData(makeClipboard('hello'))

    const [node] = editor.children as Element[]
    expect(node.children[0]).toMatchObject({ text: 'hello', bold: true })
  })

  test('lone Windows CRLF newline with an active mark still applies the mark', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 0 } })
    SlateEditor.addMark(editor, 'bold', true)

    editor.insertData(makeClipboard('Line one\r\nLine two'))

    expect(paragraphTexts(editor)).toEqual(['Line one', 'Line two'])
    for (const node of editor.children as Element[]) {
      expect(node.children[0]).toMatchObject({ bold: true })
    }
  })
})
