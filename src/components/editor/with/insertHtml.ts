import { BaseRange, Editor, Element, Node, Path, Transforms } from 'slate'
import * as uuid from 'uuid'
import { Registry } from '../registry'
import { TextbitEditor } from '@/lib/textbit-editor'
import { Range } from 'slate'
import { TextbitElement } from '@/lib/textbit-element'
import { componentConstraints } from '@/lib/componentConstraints'

export const withInsertHtml = (editor: Editor) => {
    const { insertData } = editor

    editor.insertData = (data) => {
        const { selection } = editor
        if (!selection) {
            return insertData(data)
        }

        // We only take care of simple collapsed selections or range selections
        // in the same text node.
        const edges = Range.edges(selection)
        if (!Range.isCollapsed(selection) && 0 !== Path.compare(edges[0].path, edges[1].path)) {
            return insertData(data)
        }

        // Split text into paragraphs based on newlines or carriage returns
        const text = data.getData('text/plain')
        const paragraphedText = text.replace(/[\r\n]{2,}/g, "\n").trim()
        const paragraphs = paragraphedText.split("\n").map(t => t.trim())
        if (paragraphs.length < 2) {
            return insertData(data)
        }

        // Find node and which component this is related to
        const parent = TextbitEditor.parent(editor, selection)
        const node = parent[0] as Element
        const { component: tbComponent = undefined } = Registry.elementComponents.get(node.type) || {}
        if (!tbComponent) {
            return insertData(data)
        }

        // Only handle paste inside of text elements
        if (node.class !== 'text') {
            return insertData(data)
        }

        // If we don't allow break, let default put all text in same node
        const { allowBreak } = componentConstraints(tbComponent)
        if (!allowBreak) {
            return insertData(data)
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
    }
}