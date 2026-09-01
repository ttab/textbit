import { describe, test, expect } from 'vitest'
import { createEditor, type Descendant, type Editor } from 'slate'
import { withUniqueIds } from '../lib/with/withUniqueIds'

function makeEditor(initial: Descendant[]): Editor {
  const editor = withUniqueIds(createEditor())
  editor.children = initial
  return editor
}

describe('withUniqueIds — top-level node', () => {
  test('assigns a new id when inserted node has no id', () => {
    const editor = makeEditor([])
    editor.apply({
      type: 'insert_node',
      path: [0],
      node: {
        type: 'core/text',
        class: 'text',
        children: [{ text: 'a' }]
      } as Descendant
    })

    expect(editor.children).toHaveLength(1)
    const inserted = editor.children[0] as { id?: string }
    expect(typeof inserted.id).toBe('string')
    expect(inserted.id).not.toBe('')
  })

  test('rewrites id when inserted node collides with an existing id', () => {
    const editor = makeEditor([
      { type: 'core/text', class: 'text', id: 'dup', properties: {}, children: [{ text: 'x' }] }
    ])

    editor.apply({
      type: 'insert_node',
      path: [1],
      node: {
        type: 'core/text',
        class: 'text',
        id: 'dup',
        properties: {},
        children: [{ text: 'y' }]
      } as Descendant
    })

    const first = editor.children[0] as { id: string }
    const second = editor.children[1] as { id: string }
    expect(first.id).toBe('dup')
    expect(second.id).not.toBe('dup')
    expect(second.id).toBeTruthy()
  })

  test('keeps id when the inserted node has a unique id', () => {
    const editor = makeEditor([
      { type: 'core/text', class: 'text', id: 'one', properties: {}, children: [{ text: 'x' }] }
    ])

    editor.apply({
      type: 'insert_node',
      path: [1],
      node: {
        type: 'core/text',
        class: 'text',
        id: 'two',
        properties: {},
        children: [{ text: 'y' }]
      } as Descendant
    })

    const second = editor.children[1] as { id: string }
    expect(second.id).toBe('two')
  })
})

