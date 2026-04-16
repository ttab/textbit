import { Editor, Element, Transforms, type Descendant } from 'slate'
import type { AdjacentBlockState } from '../contexts/AdjacentBlockContext'
import type { BlockSelectionState } from '../contexts/BlockSelectionContext'

/**
 * Result describing how the paste should proceed after block-aware
 * preparation has run.
 *
 * - 'handled'     : the paste was fully inserted (caller must preventDefault
 *                   to stop slate-react's default paste handler).
 * - 'prepared'    : an empty placeholder text block has been inserted and
 *                   selected at the target path. The caller should NOT
 *                   preventDefault; slate-react's default paste handler will
 *                   fill the placeholder via editor.insertData.
 * - 'unhandled'   : neither adjacentBlock nor blockSelection was active, or
 *                   the target could not be resolved. Normal paste behaviour.
 */
export type BlockAwarePasteResult = 'handled' | 'prepared' | 'unhandled'

/**
 * Prepare and/or execute a paste when the block caret (adjacentBlock) or
 * block-level selection (blockSelection) is active.
 *
 * The real Slate selection while these states are active is kept INSIDE
 * one of the blocks so that `useSelected()` stays correct. A naïve paste
 * would therefore insert the clipboard content inside that block, which is
 * never what the user wants — they expect the pasted content to land
 * adjacent to (or replacing) the affected block(s).
 *
 * Strategy:
 *   1. Compute the target path on the editor's top level.
 *   2. If a Slate fragment is available on the clipboard, decode it and
 *      insert the nodes directly at that path. Types and roles are
 *      preserved exactly (we bypass editor.insertFragment which would
 *      otherwise rewrite roles when merging into an empty paragraph).
 *   3. Otherwise, insert an empty text placeholder at the target path,
 *      select it, and let Slate's existing paste flow (including
 *      withInsertHtml + consumer plugins) populate it from HTML / text.
 *
 * The caller is responsible for clearing the adjacentBlock / blockSelection
 * React state after this returns.
 */
export function prepareBlockAwarePaste(
  editor: Editor,
  data: DataTransfer,
  adjacentBlock: AdjacentBlockState | null,
  blockSelection: BlockSelectionState | null
): BlockAwarePasteResult {
  if (!adjacentBlock && !blockSelection) {
    return 'unhandled'
  }

  const target = resolveTargetIndex(editor, adjacentBlock, blockSelection)
  if (target === null) {
    return 'unhandled'
  }

  const { targetIndex, removeRange } = target
  const slateFragment = decodeSlateFragment(data)

  if (slateFragment && slateFragment.length > 0) {
    // Direct insertion — preserves types/roles, no merge behaviour
    Editor.withoutNormalizing(editor, () => {
      if (removeRange) {
        for (let i = removeRange.hi; i >= removeRange.lo; i--) {
          Transforms.removeNodes(editor, { at: [i] })
        }
      }
      Transforms.insertNodes(editor, slateFragment, { at: [targetIndex] })
    })

    // Place caret at the end of the last inserted block (user request).
    // If the last inserted block has no accessible text edge (pure void),
    // selection is left wherever Slate put it.
    const lastPath = [targetIndex + slateFragment.length - 1]
    try {
      Transforms.select(editor, Editor.end(editor, lastPath))
    } catch {
      // Non-text / void: best-effort; leave selection as is.
    }

    return 'handled'
  }

  // No Slate fragment on clipboard — prepare a placeholder and let
  // slate-react's default paste populate it via editor.insertData.
  Editor.withoutNormalizing(editor, () => {
    if (removeRange) {
      for (let i = removeRange.hi; i >= removeRange.lo; i--) {
        Transforms.removeNodes(editor, { at: [i] })
      }
    }
    const placeholder: Descendant = {
      id: crypto.randomUUID(),
      type: 'core/text',
      class: 'text',
      properties: {},
      children: [{ text: '' }]
    }
    Transforms.insertNodes(editor, placeholder, { at: [targetIndex], select: true })
  })

  return 'prepared'
}

/**
 * Resolve the top-level path index where new content should be inserted,
 * plus an optional range of existing blocks to remove.
 */
function resolveTargetIndex(
  editor: Editor,
  adjacentBlock: AdjacentBlockState | null,
  blockSelection: BlockSelectionState | null
): { targetIndex: number; removeRange: { lo: number; hi: number } | null } | null {
  if (blockSelection) {
    const lo = Math.min(blockSelection.anchorIndex, blockSelection.focusIndex)
    const hi = Math.max(blockSelection.anchorIndex, blockSelection.focusIndex)
    if (lo < 0 || hi >= editor.children.length) return null
    return { targetIndex: lo, removeRange: { lo, hi } }
  }

  if (adjacentBlock) {
    const blockIndex = editor.children.findIndex(
      (c) => Element.isElement(c) && c.id === adjacentBlock.blockId
    )
    if (blockIndex === -1) return null
    const targetIndex = adjacentBlock.direction === 'before' ? blockIndex : blockIndex + 1
    return { targetIndex, removeRange: null }
  }

  return null
}

/**
 * Decode the `application/x-slate-fragment` clipboard payload. Slate writes
 * this as `window.btoa(encodeURIComponent(JSON.stringify(nodes)))`.
 */
function decodeSlateFragment(data: DataTransfer): Descendant[] | null {
  if (!data.types.includes('application/x-slate-fragment')) {
    return null
  }

  const encoded = data.getData('application/x-slate-fragment')
  if (!encoded) return null

  try {
    const decoded = decodeURIComponent(window.atob(encoded))
    const parsed = JSON.parse(decoded)
    return Array.isArray(parsed) ? (parsed as Descendant[]) : null
  } catch {
    return null
  }
}
