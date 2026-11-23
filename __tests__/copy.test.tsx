import { afterEach, describe, test, expect, vi } from 'vitest'
import { fireEvent, renderHook } from '@testing-library/react'
import { ReactEditor, useSlateStatic } from 'slate-react'
import { type PropsWithChildren } from 'react'
import type { Descendant, Editor, Range } from 'slate'
import { TextbitRoot } from '../lib/components/TextbitRoot'
import { TextbitEditable } from '../lib/components/TextbitEditable/TextbitEditable'
import {
  handleBlockSelectionKeyDown
} from '../lib/components/TextbitEditable/handleOnKeyDown/blockSelectionHandler'
import { adjacentBlockContent, basicEditorContent } from './_fixtures'

Object.defineProperty(HTMLElement.prototype, 'isContentEditable', {
  configurable: true,
  get(this: HTMLElement) {
    return this.closest('[contenteditable]')?.getAttribute('contenteditable') === 'true'
  }
})

function makeEditor(content: Descendant[] = basicEditorContent): Editor {
  function Wrapper({ children }: PropsWithChildren) {
    return (
      <TextbitRoot value={content} onChange={() => { }}>
        <TextbitEditable>{children}</TextbitEditable>
      </TextbitRoot>
    )
  }
  const { result: { current: editor } } = renderHook(() => useSlateStatic(), { wrapper: Wrapper })
  const editable = ReactEditor.toDOMNode(editor, editor)
  editable.setAttribute('tabindex', '0')
  editable.focus()
  return editor
}

function selectInDOM(editor: Editor, range: Range): void {
  const selection = document.getSelection()
  vi.spyOn(window, 'getSelection').mockReturnValue(selection)
  selection?.removeAllRanges()
  selection?.addRange(ReactEditor.toDOMRange(editor, range))
}

let outside: HTMLElement | undefined

function selectOutOfEditor(editor: Editor, backward = false): void {
  outside = document.body.appendChild(document.createElement('p'))
  outside.textContent = 'outside'
  const inside = ReactEditor.toDOMRange(editor, paragraph).startContainer
  const selection = document.getSelection()
  selection?.removeAllRanges()
  if (backward) {
    selection?.setBaseAndExtent(outside.firstChild!, 3, inside, 8)
  } else {
    selection?.setBaseAndExtent(inside, 8, outside.firstChild!, 3)
  }
  vi.spyOn(window, 'getSelection').mockReturnValue(selection)
}

function makeClipboard() {
  const store = new Map<string, string>()
  const data = {
    setData: (type: string, value: string) => store.set(type, value),
    getData: (type: string) => store.get(type) ?? '',
    get types() {
      return Array.from(store.keys())
    }
  }
  return { store, data }
}

function fragmentIds(store: Map<string, string>): string[] {
  const encoded = store.get('application/x-slate-fragment') ?? ''
  const fragment = JSON.parse(decodeURIComponent(window.atob(encoded))) as Array<{ id: string }>
  return fragment.map((node) => node.id)
}

function makeKeyEvent(key: string, mods: { ctrlKey?: boolean, shiftKey?: boolean } = {}) {
  return {
    key,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...mods,
    preventDefault: vi.fn()
  } as unknown as React.KeyboardEvent<HTMLDivElement>
}

afterEach(() => {
  outside?.remove()
  outside = undefined
  vi.restoreAllMocks()
  Reflect.deleteProperty(document, 'execCommand')
})

const title: Range = {
  anchor: { path: [0, 0], offset: 0 },
  focus: { path: [0, 0], offset: 4 }
}

const paragraph: Range = {
  anchor: { path: [1, 0], offset: 8 },
  focus: { path: [1, 0], offset: 17 }
}

