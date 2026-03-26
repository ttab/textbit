import { Editor, Element, type Point, Range, Transforms } from 'slate'
import type { PluginRegistryAction } from '../../contexts/PluginRegistry/lib/types'
import { toggleLeaf } from '../../utils/toggleLeaf'
import type { AdjacentBlockState } from '../../contexts/AdjacentBlockContext'

/** First non-void child index, or -1 if all children are void */
function firstEditableChildIdx(editor: Editor, block: Element): number {
  return block.children.findIndex(
    (child) => !Element.isElement(child) || !editor.isVoid(child)
  )
}

/** Last non-void child index, or -1 if all children are void */
function lastEditableChildIdx(editor: Editor, block: Element): number {
  return block.children.reduce<number>(
    (found, child, i) => (!Element.isElement(child) || !editor.isVoid(child)) ? i : found,
    -1
  )
}

/** True when the cursor is at the start of the first non-void child of the block */
function isAtAccessibleStart(editor: Editor, anchor: Point, blockIndex: number): boolean {
  const block = editor.children[blockIndex]
  if (!Element.isElement(block)) return false
  const idx = firstEditableChildIdx(editor, block)
  if (idx < 0) return Editor.isStart(editor, anchor, [blockIndex])
  return Editor.isStart(editor, anchor, [blockIndex, idx])
}

