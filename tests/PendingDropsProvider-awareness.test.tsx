import { describe, test, expect } from 'vitest'
import { render, act } from '@testing-library/react'
import { Editor, createEditor, type Descendant } from 'slate'
import { Slate, withReact } from 'slate-react'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { withYjs, withCursors, slateNodesToInsertDelta, slatePointToRelativePosition, YjsEditor } from '@slate-yjs/core'
import { PendingDropsProvider } from '../lib/contexts/PendingDropsProvider'
import { usePendingDrops } from '../lib/hooks/usePendingDrops'

function seed(): Descendant[] {
  return [
    { id: 'a', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'aaa' }] } as Descendant,
    { id: 'b', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'bbb' }] } as Descendant,
    { id: 'c', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'ccc' }] } as Descendant
  ]
}

function makeCollaborativeEditor(children: Descendant[], awareness: Awareness): Editor {
  const doc = new Y.Doc()
  const sharedType = doc.get('content', Y.XmlText) as Y.XmlText
  sharedType.applyDelta(slateNodesToInsertDelta(children))
  const editor = withCursors(
    withYjs(withReact(createEditor()), sharedType, { autoConnect: false }),
    awareness
  )
  YjsEditor.connect(editor as YjsEditor)
  return editor
}

function Reader({ onDrops }: { onDrops: (drops: ReturnType<typeof usePendingDrops>) => void }) {
  const drops = usePendingDrops()
  onDrops(drops)
  return null
}

async function tickMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('PendingDropsProvider — awareness broadcast (own → peers)', () => {
  test('mirrors local drops onto awareness.pendingDrops', async () => {
    const awareness = new Awareness(new Y.Doc())
    const editor = makeCollaborativeEditor(seed(), awareness)
    render(<Slate editor={editor} initialValue={editor.children}><PendingDropsProvider editor={editor}><span /></PendingDropsProvider></Slate>)

    await act(async () => {
      editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [1]), kind: 'image' })
      await tickMicrotasks()
    })

    const localState = awareness.getLocalState() ?? {}
    const wire = (localState.pendingDrops ?? []) as Array<{ id: string, kind?: string, relPos: number[] }>
    expect(wire).toHaveLength(1)
    expect(wire[0].kind).toBe('image')
    expect(Array.isArray(wire[0].relPos)).toBe(true)
    expect(wire[0].relPos.length).toBeGreaterThan(0)
  })

  test('clears awareness.pendingDrops when the last local drop ends', async () => {
    const awareness = new Awareness(new Y.Doc())
    const editor = makeCollaborativeEditor(seed(), awareness)
    render(<Slate editor={editor} initialValue={editor.children}><PendingDropsProvider editor={editor}><span /></PendingDropsProvider></Slate>)

    let id = ''
    await act(async () => {
      id = editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [0]), kind: 'image' })
      await tickMicrotasks()
    })
    expect((awareness.getLocalState() as { pendingDrops?: unknown }).pendingDrops).toBeTruthy()

    await act(async () => {
      editor.pendingDrops!.end(id)
      await tickMicrotasks()
    })
    expect((awareness.getLocalState() as { pendingDrops?: unknown }).pendingDrops).toBeNull()
  })

  test('does not broadcast when the editor is not collaborative', async () => {
    // No CursorEditor → no awareness → no broadcast attempt.
    const editor = withReact(createEditor())
    editor.children = seed()
    render(<Slate editor={editor} initialValue={editor.children}><PendingDropsProvider editor={editor}><span /></PendingDropsProvider></Slate>)

    await act(async () => {
      editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [0]), kind: 'image' })
      await tickMicrotasks()
    })
    // No throw is the acceptance criterion; nothing to inspect.
  })

  test('clears our field on Provider unmount so peers see us vanish', async () => {
    const awareness = new Awareness(new Y.Doc())
    const editor = makeCollaborativeEditor(seed(), awareness)
    const { unmount } = render(<Slate editor={editor} initialValue={editor.children}><PendingDropsProvider editor={editor}><span /></PendingDropsProvider></Slate>)

    await act(async () => {
      editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [0]), kind: 'image' })
      await tickMicrotasks()
    })
    expect((awareness.getLocalState() as { pendingDrops?: unknown }).pendingDrops).toBeTruthy()

    unmount()
    expect((awareness.getLocalState() as { pendingDrops?: unknown }).pendingDrops).toBeNull()
  })
})

