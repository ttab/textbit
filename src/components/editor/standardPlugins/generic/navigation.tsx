import { Transforms } from 'slate'
import { TBPlugin } from '../../../../types/types'
import { TextbitEditor } from '@/lib/index'

export const Navigation: TBPlugin = {
  class: 'generic',
  name: 'navigation',
  actions: [
    {
      hotkey: 'mod+option+up',
      handler: ({ editor }) => {
        const position = TextbitEditor.position(editor)

        if (position < 1) {
          return
        }

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
        const position = TextbitEditor.position(editor)
        const positions = TextbitEditor.length(editor)

        if (position < 0 || position + 1 === positions) {
          return
        }

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
