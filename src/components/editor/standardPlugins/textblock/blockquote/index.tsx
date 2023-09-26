import React, { JSX } from 'react' // Necessary for esbuild
import { Transforms, Node, Element } from 'slate'
import { BsChatQuote } from 'react-icons/bs'
import * as uuid from 'uuid'

import {
    MimerActionHandlerProps,
    MimerPlugin,
    RenderElementProps
} from '../../../types'

import { convertLastSibling, getElementPosition as getElementPosition, getSelectedText, insertAt } from '../../../../../lib/utils'
import './style.css'

const render = ({ children }: RenderElementProps): JSX.Element => {
    return <div className="fg-weak">
        {children}
    </div>
}

const renderBody = ({ children }: RenderElementProps) => {
    return <div className="text-xl text-sans-serif font-light">
        {children}
    </div>
}

const renderCaption = ({ children }: RenderElementProps) => {
    return <div className="text-sm italic">
        {children}
    </div>
}

const actionHandler = ({ editor }: MimerActionHandlerProps) => {
    const text = getSelectedText(editor)
    const node = [{
        id: uuid.v4(),
        class: 'textblock',
        type: 'core/blockquote',
        children: [
            {
                type: 'core/blockquote/body',
                children: [{ text: text || '' }]
            },
            {
                type: 'core/blockquote/caption',
                children: [{ text: '' }]
            }
        ]
    }]

    const position = getElementPosition(editor) + (!!text ? 0 : 1)
    insertAt(editor, position, node)

    const atChild = !!text ? 0 : 1
    Transforms.select(editor, {
        anchor: { offset: 0, path: [position, atChild, 0] },
        focus: { offset: 0, path: [position, atChild, 0] },
    })
}


export const Blockquote: MimerPlugin = {
    class: 'text',
    name: 'core/blockquote',
    // normalize: (editor, entry) => {
    //     const [node, path] = entry
    //     if (!Element.isElement(node)) {
    //         return
    //     }

    //     convertLastSibling(editor, node, path, 'core/blockquote/caption', 'core/paragraph')

    //     const bodyNodes: Array<any> = []
    //     for (const [child, childPath] of Node.elements(node)) {
    //         if (child.type === 'core/blockquote/body') {
    //             bodyNodes.push([child, childPath])
    //         }
    //     }

    //     // FIXME: This crash when last node in document
    //     if (!bodyNodes.length || bodyNodes.length < 1) {
    //         Transforms.removeNodes(editor, {
    //             at: [...path],
    //         })
    //         return
    //     }
    // },
    actions: [
        {
            title: 'Blockquote',
            tool: <BsChatQuote />,
            hotkey: 'mod+shift+2',
            handler: actionHandler,
            visibility: (element, rootElement) => {
                return [
                    true, // Always visible
                    true, // Always enabled
                    false // Never active
                ]
            }
        }
    ],
    component: {
        render,
        children: [
            {
                type: 'body',
                render: renderBody
            },
            {
                type: 'caption',
                render: renderCaption,
                constraints: {
                    allowBreak: false
                }
            }
        ]
    }
}