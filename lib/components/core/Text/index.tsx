import { TextbitEditor } from '../../../lib'
import { type Plugin } from '../../../types'


export const Text: Plugin.InitFunction = () => {
  return {
    class: 'text',
    name: 'core/text',
    componentEntry: {
      class: 'text',
      component: TextComponent,
      placeholder: '¶'
    },
    actions: [{
      name: 'set-text',
      title: 'Text',
      hotkey: 'mod+0',
      handler: ({ editor }) => {
        TextbitEditor.convertToTextNode(editor, 'core/text')
      },
      visibility: (element) => {
        return [
          element.type === 'core/text',
          true,
          element.type === 'core/text' && !element?.properties?.role
        ]
      }
    }]
  }
}


function TextComponent(props: Plugin.ComponentProps): JSX.Element {
  const { children, element } = props

  return (
    <>
      {element?.properties?.type === undefined
        ? children
        : <div style={{
          fontStyle: 'italic',
          textDecoration: 'line-through',
          padding: '0.25rem',
          opacity: '0.6'
        }}>{children}</div>
      }
    </>
  )
}
