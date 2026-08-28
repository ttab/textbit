import { describe, test, expect, vi } from 'vitest'
import { render, act } from '@testing-library/react'
import { Editor, createEditor, type Descendant } from 'slate'
import { Slate, withReact } from 'slate-react'
import { PendingDropsProvider } from '../lib/contexts/PendingDropsProvider'
import { UploadMarker } from '../lib/components/UploadMarker'

// Bypass DOM measurement / positioning — this suite tests rendering shape,
// not layout math. `Editor.node` and `ReactEditor.toDOMNode` are mocked so
// the marker gets a stable rect it can absolute-position from.
vi.mock('slate-react', async () => {
  const actual = await vi.importActual<typeof import('slate-react')>('slate-react')
  return {
    ...actual,
    ReactEditor: {
      ...actual.ReactEditor,
      toDOMNode: () => {
        const el = document.createElement('div')
        Object.defineProperty(el, 'getBoundingClientRect', {
          value: () => ({ left: 10, top: 20, width: 100, height: 24, right: 110, bottom: 44, x: 10, y: 20, toJSON: () => ({}) })
        })
        return el
      }
    }
  }
})

function makeEditor(children: Descendant[]): Editor {
  const editor = withReact(createEditor())
  editor.children = children
  editor.selection = null
  return editor
}

function content(): Descendant[] {
  return [
    { id: 'a', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'aaa' }] } as Descendant,
    { id: 'b', type: 'core/text', class: 'text', properties: {}, children: [{ text: 'bbb' }] } as Descendant
  ]
}

function Wrapper({ editor, children }: { editor: Editor, children: React.ReactNode }) {
  // The marker locates its editable sibling by `role="textbox"` and reads
  // its bounding rect. Provide a stub so positioning succeeds.
  return (
    <Slate editor={editor} initialValue={editor.children}>
      <PendingDropsProvider editor={editor}>
        <div style={{ position: 'relative' }}>
          <div role="textbox" ref={(el) => {
            if (el) el.getBoundingClientRect = () => ({
              left: 0, top: 0, width: 200, height: 60,
              right: 200, bottom: 60, x: 0, y: 0, toJSON: () => ({})
            })
          }} />
          {children}
        </div>
      </PendingDropsProvider>
    </Slate>
  )
}

describe('UploadMarker', () => {
  test('renders nothing visible when there are no drops', () => {
    const editor = makeEditor(content())
    const { container } = render(<Wrapper editor={editor}><UploadMarker /></Wrapper>)

    // Only a hidden anchor sibling, no visible marker element.
    const markers = container.querySelectorAll('[data-source]')
    expect(markers).toHaveLength(0)
  })

  test('renders one positioned child per drop with data attributes', () => {
    const editor = makeEditor(content())
    const { container } = render(
      <Wrapper editor={editor}>
        <UploadMarker className="chip" />
      </Wrapper>
    )

    act(() => {
      editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [0]), kind: 'image' })
      editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [1]), kind: 'file' })
    })

    const markers = container.querySelectorAll('.chip')
    expect(markers).toHaveLength(2)
    expect(markers[0].getAttribute('data-source')).toBe('own')
    expect(new Set(Array.from(markers).map((m) => m.getAttribute('data-kind')))).toEqual(new Set(['image', 'file']))
  })

  test('render-prop children receive the pending drop', () => {
    const editor = makeEditor(content())
    const { container } = render(
      <Wrapper editor={editor}>
        <UploadMarker>
          {(drop) => <span data-testid="body">{drop.kind}</span>}
        </UploadMarker>
      </Wrapper>
    )

    act(() => {
      editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [0]), kind: 'image' })
    })

    const bodies = container.querySelectorAll('[data-testid="body"]')
    expect(bodies).toHaveLength(1)
    expect(bodies[0].textContent).toBe('image')
  })

  test('className and style pass through to each marker', () => {
    const editor = makeEditor(content())
    const { container } = render(
      <Wrapper editor={editor}>
        <UploadMarker className="chip" style={{ opacity: 0.5 }} />
      </Wrapper>
    )

    act(() => {
      editor.pendingDrops!.start({ pathRef: Editor.pathRef(editor, [0]), kind: 'image' })
    })

    const marker = container.querySelector('.chip') as HTMLElement
    expect(marker).not.toBeNull()
    // Custom style wins over the default (defaultStyle spreads first).
    expect(marker.style.opacity).toBe('0.5')
  })
})