describe('PendingDropsProvider — awareness subscribe (peers → local)', () => {
  test('renders a peer drop received via awareness change', async () => {
    // Peer B's editor + Provider is under test. We fabricate a peer A wire
    // message with a distinct clientID and inject it into B's awareness map
    // to simulate a state that just arrived over the network.
    const bAwareness = new Awareness(new Y.Doc())
    const editorB = makeCollaborativeEditor(seed(), bAwareness)

    let latest: ReturnType<typeof usePendingDrops> = []
    render(
      <Slate editor={editorB} initialValue={editorB.children}><PendingDropsProvider editor={editorB}>
        <Reader onDrops={(d) => { latest = d }} />
      </PendingDropsProvider></Slate>
    )

    // Encode a RelativePosition for [1] using B's own sharedRoot — the same
    // content lives in both peers' shared roots in a real session.
    const sharedRoot = (editorB as unknown as YjsEditor).sharedRoot
    const relPos = slatePointToRelativePosition(sharedRoot, editorB, Editor.start(editorB, [1]))
    const fakePeerId = bAwareness.clientID + 1

    await act(async () => {
      bAwareness.states.set(fakePeerId, {
        pendingDrops: [{
          id: 'wire-1',
          relPos: Array.from(Y.encodeRelativePosition(relPos)),
          kind: 'image'
        }],
        data: { name: 'Alice', color: '#f00' }
      })
      bAwareness.emit('change', [
        { added: [fakePeerId], updated: [], removed: [] },
        'test'
      ])
      await tickMicrotasks()
    })

    const peerDrops = latest.filter((d) => d.source === 'peer')
    expect(peerDrops).toHaveLength(1)
    expect(peerDrops[0].kind).toBe('image')
    expect(peerDrops[0].peerId).toBe(fakePeerId)
    expect(peerDrops[0].path).toEqual([1])
    expect(peerDrops[0].peerData).toEqual({ name: 'Alice', color: '#f00' })
  })

  test('peer drop vanishes when their awareness state is removed', async () => {
    const bAwareness = new Awareness(new Y.Doc())
    const editorB = makeCollaborativeEditor(seed(), bAwareness)

    let latest: ReturnType<typeof usePendingDrops> = []
    render(
      <Slate editor={editorB} initialValue={editorB.children}><PendingDropsProvider editor={editorB}>
        <Reader onDrops={(d) => { latest = d }} />
      </PendingDropsProvider></Slate>
    )

    const sharedRoot = (editorB as unknown as YjsEditor).sharedRoot
    const relPos = slatePointToRelativePosition(sharedRoot, editorB, Editor.start(editorB, [1]))
    const fakePeerId = bAwareness.clientID + 1

    await act(async () => {
      bAwareness.states.set(fakePeerId, {
        pendingDrops: [{
          id: 'wire-1',
          relPos: Array.from(Y.encodeRelativePosition(relPos)),
          kind: 'image'
        }]
      })
      bAwareness.emit('change', [
        { added: [fakePeerId], updated: [], removed: [] },
        'test'
      ])
      await tickMicrotasks()
    })
    expect(latest.filter((d) => d.source === 'peer')).toHaveLength(1)

    // Peer disconnect: state removed. In production this happens automatically
    // when their awareness expires (WebSocket drop, tab close).
    await act(async () => {
      bAwareness.states.delete(fakePeerId)
      bAwareness.emit('change', [
        { added: [], updated: [], removed: [fakePeerId] },
        'test'
      ])
      await tickMicrotasks()
    })

    expect(latest.filter((d) => d.source === 'peer')).toHaveLength(0)
  })

  test('ignores awareness changes that do not touch pendingDrops', async () => {
    // Cursor movements broadcast via awareness every keystroke. The peer read
    // must short-circuit when no peer's pendingDrops field changed, otherwise
    // we re-decode positions on every cursor tick. Fires an awareness change
    // with only cursor data updates and verifies the peer drop list doesn't
    // churn.
    const bAwareness = new Awareness(new Y.Doc())
    const editorB = makeCollaborativeEditor(seed(), bAwareness)

    let renderCount = 0
    function Counter() {
      const drops = usePendingDrops()
      renderCount += 1
      // Reference `drops` so the linter doesn't optimise it away.
      void drops
      return null
    }

    render(
      <Slate editor={editorB} initialValue={editorB.children}><PendingDropsProvider editor={editorB}>
        <Counter />
      </PendingDropsProvider></Slate>
    )

    const rendersBefore = renderCount

    // Peer moves their cursor — awareness fires 'change', but `pendingDrops`
    // is untouched.
    const fakePeerId = bAwareness.clientID + 1
    await act(async () => {
      bAwareness.states.set(fakePeerId, {
        cursor: { anchor: 1, focus: 2 },
        data: { name: 'Alice' }
      })
      bAwareness.emit('change', [
        { added: [fakePeerId], updated: [], removed: [] },
        'test'
      ])
      await tickMicrotasks()
    })

    // No cursor field means the peer's pendingDrops didn't change. The
    // Provider must NOT setState → the consumer must NOT re-render.
    expect(renderCount).toBe(rendersBefore)
  })
})
