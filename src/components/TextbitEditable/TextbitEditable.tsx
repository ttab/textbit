import React, { // Necessary for esbuild
  PropsWithChildren,
  useEffect,
  useMemo,
  useCallback
} from 'react'
import { createEditor, Editor as SlateEditor, Descendant, Transforms, Element as SlateElement, Range, Path, Node, BaseEditor, Editor } from "slate"
import { HistoryEditor, withHistory } from "slate-history"
import { Editable, ReactEditor, RenderElementProps, RenderLeafProps, Slate, useFocused, withReact } from "slate-react"
import * as uuid from 'uuid'
import { YHistoryEditor } from '@slate-yjs/core'

import { DragStateProvider } from './DragStateProvider'
import { withInline } from './with/inline'
import { calculateStats } from '@/lib/index'

import { ElementComponent } from './components/Element'
import { Leaf } from './components/Leaf'
import { toggleLeaf } from '@/lib/toggleLeaf'
import { withInsertText } from './with/insertText'
import { withNormalizeNode } from './with/normalizeNode'
import { withEditableVoids } from './with/editableVoids'
import { withInsertBreak } from './with/insertBreak'
import { withInsertHtml } from './with/insertHtml'
import { PresenceOverlay } from './components/PresenceOverlay/PresenceOverlay'
import { useTextbit } from '../TextbitRoot'
import { debounce } from '@/lib/debounce'
import { usePluginRegistry } from '../PluginRegistry'
import { PluginRegistryAction, PluginRegistryComponent } from '../PluginRegistry/lib/types'
import { PositionProvider } from '../ContextTools/PositionProvider'
import { Gutter } from '../GutterProvider'


export const TextbitEditable = ({ children, value, onChange, yjsEditor, gutter = true, dir = 'ltr', className = '' }: PropsWithChildren & {
  onChange?: (value: Descendant[]) => void
  value?: Descendant[]
  yjsEditor?: SlateEditor
  gutter?: boolean
  dir?: 'ltr' | 'rtl'
  className?: string
}) => {
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
    components,
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
    withNormalizeNode(e, plugins, components)

    withEditableVoids(e, components)
    withInsertBreak(e, components)
    withInsertHtml(e, components, plugins)

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
    <DragStateProvider>
      <Slate
        editor={textbitEditor}
        initialValue={inValue}
        onChange={(value) => { handleOnChange(value) }}
      >
        <PositionProvider inline={true}>
          <Gutter.Provider dir={dir} gutter={gutter}>

            <Gutter.Content>
              <PresenceOverlay isCollaborative={!!yjsEditor}>
                <SlateEditable
                  className={className}
                  renderSlateElement={renderSlateElement}
                  renderLeafComponent={renderLeafComponent}
                  textbitEditor={textbitEditor}
                  actions={actions}
                  components={components}
                />
              </PresenceOverlay>
            </Gutter.Content>

            {children}

          </Gutter.Provider>
        </PositionProvider>
      </Slate>
    </DragStateProvider >
  )
}

const SlateEditable = ({ className, renderSlateElement, renderLeafComponent, textbitEditor, actions, components }: {
  className: string
  renderSlateElement: (props: RenderElementProps) => JSX.Element
  renderLeafComponent: (props: RenderLeafProps) => JSX.Element
  textbitEditor: Editor
  actions: PluginRegistryAction[]
  components: Map<string, PluginRegistryComponent>
}): JSX.Element => {
  const focused = useFocused()

  return (
    <Editable
      data-state={focused ? 'focused' : ''}
      className={className}
      renderElement={renderSlateElement}
      renderLeaf={renderLeafComponent}
      onKeyDown={event => handleOnKeyDown(textbitEditor, actions, event)}
      decorate={([node, path]) => handleDecoration(textbitEditor, components, node, path)}
    />
  )
}

/*
 * Display decoration when node is
 * 1. not the editor
 * 2. node is empty
 * 3. selection is on this node
 * 4. selection is collapsed (it does not span more nodes)
 */
function handleDecoration(editor: SlateEditor, components: Map<string, PluginRegistryComponent>, node: Node, path: Path) {
  if (
    editor.selection != null &&
    !SlateEditor.isEditor(node) &&
    SlateEditor.string(editor, [path[0]]) === "" &&
    Range.includes(editor.selection, path) &&
    Range.isCollapsed(editor.selection) &&
    SlateElement.isElement(node)
  ) {
    const entry = components.get(node.type)

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
