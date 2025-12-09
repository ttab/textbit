import { useCallback, useEffect, useState } from 'react'
import { Editor, Element, NodeEntry, Transforms } from 'slate'
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
  const [decorationsKey, setDecorationsKey] = useState(0)
  const handleContextMenu = useContextMenu()
  const [spellingLookupTable, setSpellingLookupTable] = useState<SpellcheckLookupTable>(new Map())
  const { onFocus, autoFocus = false } = props

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

    // HACK: Deselect and select the editor after spellcheck completes
    // HACK: to ensure the dom selection is correctly updated.
    editor.onSpellcheckComplete((newLookupTable) => {
      const selection = editor.selection
      setSpellingLookupTable(newLookupTable)
      ReactEditor.deselect(editor)

      setTimeout(() => {
        if (selection) {
          Transforms.select(editor, selection)
        }
      }, 10)
      // setDecorationsKey(prev => prev + 1)
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
    handleOnKeyDown(editor, actions, event)
  }, [editor, actions])

  return (
    <DragStateProvider>
      <PresenceOverlay isCollaborative={collaborative}>
        <Editable
          autoFocus={!!autoFocus}
          // key={decorationsKey}
          data-state={isFocused ? 'focused' : ''}
          readOnly={readOnly}
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
          onContextMenu={handleContextMenu}
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
