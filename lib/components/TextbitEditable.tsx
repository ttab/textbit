import { useCallback, useRef } from 'react'
import { Editor, Element, NodeEntry, Transforms } from 'slate'
import { Editable, useFocused, type RenderElementProps, type RenderLeafProps } from 'slate-react'
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

interface TextbitEditableProps {
  autoFocus?: boolean | 'start' | 'end'
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

export function TextbitEditable(props: TextbitEditableProps) {
  const editor = useSlateStatic()
  const { placeholders, placeholder, readOnly, dir, collaborative } = useTextbit()
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

  const { autoFocus = false, onFocus } = props
  const handleFocus = useCallback((event: React.FocusEvent<HTMLDivElement>) => {
    if (!editor.selection) {
      setInitialSelection(editor, autoFocus)
    }

    if (onFocus) {
      onFocus(event)
    }
  }, [editor, autoFocus, onFocus])

  return (
    <DragStateProvider>
      <PresenceOverlay isCollaborative={collaborative}>
        <Editable
          ref={containerRef}
          data-state={isFocused ? 'focused' : ''}
          readOnly={readOnly}
          autoFocus={!!autoFocus}
          renderElement={renderElement}
          renderLeaf={renderLeaf}
          onFocus={handleFocus}
          onBlur={props.onBlur}
          onKeyDown={onKeyDown}
          decorate={decorate}
          className={props.className}
          style={props.style}
          spellCheck={false}
          placeholder={placeholder}
          dir={dir}
        />
        {props.children}
      </PresenceOverlay>
    </DragStateProvider>
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
function setInitialSelection(editor: Editor, autoFocus: boolean | 'start' | 'end') {
  setTimeout(() => {
    if (autoFocus === 'end') {
      Transforms.select(editor, Editor.end(editor, []))
    } else if (autoFocus) {
      Transforms.select(editor, Editor.start(editor, []))
    }
  }, 0)
}
