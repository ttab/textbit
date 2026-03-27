import { Editor, Element, Node, Range, Transforms } from 'slate'
import type { AdjacentBlockState } from '../../../contexts/AdjacentBlockContext'
import { resolveTargetIndex, selectStartAt } from './blockUtils'

/**
 * Handle non-arrow keys while an adjacent-block indicator is active.
 *
 * Returns `true` if the event was fully handled (caller should skip the
 * action-hotkey loop). Returns `false` to fall through to the loop.
 */
export function handleNonArrowWithAdjacentBlock(
  editor: Editor,
  event: React.KeyboardEvent<HTMLDivElement>,
  adjacentBlock: AdjacentBlockState,
  setAdjacentBlock: (state: AdjacentBlockState | null) => void
): boolean {
  // Enter: insert a new default text element next to the target block
  if (event.key === 'Enter') {
    const targetIndex = resolveTargetIndex(editor, adjacentBlock)
    if (targetIndex !== -1) {
      event.preventDefault()
      const insertIndex = adjacentBlock.direction === 'before' ? targetIndex : targetIndex + 1
      const newNode = {
        id: crypto.randomUUID(),
        class: 'text' as const,
        type: 'core/text',
        children: [{ text: '' }]
      }
      Transforms.insertNodes(editor, newNode, { at: [insertIndex] })
      Transforms.select(editor, Editor.start(editor, [insertIndex]))
      setAdjacentBlock(null)
      return true
    }
  }

  const { selection } = editor
  if (selection && Range.isCollapsed(selection)) {
    // Backspace with 'after' indicator: delete the target block (it is behind the caret)
    if (event.key === 'Backspace' && adjacentBlock.direction === 'after') {
      const targetIndex = resolveTargetIndex(editor, adjacentBlock)
      if (targetIndex !== -1) {
        event.preventDefault()
        Transforms.removeNodes(editor, { at: [targetIndex] })
        const prevIndex = targetIndex - 1
        if (prevIndex >= 0 && prevIndex < editor.children.length) {
          Transforms.select(editor, Editor.end(editor, [prevIndex]))
        } else if (editor.children.length > 0) {
          Transforms.select(editor, Editor.start(editor, [0]))
        }
        setAdjacentBlock(null)
        return true
      }
    }

    // Backspace with 'before' indicator: act on the block behind the caret (targetIndex - 1)
    if (event.key === 'Backspace' && adjacentBlock.direction === 'before') {
      const targetIndex = resolveTargetIndex(editor, adjacentBlock)
      if (targetIndex !== -1) {
        const prevIndex = targetIndex - 1
        const prevBlock = prevIndex >= 0 ? editor.children[prevIndex] : null
        if (prevBlock && Element.isElement(prevBlock)) {
          event.preventDefault()
          if (prevBlock.class !== 'text') {
            // Non-text block behind: delete it, land at start of the target block
            Transforms.removeNodes(editor, { at: [prevIndex] })
            selectStartAt(editor, prevIndex)
          } else if (Node.string(prevBlock) === '') {
            // Empty text block behind: remove it, land at start of the target block
            Transforms.removeNodes(editor, { at: [prevIndex] })
            selectStartAt(editor, prevIndex)
          } else {
            // Non-empty text block behind: move into it and delete the last character
            Transforms.select(editor, Editor.end(editor, [prevIndex]))
            Transforms.delete(editor, { unit: 'character', reverse: true })
          }
          setAdjacentBlock(null)
          return true
        }
      }
    }

    // Delete with 'before' indicator: delete the target block (it is ahead of the caret)
    if (event.key === 'Delete' && adjacentBlock.direction === 'before') {
      const targetIndex = resolveTargetIndex(editor, adjacentBlock)
      if (targetIndex !== -1) {
        event.preventDefault()
        Transforms.removeNodes(editor, { at: [targetIndex] })
        if (targetIndex < editor.children.length) {
          Transforms.select(editor, Editor.start(editor, [targetIndex]))
        } else if (editor.children.length > 0) {
          Transforms.select(editor, Editor.end(editor, [editor.children.length - 1]))
        }
        setAdjacentBlock(null)
        return true
      }
    }
  }

  // Vertical arrow keys: no-op while adjacent indicator is active.
  // ArrowDown/ArrowUp are not part of the adjacent block navigation system;
  // letting Slate handle them here would move the real selection into an
  // unexpected position inside the non-text block.
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    return true
  }

  // Modifier-only keys should not disturb adjacent state
  if (['Meta', 'Control', 'Alt', 'Shift', 'CapsLock'].includes(event.key)) {
    return true
  }

  // Printable character: insert a new text element and let the character be typed into it
  if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    const targetIndex = resolveTargetIndex(editor, adjacentBlock)
    if (targetIndex !== -1) {
      const insertIndex = adjacentBlock.direction === 'before' ? targetIndex : targetIndex + 1
      const newNode = {
        id: crypto.randomUUID(),
        class: 'text' as const,
        type: 'core/text',
        children: [{ text: '' }]
      }
      Transforms.insertNodes(editor, newNode, { at: [insertIndex] })
      Transforms.select(editor, Editor.start(editor, [insertIndex]))
      setAdjacentBlock(null)
      // Don't preventDefault — let Slate insert the character into the new node
      return true
    }
  }

  // Any other non-arrow key — clear adjacent state, fall through to action loop
  setAdjacentBlock(null)
  return false
}
