import { Editor, Range, Element as SlateElement, Transforms } from 'slate'
import { type PluginRegistryComponent } from '../contexts/PluginRegistry/lib/types'

/**
 * Make Shift+Enter insert a soft break (a `\n` in the text leaf).
 *
 * Soft break is opt-in per plugin. It is allowed only when some element
 * ancestor of the selection sets `constraints.allowSoftBreak` to `true`, and
 * it is denied when any ancestor sets it to `false`. With no explicit setting
 * anywhere the break is denied.
 */
export function withInsertSoftBreak(editor: Editor, components: Map<string, PluginRegistryComponent>) {
  editor.insertSoftBreak = () => {
    if (!allowSoftBreak(editor, components)) {
      return
    }

    Transforms.insertText(editor, '\n')
  }

  return editor
}

function allowSoftBreak(
  editor: Editor,
  components: Map<string, PluginRegistryComponent>
): boolean {
  const { selection } = editor
  if (!selection) {
    return false
  }

  const points = Range.isCollapsed(selection)
    ? [selection.anchor]
    : [selection.anchor, selection.focus]

  let allow = false
  for (const point of points) {
    for (const [node] of Editor.levels(editor, { at: point })) {
      if (!SlateElement.isElement(node)) continue

      const constraints = components.get(node.type)?.componentEntry?.constraints
      if (constraints?.allowSoftBreak === false) {
        return false
      }
      if (constraints?.allowSoftBreak === true) {
        allow = true
      }
    }
  }

  return allow
}
