import { useCallback, useRef } from 'react'
import { Editor, Element, NodeEntry, Text, Transforms } from 'slate'
import { Editable, useFocused, type RenderElementProps, type RenderLeafProps } from 'slate-react'
import { getDecorationRanges } from '../utils/getDecorationRanges'
import { ElementComponent } from './Element/Element'
import { LeafElement } from './Element/LeafElement'
import { usePluginRegistry } from '../hooks/usePluginRegistry'
import { useTextbit } from '../hooks/useTextbit'
import type { PluginRegistryAction } from '../contexts/PluginRegistry/lib/types'
import { toggleLeaf } from '../utils/toggleLeaf'
import { useContextMenu } from '../hooks/useContextMenu'

interface SlateEditableProps {
  editor: Editor
  readOnly?: boolean
  autoFocus?: boolean
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  className?: string
  style?: React.CSSProperties
  decorationKey?: number
}

export function SlateEditableContainer(props: SlateEditableProps) {
  const { editor, readOnly = false, autoFocus = false, onFocus, onBlur, decorationKey } = props
  const { placeholders, placeholder } = useTextbit()
  const { components, actions } = usePluginRegistry()
  const isFocused = useFocused()
  const containerRef = useRef<HTMLDivElement>(null)

  useContextMenu(containerRef)

  const renderElement = useCallback((props: RenderElementProps) => {
    return ElementComponent({
      ...props
    })
  }, [])

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return LeafElement(props)
  }, [])

  const decorate = useCallback((entry: NodeEntry) => {
    return getDecorationRanges(editor, entry, components, placeholders, placeholder)
  }, [editor, components, placeholders, placeholder])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    handleOnKeyDown(editor, actions, event)
  }, [editor, actions])

  const handleFocus = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    if (!editor.selection) {
      setInitialSelection(editor)
    }

    if (onFocus) {
      onFocus(event)
    }
  }, [editor, onFocus])

  return (
    <Editable
      ref={containerRef}
      key={decorationKey}
      data-state={isFocused ? 'focused' : ''}
      readOnly={readOnly}
      autoFocus={autoFocus}
      renderElement={renderElement}
      renderLeaf={renderLeaf}
      onFocus={handleFocus}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      decorate={decorate}
      className={props?.className}
      style={props?.style}
      spellCheck={false}
    />
  )
}

/*
 * Match key events to registered actions keyboard shortcuts. Then either
 * 1. call their action handler
 * 2. toggle leafs on or off
 * 3. transform text nodes to another type
 */
function handleOnKeyDown(editor: Editor, actions: PluginRegistryAction[], event: React.KeyboardEvent<HTMLDivElement>) {
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
        { match: (n) => Element.isElement(n) && Editor.isBlock(editor, n) }
      )
    }
    break
  }
}

/**
 * Set iniital selection on load or on focus.
 *
 * Set it to beginning if there are multiple lines, otherwise to the end of the first.
 * Needs setTimout() when in yjs env.
 */
function setInitialSelection(editor: Editor) {
  const nodes = Array.from(
    Editor.nodes(editor, {
      at: [],
      match: (el) => {
        return Text.isText(el)
      }
    })
  )

  const node = nodes.length ? nodes[0][0] : null
  const offset = (editor.children.length <= 1 && Text.isText(node)) ? node.text.length : 0
  const initialSelection = {
    anchor: { path: [0, 0], offset },
    focus: { path: [0, 0], offset }
  }

  Transforms.select(editor, initialSelection)
}
