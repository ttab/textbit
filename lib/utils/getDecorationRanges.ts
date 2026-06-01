import { Editor, NodeEntry, Node, Text, Element, type Range } from 'slate'
import { PluginRegistryComponent } from '../contexts/PluginRegistry/lib/types'
import { PlaceholdersVisibility } from '../contexts/TextbitContext'
import { SpellcheckLookupTable } from '../types'

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Create ranges for all decorations needed, includes spellchecking and placeholders.
 *
 * `editorIsEmpty` is the precomputed answer to "does the whole document
 * contain no text?" — passed in from the caller (typically derived via
 * `useSlateSelector` once per emptiness change). It is only consulted in
 * 'single' placeholder mode, where the global placeholder must hide as
 * soon as *any* block has content, not just when the first block is empty.
 */
export function getDecorationRanges(
  editor: Editor,
  spellingLookupTable: SpellcheckLookupTable,
  nodeEntry: NodeEntry,
  components: Map<string, PluginRegistryComponent>,
  placeholders?: PlaceholdersVisibility,
  placeholder?: string,
  editorIsEmpty?: boolean
): Range[] {
  const [node, path] = nodeEntry
  const ranges: Range[] = []

  // Add ranges from spellchecking
  if (spellingLookupTable?.size && Text.isText(node)) {
    const [topNode] = Editor.node(editor, [path[0]])

    if (Element.isElement(topNode) && topNode.id) {
      const spelling = spellingLookupTable.get(topNode.id)

      if (spelling?.errors.length) {
        const text = node.text
        spelling.errors.forEach((spellingError) => {
          // Escape special regex characters
          const escapedText = escapeRegExp(spellingError.text)

          // Unicode word boundary handling (\b only handles ASCII characters)
          const regex = new RegExp(`(?<!\\p{L})${escapedText}(?!\\p{L})`, 'giu')
          const indices = [...text.matchAll(regex)]

          indices.forEach((match) => {
            if (match.index !== undefined) {
              ranges.push({
                anchor: { path, offset: match.index },
                focus: { path, offset: match.index + spellingError.text.length },
                spellingError
              })
            }
          })
        })
      }
    }
  }

  // Placeholders
  if (path.length === 2 && Text.isText(node) && !node.text && placeholders !== 'none') {
    const parentNode = Node.parent(editor, path)

    if (Element.isElement(parentNode) && Node.string(parentNode) === '') {
      // In 'single' mode the placeholder represents emptiness of the whole
      // editor, not just the first block — so a leading empty block (e.g.
      // the user pressed Enter at the start) must not keep the placeholder
      // visible when content exists further down. `editorIsEmpty` is the
      // precomputed answer to that, threaded down from the caller.
      const isFirstBlock = parentNode.id === editor.children[0].id
      const showPlaceholder = placeholders === 'multiple'
        || (placeholders === 'single' && isFirstBlock && editorIsEmpty !== false)

      if (showPlaceholder) {
        const entryPlaceholder = components.get(parentNode.type)?.componentEntry?.placeholder
        const value = (placeholders === 'single')
          ? placeholder
          : (typeof entryPlaceholder === 'function')
            ? entryPlaceholder(parentNode)
            : entryPlaceholder ?? ''

        ranges.push({
          anchor: { path, offset: 0 },
          focus: { path, offset: 0 },
          placeholder: value
        })
      }
    }
  }

  return ranges
}
