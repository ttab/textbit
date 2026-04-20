import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import type { Descendant, Editor } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import { prepareBlockAwarePaste } from '../lib/utils/blockAwarePaste'
import { adjacentBlockContent } from './_fixtures'
import type { AdjacentBlockState } from '../lib/contexts/AdjacentBlockContext'
import type { BlockSelectionState } from '../lib/contexts/BlockSelectionContext'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a minimal DataTransfer-like stub. `slateFragment`, if given, is
 * encoded the same way slate-react writes it to the clipboard.
 */
function makeClipboard(opts: {
  slateFragment?: Descendant[]
  text?: string
}): DataTransfer {
  const store = new Map<string, string>()
  if (opts.slateFragment) {
    const json = JSON.stringify(opts.slateFragment)
    store.set('application/x-slate-fragment', window.btoa(encodeURIComponent(json)))
  }
  if (opts.text != null) {
    store.set('text/plain', opts.text)
  }

  return {
    types: Array.from(store.keys()),
    getData: (type: string) => store.get(type) ?? ''
  } as unknown as DataTransfer
}

function makeEditor(content: Descendant[] = adjacentBlockContent): Editor {
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

function makeFragment(texts: Array<{ id: string; text: string; role?: string }>): Descendant[] {
  return texts.map(({ id, text, role }) => ({
    id,
    type: 'core/text',
    class: 'text',
    properties: role ? { role } : {},
    children: [{ text }]
  })) as Descendant[]
}

// ---------------------------------------------------------------------------
// Slate-fragment paste with block caret
// ---------------------------------------------------------------------------

describe('prepareBlockAwarePaste — slate-fragment with block caret', () => {
  test('direction=before inserts fragment before the target block', () => {
    const editor = makeEditor()
    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'before' }
    const fragment = makeFragment([{ id: 'f-1', text: 'Pasted' }])
    const clipboard = makeClipboard({ slateFragment: fragment })

    const result = prepareBlockAwarePaste(editor, clipboard, adjacentBlock, null)

    expect(result).toBe('handled')
    expect(editor.children).toHaveLength(4)
    expect(editor.children[1]).toMatchObject({ id: 'f-1' })
    expect(editor.children[2]).toMatchObject({ id: 'non-text-block' })
  })

  test('direction=after inserts fragment after the target block', () => {
    const editor = makeEditor()
    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'after' }
    const fragment = makeFragment([{ id: 'f-1', text: 'Pasted' }])
    const clipboard = makeClipboard({ slateFragment: fragment })

    const result = prepareBlockAwarePaste(editor, clipboard, adjacentBlock, null)

    expect(result).toBe('handled')
    expect(editor.children).toHaveLength(4)
    expect(editor.children[1]).toMatchObject({ id: 'non-text-block' })
    expect(editor.children[2]).toMatchObject({ id: 'f-1' })
    expect(editor.children[3]).toMatchObject({ id: 'text-after-block' })
  })

  test('preserves role of each pasted block (no merge rewriting)', () => {
    const editor = makeEditor()
    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'before' }
    const fragment = makeFragment([
      { id: 'h1', text: 'Heading', role: 'h1' },
      { id: 'body', text: 'Body paragraph' }
    ])
    const clipboard = makeClipboard({ slateFragment: fragment })

    prepareBlockAwarePaste(editor, clipboard, adjacentBlock, null)

    expect(editor.children[1]).toMatchObject({ id: 'h1', properties: { role: 'h1' } })
    expect(editor.children[2]).toMatchObject({ id: 'body' })
  })

  test('selection lands at the end of the last inserted block', () => {
    const editor = makeEditor()
    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'after' }
    const fragment = makeFragment([
      { id: 'f-1', text: 'First' },
      { id: 'f-2', text: 'Second paragraph' }
    ])
    const clipboard = makeClipboard({ slateFragment: fragment })

    prepareBlockAwarePaste(editor, clipboard, adjacentBlock, null)

    // The last inserted block sits at index [2 + 2 - 1] = 3; its text length is
    // 'Second paragraph'.length = 16
    expect(editor.selection).toEqual({
      anchor: { path: [3, 0], offset: 16 },
      focus: { path: [3, 0], offset: 16 }
    })
  })

  test('returns unhandled when block id cannot be resolved', () => {
    const editor = makeEditor()
    const adjacentBlock: AdjacentBlockState = { blockId: 'no-such-block', direction: 'before' }
    const clipboard = makeClipboard({ slateFragment: makeFragment([{ id: 'f', text: 'x' }]) })

    const result = prepareBlockAwarePaste(editor, clipboard, adjacentBlock, null)

    expect(result).toBe('unhandled')
    expect(editor.children).toHaveLength(3) // unchanged
  })
})

// ---------------------------------------------------------------------------
// Slate-fragment paste with block selection
// ---------------------------------------------------------------------------

