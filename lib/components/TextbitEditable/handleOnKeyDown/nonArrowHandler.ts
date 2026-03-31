import { Editor, Element, Node, Range, Transforms } from 'slate'
import type { AdjacentBlockState } from '../../../contexts/AdjacentBlockContext'
import { resolveTargetIndex, selectStartAt, enterBlockFromStart, enterBlockFromEnd } from './blockUtils'

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
            // Non-text block behind: delete it, stay at the target block
            Transforms.removeNodes(editor, { at: [prevIndex] })
            // Target block shifted to prevIndex; it's still non-text so use
            // enterBlockFromStart to skip void children and keep the indicator.
            const shiftedBlock = editor.children[prevIndex]
            if (Element.isElement(shiftedBlock) && shiftedBlock.class !== 'text') {
              enterBlockFromStart(editor, [prevIndex], shiftedBlock)
              setAdjacentBlock({ blockId: shiftedBlock.id, direction: 'before' })
            } else {
              selectStartAt(editor, prevIndex)
              setAdjacentBlock(null)
            }
            return true
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

        // After removal, the block that was after the target (if any) shifts
        // into targetIndex. If it's a non-text block, use void-skipping
        // selection and preserve the adjacent indicator.
        if (targetIndex < editor.children.length) {
          const nextBlock = editor.children[targetIndex]
          if (Element.isElement(nextBlock) && nextBlock.class !== 'text') {
            enterBlockFromStart(editor, [targetIndex], nextBlock)
            setAdjacentBlock({ blockId: nextBlock.id, direction: 'before' })
          } else {
            Transforms.select(editor, Editor.start(editor, [targetIndex]))
            setAdjacentBlock(null)
          }
        } else if (editor.children.length > 0) {
          const lastIndex = editor.children.length - 1
          const lastBlock = editor.children[lastIndex]
          if (Element.isElement(lastBlock) && lastBlock.class !== 'text') {
            enterBlockFromEnd(editor, [lastIndex], lastBlock)
            setAdjacentBlock({ blockId: lastBlock.id, direction: 'after' })
          } else {
            Transforms.select(editor, Editor.end(editor, [lastIndex]))
            setAdjacentBlock(null)
          }
        } else {
          setAdjacentBlock(null)
        }
        return true
      }
    }
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
