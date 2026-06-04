import { describe, test, expect } from 'vitest'
import { createEditor, type Descendant, type Editor } from 'slate'
import { findTopLevelPathById } from '../lib/utils/pipes'

function makeEditor(value: Descendant[]): Editor {
  const editor = createEditor()
  editor.children = value
  return editor
}

const block = (id: string): Descendant => ({
  id,
  type: 'core/text',
  class: 'text',
  properties: {},
  children: [{ text: id }]
})

describe('findTopLevelPathById', () => {
  test('returns the path of a matching top-level child', () => {
    const editor = makeEditor([block('a'), block('b'), block('c')])
    expect(findTopLevelPathById(editor, 'a')).toEqual([0])
    expect(findTopLevelPathById(editor, 'b')).toEqual([1])
    expect(findTopLevelPathById(editor, 'c')).toEqual([2])
  })

  test('returns null when no top-level child carries the id', () => {
    const editor = makeEditor([block('a'), block('b')])
    expect(findTopLevelPathById(editor, 'missing')).toBeNull()
  })

  test('returns null on an empty editor', () => {
    const editor = makeEditor([])
    expect(findTopLevelPathById(editor, 'anything')).toBeNull()
  })

  test('does not match nested descendants — only top-level children', () => {
    // The pipe machinery only ever inserts loaders at top level, so the
    // lookup is intentionally shallow. A descendant with the same id is
    // not a hit.
    const editor = makeEditor([
      {
        id: 'parent',
        type: 'block-with-children',
        class: 'block',
        children: [block('nested-target')]
      } as Descendant
    ])
    expect(findTopLevelPathById(editor, 'nested-target')).toBeNull()
    expect(findTopLevelPathById(editor, 'parent')).toEqual([0])
  })
})
