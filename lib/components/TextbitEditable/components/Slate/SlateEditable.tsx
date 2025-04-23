import React, { useRef, forwardRef, useState, useCallback } from 'react'
import {
  Editor as SlateEditor,
  Transforms,
  Element as SlateElement,
  Editor,
  Text,
  Range,
  type NodeEntry,
  Node,
  type BaseRange,
  Path,
  Point
} from 'slate'
import { Editable, ReactEditor, type RenderElementProps, type RenderLeafProps, useFocused } from 'slate-react'
import { toggleLeaf } from '../../../../lib/toggleLeaf'
import type { PluginRegistryAction } from '../../../PluginRegistry/lib/types'
import { useTextbit } from '../../../../components/TextbitRoot'
import { TextbitEditor, TextbitElement } from '../../../../lib'
import { useContextMenu } from '../../../../hooks/useContextMenu'
import { ElementComponent } from '../Element'
import { Leaf } from '../Leaf'

interface SlateEditableProps {
  className?: string
  textbitEditor: Editor
  actions: PluginRegistryAction[]
  autoFocus: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onDecorate?: ((entry: NodeEntry) => Range[]) | undefined
  readOnly?: boolean
}

type NavigationKey = 'ArrowRight' | 'ArrowDown' | 'ArrowUp' | 'ArrowLeft'

type BlockSelection = {
  edge: string
  path: Path
  direction: 'in' | 'out'
} | undefined

export const SlateEditable = forwardRef(function SlateEditable({
  className = '',
  textbitEditor,
  actions,
  autoFocus,
  onBlur,
  onFocus,
  onDecorate,
  readOnly
}: SlateEditableProps, ref: React.LegacyRef<HTMLDivElement>): JSX.Element {
  const focused = useFocused()
  const { placeholder } = useTextbit()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [blockSelection, setBlockSelection] = useState<BlockSelection>(undefined)

  useContextMenu(wrapperRef)

  const renderSlateElement = useCallback((props: RenderElementProps) => {
    return ElementComponent({
      ...props,
      selectedBlockPath: blockSelection?.path
    })
  }, [blockSelection])

  const renderLeafComponent = useCallback((props: RenderLeafProps) => {
    return Leaf(props)
  }, [])

  return (
    <div ref={wrapperRef}>
      <Editable
        ref={ref}
        placeholder={placeholder}
        readOnly={readOnly}
        data-state={focused ? 'focused' : ''}
        className={className}
        renderElement={renderSlateElement}
        renderLeaf={renderLeafComponent}
        onKeyDown={(event) => {
          handleBlockOperations(textbitEditor, event, blockSelection, setBlockSelection)

          if (!event.defaultPrevented) {
            handleOnKeyDown(textbitEditor, actions, event)
          }
        }}
        decorate={onDecorate}
        onBlur={onBlur}
        spellCheck={false}
        autoFocus={autoFocus}
        onMouseDown={(event) => {
          // Always clear block selection
          if (blockSelection) {
            setBlockSelection(undefined)
          }

          if (!focused && !textbitEditor.selection) {
            // Especially Firefox does not set it correctly on first click
            const range = ReactEditor.findEventRange(textbitEditor, event)
            if (Range.isRange(range)) {
              Transforms.select(textbitEditor, range)
            }
          }
        }}
        onFocus={(event) => {
          if (!textbitEditor.selection) {
            setInitialSelection(textbitEditor)
          }

          if (onFocus) {
            onFocus(event)
          }
        }}
      >
      </Editable>
    </div>
  )
})


/**
 * Set iniital selection on load or on focus.
 *
 * Set it to beginning if there are multiple lines, otherwise to the end of the first.
 * Needs setTimout() when in yjs env.
 */
function setInitialSelection(textbitEditor: Editor) {
  setTimeout(() => {
    const nodes = Array.from(
      Editor.nodes(textbitEditor, {
        at: [],
        match: (el) => {
          return Text.isText(el)
        }
      })
    )

    const node = nodes.length ? nodes[0][0] : null
    const offset = (TextbitEditor.length(textbitEditor) <= 1 && Text.isText(node)) ? node.text.length : 0
    const initialSelection = {
      anchor: { path: [0, 0], offset },
      focus: { path: [0, 0], offset }
    }

    Transforms.select(textbitEditor, initialSelection)
  }, 0)
}


