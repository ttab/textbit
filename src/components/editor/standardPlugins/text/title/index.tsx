import React from 'react' // Necessary for esbuild
import { MdTitle } from 'react-icons/md'

import { MimerPlugin, RenderElementProps } from '../../../types'
import { convertToText } from '../../../../../lib/utils'

const render = ({ children }: RenderElementProps) => {
    return <div className="text-xl2 font-bold text-sans-serif">
        {children}
    </div>
}

export const Title: MimerPlugin = {
    class: 'text',
    name: 'core/heading-1',
    component: {
        render,
        placeholder: 'Title',
    },
    actions: [
        {
            title: 'Title',
            tool: <MdTitle />,
            hotkey: 'mod+1',
            handler: ({ editor }) => {
                convertToText(editor, 'core/heading-1')
            }
        }
    ],
}