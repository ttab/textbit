import React from 'react' // Necessary for esbuild
import { MdTitle } from 'react-icons/md'

import { MimerPlugin } from '../../../../../types'
import { convertToText } from '../../../../../lib/utils'

export const Title: MimerPlugin = {
    class: 'text',
    name: 'core/heading-1',
    placeholder: 'Title',
    components: [{
        render: ({ children }) => {
            return <div className="text-xl2 font-bold text-sans-serif">
                {children}
            </div>
        }
    }],
    actions: [
        {
            title: 'Title',
            tool: <MdTitle />,
            hotkey: 'mod+1',
            handler: (editor) => {
                convertToText(editor, 'core/heading-1')
            }
        }
    ],
}