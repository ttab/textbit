import { Editor, Transforms, Range, Path, Node } from "slate"
import * as uuid from 'uuid'

import { Element as SlateElement, BaseRange } from 'slate'
import { RegistryComponent } from "../registry"

/**
 * FIXME: Important bugs!
 * BUG: When hitting <enter> in the middle of a text block an empty paragraph is inserted.
 * BUG: When hitting <enter> in the middle of a text block the split paragraphs both get the same id.
 */
export const withInsertBreak = (editor: Editor, components: Map<string, RegistryComponent>) => {
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
      if (component?.component?.constraints?.allowBreak === false) {
        return
      }
    }

    const matches = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection as BaseRange),
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.class !== 'inline'
      })
    )

    const comps = Array.from(components)

    // Handle common case where <enter> should by default create paragraph and not same as current node
    // But only if on the highest level (not in a blockquote sub element for example)
    if (Range.isCollapsed(selection) && matches.length < 2) {
      // New nodes should be paragraph with a newly generated id
      return Transforms.insertNodes(editor, {
        id: uuid.v4(),
        class: 'text',
        type: 'core/text',
        children: [{ text: "" }]
      })
    }

    return insertBreak()
  }

  return editor
}