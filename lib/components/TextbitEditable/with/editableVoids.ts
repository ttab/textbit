import { Editor, Element } from 'slate'
import { type PluginRegistryComponent } from '../../../components/PluginRegistry/lib/types'


export const withEditableVoids = (editor: Editor, components: Map<string, PluginRegistryComponent>) => {
  const { isVoid } = editor

  const allComponents: string[] = []
  const voidComponents: string[] = []

  components.forEach((comp) => {
    allComponents.push(comp.type)

    if (comp.class === 'void') {
      voidComponents.push(comp.type)
    }
  })

  editor.isVoid = (element: Element) => {
    if (voidComponents.includes(element.type)) {
      return true
    }

    if (!allComponents.includes(element.type)) {
      // Element types without registered component is considered a void element
      return true
    }

    return isVoid(element)
  }

  return editor
}
