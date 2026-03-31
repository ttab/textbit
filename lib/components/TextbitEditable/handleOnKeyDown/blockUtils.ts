import { Editor, Element, type Point, Transforms } from 'slate'
import type { AdjacentBlockState } from '../../../contexts/AdjacentBlockContext'

// ---------------------------------------------------------------------------
// Child-index helpers
// ---------------------------------------------------------------------------

/** First non-void child index, or -1 if all children are void */
export function firstEditableChildIdx(editor: Editor, block: Element): number {
  return block.children.findIndex(
    (child) => !Element.isElement(child) || !editor.isVoid(child)
  )
}

/** Last non-void child index, or -1 if all children are void */
export function lastEditableChildIdx(editor: Editor, block: Element): number {
  return block.children.reduce<number>(
    (found, child, i) => (!Element.isElement(child) || !editor.isVoid(child)) ? i : found,
    -1
  )
}

// ---------------------------------------------------------------------------
// Boundary-check helpers
// ---------------------------------------------------------------------------

/** True when the caret is at the start of the first non-void child of the block */
export function isAtAccessibleStart(editor: Editor, anchor: Point, blockIndex: number): boolean {
  const block = editor.children[blockIndex]
  if (!Element.isElement(block)) return false
  const idx = firstEditableChildIdx(editor, block)
  if (idx < 0) return Editor.isStart(editor, anchor, [blockIndex])
  return Editor.isStart(editor, anchor, [blockIndex, idx])
}

/** True when the caret is at the end of the last non-void child of the block */
export function isAtAccessibleEnd(editor: Editor, anchor: Point, blockIndex: number): boolean {
  const block = editor.children[blockIndex]
  if (!Element.isElement(block)) return false
  const idx = lastEditableChildIdx(editor, block)
  if (idx < 0) return Editor.isEnd(editor, anchor, [blockIndex])
  return Editor.isEnd(editor, anchor, [blockIndex, idx])
}

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

/** Top-level index of the block referenced by adjacentBlock, or -1 if not found */
export function resolveTargetIndex(editor: Editor, adjacentBlock: AdjacentBlockState): number {
  return editor.children.findIndex(
    (child) => Element.isElement(child) && child.id === adjacentBlock.blockId
  )
}

/**
 * Select the start of `index` (after a node removal that may have shifted indices).
 * Falls back to the end of the last block when `index` is out of range.
 */
export function selectStartAt(editor: Editor, index: number): void {
  if (index < editor.children.length) {
    Transforms.select(editor, Editor.start(editor, [index]))
  } else if (editor.children.length > 0) {
    Transforms.select(editor, Editor.end(editor, [editor.children.length - 1]))
  }
}

// ---------------------------------------------------------------------------
// Block-entry helpers
// ---------------------------------------------------------------------------

/**
 * Enter a non-text block from its leading edge (going right).
 * Skips any leading void children so the caret lands on the first editable position.
 */
export function enterBlockFromStart(editor: Editor, targetPath: number[], targetBlock: Element): void {
  let enterPath: number[] = targetPath
  const firstNonVoidIdx = firstEditableChildIdx(editor, targetBlock)
  if (firstNonVoidIdx >= 0) {
    enterPath = [...targetPath, firstNonVoidIdx]
  }
  Transforms.select(editor, Editor.start(editor, enterPath))
}

/**
 * Enter a non-text block from its trailing edge (going left).
 * Skips any trailing void children so the caret lands on the last editable position.
 */
export function enterBlockFromEnd(editor: Editor, targetPath: number[], targetBlock: Element): void {
  let enterPath: number[] = targetPath
  const lastNonVoidIdx = lastEditableChildIdx(editor, targetBlock)
  if (lastNonVoidIdx >= 0) {
    enterPath = [...targetPath, lastNonVoidIdx]
  }
  Transforms.select(editor, Editor.end(editor, enterPath))
}