/*
 * Match key events to registered actions keyboard shortcuts. Then either
 * 1. call their action handler
 * 2. toggle leafs on or off
 * 3. transform text nodes to another type
 */
function handleOnKeyDown(editor: SlateEditor, actions: PluginRegistryAction[], event: React.KeyboardEvent<HTMLDivElement>) {
  for (const action of actions) {
    if (!action.isHotkey(event)) {
      continue
    }

    event.preventDefault()

    if (action.handler && true !== action.handler({ editor, options: action.plugin.options })) {
      break
    }

    if (action.plugin.class === 'leaf') {
      toggleLeaf(editor, action.plugin.name)
    } else if (action.plugin.class === 'text') {
      // FIXME: Should not allow transforming blocks (only text class element)
      Transforms.setNodes(
        editor,
        { type: action.plugin.name },
        { match: (n) => SlateElement.isElement(n) && SlateEditor.isBlock(editor, n) }
      )
    }
    break
  }
}

/**
 * 1. Handle navigation into and out from blocks using arrow keys. This kind of navigation
 * should always be handle in two steps, first the whole block is selected and the cursor
 * hidden, the next navigation should move in to or out of the block. Slate does not have
 * the concept of block node selections which is why this is needed.
 *
 * 2. Handle deletion of block node through backspace and delete.
 *
 * 3. Prevent deletion when in offset 0 in first child.
 */
function handleBlockOperations(
  textbitEditor: Editor,
  event: React.KeyboardEvent<HTMLDivElement>,
  blockSelection: BlockSelection,
  setBlockSelection: React.Dispatch<React.SetStateAction<BlockSelection>>
) {
  // 1. Handle navigation with arrow keys and selecting/deselecting block node
  if (isNavigationKey(event.key)) {
    const inToBlockSelection = blockSelection ? undefined : isMovingIntoBlockNode(textbitEditor, event.key)
    const outFromBlockSelection = inToBlockSelection ? undefined : isMovingOutOfBlockNode(textbitEditor, event.key)
    const newBlockSelection = inToBlockSelection || outFromBlockSelection

    if (newBlockSelection?.path?.[0] !== blockSelection?.path?.[0]) {
      if (blockSelection) {
        let outsideSelection: Point | undefined

        if (['ArrowLeft', 'ArrowUp'].includes(event.key) && blockSelection.edge === 'start') {
          outsideSelection = Editor.before(textbitEditor, blockSelection.path)
        } else if (['ArrowRight', 'ArrowDown'].includes(event.key) && blockSelection.edge === 'end') {
          outsideSelection = Editor.after(textbitEditor, blockSelection.path)
        }

        if (outsideSelection) {
          Transforms.select(textbitEditor, outsideSelection)
        }
      } else if (newBlockSelection?.path) {
        if (newBlockSelection.edge === 'start') {
          Transforms.select(textbitEditor, Editor.start(textbitEditor, newBlockSelection.path))
        } else {
          Transforms.select(textbitEditor, Editor.end(textbitEditor, newBlockSelection.path))
        }
      }

      event.preventDefault()
      setBlockSelection(newBlockSelection)
    } else if (blockSelection) {
      setBlockSelection(undefined)
    }

    return
  }

  // 2. If there is a block selection and the user hits delete
  if (blockSelection && ['Backspace', 'Delete'].includes(event.key)) {
    event.preventDefault()

    const [blockNode] = Editor.node(textbitEditor, blockSelection.path)
    if (SlateElement.isElement(blockNode)) {
      Transforms.removeNodes(textbitEditor, {
        at: blockSelection.path,
        match: (n) => SlateElement.isElement(n) && TextbitElement.isBlock(n)
      })

      setBlockSelection(undefined)
    }
    return
  }

  // 3. If backspace without block selection, don't allow backspace in offset 0 of first child
  // FIXME: This should be turned into a constraint in the plugin component defenitions
  // which should also handle delete.
  if (!blockSelection && event.key === 'Backspace') {
    const { selection } = textbitEditor

    if (selection && Range.isCollapsed(selection)) {
      const focusPath = selection.focus.path

      // Check if offset is 0
      if (selection.focus.offset !== 0) return

      // Find the top-level block above the selection
      const [blockNode, blockPath] = Editor.above(textbitEditor, {
        at: focusPath,
        match: (n) => TextbitElement.isBlock(n)
      }) ?? []

      if (!blockNode || !blockPath) return

      // Get the path to the first text node in the block
      const firstTextEntry = Editor.first(textbitEditor, blockPath)

      if (!firstTextEntry) return

      const [, firstTextPath] = firstTextEntry

      if (Path.equals(focusPath, firstTextPath) && selection.focus.offset === 0) {
        event.preventDefault()
      }
    }

    return
  }


  // 4. Handle insertion of new line after selected block
  if (blockSelection && event.key === 'Enter') {
    const nextPath = Path.next(blockSelection.path)
    Transforms.insertNodes(textbitEditor, {
      id: crypto.randomUUID(),
      class: 'text',
      type: 'core/text',
      children: [{ text: '' }]
    }, { at: nextPath })

    Transforms.select(textbitEditor, Editor.start(textbitEditor, nextPath))
    setBlockSelection(undefined)
    event.preventDefault()
  }
}

