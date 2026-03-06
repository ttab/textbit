import { Editor, Element, Range, Transforms } from 'slate'
import type { PluginRegistryAction } from '../../contexts/PluginRegistry/lib/types'
import { toggleLeaf } from '../../utils/toggleLeaf'
import { TextbitElement } from '../../utils/textbit-element'
import type { AdjacentBlockState } from '../../contexts/AdjacentBlockContext'

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
  setAdjacentBlock: (state: AdjacentBlockState | null) => void
) {
  const key = event.key
  const goingForward = key === 'ArrowRight' || key === 'ArrowDown'
  const goingBackward = key === 'ArrowLeft' || key === 'ArrowUp'
  const isArrowKey = goingForward || goingBackward

  if (isArrowKey) {
    const { selection } = editor

    if (!selection || !Range.isCollapsed(selection)) {
      if (adjacentBlock) setAdjacentBlock(null)
      return
    }

    const { anchor } = selection
    const topLevelIndex = anchor.path[0]
    const topLevelPath = [topLevelIndex]

    if (adjacentBlock) {
      const targetIndex = editor.children.findIndex(
        (child) => Element.isElement(child) && child.id === adjacentBlock.blockId
      )

      if (targetIndex === -1) {
        setAdjacentBlock(null)
        return
      }

      const targetPath = [targetIndex]
      const targetBlock = editor.children[targetIndex]
      const isVoid = TextbitElement.isVoid(targetBlock)
      const { direction } = adjacentBlock

      if (goingForward && direction === 'before') {
        event.preventDefault()
        if (isVoid) {
          // Step 2 of void traversal L→R: show 'after' indicator before moving past
          setAdjacentBlock({ blockId: adjacentBlock.blockId, direction: 'after' })
        } else {
          Transforms.select(editor, Editor.start(editor, targetPath))
          setAdjacentBlock(null)
        }
        return
      }

      if (goingForward && direction === 'after' && topLevelIndex < targetIndex) {
        // Step 3 of void traversal L→R: cursor is still before the void, move past it
        event.preventDefault()
        const nextIndex = targetIndex + 1
        if (nextIndex < editor.children.length) {
          Transforms.select(editor, Editor.start(editor, [nextIndex]))
        }
        setAdjacentBlock(null)
        return
      }

      if (goingBackward && direction === 'after') {
        event.preventDefault()
        if (isVoid) {
          // Step 2 of void traversal R→L: show 'before' indicator before moving past
          setAdjacentBlock({ blockId: adjacentBlock.blockId, direction: 'before' })
        } else {
          Transforms.select(editor, Editor.end(editor, targetPath))
          setAdjacentBlock(null)
        }
        return
      }

      if (goingBackward && direction === 'before' && topLevelIndex > targetIndex) {
        // Step 3 of void traversal R→L: cursor is still after the void, move past it
        event.preventDefault()
        const prevIndex = targetIndex - 1
        if (prevIndex >= 0) {
          Transforms.select(editor, Editor.end(editor, [prevIndex]))
        }
        setAdjacentBlock(null)
        return
      }

      // Going in the opposite direction — clear state, let Slate handle default
      setAdjacentBlock(null)
      return
    }

    // No adjacent state — check if an intermediate step is needed
    if (goingForward && Editor.isEnd(editor, anchor, topLevelPath)) {
      const currentBlock = editor.children[topLevelIndex]

      // Exiting a non-text block from its right edge
      if (Element.isElement(currentBlock) && currentBlock.class !== 'text') {
        event.preventDefault()
        setAdjacentBlock({ blockId: currentBlock.id, direction: 'after' })
        return
      }

      // Entering a non-text block from a preceding text block
      const nextIndex = topLevelIndex + 1
      if (nextIndex < editor.children.length) {
        const nextBlock = editor.children[nextIndex]
        if (Element.isElement(nextBlock) && nextBlock.class !== 'text') {
          event.preventDefault()
          setAdjacentBlock({ blockId: nextBlock.id, direction: 'before' })
          return
        }
      }
    }

    if (goingBackward && Editor.isStart(editor, anchor, topLevelPath)) {
      const currentBlock = editor.children[topLevelIndex]

      // Exiting a non-text block from its left edge
      if (Element.isElement(currentBlock) && currentBlock.class !== 'text') {
        event.preventDefault()
        setAdjacentBlock({ blockId: currentBlock.id, direction: 'before' })
        return
      }

      // Entering a non-text block from a following text block
      const prevIndex = topLevelIndex - 1
      if (prevIndex >= 0) {
        const prevBlock = editor.children[prevIndex]
        if (Element.isElement(prevBlock) && prevBlock.class !== 'text') {
          event.preventDefault()
          setAdjacentBlock({ blockId: prevBlock.id, direction: 'after' })
          return
        }
      }
    }

    // Not at boundary or next block is text — clear stale state
    if (adjacentBlock) setAdjacentBlock(null)
    // fall through to action loop
  } else if (adjacentBlock) {
    const { selection } = editor

    // Enter: insert a new default text element next to the target block
    if (event.key === 'Enter') {
      const targetIndex = editor.children.findIndex(
        (child) => Element.isElement(child) && child.id === adjacentBlock.blockId
      )
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
        return
      }
    }

    if (selection && Range.isCollapsed(selection)) {
      // Backspace with 'after' indicator: always delete the target block
      if (event.key === 'Backspace' && adjacentBlock.direction === 'after') {
        const targetIndex = editor.children.findIndex(
          (child) => Element.isElement(child) && child.id === adjacentBlock.blockId
        )
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
          return
        }
      }

      // Delete with 'before' indicator: always delete the target block
      if (event.key === 'Delete' && adjacentBlock.direction === 'before') {
        const targetIndex = editor.children.findIndex(
          (child) => Element.isElement(child) && child.id === adjacentBlock.blockId
        )
        if (targetIndex !== -1) {
          event.preventDefault()
          Transforms.removeNodes(editor, { at: [targetIndex] })
          if (targetIndex < editor.children.length) {
            Transforms.select(editor, Editor.start(editor, [targetIndex]))
          } else if (editor.children.length > 0) {
            Transforms.select(editor, Editor.end(editor, [editor.children.length - 1]))
          }
          setAdjacentBlock(null)
          return
        }
      }
    }

    // Modifier-only keys should not disturb adjacent state
    if (['Meta', 'Control', 'Alt', 'Shift', 'CapsLock'].includes(event.key)) {
      return
    }

    // Any other non-arrow key — clear adjacent state, fall through to action loop
    setAdjacentBlock(null)
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
