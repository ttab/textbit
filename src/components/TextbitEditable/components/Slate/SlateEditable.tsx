import React, { // Necessary for esbuild
  FocusEventHandler,
  useCallback,
  useContext, useLayoutEffect
} from 'react'
import { Editor as SlateEditor, Transforms, Element as SlateElement, Path, Node, Editor, Text, Element } from "slate"
import { Editable, RenderElementProps, RenderLeafProps, useFocused } from "slate-react"
import { toggleLeaf } from '@/lib/toggleLeaf'
import { PluginRegistryAction, PluginRegistryComponent } from '../../../PluginRegistry/lib/types'
import { FocusContext } from '@/components/TextbitRoot/FocusContext'
import { useTextbit } from '@/components/TextbitRoot'
import { PlaceholdersVisibility } from '@/components/TextbitRoot/TextbitContext'
import { TextbitEditor } from '@/lib'

export const SlateEditable = ({ className, renderSlateElement, renderLeafComponent, textbitEditor, actions, components, autoFocus, onBlur }: {
  className: string
  renderSlateElement: (props: RenderElementProps) => JSX.Element
  renderLeafComponent: (props: RenderLeafProps) => JSX.Element
  textbitEditor: Editor
  actions: PluginRegistryAction[]
  components: Map<string, PluginRegistryComponent>
  autoFocus: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
}): JSX.Element => {
  const slateIsFocused = useFocused()
  const { focused, setFocused } = useContext(FocusContext)
  const { placeholder, placeholders } = useTextbit()

  useLayoutEffect(() => {
    if (focused !== slateIsFocused) {
      setTimeout(() => {
        setFocused(slateIsFocused)
      }, 0)
    }
  }, [slateIsFocused, focused])

  // Set initial selection on focus it no selection exists
  const onFocus = useCallback<FocusEventHandler<HTMLDivElement>>((evt) => {
    if (!!textbitEditor.selection) {
      return
    }

    // Set it to beginning if there are multiple lines, otherwise to
    // the end of the first (only line.Needs setTimout() when in yjs env.
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
  }, [])

  return (
    <Editable
      placeholder={placeholder}
      data-state={focused ? 'focused' : ''}
      className={className}
      renderElement={renderSlateElement}
      renderLeaf={renderLeafComponent}
      onKeyDown={event => handleOnKeyDown(textbitEditor, actions, event)}
      decorate={([node, path]) => handleDecoration(textbitEditor, components, node, path, placeholders)}
      autoFocus={autoFocus}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  )
}

/*
 * Display placeholder as decoration when node is an empty text node
 */
function handleDecoration(editor: SlateEditor, components: Map<string, PluginRegistryComponent>, node: Node, path: Path, placeholders: PlaceholdersVisibility) {
  if (placeholders !== 'multiple') {
    return []
  }

  if (!Text.isText(node) || !path.length || node.text !== '') {
    return []
  }

  const parent = Node.parent(editor, path)
  if (!Element.isElement(parent)) {
    return []
  }

  const entry = components.get(parent.type)

  return [{
    anchor: { path, offset: 0 },
    focus: { path, offset: 0 },
    placeholder: (entry?.componentEntry?.placeholder) ? entry.componentEntry.placeholder : ''
  }]
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