function isMovingIntoBlockNode(editor: Editor, key: NavigationKey): BlockSelection | undefined {
  const { selection } = editor
  if (!selection || !selection.focus) return

  // If we navigate "horisontally" and are not at the edges we can stop
  if (isAtTextEdges(editor, key, selection) === false) {
    return
  }

  // Get the next point
  const nextPoint = getNextPoint(editor, selection, key)
  if (!nextPoint) return

  const [nextNode] = Editor.node(editor, [nextPoint.path[0]])
  const [nextChildNode] = Editor.node(editor, nextPoint.path)

  if (TextbitElement.isBlock(nextNode)
    && SlateElement.isElement(nextNode)
    && !!nextNode.children.length
    && selection.focus.path[0] !== nextPoint.path[0]
    && Object.prototype.hasOwnProperty.call(nextChildNode, 'text')) {
    return {
      edge: getEdge(key, 'in'),
      path: [nextPoint.path[0]],
      direction: 'in'
    }
  }
}

function isMovingOutOfBlockNode(editor: Editor, key: NavigationKey): BlockSelection | undefined {
  const { selection } = editor
  if (!selection || !selection.focus) return

  if (isAtTextEdges(editor, key, selection) === false) {
    return
  }

  const [parentBlock] = Editor.above(editor, {
    at: selection.focus,
    match: (n) => TextbitElement.isBlock(n)
  }) ?? []

  if (!TextbitElement.isBlock(parentBlock)) return

  const nextPoint = getNextPoint(editor, selection, key)

  if (selection.focus.path[0] !== nextPoint?.path[0]) {
    return {
      edge: getEdge(key, 'out'),
      path: [selection.focus.path[0]],
      direction: 'out'
    }
  }
}

function getNextPoint(editor: Editor, selection: BaseRange, key: NavigationKey) {
  if (key === 'ArrowRight') {
    return Editor.after(editor, selection.focus.path)
  } else if (key === 'ArrowDown') {
    return Editor.after(editor, selection.focus.path)
  } else if (key === 'ArrowLeft') {
    return Editor.before(editor, selection.focus.path)
  } else if (key === 'ArrowUp') {
    return Editor.before(editor, selection.focus.path)
  }
}

/**
 * Find out out whether the cursor is at any of the edges of the text when
 * navigating horisontally. (Even though it does not take into account that
 * it can be in an inline node it does save us from a lot of calculations.)
 */
function isAtTextEdges(editor: Editor, key: NavigationKey, selection: BaseRange) {
  const [node] = Editor.node(editor, selection.focus.path)

  if (key === 'ArrowUp' || key === 'ArrowDown') {
    return
  }

  if (key === 'ArrowRight' && selection.focus.offset === Node.string(node).length) {
    return true
  }

  if (key === 'ArrowLeft' && selection.focus.offset === 0) {
    return true
  }

  return false
}

/**
 * Identify which edge of a block we are at when navigating into or out from a block.
 */
function getEdge(
  key: NavigationKey,
  direction: 'in' | 'out'
): 'end' | 'start' {
  if (['ArrowRight', 'ArrowDown'].includes(key)) {
    return direction === 'in' ? 'start' : 'end'
  } else {
    return direction === 'in' ? 'end' : 'start'
  }
}

/**
 * Type guard for navigation keys-
 */
function isNavigationKey(value: unknown): value is NavigationKey {
  return typeof value === 'string' && ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown'].includes(value)
}
