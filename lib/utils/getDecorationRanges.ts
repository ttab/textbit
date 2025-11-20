import { Editor, NodeEntry, Node, Text, Element, type Range } from 'slate'
import { PluginRegistryComponent } from '../contexts/PluginRegistry/lib/types'
import { PlaceholdersVisibility } from '../contexts/TextbitContext'

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Create ranges for all decorations needed, includes spellchecking and placeholders
 */
export function getDecorationRanges(
  editor: Editor,
  nodeEntry: NodeEntry,
  components: Map<string, PluginRegistryComponent>,
  placeholders?: PlaceholdersVisibility,
  placeholder?: string
): Range[] {
  const [node, path] = nodeEntry
  const ranges: Range[] = []

  // Add ranges from spellchecking
  if (editor.spellingLookupTable?.size && Text.isText(node)) {
    const [topNode] = Editor.node(editor, [path[0]])

    if (Element.isElement(topNode) && topNode.id) {
      const spelling = editor.spellingLookupTable.get(topNode.id)

      if (spelling?.errors.length) {
        const text = node.text
        spelling.errors.forEach((spellingError) => {
          // Escape special regex characters and use proper RegExp constructor
          const escapedText = escapeRegExp(spellingError.text)
          const regex = new RegExp(`\\b${escapedText}\\b`, 'gi')
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
      if (placeholders === 'multiple' || (placeholders === 'single' && parentNode.id === editor.children[0].id)) {
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
