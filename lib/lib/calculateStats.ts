import { Editor, Element, Node } from 'slate'
import type { NodeEntry } from 'slate'
import type { TextbitStats } from '../components/TextbitRoot/TextbitContext'

export default function calculateStats(editor: Editor): TextbitStats {
  const textNodesArticle = Array.from(Editor.nodes(editor, {
    at: [],
    match: (n, path) => Element.isElement(n)
      && ['core/text'].includes(n.type || '')
      && n.properties?.role !== 'vignette'
      && path.length === 1
  }))

  const textNodesAll = Array.from(Editor.nodes(editor, {
    at: [],
    match: (n) => Element.isElement(n) && ['text', 'textblock'].includes(n.class || '')
  }))

  return {
    full: collectStats(textNodesAll),
    short: collectStats(textNodesArticle)
  }
}

function collectStats(nodes: NodeEntry<Node>[]): { words: number, characters: number } {
  let words = 0,
    characters = 0

  for (const [node] of nodes) {
    const str = Node.string(node).trim()
    words += (str.match(/\p{L}+/gu) || []).length
    characters = characters + str.length
  }

  return { words, characters }
}
