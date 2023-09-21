import { Transforms } from 'slate'
import { getElementPosition } from '../../../../lib/utils'
import { MimerPlugin } from '../../types'

export const Navigation: MimerPlugin = {
    class: 'generic',
    name: 'navigation',
    actions: [
        {
            hotkey: 'mod+option+up',
            handler: ({ editor }) => {
                const position = getElementPosition(editor)

                Transforms.moveNodes(
                    editor,
                    {
                        at: [position],
                        to: [position - 1]
                    }
                )
            }
        },
        {
            hotkey: 'mod+option+down',
            handler: ({ editor }) => {
                const position = getElementPosition(editor)

                Transforms.moveNodes(
                    editor,
                    {
                        at: [position],
                        to: [position + 1]
                    }
                )
            }
        }
    ]
}