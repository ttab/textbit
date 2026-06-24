import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { createEditor, type Descendant, type Editor } from 'slate'
import { withSelectionGuard } from '../lib/with/withSelectionGuard'

function makeGuardedEditor(children: Descendant[]): Editor {
  const editor = withSelectionGuard(createEditor())
  editor.children = children
  return editor
}

const flatChildren: Descendant[] = [
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
]

const nestedChildren: Descendant[] = [
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

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  warnSpy.mockRestore()
})

describe('withSelectionGuard', () => {
  test('preserves selection that resolves to a real descendant', () => {
    const editor = makeGuardedEditor(flatChildren)
    const valid = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 5 }
    }
    editor.apply({ type: 'set_selection', properties: null, newProperties: valid })
    expect(editor.selection).toEqual(valid)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('clears selection whose first segment is past editor.children', () => {
    const editor = makeGuardedEditor(flatChildren)
    const stale = {
      anchor: { path: [5, 0], offset: 0 },
      focus: { path: [5, 0], offset: 0 }
    }
    editor.apply({ type: 'set_selection', properties: null, newProperties: stale })
    expect(editor.selection).toBeNull()
    expect(warnSpy).toHaveBeenCalledOnce()
  })

  test('clears selection whose deeper segment is past its parent', () => {
    // The exact failure mode captured from production: top-level resolves
    // but a deeper segment exceeds its parent's children length.
    const editor = makeGuardedEditor(nestedChildren)
    const stale = {
      anchor: { path: [0, 2, 0], offset: 0 },
      focus: { path: [0, 2, 0], offset: 0 }
    }
    editor.apply({ type: 'set_selection', properties: null, newProperties: stale })
    expect(editor.selection).toBeNull()
    expect(warnSpy).toHaveBeenCalledOnce()
  })

  test('preserves selection that lands inside a nested block', () => {
    const editor = makeGuardedEditor(nestedChildren)
    const valid = {
      anchor: { path: [1, 1, 0], offset: 0 },
      focus: { path: [1, 1, 0], offset: 6 }
    }
    editor.apply({ type: 'set_selection', properties: null, newProperties: valid })
    expect(editor.selection).toEqual(valid)
    expect(warnSpy).not.toHaveBeenCalled()
  })

  test('does nothing when selection is already null', () => {
    const editor = makeGuardedEditor(flatChildren)
    editor.apply({ type: 'insert_text', path: [0, 0], offset: 0, text: '' })
    expect(editor.selection).toBeNull()
    expect(warnSpy).not.toHaveBeenCalled()
  })
})