/** True when the cursor is at the end of the last non-void child of the block */
function isAtAccessibleEnd(editor: Editor, anchor: Point, blockIndex: number): boolean {
  const block = editor.children[blockIndex]
  if (!Element.isElement(block)) return false
  const idx = lastEditableChildIdx(editor, block)
  if (idx < 0) return Editor.isEnd(editor, anchor, [blockIndex])
  return Editor.isEnd(editor, anchor, [blockIndex, idx])
}

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
      const isVoid = Element.isElement(targetBlock) && editor.isVoid(targetBlock)
      const { direction } = adjacentBlock

      if (goingForward && direction === 'before') {
        event.preventDefault()
        if (isVoid) {
          // Step 2 of void traversal L→R: show 'after' indicator before moving past
          setAdjacentBlock({ blockId: adjacentBlock.blockId, direction: 'after' })
        } else {
          // Skip leading void children (e.g. an image child) to land on first editable position
          let enterPath: number[] = targetPath
          if (Element.isElement(targetBlock)) {
            const firstNonVoidIdx = targetBlock.children.findIndex(
              (child) => !Element.isElement(child) || !editor.isVoid(child)
            )
            if (firstNonVoidIdx >= 0) {
              enterPath = [...targetPath, firstNonVoidIdx]
            }
          }
          Transforms.select(editor, Editor.start(editor, enterPath))
          setAdjacentBlock(null)
        }
        return
      }

      if (goingForward && direction === 'after' && topLevelIndex <= targetIndex) {
        // Step 3 of void traversal L→R: move past the block
        event.preventDefault()
        const nextIndex = targetIndex + 1
        if (nextIndex < editor.children.length) {
          const nextBlock = editor.children[nextIndex]
          if (Element.isElement(nextBlock) && nextBlock.class !== 'text') {
            // Next block is also non-text: show 'before' indicator for it
            if (topLevelIndex === targetIndex) {
              // Cursor is still inside the exited block; park it at a text block so the
              // exited block doesn't render as 'active'. Prefer a preceding text block;
              // fall back to one after the next block.
              let parkIdx = targetIndex - 1
              while (parkIdx >= 0 && Element.isElement(editor.children[parkIdx]) && editor.children[parkIdx].class !== 'text') {
                parkIdx--
              }
              if (parkIdx >= 0) {
                Transforms.select(editor, Editor.end(editor, [parkIdx]))
              } else {
                parkIdx = nextIndex + 1
                while (parkIdx < editor.children.length && Element.isElement(editor.children[parkIdx]) && editor.children[parkIdx].class !== 'text') {
                  parkIdx++
                }
                if (parkIdx < editor.children.length) {
                  Transforms.select(editor, Editor.start(editor, [parkIdx]))
                }
              }
            }
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

      if (goingBackward && direction === 'after') {
        event.preventDefault()
        if (isVoid) {
          // Step 2 of void traversal R→L: show 'before' indicator before moving past
          setAdjacentBlock({ blockId: adjacentBlock.blockId, direction: 'before' })
        } else {
          // Skip trailing void children to land on last editable position
          let enterPath: number[] = targetPath
          if (Element.isElement(targetBlock)) {
            const lastNonVoidIdx = targetBlock.children.reduce<number>(
              (found, child, i) => (!Element.isElement(child) || !editor.isVoid(child)) ? i : found,
              -1
            )
            if (lastNonVoidIdx >= 0) {
              enterPath = [...targetPath, lastNonVoidIdx]
            }
          }
          Transforms.select(editor, Editor.end(editor, enterPath))
          setAdjacentBlock(null)
        }
        return
      }

      if (goingBackward && direction === 'before' && topLevelIndex >= targetIndex) {
        // Step 3 of void traversal R→L: move past the block
        event.preventDefault()
        const prevIndex = targetIndex - 1
        if (prevIndex >= 0) {
          const prevBlock = editor.children[prevIndex]
          if (Element.isElement(prevBlock) && prevBlock.class !== 'text') {
            // Previous block is also non-text: show 'after' indicator for it
            if (topLevelIndex === targetIndex) {
              // Cursor is still inside the exited block; park it at a text block so the
              // exited block doesn't render as 'active'. Prefer a following text block;
              // fall back to one before the previous block.
              let parkIdx = targetIndex + 1
              while (parkIdx < editor.children.length && Element.isElement(editor.children[parkIdx]) && editor.children[parkIdx].class !== 'text') {
                parkIdx++
              }
              if (parkIdx < editor.children.length) {
                Transforms.select(editor, Editor.start(editor, [parkIdx]))
              } else {
                parkIdx = prevIndex - 1
                while (parkIdx >= 0 && Element.isElement(editor.children[parkIdx]) && editor.children[parkIdx].class !== 'text') {
                  parkIdx--
                }
                if (parkIdx >= 0) {
                  Transforms.select(editor, Editor.end(editor, [parkIdx]))
                }
              }
            }
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

      // Cursor was parked on the far side of the target block by a previous transition.
      // Advance the adjacent indicator one step in the travel direction rather than
      // jumping straight to the parked cursor position.
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

      // Going in the opposite direction — clear state, let Slate handle default
      setAdjacentBlock(null)
      return
    }

    // No adjacent state — check if an intermediate step is needed
    const currentBlock = editor.children[topLevelIndex]

    if (goingForward) {
      // Exiting a non-text block from its right (accessible) edge
      if (Element.isElement(currentBlock) && currentBlock.class !== 'text'
        && isAtAccessibleEnd(editor, anchor, topLevelIndex)) {
        event.preventDefault()
        setAdjacentBlock({ blockId: currentBlock.id, direction: 'after' })
        return
      }

      // Entering a non-text block from a preceding text block
      if (Editor.isEnd(editor, anchor, topLevelPath)) {
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
    }

    if (goingBackward) {
      // Exiting a non-text block from its left (accessible) edge
      if (Element.isElement(currentBlock) && currentBlock.class !== 'text'
        && isAtAccessibleStart(editor, anchor, topLevelIndex)) {
        event.preventDefault()
        setAdjacentBlock({ blockId: currentBlock.id, direction: 'before' })
        return
      }

      // Entering a non-text block from a following text block
      if (Editor.isStart(editor, anchor, topLevelPath)) {
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

    // Printable character: insert a new text element and let the character be typed into it
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const targetIndex = editor.children.findIndex(
        (child) => Element.isElement(child) && child.id === adjacentBlock.blockId
      )
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
        return
      }
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
