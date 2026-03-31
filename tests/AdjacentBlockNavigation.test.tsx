import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import { Editor, Transforms } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import { handleOnKeyDown } from '../lib/components/TextbitEditable/handleOnKeyDown/handleOnKeyDown'
import type { AdjacentBlockState } from '../lib/contexts/AdjacentBlockContext'
import { adjacentBlockContent, consecutiveBlocksContent } from './_fixtures'

// Helpers

function makeEvent(key: string) {
  return {
    key,
    preventDefault: vi.fn()
  } as unknown as React.KeyboardEvent<HTMLDivElement>
}

function makeWrapper() {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <TextbitRoot value={adjacentBlockContent} onChange={() => { }}>
        <TextbitEditable>{children}</TextbitEditable>
      </TextbitRoot>
    )
  }
}

function makeEditor() {
  const wrapper = makeWrapper()
  const { result: { current: editor } } = renderHook(() => useSlateStatic(), { wrapper })
  vi.spyOn(editor, 'onChange').mockImplementation(() => { })
  return editor
}

// Arrow keys: entering a non-text block

describe('Arrow keys — entering a non-text block', () => {
  test('ArrowRight at end of text block sets direction=before on the next non-text block', () => {
    const editor = makeEditor()
    // Place cursor at the end of 'text-before-block' ("Before" = 6 chars)
    editor.selection = {
      anchor: { path: [0, 0], offset: 6 },
      focus: { path: [0, 0], offset: 6 }
    }

    const setAdjacentBlock = vi.fn()
    const event = makeEvent('ArrowRight')
    handleOnKeyDown(editor, [], event, null, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(setAdjacentBlock).toHaveBeenCalledWith({
      blockId: 'non-text-block',
      direction: 'before'
    })
  })

  test('ArrowLeft at start of text block sets direction=after on the preceding non-text block', () => {
    const editor = makeEditor()
    // Place cursor at the start of 'text-after-block'
    editor.selection = {
      anchor: { path: [2, 0], offset: 0 },
      focus: { path: [2, 0], offset: 0 }
    }

    const setAdjacentBlock = vi.fn()
    const event = makeEvent('ArrowLeft')
    handleOnKeyDown(editor, [], event, null, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(setAdjacentBlock).toHaveBeenCalledWith({
      blockId: 'non-text-block',
      direction: 'after'
    })
  })
})

// Arrow keys: exiting a non-text block

describe('Arrow keys — exiting a non-text block', () => {
  test('ArrowRight at end of non-text block sets direction=after on itself', () => {
    const editor = makeEditor()
    // Place cursor at the end of block content ("Block content" = 13 chars)
    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 13 },
      focus: { path: [1, 0, 0], offset: 13 }
    }

    const setAdjacentBlock = vi.fn()
    const event = makeEvent('ArrowRight')
    handleOnKeyDown(editor, [], event, null, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(setAdjacentBlock).toHaveBeenCalledWith({
      blockId: 'non-text-block',
      direction: 'after'
    })
  })

  test('ArrowLeft at start of non-text block sets direction=before on itself', () => {
    const editor = makeEditor()
    // Place cursor at the start of block content
    editor.selection = {
      anchor: { path: [1, 0, 0], offset: 0 },
      focus: { path: [1, 0, 0], offset: 0 }
    }

    const setAdjacentBlock = vi.fn()
    const event = makeEvent('ArrowLeft')
    handleOnKeyDown(editor, [], event, null, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(setAdjacentBlock).toHaveBeenCalledWith({
      blockId: 'non-text-block',
      direction: 'before'
    })
  })
})

// Enter

describe('Enter with adjacent block state', () => {
  test('Enter with direction=before inserts a text node before the non-text block', () => {
    const editor = makeEditor()
    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'before' }
    const setAdjacentBlock = vi.fn()

    handleOnKeyDown(editor, [], makeEvent('Enter'), adjacentBlock, setAdjacentBlock)

    expect(editor.children).toHaveLength(4)
    // New text node pushed in at index 1; non-text block moves to index 2
    expect(editor.children[1]).toMatchObject({ type: 'core/text', class: 'text' })
    expect(editor.children[2]).toMatchObject({ id: 'non-text-block' })
    expect(setAdjacentBlock).toHaveBeenCalledWith(null)
  })

  test('Enter with direction=after inserts a text node after the non-text block', () => {
    const editor = makeEditor()
    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'after' }
    const setAdjacentBlock = vi.fn()

    handleOnKeyDown(editor, [], makeEvent('Enter'), adjacentBlock, setAdjacentBlock)

    expect(editor.children).toHaveLength(4)
    // Non-text block stays at index 1; new text node at index 2
    expect(editor.children[1]).toMatchObject({ id: 'non-text-block' })
    expect(editor.children[2]).toMatchObject({ type: 'core/text', class: 'text' })
    // Original 'text-after-block' shifts to index 3
    expect(editor.children[3]).toMatchObject({ id: 'text-after-block' })
    expect(setAdjacentBlock).toHaveBeenCalledWith(null)
  })
})

// Backspace / Delete

