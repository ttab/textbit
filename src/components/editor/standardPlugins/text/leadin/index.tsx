import React from 'react' // Necessary for esbuild
import { MdOutlineShortText } from 'react-icons/md'
import { convertToText } from '../../../../../lib/utils'
import { MimerPlugin, RenderLeafFunction } from '../../../../../types'

const render: RenderLeafFunction = ({ children }) => {
    return <div className="font-bold">
        {children}
    </div>
}

export const Leadin: MimerPlugin = {
    class: 'text',
    name: 'core/preamble',
    placeholder: 'Leadin',
    components: [{
        render
    }],
    actions: [
        {
            title: 'Leadin',
            tool: <MdOutlineShortText />,
            hotkey: 'mod+2',
            handler: (editor) => {
                convertToText(editor, 'core/preamble')
            }
        }
    ],
}