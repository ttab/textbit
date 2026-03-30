import { Editor, Element, type Point, Transforms } from 'slate'
import type { AdjacentBlockState } from '../../../contexts/AdjacentBlockContext'
import {
  isAtAccessibleStart,
  isAtAccessibleEnd,
  resolveTargetIndex,
  enterBlockFromStart,
  enterBlockFromEnd,
} from './blockUtils'

/**
 * Handle an arrow key while an adjacent-block indicator is active.
 *
 * ### Invariant
 * The real Slate selection is always kept INSIDE the block the adjacent
 * indicator currently points to. This means `useSelected()` is true only
 * for that block.
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
  goingBackward: boolean
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
  // Virtual caret is just left of block; → enters it (or advances to 'after' for void).
  if (goingForward && direction === 'before') {
    event.preventDefault()
    if (isVoid) {
      // Void: advance indicator to 'after' (step 2 of 3).
      // Selection stays inside the void block (invariant already satisfied).
      setAdjacentBlock({ blockId: adjacentBlock.blockId, direction: 'after' })
    } else {
      // Non-void: enter block at its accessible start
      enterBlockFromStart(editor, targetPath, targetBlock as Element)
      setAdjacentBlock(null)
    }
    return
  }

  // ── Going right, indicator is 'after' → step past the block ───────────────
  // Virtual caret is just right of block; → moves past it.
  if (goingForward && direction === 'after') {
    event.preventDefault()
    const nextIndex = targetIndex + 1
    if (nextIndex < editor.children.length) {
      const nextBlock = editor.children[nextIndex]
      // Move selection into the next block first to maintain the invariant,
      // then set the indicator (so useSelected() stays true only for that block).
      Transforms.select(editor, Editor.start(editor, [nextIndex]))
      if (Element.isElement(nextBlock) && nextBlock.class !== 'text') {
        setAdjacentBlock({ blockId: nextBlock.id, direction: 'before' })
      } else {
        setAdjacentBlock(null)
      }
    } else {
      setAdjacentBlock(null)
    }
    return
  }

  // ── Going left, indicator is 'after' ──────────────────────────────────────
  // Virtual caret is just right of block; ← enters it (or retreats to 'before' for void).
  if (goingBackward && direction === 'after') {
    event.preventDefault()
    if (isVoid) {
      // Void: retreat indicator to 'before' (step 2 of 3).
      // Selection stays inside the void block (invariant already satisfied).
      setAdjacentBlock({ blockId: adjacentBlock.blockId, direction: 'before' })
    } else {
      // Non-void: enter block at its accessible end
      enterBlockFromEnd(editor, targetPath, targetBlock as Element)
      setAdjacentBlock(null)
    }
    return
  }

  // ── Going left, indicator is 'before' → step past the block ───────────────
  // Virtual caret is just left of block; ← moves past it.
  if (goingBackward && direction === 'before') {
    event.preventDefault()
    const prevIndex = targetIndex - 1
    if (prevIndex >= 0) {
      const prevBlock = editor.children[prevIndex]
      // Move selection into the previous block first to maintain the invariant.
      Transforms.select(editor, Editor.end(editor, [prevIndex]))
      if (Element.isElement(prevBlock) && prevBlock.class !== 'text') {
        setAdjacentBlock({ blockId: prevBlock.id, direction: 'after' })
      } else {
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
 * Handle an Up or Down arrow key while an adjacent-block indicator is active.
 *
 * Navigates to the neighbouring top-level block, preserving the indicator
 * direction when that neighbour is also a non-text block, or moving the
 * Slate selection into a text block as appropriate.
 */
