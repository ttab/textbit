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

interface SlateEditableProps {
  editor: Editor
  readOnly?: boolean
  autoFocus?: boolean
  placeholder?: string
  onFocus?: React.FocusEventHandler<HTMLDivElement>
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  className?: string
  style?: React.CSSProperties
  decorationKey?: number
}

export function SlateEditableContainer(props: SlateEditableProps) {
  const { editor, readOnly = false, autoFocus = false, onFocus, onBlur, placeholder, decorationKey } = props
  const { placeholders } = useTextbit()
  const { components, actions } = usePluginRegistry()
  const isFocused = useFocused()
  const containerRef = useRef<HTMLDivElement>(null)

  const renderElement = useCallback((props: RenderElementProps) => {
    return ElementComponent({
      ...props
    })
  }, [])

  const renderLeaf = useCallback((props: RenderLeafProps) => {
    return LeafElement(props)
  }, [])

  const decorate = useCallback((entry: NodeEntry) => {
    return getDecorationRanges(editor, entry, components, placeholders)
  }, [editor, components, placeholders])

  const onKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    handleOnKeyDown(editor, actions, event)
  }, [editor, actions])

  return (
    <div ref={containerRef}>
      <Editable
        key={decorationKey}
        placeholder={placeholder}
        data-state={isFocused ? 'focused' : ''}
        readOnly={readOnly}
        autoFocus={autoFocus}
        renderElement={renderElement}
        renderLeaf={renderLeaf}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        decorate={decorate}
        className={props?.className}
        style={props?.style}
        spellCheck={false}
      ></Editable>
    </div>
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
