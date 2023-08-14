import React from 'react' // Necessary for esbuild
import { MdOutlineShortText } from 'react-icons/md'
import { convertToText } from '../../../../../lib/utils'
import { MimerPlugin } from '../../../../../types'

export const Leadin: MimerPlugin = {
    class: 'text',
    name: 'leadin',
    placeholder: 'Leadin',
    components: [{
        render: ({ children }) => {
            return <div className="font-bold">
                {children}
            </div>
        }
    }],
    actions: [
        {
            title: 'Leadin',
            tool: <MdOutlineShortText />,
            hotkey: 'mod+2',
            handler: (editor) => {
                convertToText(editor, 'leadin')
            }
        }
    ],
}