describe('Backspace/Delete with adjacent block state', () => {
  test('Backspace with direction=after deletes the non-text block', () => {
    const editor = makeEditor()
    // Cursor somewhere with a collapsed selection
    Transforms.select(editor, Editor.end(editor, [0]))

    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'after' }
    const setAdjacentBlock = vi.fn()
    const event = makeEvent('Backspace')

    handleOnKeyDown(editor, [], event, adjacentBlock, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(editor.children).toHaveLength(2)
    expect(editor.children.every(c => c.id !== 'non-text-block')).toBe(true)
    expect(setAdjacentBlock).toHaveBeenCalledWith(null)
  })

  test('Delete with direction=before deletes the non-text block', () => {
    const editor = makeEditor()
    Transforms.select(editor, Editor.start(editor, [2]))

    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'before' }
    const setAdjacentBlock = vi.fn()
    const event = makeEvent('Delete')

    handleOnKeyDown(editor, [], event, adjacentBlock, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(editor.children).toHaveLength(2)
    expect(editor.children.every(c => c.id !== 'non-text-block')).toBe(true)
    expect(setAdjacentBlock).toHaveBeenCalledWith(null)
  })
})

// Deletion with consecutive non-text blocks (void + text children)

function makeConsecutiveBlocksWrapper() {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <TextbitRoot value={consecutiveBlocksContent} onChange={() => { }}>
        <TextbitEditable>{children}</TextbitEditable>
      </TextbitRoot>
    )
  }
}

function makeConsecutiveBlocksEditor() {
  const wrapper = makeConsecutiveBlocksWrapper()
  const { result: { current: editor } } = renderHook(() => useSlateStatic(), { wrapper })
  vi.spyOn(editor, 'onChange').mockImplementation(() => { })
  return editor
}

describe('Delete with direction=before on consecutive blocks', () => {
  test('removes the target block and preserves adjacent state on next non-text block', () => {
    // [para-before, block-1, block-2, para-after]
    // Caret 'before' block-1, delete → removes block-1, block-2 shifts to index 1
    const editor = makeConsecutiveBlocksEditor()
    Transforms.select(editor, Editor.start(editor, [1]))

    const adjacentBlock: AdjacentBlockState = { blockId: 'block-1', direction: 'before' }
    const setAdjacentBlock = vi.fn()
    const event = makeEvent('Delete')

    handleOnKeyDown(editor, [], event, adjacentBlock, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(editor.children).toHaveLength(3)
    expect(editor.children.every(c => c.id !== 'block-1')).toBe(true)
    // block-2 shifted to index 1 → adjacent state preserved
    expect(setAdjacentBlock).toHaveBeenCalledWith({
      blockId: 'block-2',
      direction: 'before'
    })
  })

  test('removes the target block and clears adjacent state when next block is text', () => {
    // [para-before, block-1, block-2, para-after]
    // Caret 'before' block-2, delete → removes block-2, para-after shifts to index 2
    const editor = makeConsecutiveBlocksEditor()
    Transforms.select(editor, Editor.start(editor, [2]))

    const adjacentBlock: AdjacentBlockState = { blockId: 'block-2', direction: 'before' }
    const setAdjacentBlock = vi.fn()
    const event = makeEvent('Delete')

    handleOnKeyDown(editor, [], event, adjacentBlock, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(editor.children).toHaveLength(3)
    expect(editor.children.every(c => c.id !== 'block-2')).toBe(true)
    // para-after is now at index 2, which is a text block → clear adjacent state
    expect(setAdjacentBlock).toHaveBeenCalledWith(null)
  })

  test('removes last block and lands on preceding non-text block with after direction', () => {
    // [para-before, block-1, block-2, para-after]
    // Remove para-after first to set up [para-before, block-1, block-2]
    const editor = makeConsecutiveBlocksEditor()
    Transforms.removeNodes(editor, { at: [3] })
    expect(editor.children).toHaveLength(3)

    // Caret 'before' block-2 (last element), delete → removes it
    Transforms.select(editor, Editor.start(editor, [2]))
    const adjacentBlock: AdjacentBlockState = { blockId: 'block-2', direction: 'before' }
    const setAdjacentBlock = vi.fn()
    const event = makeEvent('Delete')

    handleOnKeyDown(editor, [], event, adjacentBlock, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(editor.children).toHaveLength(2)
    expect(editor.children.every(c => c.id !== 'block-2')).toBe(true)
    // block-1 is now the last element → adjacent state with 'after' direction
    expect(setAdjacentBlock).toHaveBeenCalledWith({
      blockId: 'block-1',
      direction: 'after'
    })
  })
})

describe('Backspace with direction=before on consecutive blocks', () => {
  test('removes the non-text block behind and preserves adjacent state on the target', () => {
    // [para-before, block-1, block-2, para-after]
    // Caret 'before' block-2, backspace → removes block-1
    const editor = makeConsecutiveBlocksEditor()
    Transforms.select(editor, Editor.start(editor, [2]))

    const adjacentBlock: AdjacentBlockState = { blockId: 'block-2', direction: 'before' }
    const setAdjacentBlock = vi.fn()
    const event = makeEvent('Backspace')

    handleOnKeyDown(editor, [], event, adjacentBlock, setAdjacentBlock)

    expect(event.preventDefault).toHaveBeenCalled()
    expect(editor.children).toHaveLength(3)
    expect(editor.children.every(c => c.id !== 'block-1')).toBe(true)
    // block-2 shifted to index 1, still non-text → adjacent state preserved
    expect(setAdjacentBlock).toHaveBeenCalledWith({
      blockId: 'block-2',
      direction: 'before'
    })
  })
})

// Modifier keys

describe('Modifier keys do not clear adjacent state', () => {
  test.each(['Meta', 'Control', 'Alt', 'Shift', 'CapsLock'])(
    '%s key leaves adjacent state untouched',
    (key) => {
      const editor = makeEditor()
      const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'before' }
      const setAdjacentBlock = vi.fn()

      handleOnKeyDown(editor, [], makeEvent(key), adjacentBlock, setAdjacentBlock)

      expect(setAdjacentBlock).not.toHaveBeenCalled()
    }
  )
})