export function handleVerticalArrowWithAdjacentBlock(
  editor: Editor,
  event: React.KeyboardEvent<HTMLDivElement>,
  adjacentBlock: AdjacentBlockState,
  setAdjacentBlock: (state: AdjacentBlockState | null) => void
): void {
  const targetIndex = resolveTargetIndex(editor, adjacentBlock)
  if (targetIndex === -1) {
    event.preventDefault()
    return
  }

  const goingUp = event.key === 'ArrowUp'
  const neighborIndex = goingUp ? targetIndex - 1 : targetIndex + 1

  if (neighborIndex < 0 || neighborIndex >= editor.children.length) {
    // Already at the document edge in this direction — no-op
    event.preventDefault()
    return
  }

  const neighborBlock = editor.children[neighborIndex]

  if (Element.isElement(neighborBlock) && neighborBlock.class !== 'text') {
    // Navigate to another non-text block: preserve the current indicator direction
    // ('before' stays left, 'after' stays right regardless of movement direction).
    event.preventDefault()
    Transforms.select(editor, adjacentBlock.direction === 'after'
      ? Editor.end(editor, [neighborIndex])
      : Editor.start(editor, [neighborIndex])
    )
    setAdjacentBlock({ blockId: neighborBlock.id, direction: adjacentBlock.direction })
    return
  }

  // Neighbor is a text block.
  //
  // Cases that need manual navigation (preventDefault + explicit placement):
  //   • 'after'  + Up   — Slate selection is at block bottom; Up stays inside.
  //   • 'before' + Down — Slate selection is at block top; Down stays inside.
  //   • void target     — Slate selection is at a void point; Up/Down loses the
  //                       caret entirely (e.g. image blocks).
  //
  // When handling manually: going up → land at end, going down → land at start.
  // For all remaining cases ('before'+Up, 'after'+Down, non-void) let Slate navigate.
  const targetBlock = editor.children[targetIndex]
  const isVoidTarget = Element.isElement(targetBlock) && editor.isVoid(targetBlock)
  const handleManually =
    (adjacentBlock.direction === 'after' && goingUp) ||
    (adjacentBlock.direction === 'before' && !goingUp) ||
    isVoidTarget

  if (handleManually) {
    event.preventDefault()
    Transforms.select(editor, goingUp
      ? Editor.end(editor, [neighborIndex])
      : Editor.start(editor, [neighborIndex])
    )
    setAdjacentBlock(null)
    return
  }

  // 'before'+Up and 'after'+Down with non-void target: let Slate navigate.
  setAdjacentBlock(null)
}

/**
 * Handle an arrow key when there is no active adjacent-block indicator.
 *
 * Intercepts at the boundary of a non-text block (either leaving one or
 * approaching one from a text block) and sets the indicator instead of
 * letting Slate perform its default caret movement.
 *
 * When approaching a non-text block from a text block, the selection is moved
 * into the non-text block to satisfy the invariant: useSelected() should be
 * true only for the block the indicator points to.
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
    // Exiting a non-text block from its right (accessible) edge.
    // Selection is already inside this block — no move needed.
    if (Element.isElement(currentBlock) && currentBlock.class !== 'text'
      && isAtAccessibleEnd(editor, anchor, topLevelIndex)) {
      event.preventDefault()
      setAdjacentBlock({ blockId: currentBlock.id, direction: 'after' })
      return true
    }

    // Entering a non-text block from a preceding text block.
    // Move the selection into the non-text block to satisfy the invariant.
    if (Editor.isEnd(editor, anchor, topLevelPath)) {
      const nextIndex = topLevelIndex + 1
      if (nextIndex < editor.children.length) {
        const nextBlock = editor.children[nextIndex]
        if (Element.isElement(nextBlock) && nextBlock.class !== 'text') {
          event.preventDefault()
          // Use enterBlockFromStart (skips void children) so the selection lands
          // in the first editable child, not inside a void element such as an image.
          enterBlockFromStart(editor, [nextIndex], nextBlock)
          setAdjacentBlock({ blockId: nextBlock.id, direction: 'before' })
          return true
        }
      }
    }
  }

  if (goingBackward) {
    // Exiting a non-text block from its left (accessible) edge.
    // Selection is already inside this block — no move needed.
    if (Element.isElement(currentBlock) && currentBlock.class !== 'text'
      && isAtAccessibleStart(editor, anchor, topLevelIndex)) {
      event.preventDefault()
      setAdjacentBlock({ blockId: currentBlock.id, direction: 'before' })
      return true
    }

    // Entering a non-text block from a following text block.
    // Move the selection into the non-text block to satisfy the invariant.
    if (Editor.isStart(editor, anchor, topLevelPath)) {
      const prevIndex = topLevelIndex - 1
      if (prevIndex >= 0) {
        const prevBlock = editor.children[prevIndex]
        if (Element.isElement(prevBlock) && prevBlock.class !== 'text') {
          event.preventDefault()
          Transforms.select(editor, Editor.end(editor, [prevIndex]))
          setAdjacentBlock({ blockId: prevBlock.id, direction: 'after' })
          return true
        }
      }
    }
  }

  return false
}
