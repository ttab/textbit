import React from 'react' // Necessary for esbuild
import { MdRadar } from 'react-icons/md'
import { convertToText } from '../../../../../lib/utils'
import { MimerPlugin, RenderElementFunction } from '../../../types'

const render: RenderElementFunction = ({ children }) => {
    return <div className="text-sm font-bold text-sans-serif">
        <span style={{ padding: '3px 9px 2px 9px', display: 'inline-block' }} className="bg-base-focus">{children}</span>
    </div>
}

export const Dateline: MimerPlugin = {
    class: 'text',
    name: 'core/dateline',
    component: {
        placeholder: 'Dateline',
        render
    },
    actions: [
        {
            title: 'Dateline',
            tool: <MdRadar />,
            hotkey: 'mod+3',
            handler: ({ editor }) => {
                convertToText(editor, 'core/dateline')
            }
        }
    ],
}