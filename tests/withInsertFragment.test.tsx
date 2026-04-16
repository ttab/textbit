import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import type { Descendant, Editor, Element } from 'slate'
import { Transforms, Editor as SlateEditor } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import { consecutiveBlocksContent } from './_fixtures'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEditor(content: Descendant[] = consecutiveBlocksContent): Editor {
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

function imageBlock(id: string, caption: string): Descendant {
  return {
    type: 'core/image',
    id,
    class: 'block',
    children: [
      {
        type: 'core/image/image',
        class: 'void',
        children: [{ text: '' }]
      },
      {
        id: `${id}-caption`,
        type: 'core/text',
        class: 'text',
        properties: {},
        children: [{ text: caption }]
      }
    ]
  } as Descendant
}

// ---------------------------------------------------------------------------
// Insert block fragment into middle of top-level text paragraph
// ---------------------------------------------------------------------------

describe('withInsertFragment — block into text paragraph', () => {
  test('splits paragraph and inserts block between halves', () => {
    const editor = makeEditor()
    // consecutiveBlocksContent: [para-before, block-1, block-2, para-after]
    // Place cursor in the middle of para-before "Bef|ore"
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    const fragment = [imageBlock('pasted-img', 'Pasted caption')]
    editor.insertFragment(fragment)

    // Expected: ["Bef", pasted-img, "ore", block-1, block-2, para-after]
    expect(editor.children).toHaveLength(6)

    const first = editor.children[0] as Element
    expect(first.class).toBe('text')
    expect(first.children).toMatchObject([{ text: 'Bef' }])

    const inserted = editor.children[1] as Element
    expect(inserted.type).toBe('core/image')
    expect(inserted.class).toBe('block')
    expect(inserted.children).toHaveLength(2)
    expect(inserted.children[0]).toMatchObject({ class: 'void' })

    const second = editor.children[2] as Element
    expect(second.class).toBe('text')
    expect(second.children).toMatchObject([{ text: 'ore' }])
  })

  test('inserts block before paragraph when cursor is at start', () => {
    const editor = makeEditor()
    Transforms.select(editor, SlateEditor.start(editor, [0]))

    editor.insertFragment([imageBlock('pasted', 'Caption')])

    // Expected: [pasted, para-before, block-1, block-2, para-after]
    expect(editor.children).toHaveLength(5)
    expect((editor.children[0] as Element).type).toBe('core/image')
    expect((editor.children[1] as Element).class).toBe('text')
    expect((editor.children[1] as Element).children).toMatchObject([{ text: 'Before' }])
  })

  test('inserts block after paragraph when cursor is at end', () => {
    const editor = makeEditor()
    Transforms.select(editor, SlateEditor.end(editor, [0]))

    editor.insertFragment([imageBlock('pasted', 'Caption')])

    // Expected: [para-before, pasted, block-1, block-2, para-after]
    expect(editor.children).toHaveLength(5)
    expect((editor.children[0] as Element).class).toBe('text')
    expect((editor.children[0] as Element).children).toMatchObject([{ text: 'Before' }])
    expect((editor.children[1] as Element).type).toBe('core/image')
  })

  test('preserves void child in the inserted block', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    editor.insertFragment([imageBlock('pasted', 'My caption')])

    const inserted = editor.children[1] as Element
    const voidChild = inserted.children[0] as Element
    expect(voidChild.type).toBe('core/image/image')
    expect(voidChild.class).toBe('void')

    const captionChild = inserted.children[1] as Element
    expect(captionChild.class).toBe('text')
    expect(captionChild.children).toMatchObject([{ text: 'My caption' }])
  })

  test('places cursor at end of last inserted fragment node', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    editor.insertFragment([imageBlock('pasted', 'Pasted caption')])

    // Last inserted node is at index 1; its last text child has "Pasted caption" (length 14)
    expect(editor.selection).toEqual({
      anchor: { path: [1, 1, 0], offset: 14 },
      focus: { path: [1, 1, 0], offset: 14 }
    })
  })

  test('handles multiple blocks in the fragment', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    editor.insertFragment([
      imageBlock('img-1', 'First'),
      imageBlock('img-2', 'Second')
    ])

    // Expected: ["Bef", img-1, img-2, "ore", block-1, block-2, para-after]
    expect(editor.children).toHaveLength(7)
    expect((editor.children[0] as Element).children).toMatchObject([{ text: 'Bef' }])
    expect((editor.children[1] as Element).type).toBe('core/image')
    expect((editor.children[2] as Element).type).toBe('core/image')
    expect((editor.children[3] as Element).children).toMatchObject([{ text: 'ore' }])
  })

  test('handles non-collapsed selection within the paragraph', () => {
    const editor = makeEditor()
    // Select "efo" in "Before" (offset 1 to 4)
    Transforms.select(editor, {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 4 }
    })

    editor.insertFragment([imageBlock('pasted', 'Caption')])

    // "B" + pasted-img + "re" (selected "efo" was deleted, then split at cursor)
    expect(editor.children).toHaveLength(6)
    expect((editor.children[0] as Element).children).toMatchObject([{ text: 'B' }])
    expect((editor.children[1] as Element).type).toBe('core/image')
    expect((editor.children[2] as Element).children).toMatchObject([{ text: 're' }])
  })
})

// ---------------------------------------------------------------------------
// Ensure existing text-only fragment behavior is preserved
// ---------------------------------------------------------------------------

describe('withInsertFragment — text-only fragment passthrough', () => {
  test('text fragment pasted into text paragraph uses default behavior', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    const textFragment: Descendant[] = [{
      type: 'core/text',
      id: 'frag-text',
      class: 'text',
      properties: {},
      children: [{ text: 'INSERTED' }]
    }]

    editor.insertFragment(textFragment)

    // Text should be merged into the paragraph, not split
    expect((editor.children[0] as Element).class).toBe('text')
  })
})
