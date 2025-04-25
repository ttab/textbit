import React, { useRef, forwardRef, useCallback } from 'react'
import {
  Editor as SlateEditor,
  Transforms,
  Element as SlateElement,
  Editor,
  Text,
  Range,
  type NodeEntry,
  Path,
  Point,
  Element
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

  useContextMenu(wrapperRef)

  const renderSlateElement = useCallback((props: RenderElementProps) => {
    return ElementComponent({
      ...props
    })
  }, [])

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
          handleBlockOperations(textbitEditor, event)

          if (!event.defaultPrevented) {
            handleOnKeyDown(textbitEditor, actions, event)
          }
        }}
        decorate={onDecorate}
        onBlur={onBlur}
        spellCheck={false}
        autoFocus={autoFocus}
        onMouseDown={(event) => {
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
  event: React.KeyboardEvent<HTMLDivElement>
) {
  // If backspace without block selection, don't allow backspace in offset 0 of first child
  // FIXME: This should be turned into a constraint in the plugin component defenitions
  // which should also handle delete.
  // FIXME: Move this ot withBlockDeletion.ts!!!
  if (event.key === 'Backspace') {
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

  // FIXME: Merge this with below enter or move to a withBreak
  if (event.key === 'Enter') {
    const { selection } = textbitEditor
    if (!selection || !Range.isCollapsed(selection)) return

    const [blockEntry] = Editor.nodes(textbitEditor, {
      match: (n) => Element.isElement(n) && n.class === 'block',
      at: selection
    })

    if (blockEntry) {
      const [, path] = blockEntry
      const blockEnd = Editor.end(textbitEditor, path)

      if (Point.equals(selection.anchor, blockEnd)) {
        const after = Path.next(path)
        Transforms.select(textbitEditor, blockEnd)
        // Transforms.insertNodes(
        //   textbitEditor,
        //   { type: 'paragraph', children: [{ text: '' }] },
        //   { at: after }
        // )
        Transforms.insertNodes(textbitEditor, {
          id: crypto.randomUUID(),
          class: 'text',
          type: 'core/text',
          children: [{ text: '' }]
        }, { at: after })
        Transforms.select(textbitEditor, Editor.start(textbitEditor, after))
        event.preventDefault()
        return
      }
    }
    return
  }


  // 4. Handle insertion of new line after selected block
  // if (blockSelection && event.key === 'Enter') {
  //   const nextPath = Path.next(blockSelection.path)
  //   Transforms.insertNodes(textbitEditor, {
  //     id: crypto.randomUUID(),
  //     class: 'text',
  //     type: 'core/text',
  //     children: [{ text: '' }]
  //   }, { at: nextPath })

  //   Transforms.select(textbitEditor, Editor.start(textbitEditor, nextPath))
  //   setBlockSelection(undefined)
  //   event.preventDefault()
  // }
}
