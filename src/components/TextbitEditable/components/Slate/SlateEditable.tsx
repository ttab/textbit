import React, { // Necessary for esbuild
  useContext, useLayoutEffect
} from 'react'
import { Editor as SlateEditor, Transforms, Element as SlateElement, Range, Path, Node, Editor, Text, Element } from "slate"
import { Editable, RenderElementProps, RenderLeafProps, useFocused } from "slate-react"
import { toggleLeaf } from '@/lib/toggleLeaf'
import { PluginRegistryAction, PluginRegistryComponent } from '../../../PluginRegistry/lib/types'
import { FocusContext } from '../../../TextbitRoot/FocusContext'
import { useTextbit } from '@/components/TextbitRoot'

export const SlateEditable = ({ className, renderSlateElement, renderLeafComponent, textbitEditor, actions, components }: {
  className: string
  renderSlateElement: (props: RenderElementProps) => JSX.Element
  renderLeafComponent: (props: RenderLeafProps) => JSX.Element
  textbitEditor: Editor
  actions: PluginRegistryAction[]
  components: Map<string, PluginRegistryComponent>
}): JSX.Element => {
  const slateIsFocused = useFocused()
  const { focused, setFocused } = useContext(FocusContext)
  const { placeholder, placeholders } = useTextbit()

  useLayoutEffect(() => {
    // FIXME: This might be unnecessary if we use dependency array correctly...
    if (focused !== slateIsFocused) {
      setFocused(slateIsFocused)
    }
  })

  return (
    <Editable
      placeholder={placeholder}
      data-state={focused ? 'focused' : ''}
      className={className}
      renderElement={renderSlateElement}
      renderLeaf={renderLeafComponent}
      onKeyDown={event => handleOnKeyDown(textbitEditor, actions, event)}
      decorate={([node, path]) => handleDecoration(textbitEditor, components, node, path, placeholders)}
    />
  )
}

/*
 * Display placeholder as decoration when node is an empty text node
 */
function handleDecoration(editor: SlateEditor, components: Map<string, PluginRegistryComponent>, node: Node, path: Path, placeholders: boolean) {
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
    placeholder: (entry?.componentEntry?.placeholder && placeholders) ? entry.componentEntry.placeholder : ''
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
