import React, { useRef, forwardRef, useCallback } from 'react'
import {
  Editor as SlateEditor,
  Transforms,
  Element as SlateElement,
  Editor,
  Text,
  Range,
  type NodeEntry
} from 'slate'
import { Editable, ReactEditor, type RenderElementProps, type RenderLeafProps, useFocused } from 'slate-react'
import { toggleLeaf } from '../../../../lib/toggleLeaf'
import type { PluginRegistryAction } from '../../../PluginRegistry/lib/types'
import { useTextbit } from '../../../../components/TextbitRoot'
import { TextbitEditor } from '../../../../lib'
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
          handleOnKeyDown(textbitEditor, actions, event)
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
