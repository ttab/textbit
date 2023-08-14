import React from 'react' // Necessary for esbuild
import { Element, Transforms } from 'slate'
import { BsTextParagraph } from 'react-icons/bs'
import * as uuid from 'uuid'

import { convertToText } from '../../../../../lib/utils'
import { MimerPlugin, RenderFunction, NormalizeFunction } from '../../../../../types'

const render: RenderFunction = ({ children }) => {
    return <>
        {children}
    </>
}

/**
 * Paragraphs are special in that they are default elements and automatically inserted.
 * So they must have an id set using normlization.
 * Other plugins set it when they create the node/s.
 */
const normalize: NormalizeFunction = (editor, entry) => {
    const [node] = entry
    if (!Element.isElement(node)) {
        return
    }

    if (!node.id) {
        Transforms.setNodes(editor, {
            id: uuid.v4(),
            class: 'text'
        })
    }
}

export const Paragraph: MimerPlugin = {
    class: 'text',
    name: 'paragraph',
    components: [{
        render
    }],
    normalize,
    actions: [
        {
            title: 'Body text',
            tool: <BsTextParagraph />,
            hotkey: 'mod+0',
            handler: (editor) => {
                convertToText(editor, 'paragraph')
            }
        }
    ],
}