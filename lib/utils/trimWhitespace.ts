import { Editor, Node, Transforms } from 'slate'
import type { NodeEntry } from 'slate'

/**
 * Trims whitespace from the start and end of a text element's content.
 *
 * Specifically does not trim non-breaking spaces (\u00A0) or other
 * specialized spacers that are used to keep numbers together or are
 * used in different languages.
 *
 * Returns true if a transformation was made (causing normalization to re-run).
 */
export function trimWhitespace(editor: Editor, nodeEntry: NodeEntry): boolean {
  const [node, path] = nodeEntry

  const texts = Array.from(Node.texts(node))
  if (texts.length === 0) {
    return false
  }

  const [firstText, firstRelPath] = texts[0]
  const leadingMatch = firstText.text.match(/^[\t\n\r\f\v ]+/)
  if (leadingMatch) {
    const absPath = [...path, ...firstRelPath]
    Transforms.delete(editor, {
      at: {
        anchor: { path: absPath, offset: 0 },
        focus: { path: absPath, offset: leadingMatch[0].length }
      }
    })
    return true
  }

  const [lastText, lastRelPath] = texts[texts.length - 1]
  const trailingMatch = lastText.text.match(/[\t\n\r\f\v ]+$/)
  if (trailingMatch) {
    const absPath = [...path, ...lastRelPath]
    const textLength = lastText.text.length
    Transforms.delete(editor, {
      at: {
        anchor: { path: absPath, offset: textLength - trailingMatch[0].length },
        focus: { path: absPath, offset: textLength }
      }
    })
    return true
  }

  return false
}
