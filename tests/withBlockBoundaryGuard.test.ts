import { describe, test, expect, vi } from 'vitest'
import { createEditor, Node, Range, type Descendant, type Editor } from 'slate'
import { withBlockBoundaryGuard } from '../lib/with/withBlockBoundaryGuard'

function makeEditor(children: Descendant[]): Editor {
  const editor = createEditor()
  editor.children = children
  return withBlockBoundaryGuard(editor)
}

// A top-level 'text' ("outside"), a 'block' with two 'text' children
// ("caption" / "second"), and a second 'block' ("third").
function makeChildren(): Descendant[] {
  return [
    {
      id: 'a',
      type: 'core/text',
      class: 'text',
      properties: {},
      children: [{ text: 'outside' }]
    },
    {
      id: 'block-1',
      type: 'test/parent',
      class: 'block',
      children: [
        {
          id: 'b1-0',
          type: 'test/parent/leaf',
          class: 'text',
          children: [{ text: 'caption' }]
        },
        {
          id: 'b1-1',
          type: 'test/parent/leaf',
          class: 'text',
          children: [{ text: 'second' }]
        }
      ]
    },
    {
      id: 'block-2',
      type: 'test/parent',
      class: 'block',
      children: [
        {
          id: 'b2-0',
          type: 'test/parent/leaf',
          class: 'text',
          children: [{ text: 'third' }]
        }
      ]
    }
  ]
}

function plainTextData(text: string): DataTransfer {
  return {
    types: ['text/plain'],
    getData: (type: string) => (type === 'text/plain' ? text : '')
  } as unknown as DataTransfer
}

function slateFragmentData(text: string): DataTransfer {
  return {
    types: ['application/x-slate-fragment', 'text/plain'],
    getData: (type: string) => (type === 'text/plain' ? text : '')
  } as unknown as DataTransfer
}

function text(editor: Editor, path: number[]): string {
  return Node.string(Node.get(editor, path))
}

describe('withBlockBoundaryGuard - delete strips text, keeps structure', () => {
  test('deletes selected text on both sides (outside -> inside), no merge', () => {
    const editor = makeEditor(makeChildren())
    editor.selection = {
      anchor: { path: [0, 0], offset: 3 }, // "out|side"
      focus: { path: [1, 0, 0], offset: 4 } // "capt|ion"
    }

    editor.deleteFragment()

    expect(editor.children).toHaveLength(3)
    expect(text(editor, [0, 0])).toBe('out')
    expect(text(editor, [1, 0, 0])).toBe('ion')
    expect(text(editor, [1, 1, 0])).toBe('second')
    expect(editor.selection).toEqual({
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [0, 0], offset: 3 }
    })
  })

  test('deletes selected text (inside -> outside), no merge', () => {
    const editor = makeEditor(makeChildren())
    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 4 }, // "capt|ion"
      focus: { path: [0, 0], offset: 3 } // "out|side"
    }

    editor.deleteFragment()

    expect(editor.children).toHaveLength(3)
    expect(text(editor, [0, 0])).toBe('out')
    expect(text(editor, [1, 0, 0])).toBe('ion')
    // Caret collapses to the document-order start (outside node).
    expect(editor.selection && Range.isCollapsed(editor.selection)).toBe(true)
    expect(editor.selection?.anchor).toEqual({ path: [0, 0], offset: 3 })
  })

  test('deletes selected text across two different blocks, keeping both', () => {
    const editor = makeEditor(makeChildren())
    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 4 }, // block-1 "capt|ion"
      focus: { path: [2, 0, 0], offset: 2 } // block-2 "th|ird"
    }

    editor.deleteFragment()

    expect(editor.children).toHaveLength(3)
    expect(text(editor, [1, 0, 0])).toBe('capt')
    expect(text(editor, [2, 0, 0])).toBe('ird')
  })
})

describe('withBlockBoundaryGuard - typing replaces text, keeps structure', () => {
  test('removes selected text then inserts the char at the selection end', () => {
    const editor = makeEditor(makeChildren())
    editor.selection = {
      anchor: { path: [0, 0], offset: 3 }, // "out|side"
      focus: { path: [1, 0, 0], offset: 4 } // "capt|ion"
    }

    editor.insertText('x')

    expect(editor.children).toHaveLength(3)
    expect(text(editor, [0, 0])).toBe('out')
    expect(text(editor, [1, 0, 0])).toBe('xion')
  })
})

describe('withBlockBoundaryGuard - paste', () => {
  test('plain-text paste replaces text and inserts at the selection end', () => {
    const editor = makeEditor(makeChildren())
    editor.selection = {
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [1, 0, 0], offset: 4 }
    }

    editor.insertData(plainTextData('YO'))

    expect(text(editor, [0, 0])).toBe('out')
    expect(text(editor, [1, 0, 0])).toBe('YOion')
  })

  test('rich (slate fragment) paste is blocked', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))
    editor.selection = {
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [1, 0, 0], offset: 4 }
    }

    editor.insertData(slateFragmentData('whatever'))

    expect(editor.children).toEqual(before)
  })
})

describe('withBlockBoundaryGuard - blocked structural edits', () => {
  test('insertFragment is blocked', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))
    editor.selection = {
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [1, 0, 0], offset: 4 }
    }

    editor.insertFragment([{ text: 'x' }])

    expect(editor.children).toEqual(before)
  })

  test('insertBreak and insertSoftBreak are blocked', () => {
    const editor = makeEditor(makeChildren())
    const before = JSON.parse(JSON.stringify(editor.children))
    editor.selection = {
      anchor: { path: [0, 0], offset: 3 },
      focus: { path: [1, 0, 0], offset: 4 }
    }

    editor.insertBreak()
    editor.insertSoftBreak()

    expect(editor.children).toEqual(before)
  })
})

describe('withBlockBoundaryGuard - non-crossing selections edit normally', () => {
  test('typing within a single block replaces normally', () => {
    const editor = makeEditor(makeChildren())
    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 1 },
      focus: { path: [1, 0, 0], offset: 4 }
    }

    editor.insertText('x')

    expect(text(editor, [1, 0, 0])).toBe('cxion')
  })

  test('delete spanning two plain top-level text nodes is delegated', () => {
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

    editor.deleteFragment()

    // Default Slate behaviour merges the two plain paragraphs.
    expect(editor.children).toHaveLength(1)
    expect(text(editor, [0, 0])).toBe('herld')
  })

  test('non-crossing insertData is delegated to the original', () => {
    const editor = makeEditor(makeChildren())
    const original = vi.fn()
    editor.insertData = original
    // Re-wrap so the guard captures the stub as the delegate target.
    withBlockBoundaryGuard(editor)
    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 1 },
      focus: { path: [1, 0, 0], offset: 4 }
    }

    editor.insertData(plainTextData('x'))

    expect(original).toHaveBeenCalledOnce()
  })
})
