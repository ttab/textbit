import { Editor, Element, Transforms } from 'slate'

/**
 * Park the cursor at a neutral text block after stepping past `targetIndex` going right.
 *
 * When the cursor is still inside the block whose adjacent indicator has just moved on,
 * `useSelected()` keeps that block rendering as 'active' even though the virtual caret
 * is already elsewhere. Moving the real Slate selection to a text block fixes this.
 *
 * Search order: backward from `targetIndex - 1`, then forward from `nextIndex + 1`.
 */
export function parkCursorMovingForward(editor: Editor, targetIndex: number, nextIndex: number): void {
  // Prefer a text block before the one we are leaving
  let parkIdx = targetIndex - 1
  while (parkIdx >= 0 && Element.isElement(editor.children[parkIdx]) && editor.children[parkIdx].class !== 'text') {
    parkIdx--
  }
  if (parkIdx >= 0) {
    Transforms.select(editor, Editor.end(editor, [parkIdx]))
    return
  }
  // Fallback: text block after the block we are entering
  parkIdx = nextIndex + 1
  while (parkIdx < editor.children.length && Element.isElement(editor.children[parkIdx]) && editor.children[parkIdx].class !== 'text') {
    parkIdx++
  }
  if (parkIdx < editor.children.length) {
    Transforms.select(editor, Editor.start(editor, [parkIdx]))
  }
}

/**
 * Park the cursor at a neutral text block after stepping past `targetIndex` going left.
 *
 * Search order: forward from `targetIndex + 1`, then backward from `prevIndex - 1`.
 */
export function parkCursorMovingBackward(editor: Editor, targetIndex: number, prevIndex: number): void {
  // Prefer a text block after the one we are leaving
  let parkIdx = targetIndex + 1
  while (parkIdx < editor.children.length && Element.isElement(editor.children[parkIdx]) && editor.children[parkIdx].class !== 'text') {
    parkIdx++
  }
  if (parkIdx < editor.children.length) {
    Transforms.select(editor, Editor.start(editor, [parkIdx]))
    return
  }
  // Fallback: text block before the block we are entering
  parkIdx = prevIndex - 1
  while (parkIdx >= 0 && Element.isElement(editor.children[parkIdx]) && editor.children[parkIdx].class !== 'text') {
    parkIdx--
  }
  if (parkIdx >= 0) {
    Transforms.select(editor, Editor.end(editor, [parkIdx]))
  }
}
