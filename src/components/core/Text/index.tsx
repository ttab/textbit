import React from 'react' // Necessary for esbuild
import { BsTextParagraph } from 'react-icons/bs'
import { Plugin, TextbitEditor } from '../../../types'

import './style.css'

export const Text: Plugin.Definition = {
  class: 'text',
  name: 'core/text',
  componentEntry: {
    class: 'text',
    component: TextComponent,
    placeholder: '¶'
  },
  actions: [{
    title: 'Text',
    hotkey: 'mod+0',
    tool: () => <BsTextParagraph style={{ width: '1em', height: '1em' }} />,
    handler: ({ editor }) => {
      TextbitEditor.convertToTextNode(editor, 'core/text')
    },
    visibility: (element) => {
      return [
        element.type === 'core/text',
        true,
        element.type === 'core/text' && !element?.properties?.type
      ]
    }
  }]
}

function TextComponent(props: Plugin.ComponentProps): JSX.Element {
  const { children, element } = props

  return (
    <>
      {element?.properties?.type === undefined
        ? children
        : <div className="core/text-unknown">{children}</div>
      }
    </>
  )
}
