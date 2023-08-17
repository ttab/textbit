import { Editor, Element } from "slate"
import { Normalizer } from "../../../types"

export const withNormalizeNode = (editor: Editor, normalizers: Normalizer[]) => {
    const { normalizeNode } = editor

    editor.normalizeNode = (entry) => {
        const [node] = entry

        if (Element.isElement(node)) {
            const normalizer = normalizers.find(n => n.name === node.type)

            if (normalizer && !!normalizer.normalize) {
                return normalizer.normalize(editor, entry)
            }
        }

        return normalizeNode(entry)
    }

    return editor
}