describe('copy takes the DOM selection editor.selection has not caught up with', () => {
  test('copy with no editor.selection yet writes the DOM-selected text', () => {
    const editor = makeEditor()
    const { store, data } = makeClipboard()
    selectInDOM(editor, paragraph)

    fireEvent.copy(ReactEditor.toDOMNode(editor, editor), { clipboardData: data })

    expect(store.get('text/plain')).toBe('paragraph')
    expect(fragmentIds(store)).toEqual(['fc542b22-6046-49d8-8eae-56a8597599a3'])
  })

  test('copy over a stale collapsed editor.selection writes the DOM-selected text', () => {
    const editor = makeEditor()
    editor.selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 0 }
    }
    const { store, data } = makeClipboard()
    selectInDOM(editor, paragraph)

    fireEvent.copy(ReactEditor.toDOMNode(editor, editor), { clipboardData: data })

    expect(store.get('text/plain')).toBe('paragraph')
  })

  test('copy over a stale expanded editor.selection writes the DOM-selected text', () => {
    const editor = makeEditor()
    editor.selection = {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 4 }
    }
    const { store, data } = makeClipboard()
    selectInDOM(editor, paragraph)

    fireEvent.copy(ReactEditor.toDOMNode(editor, editor), { clipboardData: data })

    expect(store.get('text/plain')).toBe('paragraph')
  })

  test('copy of a DOM selection running out of the editor is left to the browser', () => {
    const editor = makeEditor()
    editor.selection = title
    const { store, data } = makeClipboard()
    selectOutOfEditor(editor)

    const notCancelled = fireEvent.copy(ReactEditor.toDOMNode(editor, editor), {
      clipboardData: data
    })

    expect(notCancelled).toBe(true)
    expect(store.size).toBe(0)
  })

  test('copy of a DOM selection dragged back into the editor is left to the browser', () => {
    const editor = makeEditor()
    editor.selection = title
    const { store, data } = makeClipboard()
    selectOutOfEditor(editor, true)

    const notCancelled = fireEvent.copy(ReactEditor.toDOMNode(editor, editor), {
      clipboardData: data
    })

    expect(notCancelled).toBe(true)
    expect(store.size).toBe(0)
  })

  test.each([
    ['running out of', false],
    ['dragged back into', true]
  ])('cut of a DOM selection %s the editor is cancelled and cuts nothing', (_name, backward) => {
    const editor = makeEditor()
    editor.selection = title
    const { store, data } = makeClipboard()
    selectOutOfEditor(editor, backward)

    const notCancelled = fireEvent.cut(ReactEditor.toDOMNode(editor, editor), {
      clipboardData: data
    })

    expect(notCancelled).toBe(false)
    expect(store.size).toBe(0)
    expect(editor.children[0]).toMatchObject({ children: [{ text: 'This is title' }] })
  })

  test.each([
    ['copy', fireEvent.copy],
    ['cut', fireEvent.cut]
  ])('%s in an input inside a void leaves the editor alone', (_name, fire) => {
    const editor = makeEditor(adjacentBlockContent)
    const before = { anchor: { path: [0, 0], offset: 0 }, focus: { path: [0, 0], offset: 6 } }
    editor.selection = before
    const block = ReactEditor.toDOMNode(editor, editor.children[1])
    const input = block.appendChild(document.createElement('input'))
    const selection = document.getSelection()
    selection?.removeAllRanges()
    selection?.collapse(block, block.childNodes.length - 1)
    vi.spyOn(window, 'getSelection').mockReturnValue(selection)
    const { store, data } = makeClipboard()

    fire(input, { clipboardData: data })

    expect(editor.selection).toEqual(before)
    expect(editor.children).toHaveLength(3)
    expect(store.size).toBe(0)
  })

  test('copy maps a DOM selection ending on the boundary of the block element itself', () => {
    const editor = makeEditor()
    const { store, data } = makeClipboard()
    const block = ReactEditor.toDOMNode(editor, editor.children[1])
    const range = document.createRange()
    range.setStart(ReactEditor.toDOMRange(editor, paragraph).startContainer, 8)
    range.setEnd(block, block.childNodes.length)
    const selection = document.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
    vi.spyOn(window, 'getSelection').mockReturnValue(selection)

    fireEvent.copy(ReactEditor.toDOMNode(editor, editor), { clipboardData: data })

    expect(store.get('text/plain')).toBe('paragraph')
  })

  test('copy with no DOM selection keeps editor.selection', () => {
    const editor = makeEditor()
    editor.selection = title
    const { store, data } = makeClipboard()
    const selection = document.getSelection()
    selection?.removeAllRanges()
    vi.spyOn(window, 'getSelection').mockReturnValue(selection)

    fireEvent.copy(ReactEditor.toDOMNode(editor, editor), { clipboardData: data })

    expect(store.get('text/plain')).toBe('This')
  })

  test('cut with no editor.selection yet writes and removes the DOM-selected text', () => {
    const editor = makeEditor()
    const { store, data } = makeClipboard()
    selectInDOM(editor, paragraph)

    fireEvent.cut(ReactEditor.toDOMNode(editor, editor), { clipboardData: data })

    expect(store.get('text/plain')).toBe('paragraph')
    expect(editor.children[1]).toMatchObject({ children: [{ text: 'This is ' }] })
  })

  test('copy in block selection keeps the selected blocks over the DOM selection', () => {
    const editor = makeEditor(adjacentBlockContent)
    const editable = ReactEditor.toDOMNode(editor, editor)
    const { store, data } = makeClipboard()

    fireEvent.mouseDown(editable, { clientX: 150, clientY: 50 })
    fireEvent.keyDown(editable, { key: 'ArrowUp', shiftKey: true })
    selectInDOM(editor, {
      anchor: { path: [0, 0], offset: 0 },
      focus: { path: [0, 0], offset: 6 }
    })

    fireEvent.copy(editable, { clipboardData: data })

    expect(fragmentIds(store)).toEqual(['non-text-block'])
  })
})

