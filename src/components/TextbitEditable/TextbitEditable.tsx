import React from 'react' // Necessary for esbuild
import { useEffect, useMemo, useCallback } from 'react'
import { createEditor, Editor as SlateEditor, Descendant, Transforms, Element as SlateElement, Range, Path, Node, BaseEditor } from "slate"
import { HistoryEditor, withHistory } from "slate-history"
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react"
import * as uuid from 'uuid'
import { YHistoryEditor } from '@slate-yjs/core'

import './index.css'

import { DragAndDrop } from './components/DragAndDrop'
import { withInline } from './with/inline'
import { calculateStats } from '@/lib/index'

import { ElementComponent } from './components/Element'
import { Leaf } from './components/Leaf'
import { toggleLeaf } from '@/lib/toggleLeaf'
import { withInsertText } from './with/insertText'
import { withNormalizeNode } from './with/normalizeNode'
import { withEditableVoids } from './with/editableVoids'
import { ContentToolbar } from './components/toolbar/content'
import { InlineToolbar } from './components/toolbar/inline'
import { withInsertBreak } from './with/insertBreak'
import { withInsertHtml } from './with/insertHtml'
import { PresenceOverlay } from './components/PresenceOverlay/PresenceOverlay'
import { useTextbit } from '../Textbit'
import { debounce } from '@/lib/debounce'
import { usePluginRegistry } from '../PluginRegistry'
import { PluginRegistryAction, PluginRegistryComponent } from '../PluginRegistry/lib/types'

/**
 * @interface
 * TextbitEditable props
 */
export interface TextbitEditableProps {
  onChange?: (value: Descendant[]) => void
  value: Descendant[]
  yjsEditor?: SlateEditor
}


export const TextbitEditable = ({ value, onChange, yjsEditor }: TextbitEditableProps) => {
  const inValue = value || [{
    id: uuid.v4(),
    type: "core/text",
    class: "text",
    children: [
      { text: "" }
    ]
  }]

  const { dispatch } = useTextbit()
  const {
    plugins,
    elementComponents,
    actions
  } = usePluginRegistry()

  const textbitEditor = useMemo<BaseEditor & ReactEditor & HistoryEditor>(() => {
    const e = SlateEditor.isEditor(yjsEditor) ? yjsEditor : createEditor()

    if (!YHistoryEditor.isYHistoryEditor(e)) {
      withHistory(e)
    }
    withReact(e)

    withInline(e)
    withInsertText(e, plugins)
    withNormalizeNode(e, plugins, elementComponents)

    withEditableVoids(e, elementComponents)
    withInsertBreak(e, elementComponents)
    withInsertHtml(e, elementComponents, plugins)

    return e
  }, [])

  useEffect(() => {
    const [words, characters] = calculateStats(textbitEditor)
    dispatch({
      words,
      characters
    })
  }, [])


  const renderSlateElement = useCallback((props: RenderElementProps) => {
    return ElementComponent(props)

  }, [])

  const renderLeafComponent = useCallback((props: RenderLeafProps) => {
    return Leaf(props)
  }, [])

  const debouncedOnchange = useMemo(() => {
    return debounce((value: Descendant[]) => {
      if (onChange) {
        onChange(value)
      }

      const [words, characters] = calculateStats(textbitEditor)

      dispatch({
        words,
        characters
      })
    }, 250)
  }, [])

  const handleOnChange = useCallback((value: Descendant[]) => {
    const isAstChange = textbitEditor.operations.some(
      op => 'set_selection' !== op.type
    )
    if (isAstChange) {
      debouncedOnchange(value)
    }
  }, [])

  return (
    <DragAndDrop>

      <Slate editor={textbitEditor} initialValue={inValue} onChange={(value) => {
        handleOnChange(value)
      }}>

        <InlineToolbar
          actions={actions.filter(action => ['leaf', 'inline'].includes(action.plugin.class))}
        />
        <ContentToolbar
          actions={actions.filter(action => action.plugin.class !== 'leaf')}
        />

        <PresenceOverlay isCollaborative={!!yjsEditor}>
          <Editable
            className="slate-root"
            renderElement={renderSlateElement}
            renderLeaf={renderLeafComponent}
            onKeyDown={event => handleOnKeyDown(textbitEditor, actions, event)}
            decorate={([node, path]) => handleDecoration(textbitEditor, elementComponents, node, path)}
          />
        </PresenceOverlay>
      </Slate>

    </DragAndDrop>
  )
}

/*
 * Display decoration when node is
 * 1. not the editor
 * 2. node is empty
 * 3. selection is on this node
 * 4. selection is collapsed (it does not span more nodes)
 */
function handleDecoration(editor: SlateEditor, elementComponents: Map<string, PluginRegistryComponent>, node: Node, path: Path) {
  if (
    editor.selection != null &&
    !SlateEditor.isEditor(node) &&
    SlateEditor.string(editor, [path[0]]) === "" &&
    Range.includes(editor.selection, path) &&
    Range.isCollapsed(editor.selection) &&
    SlateElement.isElement(node)
  ) {
    const entry = elementComponents.get(node.type)

    return [
      {
        ...editor.selection,
        placeholder: entry?.componentEntry?.placeholder || '',
      }
    ]
  }

  return []
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

    if (action.handler && true !== action.handler({ editor })) {
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
