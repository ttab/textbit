import React, { // Necessary for esbuild
  useContext,
  useEffect,
  useRef,
} from 'react'
import { Editor as SlateEditor, Transforms, Element as SlateElement, Editor, Text, Range, NodeEntry } from "slate"
import { Editable, RenderElementProps, RenderLeafProps, useFocused } from "slate-react"
import { toggleLeaf } from '@/lib/toggleLeaf'
import { PluginRegistryAction } from '../../../PluginRegistry/lib/types'
import { useTextbit } from '@/components/TextbitRoot'
import { TextbitEditor } from '@/lib'
import { TBEditor } from '@/types'
import { useContextMenu } from '@/hooks/useContextMenu'
import { ContextMenuHintsContext } from '@/components/ContextMenu/ContextMenuHintsContext'

export const SlateEditable = ({ className = '', renderSlateElement, renderLeafComponent, textbitEditor, actions, autoFocus, onBlur, onFocus, onDecorate }: {
  className?: string
  renderSlateElement: (props: RenderElementProps) => JSX.Element
  renderLeafComponent: (props: RenderLeafProps) => JSX.Element
  textbitEditor: Editor
  actions: PluginRegistryAction[]
  autoFocus: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onDecorate?: ((entry: NodeEntry) => Range[]) | undefined
}): JSX.Element => {
  const focused = useFocused()
  const { placeholder } = useTextbit()
  const ref = useRef<HTMLDivElement>(null)
  const contextMenuContext = useContext(ContextMenuHintsContext)

  useContextMenu(ref, (hints) => {
    if (!hints) {
      contextMenuContext?.dispatch({
        menu: undefined,
        spelling: undefined
      })
      return
    }

    contextMenuContext?.dispatch({
      menu: {
        x: hints.x,
        y: hints.y,
        target: hints.target,
        originalEvent: hints.originalEvent,
        nodeEntry: hints.nodeEntry
      },
      spelling: hints.spelling
    })
  })

  useEffect(() => {
    if (!autoFocus) {
      return
    }
    setAutoFocus(textbitEditor)
  }, [autoFocus])

  return (
    <div ref={ref}>
      <Editable
        placeholder={placeholder}
        data-state={focused ? 'focused' : ''}
        className={className}
        renderElement={renderSlateElement}
        renderLeaf={renderLeafComponent}
        onKeyDown={event => handleOnKeyDown(textbitEditor, actions, event)}
        decorate={onDecorate}
        autoFocus={autoFocus}
        onBlur={onBlur}
        onFocus={onFocus}
        spellCheck={false}
      />
    </div>
  )
}


/**
 * Set autofocus on load.
 *
 * Set it to beginning if there are multiple lines, otherwise to
 * the end of the first (only line.Needs setTimout() when in yjs env.
 */
function setAutoFocus(textbitEditor: TBEditor) {
  setTimeout(() => {
    const nodes = Array.from(
      Editor.nodes(textbitEditor, {
        at: [],
        match: el => {
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
    }
    else if (action.plugin.class === 'text') {
      // FIXME: Should not allow transforming blocks (only text class element)
      Transforms.setNodes(
        editor,
        { type: action.plugin.name },
        { match: n => SlateElement.isElement(n) && SlateEditor.isBlock(editor, n) }
      )
    }
    break
  }
}
