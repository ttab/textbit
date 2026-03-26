import { Editor, Element, type Point, Transforms } from 'slate'
import type { AdjacentBlockState } from '../../../contexts/AdjacentBlockContext'
import {
  isAtAccessibleStart,
  isAtAccessibleEnd,
  resolveTargetIndex,
  enterBlockFromStart,
  enterBlockFromEnd,
} from './blockUtils'
import { parkCaretMovingForward, parkCaretMovingBackward } from './caretParking'

/**
 * Handle an arrow key while an adjacent-block indicator is active.
 *
 * All code paths end with a `return`, so the caller should always return
 * immediately after invoking this function.
 *
 * ### Traversal model
 *
 * For a **non-void** non-text block the adjacent indicator passes through two
 * states as the user presses → repeatedly:
 *   1. `'before'` — virtual caret is just left of the block
 *   2. (caret inside the block — indicator cleared)
 *   3. `'after'`  — virtual caret is just right of the block
 *
 * For a **void** non-text block the block is not enterable, so there are three
 * indicator states before the caret fully passes it:
 *   1. `'before'`
 *   2. `'after'`
 *   3. (caret moves past — indicator cleared)
 *
 * The same steps apply in reverse when pressing ←.
 */
export function handleArrowWithAdjacentBlock(
  editor: Editor,
  event: React.KeyboardEvent<HTMLDivElement>,
  adjacentBlock: AdjacentBlockState,
  setAdjacentBlock: (state: AdjacentBlockState | null) => void,
  goingForward: boolean,
  goingBackward: boolean,
  topLevelIndex: number
): void {
  const targetIndex = resolveTargetIndex(editor, adjacentBlock)
  if (targetIndex === -1) {
    setAdjacentBlock(null)
    return
  }

  const targetPath = [targetIndex]
  const targetBlock = editor.children[targetIndex]
  const isVoid = Element.isElement(targetBlock) && editor.isVoid(targetBlock)
  const { direction } = adjacentBlock

  // ── Going right, indicator is 'before' ────────────────────────────────────
  // The virtual caret is just left of the block; → should move inside it (or,
  // for void blocks, advance the indicator to 'after' since they are not enterable).
  if (goingForward && direction === 'before') {
    event.preventDefault()
    if (isVoid) {
      // Void: advance to 'after' (step 2 of 3)
      setAdjacentBlock({ blockId: adjacentBlock.blockId, direction: 'after' })
    } else {
      // Non-void: enter the block at its accessible start
      enterBlockFromStart(editor, targetPath, targetBlock as Element)
      setAdjacentBlock(null)
    }
    return
  }

  // ── Going right, indicator is 'after', caret at or inside target ─────────
  // The virtual caret is just right of the block; → should step past it.
  // `topLevelIndex <= targetIndex` covers both "caret still inside the exited block"
  // (=== targetIndex, requires parking) and "caret already parked before target" (< targetIndex).
  if (goingForward && direction === 'after' && topLevelIndex <= targetIndex) {
    event.preventDefault()
    const nextIndex = targetIndex + 1
    if (nextIndex < editor.children.length) {
      const nextBlock = editor.children[nextIndex]
      if (Element.isElement(nextBlock) && nextBlock.class !== 'text') {
        // Next sibling is also a non-text block: advance the indicator to 'before' it.
        // If the caret is still inside the exited block, park it so it stops rendering as 'active'.
        if (topLevelIndex === targetIndex) {
          parkCaretMovingForward(editor, targetIndex, nextIndex)
        }
        setAdjacentBlock({ blockId: nextBlock.id, direction: 'before' })
      } else {
        // Next sibling is a text block: land at its start and clear the indicator
        Transforms.select(editor, Editor.start(editor, [nextIndex]))
        setAdjacentBlock(null)
      }
    } else {
      setAdjacentBlock(null)
    }
    return
  }

  // ── Going left, indicator is 'after' ──────────────────────────────────────
  // The virtual caret is just right of the block; ← should move inside it (or
  // advance to 'before' for void blocks).
  if (goingBackward && direction === 'after') {
    event.preventDefault()
    if (isVoid) {
      // Void: retreat to 'before' (step 2 of 3)
      setAdjacentBlock({ blockId: adjacentBlock.blockId, direction: 'before' })
    } else {
      // Non-void: enter the block at its accessible end
      enterBlockFromEnd(editor, targetPath, targetBlock as Element)
      setAdjacentBlock(null)
    }
    return
  }

  // ── Going left, indicator is 'before', caret at or inside target ─────────
  // The virtual caret is just left of the block; ← should step past it.
  // `topLevelIndex >= targetIndex` covers "caret inside exited block" (===) and
  // "caret parked after target" (>), both of which need to step past.
  if (goingBackward && direction === 'before' && topLevelIndex >= targetIndex) {
    event.preventDefault()
    const prevIndex = targetIndex - 1
    if (prevIndex >= 0) {
      const prevBlock = editor.children[prevIndex]
      if (Element.isElement(prevBlock) && prevBlock.class !== 'text') {
        // Previous sibling is also a non-text block: retreat the indicator to 'after' it.
        // If the caret is still inside the exited block, park it to avoid a stale focus ring.
        if (topLevelIndex === targetIndex) {
          parkCaretMovingBackward(editor, targetIndex, prevIndex)
        }
        setAdjacentBlock({ blockId: prevBlock.id, direction: 'after' })
      } else {
        // Previous sibling is a text block: land at its end and clear the indicator
        Transforms.select(editor, Editor.end(editor, [prevIndex]))
        setAdjacentBlock(null)
      }
    } else {
      setAdjacentBlock(null)
    }
    return
  }

  // ── Cursor parked past target (going right) ───────────────────────────────
  // After a block-to-block transition the caret may be parked beyond targetIndex.
  // Advance the indicator one step rather than jumping straight to the parked position.
  if (goingForward && direction === 'after' && topLevelIndex > targetIndex) {
    event.preventDefault()
    const nextIndex = targetIndex + 1
    if (nextIndex < editor.children.length) {
      const nextBlock = editor.children[nextIndex]
      if (Element.isElement(nextBlock) && nextBlock.class !== 'text') {
        setAdjacentBlock({ blockId: nextBlock.id, direction: 'before' })
      } else {
        Transforms.select(editor, Editor.start(editor, [nextIndex]))
        setAdjacentBlock(null)
      }
    } else {
      setAdjacentBlock(null)
    }
    return
  }

  // ── Cursor parked before target (going left) ──────────────────────────────
  if (goingBackward && direction === 'before' && topLevelIndex < targetIndex) {
    event.preventDefault()
    const prevIndex = targetIndex - 1
    if (prevIndex >= 0) {
      const prevBlock = editor.children[prevIndex]
      if (Element.isElement(prevBlock) && prevBlock.class !== 'text') {
        setAdjacentBlock({ blockId: prevBlock.id, direction: 'after' })
      } else {
        Transforms.select(editor, Editor.end(editor, [prevIndex]))
        setAdjacentBlock(null)
      }
    } else {
      setAdjacentBlock(null)
    }
    return
  }

  // Going in the opposite direction — clear state, let Slate handle the move
  setAdjacentBlock(null)
}