describe('block selection shortcuts ignore Caps Lock', () => {
  const blockSelection = { anchorIndex: 1, focusIndex: 1 }

  test('Ctrl+C with Caps Lock is left to the native copy', () => {
    const editor = makeEditor(adjacentBlockContent)
    const event = makeKeyEvent('C', { ctrlKey: true })

    handleBlockSelectionKeyDown(editor, event, blockSelection, vi.fn(), vi.fn())

    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  test('Ctrl+X with Caps Lock copies and removes the selected blocks', () => {
    const editor = makeEditor(adjacentBlockContent)
    const execCommand = vi.fn(() => true)
    Object.defineProperty(document, 'execCommand', { value: execCommand, configurable: true })
    const event = makeKeyEvent('X', { ctrlKey: true })

    handleBlockSelectionKeyDown(editor, event, blockSelection, vi.fn(), vi.fn())

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(editor.children.map((n) => (n as { id: string }).id))
      .toEqual(['text-before-block', 'text-after-block'])
  })

  test('Ctrl+Shift+X is swallowed and keeps the selected blocks', () => {
    const editor = makeEditor(adjacentBlockContent)
    const event = makeKeyEvent('X', { ctrlKey: true, shiftKey: true })

    handleBlockSelectionKeyDown(editor, event, blockSelection, vi.fn(), vi.fn())

    expect(event.preventDefault).toHaveBeenCalled()
    expect(editor.children).toHaveLength(3)
  })

  test('Ctrl+Shift+V is swallowed', () => {
    const editor = makeEditor(adjacentBlockContent)
    const event = makeKeyEvent('V', { ctrlKey: true, shiftKey: true })

    handleBlockSelectionKeyDown(editor, event, blockSelection, vi.fn(), vi.fn())

    expect(event.preventDefault).toHaveBeenCalled()
  })

  test.each([
    ['V without a modifier', 'v', {}],
    ['Ctrl+A', 'a', { ctrlKey: true }]
  ])('%s is swallowed', (_name, key, mods) => {
    const editor = makeEditor(adjacentBlockContent)
    const event = makeKeyEvent(key, mods)

    handleBlockSelectionKeyDown(editor, event, blockSelection, vi.fn(), vi.fn())

    expect(event.preventDefault).toHaveBeenCalled()
  })

  test('Ctrl+V with Caps Lock is left to the native paste', () => {
    const editor = makeEditor(adjacentBlockContent)
    const event = makeKeyEvent('V', { ctrlKey: true })

    handleBlockSelectionKeyDown(editor, event, blockSelection, vi.fn(), vi.fn())

    expect(event.preventDefault).not.toHaveBeenCalled()
  })
})
