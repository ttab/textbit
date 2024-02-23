import {
  Textbit as TextbitObj,
  TextbitEditable,
  TextbitFooter,
  ContentTools,
  useTextbit,
  usePluginRegistry
} from './components'

const Textbit = {
  Editor: TextbitObj,
  Editable: TextbitEditable,
  Footer: TextbitFooter
}

export default Textbit
export { Textbit }
export { TextbitObj as Editor }
export { TextbitEditable as Editable }
export { TextbitFooter as Footer }

export const Gutter = {
  Menu: ContentTools.Menu,
  Group: ContentTools.Group,
  Item: ContentTools.Item,
  Label: ContentTools.Label
}

export { useTextbit }
export { usePluginRegistry }
export * from './lib'
export * from './types'
