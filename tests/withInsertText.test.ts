import { describe, test, expect } from 'vitest'
import { createEditor, Node, type Descendant, type Editor } from 'slate'
import { withInsertText } from '../lib/with/withInsertText'

function makeEditor(children: Descendant[]): Editor {
  // Empty plugins -> no consumers -> falls back to Slate's insertText.
  const editor = withInsertText(createEditor(), [])
  editor.children = children
  return editor
}

// One plain top-level 'text' element followed by a 'block' element that
// contains two 'text' children. Mirrors tests/withDeletionManagement.test.ts.
function makeChildren(): Descendant[] {
  return [
    {
      id: 'a',
      type: 'core/text',
      class: 'text',
      properties: {},
      children: [{ text: 'aaa' }]
    },
    {
      id: 'parent',
      type: 'test/parent',
      class: 'block',
      children: [
        {
          id: 'child-0',
          type: 'test/parent/leaf',
          class: 'text',
          children: [{ text: 'first' }]
        },
        {
          id: 'child-1',
          type: 'test/parent/leaf',
          class: 'text',
          children: [{ text: 'second' }]
        }
      ]
    }
  ]
}

function fullText(editor: Editor): string {
  return editor.children.map((n) => Node.string(n)).join('')
}

describe('withInsertText - block boundary guard', () => {
  test('blocks typing over a selection that starts outside a block and ends inside it', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))

    const selection = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [1, 0, 0], offset: 2 }
    }
    editor.selection = selection

    editor.insertText('x')

    expect(editor.children).toEqual(before)
    expect(editor.selection).toEqual(selection)
  })

  test('allows typing over a selection that starts inside a block and ends outside it', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))

    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 1 }
    }

    editor.insertText('x')

    expect(editor.children).not.toEqual(before)
  })

  test('allows typing over a selection spanning two plain top-level text nodes', () => {
    const editor = makeEditor([
      {
        id: 'a',
        type: 'core/text',
        class: 'text',
        properties: {},
        children: [{ text: 'hello' }]
      },
      {
        id: 'b',
        type: 'core/text',
        class: 'text',
        properties: {},
        children: [{ text: 'world' }]
      }
    ])

    editor.selection = {
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [1, 0], offset: 2 }
    }

    editor.insertText('x')

    expect(fullText(editor)).toBe('hexrld')
  })

  test('allows typing over a selection contained within the same block', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))

    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 1 },
      focus: { path: [1, 1, 0], offset: 2 }
    }

    editor.insertText('x')

    expect(editor.children).not.toEqual(before)
  })

  test('inserts normally at a collapsed selection', () => {
    const editor = makeEditor(makeChildren())

    editor.selection = {
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 }
    }

    editor.insertText('x')

    expect(Node.string(editor.children[0])).toBe('aaax')
  })
})
