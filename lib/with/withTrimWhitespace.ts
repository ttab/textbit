import { Editor, Element, Range } from 'slate'

/**
 * Prevents whitespace-only text from being inserted at the start of a
 * top-level block when `editor.trimWhitespace` is true.
 *
 * Trailing whitespace is not prevented during typing (the user may continue
 * with another word), but is trimmed on blur via `TextbitEditable`.
 *
 * Non-breaking spaces (\u00A0) and other Unicode spacers are intentionally
 * not affected.
 */
export function withTrimWhitespace(editor: Editor) {
  const { insertText } = editor

  editor.insertText = (text) => {
    if (editor.trimWhitespace === true && /^[\t\n\r\f\v ]+$/.test(text)) {
      const { selection } = editor
      if (selection && Range.isCollapsed(selection)) {
        for (const [node, path] of Editor.levels(editor, { at: selection.anchor })) {
          if (!Element.isElement(node) || path.length !== 1) continue
          if (Editor.isStart(editor, selection.anchor, path)) {
            return
          }
        }
      }
    }

    insertText(text)
  }

  return editor
}