describe('withUniqueIds — nested children', () => {
  test('rewrites a colliding CHILD id while preserving the top-level id', () => {
    const editor = makeEditor([
      {
        type: 'core/image',
        class: 'block',
        id: 'outer',
        children: [
          {
            id: 'inner',
            type: 'core/text',
            class: 'text',
            properties: {},
            children: [{ text: 'original caption' }]
          }
        ]
      } as Descendant
    ])

    // Insert a block whose top id is unique, but whose child id collides.
    editor.apply({
      type: 'insert_node',
      path: [1],
      node: {
        type: 'core/image',
        class: 'block',
        id: 'outer-2',
        children: [
          {
            id: 'inner',
            type: 'core/text',
            class: 'text',
            properties: {},
            children: [{ text: 'pasted caption' }]
          }
        ]
      } as Descendant
    })

    const original = editor.children[0] as {
      id: string
      children: Array<{ id: string }>
    }
    const pasted = editor.children[1] as {
      id: string
      children: Array<{ id: string }>
    }

    expect(original.id).toBe('outer')
    expect(original.children[0].id).toBe('inner')

    expect(pasted.id).toBe('outer-2')
    expect(pasted.children[0].id).not.toBe('inner')
    expect(pasted.children[0].id).toBeTruthy()
  })

  test('rewrites BOTH top-level id and colliding child id when both collide', () => {
    const editor = makeEditor([
      {
        type: 'core/image',
        class: 'block',
        id: 'blk',
        children: [
          {
            id: 'cap',
            type: 'core/text',
            class: 'text',
            properties: {},
            children: [{ text: 'original' }]
          }
        ]
      } as Descendant
    ])

    editor.apply({
      type: 'insert_node',
      path: [1],
      node: {
        type: 'core/image',
        class: 'block',
        id: 'blk',
        children: [
          {
            id: 'cap',
            type: 'core/text',
            class: 'text',
            properties: {},
            children: [{ text: 'pasted' }]
          }
        ]
      } as Descendant
    })

    const inserted = editor.children[1] as {
      id: string
      children: Array<{ id: string }>
    }
    expect(inserted.id).not.toBe('blk')
    expect(inserted.children[0].id).not.toBe('cap')

    // Verify overall uniqueness across the whole editor
    const allIds = collectAllIds(editor.children)
    expect(new Set(allIds).size).toBe(allIds.length)
  })

  test('assigns ids to children that are missing an id', () => {
    const editor = makeEditor([])

    editor.apply({
      type: 'insert_node',
      path: [0],
      node: {
        type: 'core/image',
        class: 'block',
        id: 'has-id',
        children: [
          // child without id
          {
            type: 'core/text',
            class: 'text',
            properties: {},
            children: [{ text: 'caption' }]
          }
        ]
      } as Descendant
    })

    const inserted = editor.children[0] as {
      id: string
      children: Array<{ id?: string }>
    }
    expect(inserted.id).toBe('has-id')
    expect(typeof inserted.children[0].id).toBe('string')
    expect(inserted.children[0].id).toBeTruthy()
  })

  test('rewrites duplicate ids that collide WITHIN the same inserted subtree', () => {
    const editor = makeEditor([])

    editor.apply({
      type: 'insert_node',
      path: [0],
      node: {
        type: 'core/image',
        class: 'block',
        id: 'twin',
        children: [
          {
            id: 'twin',
            type: 'core/text',
            class: 'text',
            properties: {},
            children: [{ text: 'inner with same id' }]
          }
        ]
      } as Descendant
    })

    const inserted = editor.children[0] as {
      id: string
      children: Array<{ id: string }>
    }
    // One of the two 'twin' ids must have been rewritten so they no longer collide
    expect(inserted.id).not.toBe(inserted.children[0].id)
  })

  test('does not modify the caller-provided node object when rewriting', () => {
    const editor = makeEditor([
      { type: 'core/text', class: 'text', id: 'dup', properties: {}, children: [{ text: 'x' }] }
    ])

    const input = {
      type: 'core/image',
      class: 'block',
      id: 'dup',
      children: [
        {
          id: 'dup',
          type: 'core/text',
          class: 'text',
          properties: {},
          children: [{ text: 'inner' }]
        }
      ]
    } as Descendant

    editor.apply({ type: 'insert_node', path: [1], node: input })

    // Caller's object should remain untouched
    expect((input as { id: string }).id).toBe('dup')
    expect(((input as { children: Array<{ id: string }> }).children[0]).id).toBe('dup')
  })
})

describe('withUniqueIds — split_node', () => {
  test('rewrites the split id when it collides', () => {
    const editor = makeEditor([
      {
        type: 'core/text',
        class: 'text',
        id: 'split-me',
        properties: {},
        children: [{ text: 'hello world' }]
      }
    ])

    editor.apply({
      type: 'split_node',
      path: [0],
      position: 5,
      properties: {
        type: 'core/text',
        class: 'text',
        id: 'split-me',
        properties: {}
      },
      // slate expects 'properties' to describe the new node; include minimally typed fields
    } as never)

    const nodes = editor.children as Array<{ id: string }>
    expect(nodes[0].id).toBe('split-me')
    expect(nodes[1].id).not.toBe('split-me')
  })
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function collectAllIds(nodes: Descendant[]): string[] {
  const ids: string[] = []
  const walk = (n: Descendant) => {
    const maybeId = (n as { id?: string }).id
    if (typeof maybeId === 'string') ids.push(maybeId)
    if ('children' in n && Array.isArray(n.children)) {
      for (const c of n.children) walk(c as Descendant)
    }
  }
  for (const n of nodes) walk(n)
  return ids
}