/**
 * Handle an arrow key when there is no active adjacent-block indicator.
 *
 * Intercepts at the boundary of a non-text block (either leaving one or
 * approaching one from a text block) and sets the indicator instead of
 * letting Slate perform its default caret movement.
 *
 * Returns `true` if the event was handled (caller should return immediately).
 */
export function handleArrowNoAdjacentBlock(
  editor: Editor,
  event: React.KeyboardEvent<HTMLDivElement>,
  setAdjacentBlock: (state: AdjacentBlockState | null) => void,
  goingForward: boolean,
  goingBackward: boolean,
  topLevelIndex: number,
  anchor: Point
): boolean {
  const topLevelPath = [topLevelIndex]
  const currentBlock = editor.children[topLevelIndex]

  if (goingForward) {
    // Exiting a non-text block from its right (accessible) edge
    if (Element.isElement(currentBlock) && currentBlock.class !== 'text'
      && isAtAccessibleEnd(editor, anchor, topLevelIndex)) {
      event.preventDefault()
      setAdjacentBlock({ blockId: currentBlock.id, direction: 'after' })
      return true
    }

    // Entering a non-text block from a preceding text block
    if (Editor.isEnd(editor, anchor, topLevelPath)) {
      const nextIndex = topLevelIndex + 1
      if (nextIndex < editor.children.length) {
        const nextBlock = editor.children[nextIndex]
        if (Element.isElement(nextBlock) && nextBlock.class !== 'text') {
          event.preventDefault()
          setAdjacentBlock({ blockId: nextBlock.id, direction: 'before' })
          return true
        }
      }
    }
  }

  if (goingBackward) {
    // Exiting a non-text block from its left (accessible) edge
    if (Element.isElement(currentBlock) && currentBlock.class !== 'text'
      && isAtAccessibleStart(editor, anchor, topLevelIndex)) {
      event.preventDefault()
      setAdjacentBlock({ blockId: currentBlock.id, direction: 'before' })
      return true
    }

    // Entering a non-text block from a following text block
    if (Editor.isStart(editor, anchor, topLevelPath)) {
      const prevIndex = topLevelIndex - 1
      if (prevIndex >= 0) {
        const prevBlock = editor.children[prevIndex]
        if (Element.isElement(prevBlock) && prevBlock.class !== 'text') {
          event.preventDefault()
          setAdjacentBlock({ blockId: prevBlock.id, direction: 'after' })
          return true
        }
      }
    }
  }

  return false
}
