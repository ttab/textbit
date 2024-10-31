import { Editor, Transforms, Range, Path, Node, Text } from "slate"
import * as uuid from 'uuid'

import { Element as SlateElement, BaseRange } from 'slate'
import { PluginRegistryComponent } from '@/components/PluginRegistry/lib/types'

/**
 * FIXME: Important bugs!
 * BUG: When hitting <enter> in the middle of a text block an empty paragraph is inserted.
 * BUG: When hitting <enter> in the middle of a text block the split paragraphs both get the same id.
 */
export const withInsertBreak = (editor: Editor, components: Map<string, PluginRegistryComponent>) => {
  const { insertBreak } = editor

  editor.insertBreak = () => {
    const { selection } = editor

    if (!selection) {
      return // Not sure this could happen, ignore it
    }

    const [{ path: start }, { path: end }] = Range.edges(selection)
    const pathIsEqual = Path.equals(start, end)

    // Ensure allowBreak constraint is met in collapsed node break
    if (Range.isCollapsed(selection) || pathIsEqual) {
      var elements = Array.from(Node.elements(editor, { from: start, to: end }))
      var [element] = elements[elements.length - 1]
      const component = components.get(element?.type || '')

      if (component?.componentEntry?.constraints?.allowBreak === false) {
        return
      }
    }

    if (isSelectionAtLastOffset(editor, selection)) {
      // If last in the node, always create a new paragraph instead of the same as current node.
      // But only if on the highest level (not in a blockquote sub element for example)
      const [node] = Array.from(
        Editor.nodes(editor, {
          at: Editor.unhangRange(editor, selection as BaseRange),
          match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.class !== 'inline'
        })
      )

      if (Range.isCollapsed(selection) && node) {
        // New nodes should be paragraph with a newly generated id
        return Transforms.insertNodes(editor, {
          id: uuid.v4(),
          class: 'text',
          type: 'core/text',
          children: [{ text: "" }]
        })
      }
    }

    return insertBreak()
  }

  return editor
}


function isSelectionAtLastOffset(editor: Editor, selection: Range): boolean {
  const { offset, path } = selection.focus
  const node = Editor.node(editor, path)
  if (!Text.isText(node[0])) {
    return false
  }

  const lastOffset = node[0].text.length
  return offset === lastOffset
}
