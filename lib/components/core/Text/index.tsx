import { TextbitEditor } from '../../../utils/textbit-editor'
import { PluginInitFunction, ComponentProps } from '../../../types'


export const Text: PluginInitFunction = () => {
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


function TextComponent(props: ComponentProps) {
  return <>{props.children}</>
}