describe('prepareBlockAwarePaste — slate-fragment with block selection', () => {
  test('single-block selection replaces that block with the fragment', () => {
    const editor = makeEditor()
    const blockSelection: BlockSelectionState = { anchorIndex: 1, focusIndex: 1 }
    const fragment = makeFragment([{ id: 'f-1', text: 'Replacement' }])
    const clipboard = makeClipboard({ slateFragment: fragment })

    const result = prepareBlockAwarePaste(editor, clipboard, null, blockSelection)

    expect(result).toBe('handled')
    expect(editor.children).toHaveLength(3)
    expect(editor.children[0]).toMatchObject({ id: 'text-before-block' })
    expect(editor.children[1]).toMatchObject({ id: 'f-1' })
    expect(editor.children[2]).toMatchObject({ id: 'text-after-block' })
  })

  test('multi-block selection replaces the whole range with the fragment', () => {
    const editor = makeEditor()
    const blockSelection: BlockSelectionState = { anchorIndex: 0, focusIndex: 2 }
    const fragment = makeFragment([
      { id: 'f-1', text: 'One' },
      { id: 'f-2', text: 'Two' }
    ])
    const clipboard = makeClipboard({ slateFragment: fragment })

    prepareBlockAwarePaste(editor, clipboard, null, blockSelection)

    expect(editor.children).toHaveLength(2)
    expect(editor.children[0]).toMatchObject({ id: 'f-1' })
    expect(editor.children[1]).toMatchObject({ id: 'f-2' })
  })

  test('reversed anchor/focus still replaces the correct range', () => {
    const editor = makeEditor()
    const blockSelection: BlockSelectionState = { anchorIndex: 2, focusIndex: 0 }
    const fragment = makeFragment([{ id: 'f-1', text: 'All' }])
    const clipboard = makeClipboard({ slateFragment: fragment })

    prepareBlockAwarePaste(editor, clipboard, null, blockSelection)

    expect(editor.children).toHaveLength(1)
    expect(editor.children[0]).toMatchObject({ id: 'f-1' })
  })
})

// ---------------------------------------------------------------------------
// Text / HTML paste — placeholder path
// ---------------------------------------------------------------------------

describe('prepareBlockAwarePaste — text/html placeholder path', () => {
  test('inserts an empty text placeholder at the target path when no slate fragment is present', () => {
    const editor = makeEditor()
    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'before' }
    const clipboard = makeClipboard({ text: 'hello' })

    const result = prepareBlockAwarePaste(editor, clipboard, adjacentBlock, null)

    expect(result).toBe('prepared')
    expect(editor.children).toHaveLength(4)
    // The placeholder sits at index 1, pushing non-text-block to index 2
    expect(editor.children[1]).toMatchObject({
      type: 'core/text',
      class: 'text',
      children: [{ text: '' }]
    })
    expect(editor.children[2]).toMatchObject({ id: 'non-text-block' })

    // Selection is placed inside the placeholder so the default paste flow
    // can populate it via editor.insertData.
    expect(editor.selection).toEqual({
      anchor: { path: [1, 0], offset: 0 },
      focus: { path: [1, 0], offset: 0 }
    })
  })

  test('block-selection placeholder path removes selected blocks before inserting', () => {
    const editor = makeEditor()
    const blockSelection: BlockSelectionState = { anchorIndex: 0, focusIndex: 2 }
    const clipboard = makeClipboard({ text: 'hello' })

    const result = prepareBlockAwarePaste(editor, clipboard, null, blockSelection)

    expect(result).toBe('prepared')
    expect(editor.children).toHaveLength(1)
    expect(editor.children[0]).toMatchObject({
      type: 'core/text',
      class: 'text',
      children: [{ text: '' }]
    })
  })
})

// ---------------------------------------------------------------------------
// Passthrough cases
// ---------------------------------------------------------------------------

describe('prepareBlockAwarePaste — passthrough', () => {
  test('returns unhandled when neither adjacentBlock nor blockSelection is set', () => {
    const editor = makeEditor()
    const before = editor.children.length
    const result = prepareBlockAwarePaste(editor, makeClipboard({ text: 'x' }), null, null)

    expect(result).toBe('unhandled')
    expect(editor.children).toHaveLength(before)
  })

  test('tolerates malformed slate fragment payload (falls back to placeholder)', () => {
    const editor = makeEditor()
    const adjacentBlock: AdjacentBlockState = { blockId: 'non-text-block', direction: 'before' }
    const badClipboard = {
      types: ['application/x-slate-fragment'],
      getData: (t: string) => (t === 'application/x-slate-fragment' ? 'not-valid-base64!!!' : '')
    } as unknown as DataTransfer

    const result = prepareBlockAwarePaste(editor, badClipboard, adjacentBlock, null)

    // With invalid fragment, fall back to the placeholder path
    expect(result).toBe('prepared')
    expect(editor.children).toHaveLength(4)
    expect(editor.children[1]).toMatchObject({ class: 'text', children: [{ text: '' }] })
  })
})
