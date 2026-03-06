import { useCallback, useEffect, useRef, useState } from 'react'
import { Editor, Element, type NodeEntry, Range, Transforms } from 'slate'
import { Editable, ReactEditor, useFocused, type RenderElementProps, type RenderLeafProps } from 'slate-react'
import { getDecorationRanges } from '../utils/getDecorationRanges'
import { ElementComponent } from './Element/Element'
import { LeafElement } from './Element/LeafElement'
import { usePluginRegistry } from '../hooks/usePluginRegistry'
import { useTextbit } from '../hooks/useTextbit'
import type { PluginRegistryAction } from '../contexts/PluginRegistry/lib/types'
import { toggleLeaf } from '../utils/toggleLeaf'
import { useContextMenu } from '../hooks/useContextMenu'
import { useSlateStatic } from 'slate-react'
import { DragStateProvider } from '../contexts/DragStateProvider'
import { PresenceOverlay } from './PresenceOverlay'
import type { SpellcheckLookupTable } from '../types'
import { SelectionBoundsDetails } from './SelectionBoundsDetails'
import { type AdjacentBlockState } from '../contexts/AdjacentBlockContext'
import { AdjacentBlockProvider } from '../contexts/AdjacentBlockProvider'
import { TextbitElement } from '../utils/textbit-element'

interface TextbitEditableProps {
  autoFocus?: boolean | 'start' | 'end'
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
  'aria-label'?: string
}

export function TextbitEditable(props: TextbitEditableProps) {
  const editor = useSlateStatic()
  const { placeholders, placeholder, readOnly, dir, collaborative, verbose } = useTextbit()
  const { components, actions } = usePluginRegistry()
  const isFocused = useFocused()
  const [decorationsKey, setDecorationsKey] = useState(0)
  const handleContextMenu = useContextMenu()
  const [spellingLookupTable, setSpellingLookupTable] = useState<SpellcheckLookupTable>(new Map())
  const [adjacentBlock, setAdjacentBlock] = useState<AdjacentBlockState | null>(null)
  const { onFocus, autoFocus = false } = props

  // Track mounted state
  const isMountedRef = useRef(true)
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  // Focus the actual editable DOM node on mount
  const handleFocus = useCallback((e: React.FocusEvent<HTMLDivElement>) => {
    queueMicrotask(() => {
      if (!editor.selection && decorationsKey === 0) {
        if (autoFocus === 'end') {
          Transforms.select(editor, Editor.end(editor, []))
        } else {
          Transforms.select(editor, Editor.start(editor, []))
        }
        setDecorationsKey(prev => prev + 1)
      }
    })

    if (onFocus) {
      onFocus(e)
    }
  }, [autoFocus, decorationsKey, editor, onFocus])

  // Increment decorationkey to ensure re-render when spellcheck completes
  useEffect(() => {
    if (typeof editor.onSpellcheckComplete !== 'function') {
      return
    }

    editor.onSpellcheckComplete((newLookupTable) => {
      if (!isMountedRef.current) {
        console.log('Unmounted!')
        return
      }

      setSpellingLookupTable(newLookupTable)

      // HACK: Deselect and select the editor to ensure the dom selection is correctly updated.
      // FIXME: When https://github.com/ianstormtaylor/slate/issues/5987
      const selection = editor.selection
      ReactEditor.deselect(editor)
      setTimeout(() => {
        if (selection) {
          Transforms.select(editor, selection)
        }
      }, 10)
    })
  }, [editor, isFocused, setDecorationsKey])

  // Render element callback
  const renderElement = useCallback((props: RenderElementProps) => {
    return ElementComponent({
      ...props
    })
  }, [])

  // Render leaf callback
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return LeafElement(props)
  }, [])

  // Render decorate callback
  const decorate = useCallback((entry: NodeEntry) => {
    return getDecorationRanges(
      editor,
      spellingLookupTable,
      entry,
      components,
      placeholders,
      placeholder
    )
  }, [editor, components, placeholders, placeholder, spellingLookupTable])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    handleOnKeyDown(editor, actions, event, adjacentBlock, setAdjacentBlock)
  }, [editor, actions, adjacentBlock, setAdjacentBlock])

  /**
   * Fixefox does not set the caret position correctly when clicking
   * in an unfocused Editable area. If the gecko rendering engine is
   * detected we help the user by setting the caret position.
   */
  const onMouseDown = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    // Any mouse interaction clears adjacent block state
    if (adjacentBlock) {
      setAdjacentBlock(null)
    }

    // We only need to handle this for Firefox (Gecko rendering engine)
    if (!navigator.userAgent.includes('Gecko/')) {
      return
    }

    if (!isFocused) {
      const range = ReactEditor.findEventRange(editor, event)
      if (Range.isRange(range)) {
        Transforms.select(editor, range)
      }
    }
  }, [editor, isFocused, adjacentBlock, setAdjacentBlock])

  return (
    <>
      <AdjacentBlockProvider value={adjacentBlock}>
        <DragStateProvider>
          <PresenceOverlay isCollaborative={collaborative}>
            <Editable
              autoFocus={!!autoFocus}
              data-state={isFocused ? 'focused' : ''}
              readOnly={readOnly}
              renderElement={renderElement}
              renderLeaf={renderLeaf}
              onFocus={handleFocus}
              onBlur={props.onBlur}
              onKeyDown={onKeyDown}
              decorate={decorate}
              className={props.className}
              style={adjacentBlock
                ? { ...props.style, caretColor: 'transparent' }
                : props.style
              }
              spellCheck={false}
              placeholder={placeholder}
              dir={dir}
              onContextMenu={handleContextMenu}
              onMouseDown={onMouseDown}
              aria-label={props['aria-label']}
            />
            {props.children}
          </PresenceOverlay>
        </DragStateProvider>
      </AdjacentBlockProvider>

      {verbose && <SelectionBoundsDetails />}
    </>
  )
}

/*
 * Match key events to registered actions keyboard shortcuts. Then either
 * 1. call their action handler
 * 2. toggle leafs on or off
 * 3. transform text nodes to another type
 */
function handleOnKeyDown(
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
