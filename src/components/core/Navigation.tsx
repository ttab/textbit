import { Transforms } from 'slate'
import { Plugin } from '@/types'
import { TBEditor } from '@/lib/index'

export const Navigation: Plugin.Definition = {
  class: 'generic',
  name: 'navigation',
  actions: [
    {
      hotkey: 'mod+option+up',
      handler: ({ editor }) => {
        const position = TBEditor.position(editor)

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
        const position = TBEditor.position(editor)
        const positions = TBEditor.length(editor)

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
