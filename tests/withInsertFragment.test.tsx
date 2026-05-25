import { describe, test, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import type { Descendant, Editor, Element } from 'slate'
import { Transforms, Editor as SlateEditor } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import type { PluginDefinition } from '../lib/types'
import { consecutiveBlocksContent } from './_fixtures'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEditor(
  content: Descendant[] = consecutiveBlocksContent,
  plugins?: PluginDefinition[]
): Editor {
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <TextbitRoot value={content} onChange={() => { }} plugins={plugins}>
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
// Wrapped-text fragments (partial text selected from inside a nested block)
// should not be split-and-inserted as a malformed sibling block. Slate's
// default unwraps the block ancestors and merges the text leaves.
// ---------------------------------------------------------------------------

describe('withInsertFragment — wrapped text fragment', () => {
  test('partial caption text pasted into paragraph inserts as text only', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    // Shape produced by Editor.fragment for a partial selection inside a
    // caption: figure block with only the caption child, caption has a
    // single text leaf.
    const fragment: Descendant[] = [{
      type: 'core/image',
      id: 'wrapped',
      class: 'block',
      children: [{
        type: 'core/text',
        id: 'wrapped-caption',
        class: 'text',
        properties: {},
        children: [{ text: 'partial' }]
      }]
    } as Descendant]

    editor.insertFragment(fragment)

    // Top-level count unchanged — text was merged into the paragraph.
    expect(editor.children).toHaveLength(4)
    expect((editor.children[0] as Element).class).toBe('text')
    expect((editor.children[0] as Element).children).toMatchObject([{ text: 'Befpartialore' }])
  })

  test('wrapped text with formatted runs preserves marks', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    const fragment: Descendant[] = [{
      type: 'core/image',
      id: 'wrapped',
      class: 'block',
      children: [{
        type: 'core/text',
        id: 'wrapped-caption',
        class: 'text',
        properties: {},
        children: [
          { text: 'plain ' },
          { text: 'bold', bold: true }
        ]
      }]
    } as Descendant]

    editor.insertFragment(fragment)

    expect(editor.children).toHaveLength(4)
    const para = editor.children[0] as Element
    expect(para.class).toBe('text')
    expect(para.children).toMatchObject([
      { text: 'Befplain ' },
      { text: 'bold', bold: true },
      { text: 'ore' }
    ])
  })

  test('wrapped text from deeply nested structure (table cell) inserts as text only', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    // Shape produced by Editor.fragment for a partial selection inside a
    // table cell: table → row → cell → {text}.
    const fragment: Descendant[] = [{
      type: 'core/table',
      id: 'wrapped-table',
      class: 'block',
      children: [{
        type: 'core/table/row',
        id: 'wrapped-row',
        class: 'block',
        children: [{
          type: 'core/table/row/cell',
          id: 'wrapped-cell',
          class: 'text',
          children: [{ text: 'cell text' }]
        }]
      }]
    } as Descendant]

    editor.insertFragment(fragment)

    expect(editor.children).toHaveLength(4)
    expect((editor.children[0] as Element).class).toBe('text')
    expect((editor.children[0] as Element).children).toMatchObject([{ text: 'Befcell textore' }])
  })

  test('full block (with void) still uses split-and-insert path', () => {
    // Sanity check: a genuine block fragment (figure with image void + caption)
    // must continue to be inserted as a top-level sibling block, not flattened.
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    editor.insertFragment([imageBlock('pasted', 'Pasted caption')])

    expect(editor.children).toHaveLength(6)
    expect((editor.children[1] as Element).type).toBe('core/image')
    expect((editor.children[1] as Element).children).toHaveLength(2)
  })

  test('places cursor at end of merged wrapped text', () => {
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    const fragment: Descendant[] = [{
      type: 'core/image',
      id: 'wrapped',
      class: 'block',
      children: [{
        type: 'core/text',
        id: 'wrapped-caption',
        class: 'text',
        properties: {},
        children: [{ text: 'partial' }]
      }]
    } as Descendant]

    editor.insertFragment(fragment)

    // "Bef" + "partial" => cursor at offset 10 within the paragraph's single leaf.
    expect(editor.selection).toEqual({
      anchor: { path: [0, 0], offset: 10 },
      focus: { path: [0, 0], offset: 10 }
    })
  })

  test('wrapped text replaces non-collapsed selection within paragraph', () => {
    const editor = makeEditor()
    // Select "efo" inside "Before" (offsets 1..4)
    Transforms.select(editor, {
      anchor: { path: [0, 0], offset: 1 },
      focus: { path: [0, 0], offset: 4 }
    })

    const fragment: Descendant[] = [{
      type: 'core/image',
      id: 'wrapped',
      class: 'block',
      children: [{
        type: 'core/text',
        id: 'wrapped-caption',
        class: 'text',
        properties: {},
        children: [{ text: 'XYZ' }]
      }]
    } as Descendant]

    editor.insertFragment(fragment)

    // "B" + "XYZ" + "re" — selection deleted then leaves inserted.
    expect(editor.children).toHaveLength(4)
    expect((editor.children[0] as Element).children).toMatchObject([{ text: 'BXYZre' }])
    expect(editor.selection).toEqual({
      anchor: { path: [0, 0], offset: 4 },
      focus: { path: [0, 0], offset: 4 }
    })
  })

  test('non-void branching wrapper does not match — falls through to split-and-insert', () => {
    // A factbox-shaped fragment: block root with two text-class children
    // (title + body). No void anywhere, but the root has > 1 child so the
    // wrapped-text chain detector must reject and let the split-and-insert
    // path run.
    const editor = makeEditor()
    Transforms.select(editor, { anchor: { path: [0, 0], offset: 3 }, focus: { path: [0, 0], offset: 3 } })

    const fragment: Descendant[] = [{
      type: 'core/factbox',
      id: 'fb',
      class: 'block',
      children: [
        {
          type: 'core/factbox/title',
          id: 'fb-title',
          class: 'text',
          properties: {},
          children: [{ text: 'Title' }]
        },
        {
          type: 'core/factbox/body',
          id: 'fb-body',
          class: 'text',
          properties: {},
          children: [{ text: 'Body' }]
        }
      ]
    } as Descendant]

    editor.insertFragment(fragment)

    // Inserted as a top-level sibling block — not flattened.
    expect(editor.children).toHaveLength(6)
    const inserted = editor.children[1] as Element
    expect(inserted.type).toBe('core/factbox')
    expect(inserted.class).toBe('block')
    expect(inserted.children).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// Wrapped-text fragment pasted into a child text element (caption-to-caption).
// The wrapped-text early-out must fire before the child-text flatten path so
// that the leaves merge into the target caption — preserving the wrapping
// figure's structure on neither side.
// ---------------------------------------------------------------------------

const imageWithCaptionPlugin: PluginDefinition = {
  class: 'block',
  name: 'core/image',
  componentEntry: {
    class: 'block',
    component: ({ children, attributes }) => <figure {...attributes}>{children}</figure>,
    children: [
      {
        type: 'image',
        class: 'void',
        component: ({ attributes, children }) => (
          <div contentEditable={false} {...attributes}>image{children}</div>
        )
      },
      {
        type: 'caption',
        class: 'text',
        component: ({ attributes, children }) => <figcaption {...attributes}>{children}</figcaption>
      }
    ]
  }
}

describe('withInsertFragment — wrapped text pasted into caption', () => {
  function captionContent(): Descendant[] {
    return [
      {
        type: 'core/text',
        id: 'para',
        class: 'text',
        properties: {},
        children: [{ text: 'Lead' }]
      } as Descendant,
      {
        type: 'core/image',
        id: 'img-1',
        class: 'block',
        children: [
          {
            id: 'img-1-image',
            type: 'core/image/image',
            class: 'void',
            children: [{ text: '' }]
          },
          {
            id: 'img-1-caption',
            type: 'core/image/caption',
            class: 'text',
            properties: {},
            children: [{ text: 'Caption' }]
          }
        ]
      } as Descendant
    ]
  }

  test('merges wrapped text into the target caption (does not split the figure)', () => {
    const editor = makeEditor(captionContent(), [imageWithCaptionPlugin])
    // Cursor inside the caption text leaf at "Cap|tion" (offset 3).
    Transforms.select(editor, {
      anchor: { path: [1, 1, 0], offset: 3 },
      focus: { path: [1, 1, 0], offset: 3 }
    })

    const fragment: Descendant[] = [{
      type: 'core/image',
      id: 'wrapped',
      class: 'block',
      children: [{
        type: 'core/image/caption',
        id: 'wrapped-caption',
        class: 'text',
        properties: {},
        children: [{ text: 'XYZ' }]
      }]
    } as Descendant]

    editor.insertFragment(fragment)

    // Top-level still has [paragraph, image] — no extra block was inserted.
    expect(editor.children).toHaveLength(2)
    const image = editor.children[1] as Element
    expect(image.type).toBe('core/image')
    expect(image.children).toHaveLength(2)

    const caption = image.children[1] as Element
    expect(caption.class).toBe('text')
    expect(caption.children).toMatchObject([{ text: 'CapXYZtion' }])
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
