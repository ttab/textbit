import React from 'react' // Necessary for esbuild
import { MdOutlineShortText } from 'react-icons/md'
import { convertToText } from '../../../../../lib/utils'
import { MimerPlugin, RenderElementFunction } from '../../../types'

const render: RenderElementFunction = ({ children }) => {
    return <div className="font-bold">
        {children}
    </div>
}

export const Leadin: MimerPlugin = {
    class: 'text',
    name: 'core/preamble',
    component: {
        placeholder: 'Leadin',
        render
    },
    actions: [
        {
            title: 'Leadin',
            tool: <MdOutlineShortText />,
            hotkey: 'mod+2',
            handler: ({ editor }) => {
                convertToText(editor, 'core/preamble')
            }
        }
    ],
}