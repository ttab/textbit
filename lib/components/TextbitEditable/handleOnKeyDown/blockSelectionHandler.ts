import { Editor, Element, Transforms } from 'slate'
import type { AdjacentBlockState } from '../../../contexts/AdjacentBlockContext'
import type { BlockSelectionState } from '../../../contexts/BlockSelectionContext'
import { resolveTargetIndex, enterBlockFromStart, enterBlockFromEnd } from './blockUtils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Set the real Slate selection to span all blocks in the block-selection range.
 * This gives us native browser text highlighting and native clipboard copy.
 */
export function syncSlateSelection(editor: Editor, bs: BlockSelectionState): void {
  const lo = Math.min(bs.anchorIndex, bs.focusIndex)
  const hi = Math.max(bs.anchorIndex, bs.focusIndex)
  Transforms.select(editor, {
    anchor: Editor.start(editor, [lo]),
    focus: Editor.end(editor, [hi])
  })
}

/**
 * Remove all blocks in the selection range, then place the cursor at
 * the appropriate position in the remaining document.
 */
function deleteSelectedBlocks(
  editor: Editor,
  blockSelection: BlockSelectionState,
  setBlockSelection: (state: BlockSelectionState | null) => void
): void {
  const lo = Math.min(blockSelection.anchorIndex, blockSelection.focusIndex)
  const hi = Math.max(blockSelection.anchorIndex, blockSelection.focusIndex)

  Editor.withoutNormalizing(editor, () => {
    for (let i = hi; i >= lo; i--) {
      Transforms.removeNodes(editor, { at: [i] })
    }
  })

  setBlockSelection(null)

  // Place cursor after deletion (Slate normalizer ensures ≥1 child)
  if (lo < editor.children.length) {
    Transforms.select(editor, Editor.start(editor, [lo]))
  } else if (editor.children.length > 0) {
    Transforms.select(editor, Editor.end(editor, [editor.children.length - 1]))
  }
}

// ---------------------------------------------------------------------------
// Entry from adjacent caret
// ---------------------------------------------------------------------------

/**
 * Called when `adjacentBlock` is active, `event.shiftKey` is true,
 * and key is ArrowUp/Down/Left/Right.
 *
 * Left behaves like Up, Right behaves like Down.
 * Returns the initial BlockSelectionState, or null if out of bounds.
 */
export function enterBlockSelectionFromAdjacentCaret(
  editor: Editor,
  event: React.KeyboardEvent<HTMLDivElement>,
  adjacentBlock: AdjacentBlockState
): BlockSelectionState | null {
  const targetIndex = resolveTargetIndex(editor, adjacentBlock)
  if (targetIndex === -1) return null

  const goingForward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
  const { direction } = adjacentBlock

  // Entry rules:
  // before + Up/Left    → select block above (targetIndex - 1)
  // before + Down/Right → select current block (targetIndex)
  // after  + Up/Left    → select current block (targetIndex)
  // after  + Down/Right → select block below (targetIndex + 1)
  let selectIndex: number

  if (direction === 'before' && !goingForward) {
    selectIndex = targetIndex - 1
  } else if (direction === 'before' && goingForward) {
    selectIndex = targetIndex
  } else if (direction === 'after' && !goingForward) {
    selectIndex = targetIndex
  } else {
    // direction === 'after' && goingForward
    selectIndex = targetIndex + 1
  }

  // Bounds check
  if (selectIndex < 0 || selectIndex >= editor.children.length) {
    return null
  }

  const state = { anchorIndex: selectIndex, focusIndex: selectIndex }
  syncSlateSelection(editor, state)
  return state
}

// ---------------------------------------------------------------------------
// Key handling while block selection is active
// ---------------------------------------------------------------------------

/**
 * Handles all key events while block selection is active.
 *
 * - Shift+Arrow: extend selection
 * - Unshifted arrow: collapse selection and exit
 * - Delete/Backspace: remove selected blocks
 * - Cmd/Ctrl+C: pass through for native copy
 * - Cmd/Ctrl+X: copy then delete blocks
 * - All other keys: consumed (no-op)
 */
export function handleBlockSelectionKeyDown(
  editor: Editor,
  event: React.KeyboardEvent<HTMLDivElement>,
  blockSelection: BlockSelectionState,
  setBlockSelection: (state: BlockSelectionState | null) => void,
  setAdjacentBlock: (state: AdjacentBlockState | null) => void
): void {
  const key = event.key
  const isArrow = key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight'
  const hasMod = event.metaKey || event.ctrlKey

  // ── Shift+Arrow — extend selection ────────────────────────────────────
  if (event.shiftKey && isArrow) {
    event.preventDefault()
    const goingForward = key === 'ArrowDown' || key === 'ArrowRight'
    const lastIndex = editor.children.length - 1
    const newFocus = goingForward
      ? Math.min(blockSelection.focusIndex + 1, lastIndex)
      : Math.max(blockSelection.focusIndex - 1, 0)
    const newState = { ...blockSelection, focusIndex: newFocus }
    setBlockSelection(newState)
    syncSlateSelection(editor, newState)
    return
  }

  // ── Unshifted arrow — collapse selection ──────────────────────────────
  if (isArrow && !event.shiftKey) {
    event.preventDefault()

    const lo = Math.min(blockSelection.anchorIndex, blockSelection.focusIndex)
    const hi = Math.max(blockSelection.anchorIndex, blockSelection.focusIndex)

    // Up/Left → start of first selected block
    // Down/Right → end of last selected block
    const goingUp = key === 'ArrowUp' || key === 'ArrowLeft'
    const targetIndex = goingUp ? lo : hi
    const targetBlock = editor.children[targetIndex]

    setBlockSelection(null)

    if (Element.isElement(targetBlock) && targetBlock.class !== 'text') {
      // Non-text block: enter adjacent caret mode
      if (goingUp) {
        enterBlockFromStart(editor, [targetIndex], targetBlock)
        setAdjacentBlock({ blockId: targetBlock.id, direction: 'before' })
      } else {
        enterBlockFromEnd(editor, [targetIndex], targetBlock)
        setAdjacentBlock({ blockId: targetBlock.id, direction: 'after' })
      }
    } else {
      // Text block: place normal cursor
      if (goingUp) {
        Transforms.select(editor, Editor.start(editor, [targetIndex]))
      } else {
        Transforms.select(editor, Editor.end(editor, [targetIndex]))
      }
    }
    return
  }

  // ── Delete / Backspace — remove selected blocks ───────────────────────
  if (key === 'Backspace' || key === 'Delete') {
    event.preventDefault()
    deleteSelectedBlocks(editor, blockSelection, setBlockSelection)
    return
  }

  // ── Cmd/Ctrl+C — let native copy pass through ────────────────────────
  // The Slate selection spans the selected blocks, so the browser/Slate
  // copy handler writes the correct fragment to the clipboard.
  if (hasMod && key === 'c') {
    return
  }

  // ── Cmd/Ctrl+X — cut: copy then delete ────────────────────────────────
  if (hasMod && key === 'x') {
    // Trigger a synchronous copy via the deprecated-but-universal
    // execCommand; Slate's onCopy handler serialises the fragment.
    document.execCommand('copy')
    event.preventDefault()
    deleteSelectedBlocks(editor, blockSelection, setBlockSelection)
    return
  }

  // ── All other keys: consume, no-op ────────────────────────────────────
  event.preventDefault()
}
