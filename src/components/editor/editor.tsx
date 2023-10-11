import React from 'react' // Necessary for esbuild
import { useEffect, useMemo, useState, useCallback } from 'react'
import { createEditor, Editor as SlateEditor, Descendant, Transforms, Element as SlateElement, Range, Path, Node, BaseEditor } from "slate"
import { HistoryEditor, withHistory } from "slate-history"
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, withReact } from "slate-react"
import * as uuid from 'uuid'

import '@fontsource/inter/variable.css'
import '@fontsource/roboto/300.css'
import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/source-serif-pro/300.css'
import '@fontsource/source-serif-pro/400.css'
import '@fontsource/source-serif-pro/600.css'
import '@fontsource/source-serif-pro/700.css'
import '@fontsource/source-serif-pro/900.css'

import './editor-variables.css'
import './editor.css'

import { DragAndDrop } from './components/dragndrop'
import { withInline } from './with/inline'
import { calculateStats, handleChange } from '../../lib/index'
import { Footer } from './components/footer/footer'

import { StandardPlugins } from './standardPlugins'
import { Registry } from './registry'
import { ElementComponent } from './components/element/element'
import { LeafComponent } from './components/leaf/leaf'
import { toggleLeaf } from '../../lib/toggleLeaf'
import { withInsertText } from './with/insertText'
import { withNormalizeNode } from './with/normalizeNode'
import { withEditableVoids } from './with/editableVoids'
import { ContentToolbar } from './components/toolbar/content'
import { InlineToolbar } from './components/toolbar/inline'
import { withInsertBreak } from './with/insertBreak'
import { withInsertHtml } from './with/insertHtml'

interface TextbitEditorProps {
  onChange?: (value: Descendant[]) => void
  value: Descendant[]
  editor?: BaseEditor & ReactEditor & HistoryEditor
}


export default function Editor({ value, onChange, editor }: TextbitEditorProps) {
  const inValue = value || [{
    id: uuid.v4(),
    name: "core/paragraph",
    class: "text",
    children: [
      { text: "" }
    ]
  }]

  useMemo(() => {
    StandardPlugins.forEach(Registry.addPlugin)
  }, [])

  const textbitEditor = useMemo<BaseEditor & ReactEditor & HistoryEditor>(() => {
    const e = SlateEditor.isEditor(editor) ? editor : createEditor()
    withReact(e)
    withHistory(e)
    withInline(e)

    withInsertText(e, Registry.plugins)
    withNormalizeNode(e, Registry.plugins, Registry.elementComponents)

    withEditableVoids(e, value, Registry)
    withInsertBreak(e, Registry.elementComponents)
    withInsertHtml(e, Registry.plugins)

    return e as BaseEditor & ReactEditor & HistoryEditor
  }, [])

  const [stats, setStats] = useState([0, 0])
  useEffect(() => {
    setStats(calculateStats(textbitEditor))
  }, [])


  const renderSlateElement = useCallback((props: RenderElementProps) => {
    return ElementComponent(props, Registry.elementComponents)

  }, [])

  const renderLeafComponent = useCallback((props: RenderLeafProps) => {
    return LeafComponent(props)
  }, [])

  return (
    <div className="textbit textbit-editor bg-base-10 fg-base">
      <DragAndDrop>

        <Slate editor={textbitEditor} value={inValue} onChange={(value) => {
          handleChange(textbitEditor, onChange || null, value)
          setStats(calculateStats(textbitEditor))
        }}>

          <InlineToolbar
            actions={Registry.actions.filter(action => ['leaf', 'inline'].includes(action.plugin.class))}
          />
          <ContentToolbar
            actions={Registry.actions.filter(action => action.plugin.class !== 'leaf')}
          />

          <Editable
            // style={{ minHeight: expandHeight ? '100%' : 'auto' }}
            renderElement={renderSlateElement}
            renderLeaf={renderLeafComponent}
            onKeyDown={event => handleOnKeyDown(event, textbitEditor)}
            decorate={([node, path]) => handleDecoration(textbitEditor, node, path)}
          />

        </Slate>

      </DragAndDrop>
      <Footer stats={{ words: stats[0], characters: stats[1] }} />
    </div>
  )
}

/*
 * Display decoration when node is
 * 1. not the editor
 * 2. node is empty
 * 3. selection is on this node
 * 4. selection is collapsed (it does not span more nodes)
 */
function handleDecoration(editor: SlateEditor, node: Node, path: Path) {
  if (
    editor.selection != null &&
    !SlateEditor.isEditor(node) &&
    SlateEditor.string(editor, [path[0]]) === "" &&
    Range.includes(editor.selection, path) &&
    Range.isCollapsed(editor.selection) &&
    SlateElement.isElement(node)
  ) {
    const entry = Registry.elementComponents.get(node.type)

    return [
      {
        ...editor.selection,
        placeholder: entry?.component?.placeholder || '',
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
function handleOnKeyDown(event: React.KeyboardEvent<HTMLDivElement>, editor: SlateEditor) {
  for (const action of Registry.actions) {
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
