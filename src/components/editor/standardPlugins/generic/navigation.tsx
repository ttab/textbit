import { Transforms } from 'slate'
import { getElementPosition } from '../../../../lib/utils'
import { TextbitPlugin } from '../../../../types'

export const Navigation: TextbitPlugin = {
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