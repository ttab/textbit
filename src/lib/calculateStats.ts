import { Editor, Element, Node } from "slate"

export default function calculateStats(editor: Editor): number[] {
    const textNodes = Array.from(Editor.nodes(editor, {
        at: [],
        match: n => Element.isElement(n) && ['text', 'textblock'].includes(n.class || '')
    }))

    let words = 0,
        characters = 0

    for (const [node] of textNodes) {
        const str = Node.string(node).trim()
        words = words + str.split(/\s+/).filter(i => i !== '').length
        characters = characters + str.length
    }

    return [words, characters]
}