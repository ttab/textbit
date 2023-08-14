import { Editor, Element } from "slate"
import { Normalizer } from "../../../types"

export const withLayout = (editor: Editor, normalizers: Normalizer[]) => {
    const { normalizeNode } = editor

    editor.normalizeNode = (entry) => {
        const [node] = entry
        const normalizer = normalizers.find(n => Element.isElement(node) && n.name === node.name)

        if (normalizer && !!normalizer.normalize) {
            return normalizer.normalize(editor, entry)
        }

        return normalizeNode(entry)
    }

    return editor
}