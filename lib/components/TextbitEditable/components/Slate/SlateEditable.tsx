import React, { useRef, forwardRef, useState, useCallback } from 'react'
import { Editor as SlateEditor, Transforms, Element as SlateElement, Editor, Text, Range, type NodeEntry, Node, type BaseRange, Path, Point } from 'slate'
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
          handleNavigation(textbitEditor, event, blockSelection, setBlockSelection)

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
 * Handle navigation into and out from blocks using arrow keys. This kind of navigation
 * should always be handle in two steps, first the whole block is selected and the cursor
 * hidden, the next navigation should move in to or out of the block. Slate does not have
 * the concept of block node selections which is why this is needed.
 */
function handleNavigation(
  textbitEditor: Editor,
  event: React.KeyboardEvent<HTMLDivElement>,
  blockSelection: BlockSelection,
  setBlockSelection: React.Dispatch<React.SetStateAction<BlockSelection>>
) {
  if (isNavigationKey(event.key)) {
    const newBlockSelection = isMovingTowardsChild(textbitEditor, event.key)

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
    }
  }

  // Special cases
  if (blockSelection && ['Backspace', 'Delete'].includes(event.key)) {
    // FIXME: Handle special backspace case:
    // Add check if we are in the first pos of the first child in block node children
    // - then we should ignore the backspace.
    console.log('REMOVE IT')
  } else if (blockSelection && event.key === 'Enter') {
    // FIXME: Handle special enter case:
    // Add check if we are in the last pos of the last child in block node children
    // and that child is a single line - then we also want to add line after.
    console.log('Add line after')
  }
}


function isMovingTowardsChild(editor: Editor, key: NavigationKey): {
  edge: string
  path: Path
} | undefined {
  const { selection } = editor
  if (!selection || !selection.focus) return

  const [node] = Editor.node(editor, selection.focus.path)

  // If we navigate "horisontally" and are not at the edges we can stop
  if (key === 'ArrowRight' && selection.focus.offset !== Node.string(node).length) {
    return
  } else if (key === 'ArrowLeft' && selection.focus.offset !== 0) {
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
      path: [nextPoint.path[0]]
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
