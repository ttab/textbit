import { Editor, Transforms, Range, Path, Element, Node } from "slate"
import * as uuid from 'uuid'
import { componentConstraints } from "./componentConstraints"
import { Registry } from "@/components/Registry"
import { TextbitEditor } from "@/lib"


export function pasteToParagraphs(text: string, editor: Editor): boolean | void {
  const { selection } = editor
  if (!selection) {
    return false
  }

  // We only take care of simple collapsed selections or range selections
  // in the same text node.
  const edges = Range.edges(selection)
  if (!Range.isCollapsed(selection) && 0 !== Path.compare(edges[0].path, edges[1].path)) {
    return false
  }

  // Split text into paragraphs based on newlines or carriage returns
  const paragraphedText = text.replace(/[\r\n]{2,}/g, "\n").trim()
  const paragraphs = paragraphedText.split("\n").map(t => t.trim())
  if (paragraphs.length < 2) {
    return false
  }

  // Find node and which component this is related to
  const parent = TextbitEditor.parent(editor, selection)
  const node = parent[0] as Element
  const { componentEntry: tbComponent = undefined } = Registry.elementComponents.get(node.type) || {}
  if (!tbComponent) {
    return false
  }

  // Only handle paste inside of text elements
  if (node.class !== 'text') {
    return false
  }

  // If we don't allow break, let default put all text in same node
  const { allowBreak } = componentConstraints(tbComponent)
  if (!allowBreak) {
    return false
  }

  // If we have a longer path, paste happens in a child node, all
  // new nodes should be of the same type then
  let nodeType = 'core/text'
  let properties: { [key: string]: string | number; } | undefined = {}

  if (parent[1].length > 1) {
    nodeType = node.type
    properties = node.properties
  }

  const nodes: Node[] = paragraphs.map((s) => {
    return {
      id: uuid.v4(),
      type: nodeType,
      class: 'text',
      children: [
        { text: s }
      ],
      properties: properties
    }
  })

  const firstNode = nodes.shift()
  if (firstNode) {
    // The first text should end up in the text where the paste is happening
    Transforms.insertFragment(editor, [firstNode])
  }

  Transforms.insertNodes(editor, nodes)

  return true
}
