import React, { // Necessary for esbuild
  useContext, useLayoutEffect
} from 'react'
import { Editor as SlateEditor, Transforms, Element as SlateElement, Range, Path, Node, Editor } from "slate"
import { Editable, RenderElementProps, RenderLeafProps, useFocused } from "slate-react"
import { toggleLeaf } from '@/lib/toggleLeaf'
import { PluginRegistryAction, PluginRegistryComponent } from '../../../PluginRegistry/lib/types'
import { FocusContext } from '../../../TextbitRoot/FocusContext'

export const SlateEditable = ({ className, renderSlateElement, renderLeafComponent, textbitEditor, actions, components, displayPlaceholders }: {
  className: string
  renderSlateElement: (props: RenderElementProps) => JSX.Element
  renderLeafComponent: (props: RenderLeafProps) => JSX.Element
  textbitEditor: Editor
  actions: PluginRegistryAction[]
  components: Map<string, PluginRegistryComponent>
  displayPlaceholders: boolean
}): JSX.Element => {
  const slateIsFocused = useFocused()
  const { focused, setFocused } = useContext(FocusContext)

  useLayoutEffect(() => {
    // FIXME: This might be unnecessary if we use dependency array correctly...
    if (focused !== slateIsFocused) {
      setFocused(slateIsFocused)
    }
  })

  return (
    <Editable
      data-state={focused ? 'focused' : ''}
      className={className}
      renderElement={renderSlateElement}
      renderLeaf={renderLeafComponent}
      onKeyDown={event => handleOnKeyDown(textbitEditor, actions, event)}
      decorate={([node, path]) => handleDecoration(textbitEditor, components, node, path, displayPlaceholders)}
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
function handleDecoration(editor: SlateEditor, components: Map<string, PluginRegistryComponent>, node: Node, path: Path, displayPlaceholders: boolean) {
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
        placeholder: (entry?.componentEntry?.placeholder && displayPlaceholders) ? entry.componentEntry.placeholder : ''
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
