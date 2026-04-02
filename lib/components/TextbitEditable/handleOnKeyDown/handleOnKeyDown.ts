import { Editor, Element, Range, Transforms } from 'slate'
import type { PluginRegistryAction } from '../../../contexts/PluginRegistry/lib/types'
import { toggleLeaf } from '../../../utils/toggleLeaf'
import type { AdjacentBlockState } from '../../../contexts/AdjacentBlockContext'
import type { BlockSelectionState } from '../../../contexts/BlockSelectionContext'
import { handleArrowWithAdjacentBlock, handleArrowNoAdjacentBlock, handleVerticalArrowWithAdjacentBlock } from './arrowHandlers'
import { handleNonArrowWithAdjacentBlock } from './nonArrowHandler'
import { isAtAccessibleEnd, isAtAccessibleStart } from './blockUtils'
import { enterBlockSelectionFromAdjacentCaret, handleBlockSelectionKeyDown } from './blockSelectionHandler'

/*
 * Match key events to registered actions keyboard shortcuts. Then either
 * 1. call their action handler
 * 2. toggle leafs on or off
 * 3. transform text nodes to another type
 */
export function handleOnKeyDown(
  editor: Editor,
  actions: PluginRegistryAction[],
  event: React.KeyboardEvent<HTMLDivElement>,
  adjacentBlock: AdjacentBlockState | null,
  setAdjacentBlock: (state: AdjacentBlockState | null) => void,
  blockSelection: BlockSelectionState | null,
  setBlockSelection: (state: BlockSelectionState | null) => void
) {
  // 1. Block selection active — delegate all keys to block selection handler
  if (blockSelection) {
    handleBlockSelectionKeyDown(editor, event, blockSelection, setBlockSelection, setAdjacentBlock)
    return
  }

  // 2. Adjacent caret + Shift+Arrow — enter block selection mode
  if (adjacentBlock && event.shiftKey
    && (event.key === 'ArrowUp' || event.key === 'ArrowDown' || event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    const newSelection = enterBlockSelectionFromAdjacentCaret(editor, event, adjacentBlock)
    if (newSelection) {
      event.preventDefault()
      setAdjacentBlock(null)
      setBlockSelection(newSelection)
    }
    return
  }

  const key = event.key
  const goingForward = key === 'ArrowRight' // || key === 'ArrowDown'
  const goingBackward = key === 'ArrowLeft' // || key === 'ArrowUp'
  const isArrowKey = goingForward || goingBackward

  if (isArrowKey) {
    const { selection } = editor

    if (!selection || !Range.isCollapsed(selection)) {
      if (adjacentBlock) setAdjacentBlock(null)
      return
    }

    const { anchor } = selection
    const topLevelIndex = anchor.path[0]

    if (adjacentBlock) {
      // All paths inside handleArrowWithAdjacentBlock call event.preventDefault() and return
      handleArrowWithAdjacentBlock(
        editor,
        event,
        adjacentBlock,
        setAdjacentBlock,
        goingForward,
        goingBackward
      )
      return
    }

    // No adjacent state — check if an intermediate step is needed
    const handled = handleArrowNoAdjacentBlock(
      editor,
      event,
      setAdjacentBlock,
      goingForward,
      goingBackward,
      topLevelIndex,
      anchor
    )
    if (handled) return

    // Not at a block boundary — fall through to action loop
  } else if (key === 'ArrowUp' || key === 'ArrowDown') {
    if (adjacentBlock) {
      handleVerticalArrowWithAdjacentBlock(editor, event, adjacentBlock, setAdjacentBlock)
      return
    }

    // No indicator active: guard against Slate losing the selection when the
    // caret is at the edge of a non-text block at the top or bottom of the document.
    const { selection } = editor
    if (selection && Range.isCollapsed(selection)) {
      const { anchor } = selection
      const topLevelIndex = anchor.path[0]
      const currentBlock = editor.children[topLevelIndex]

      if (Element.isElement(currentBlock) && currentBlock.class !== 'text') {
        if (key === 'ArrowDown'
          && topLevelIndex === editor.children.length - 1
          && isAtAccessibleEnd(editor, anchor, topLevelIndex)) {
          event.preventDefault()
          return
        }
        if (key === 'ArrowUp'
          && topLevelIndex === 0
          && isAtAccessibleStart(editor, anchor, topLevelIndex)) {
          event.preventDefault()
          return
        }
      }
    }
  } else if (adjacentBlock) {
    const handled = handleNonArrowWithAdjacentBlock(
      editor,
      event,
      adjacentBlock,
      setAdjacentBlock
    )
    if (handled) return
  }

  for (const action of actions) {
    if (!action.isHotkey(event)) {
      continue
    }

    if (action.handler) {
      const allowDefault = action.handler({
        editor,
        event,
        type: action.plugin.name,
        options: {
          ...action.plugin.options
        }
      })

      if (!allowDefault) {
        break
      }
    }

    if (action.plugin.class === 'leaf') {
      event.preventDefault()
      toggleLeaf(editor, action.plugin.name)
    } else if (action.plugin.class === 'text') {
      event.preventDefault()
      // FIXME: Should not allow transforming blocks (only text class element)
      Transforms.setNodes(
        editor,
        { type: action.plugin.name },
        { match: (n) => Element.isElement(n) && Editor.isBlock(editor, n) }
      )
    }

    break
  }
}
