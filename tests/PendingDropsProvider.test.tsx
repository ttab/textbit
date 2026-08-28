import { describe, test, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { Editor, Transforms, createEditor, type Descendant } from 'slate'
import { Slate, withReact } from 'slate-react'
import { PendingDropsProvider } from '../lib/contexts/PendingDropsProvider'
import { usePendingDrops } from '../lib/hooks/usePendingDrops'

function makeEditor(children: Descendant[]): Editor {
  const editor = withReact(createEditor())
  editor.children = children
  return editor
}

function threeParagraphs(): Descendant[] {
  return [
    { id: 'a', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'aaa' }] } as Descendant,
    { id: 'b', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'bbb' }] } as Descendant,
    { id: 'c', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'ccc' }] } as Descendant
  ]
}

function Reader({ onDrops }: { onDrops: (drops: ReturnType<typeof usePendingDrops>) => void }) {
  const drops = usePendingDrops()
  onDrops(drops)
  return null
}

describe('PendingDropsProvider', () => {
  test('attaches a start/end API to the editor on mount', () => {
    const editor = makeEditor(threeParagraphs())
    render(<Slate editor={editor} initialValue={editor.children}><PendingDropsProvider editor={editor}><span /></PendingDropsProvider></Slate>)

    expect(editor.pendingDrops).toBeDefined()
    expect(typeof editor.pendingDrops?.start).toBe('function')
    expect(typeof editor.pendingDrops?.end).toBe('function')
  })

  test('start returns a unique id and end removes by id', () => {
    const editor = makeEditor(threeParagraphs())
    let latest: ReturnType<typeof usePendingDrops> = []
    render(
      <Slate editor={editor} initialValue={editor.children}><PendingDropsProvider editor={editor}>
        <Reader onDrops={(d) => { latest = d }} />
      </PendingDropsProvider></Slate>
    )

    let id1 = ''
    let id2 = ''
    act(() => {
      id1 = editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [0]), kind: 'image' })
      id2 = editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [1]), kind: 'file' })
    })

    expect(id1).not.toBe(id2)
    expect(latest.map((d) => d.id).sort()).toEqual([id1, id2].sort())
    expect(latest.find((d) => d.id === id1)?.kind).toBe('image')
    expect(latest.find((d) => d.id === id2)?.kind).toBe('file')

    act(() => {
      editor.pendingDrops!.end(id1)
    })

    expect(latest).toHaveLength(1)
    expect(latest[0].id).toBe(id2)

    // Unknown id is a safe no-op.
    act(() => {
      editor.pendingDrops!.end('never-existed')
    })
    expect(latest).toHaveLength(1)
  })

  test('PathRef auto-updates when nodes are inserted before the drop position', async () => {
    const editor = makeEditor(threeParagraphs())
    let latest: ReturnType<typeof usePendingDrops> = []
    render(
      <Slate editor={editor} initialValue={editor.children}><PendingDropsProvider editor={editor}>
        <Reader onDrops={(d) => { latest = d }} />
      </PendingDropsProvider></Slate>
    )

    act(() => {
      editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [1]), kind: 'image' })
    })
    expect(latest[0].path).toEqual([1])

    // Insert a new block at [0] — the PathRef should shift the drop to [2].
    // Slate flushes `editor.onChange` in a microtask, so we await it.
    await act(async () => {
      Transforms.insertNodes(
        editor,
        { id: 'new', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'new' }] } as Descendant,
        { at: [0] }
      )
      await Promise.resolve()
    })
    expect(latest[0].path).toEqual([2])
  })

  test('a drop whose enclosing position is removed is filtered from drops', async () => {
    const editor = makeEditor(threeParagraphs())
    let latest: ReturnType<typeof usePendingDrops> = []
    render(
      <Slate editor={editor} initialValue={editor.children}><PendingDropsProvider editor={editor}>
        <Reader onDrops={(d) => { latest = d }} />
      </PendingDropsProvider></Slate>
    )

    act(() => {
      editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [1]), kind: 'image' })
    })
    expect(latest).toHaveLength(1)

    // Remove the paragraph the ref points at. `PathRef.current` becomes null;
    // the Provider filters it from the visible drops list.
    await act(async () => {
      Transforms.removeNodes(editor, { at: [1] })
      await Promise.resolve()
    })
    expect(latest).toHaveLength(0)
  })

  test('detaches the API from the editor on unmount', () => {
    const editor = makeEditor(threeParagraphs())
    const { unmount } = render(<Slate editor={editor} initialValue={editor.children}><PendingDropsProvider editor={editor}><span /></PendingDropsProvider></Slate>)
    expect(editor.pendingDrops).toBeDefined()
    unmount()
    expect(editor.pendingDrops).toBeUndefined()
  })
})
