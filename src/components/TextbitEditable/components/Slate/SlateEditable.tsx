import React, { // Necessary for esbuild
  useEffect,
} from 'react'
import { Editor as SlateEditor, Transforms, Element as SlateElement, Path, Node, Editor, Text, Element, Range } from "slate"
import { Editable, RenderElementProps, RenderLeafProps, useFocused } from "slate-react"
import { toggleLeaf } from '@/lib/toggleLeaf'
import { PluginRegistryAction, PluginRegistryComponent } from '../../../PluginRegistry/lib/types'
import { useTextbit } from '@/components/TextbitRoot'
import { PlaceholdersVisibility } from '@/components/TextbitRoot/TextbitContext'
import { TextbitEditor } from '@/lib'
import { TBEditor } from '@/types'

export const SlateEditable = ({ className, renderSlateElement, renderLeafComponent, textbitEditor, actions, components, autoFocus, onBlur, onFocus }: {
  className: string
  renderSlateElement: (props: RenderElementProps) => JSX.Element
  renderLeafComponent: (props: RenderLeafProps) => JSX.Element
  textbitEditor: Editor
  actions: PluginRegistryAction[]
  components: Map<string, PluginRegistryComponent>
  autoFocus: boolean
  onBlur?: React.FocusEventHandler<HTMLDivElement>
  onFocus?: React.FocusEventHandler<HTMLDivElement>
}): JSX.Element => {
  const slateIsFocused = useFocused()
  const { placeholder, placeholders } = useTextbit()

  useEffect(() => {
    if (!autoFocus) {
      return
    }
    setAutoFocus(textbitEditor)
  }, [autoFocus])

  return (
    <Editable
      placeholder={placeholder}
      data-state={slateIsFocused ? 'focused' : ''}
      className={className}
      renderElement={renderSlateElement}
      renderLeaf={renderLeafComponent}
      onKeyDown={event => handleOnKeyDown(textbitEditor, actions, event)}
      decorate={([node, path]) => {
        return handleDecoration(
          textbitEditor,
          components,
          node,
          path,
          placeholders)
      }}
      autoFocus={autoFocus}
      onBlur={onBlur}
      onFocus={onFocus}
    />
  )
}


/**
 * Set autofocus on load.
 *
 * Set it to beginning if there are multiple lines, otherwise to
 * the end of the first (only line.Needs setTimout() when in yjs env.
 */
function setAutoFocus(textbitEditor: TBEditor) {
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
}


/*
 * Handle all decorations
 */
function handleDecoration(
  editor: SlateEditor,
  components: Map<string, PluginRegistryComponent>,
  node: Node,
  path: Path,
  placeholders?: PlaceholdersVisibility
) {
  const ranges: Range[] = []

  // Placeholders
  if (!placeholders || placeholders !== 'multiple') {
    return ranges
  }

  if (!Text.isText(node) || !path.length || node.text !== '') {
    return ranges
  }

  const parent = Node.parent(editor, path)
  if (!Element.isElement(parent)) {
    return ranges
  }

  const entry = components.get(parent.type)

  return [
    ...ranges,
    {
      anchor: { path, offset: 0 },
      focus: { path, offset: 0 },
      placeholder: (entry?.componentEntry?.placeholder) ? entry.componentEntry.placeholder : ''
    }
  ]
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
