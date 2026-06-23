import { describe, test, expect } from 'vitest'
import { createEditor, type Descendant, type Editor, type Range } from 'slate'
import { withDeletionManagement } from '../lib/with/withDeletionManagement'

function makeEditor(children: Descendant[]): Editor {
  const editor = withDeletionManagement(createEditor())
  editor.children = children
  return editor
}

// One plain top-level 'text' element followed by a 'block' element that
// contains two 'text' children. Mirrors tests/withSelectionGuard.test.ts.
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

describe('withDeletionManagement - deleteFragment block boundary guard', () => {
  test('blocks deleting a selection that starts outside a block and ends inside it', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))

    const selection: Range = {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [1, 0, 0], offset: 2 }
    }
    editor.selection = selection

    editor.deleteFragment({ direction: 'forward' })

    expect(editor.children).toEqual(before)
    expect(editor.selection).toEqual(selection)
  })

  test('allows deleting a selection that starts inside a block and ends outside it', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))

    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 2 },
      focus: { path: [0, 0], offset: 1 }
    }

    editor.deleteFragment({ direction: 'backward' })

    expect(editor.children).not.toEqual(before)
  })

  test('allows deleting a selection spanning two plain top-level text nodes', () => {
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
    const before = JSON.parse(JSON.stringify(editor.children))

    editor.selection = {
      anchor: { path: [0, 0], offset: 2 },
      focus: { path: [1, 0], offset: 2 }
    }

    editor.deleteFragment({ direction: 'forward' })

    expect(editor.children).not.toEqual(before)
  })

  test('allows deleting a selection contained within the same block', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))

    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 1 },
      focus: { path: [1, 1, 0], offset: 2 }
    }

    editor.deleteFragment({ direction: 'forward' })

    expect(editor.children).not.toEqual(before)
  })

  test('leaves a collapsed selection untouched', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))

    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 2 },
      focus: { path: [1, 0, 0], offset: 2 }
    }

    editor.deleteFragment({ direction: 'forward' })

    expect(editor.children).toEqual(before)
  })
})
