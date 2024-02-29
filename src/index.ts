import {
  Textbit as TextbitObj,
  TextbitEditable,
  TextbitFooter,
  ContentTools,
  useTextbit,
  usePluginRegistry,
  ContextTools,
  StandardPlugins
} from './components'

import { GutterProvider } from './components/GutterProvider/GutterProvider'

export const Textbit = {
  Editor: TextbitObj,
  Editable: TextbitEditable,
  Footer: TextbitFooter,
  Gutter: GutterProvider.Gutter,
  Plugins: StandardPlugins
}
export default Textbit

export { TextbitObj as Editor }
export { TextbitEditable as Editable }
export { TextbitFooter as Footer }
export { StandardPlugins as Plugins }
export const Gutter = GutterProvider.Gutter

export const Menu = {
  Root: ContentTools.Menu,
  Trigger: ContentTools.Trigger,
  Content: ContentTools.Content,
  Group: ContentTools.Group,
  Item: ContentTools.Item,
  Icon: ContentTools.Icon,
  Label: ContentTools.Label,
  Hotkey: ContentTools.Hotkey
}

export const Toolbar = {
  Root: ContextTools.Menu,
  Group: ContextTools.Group,
  Item: ContextTools.Item
}

export { useTextbit }
export { usePluginRegistry }
export * from './lib'
export * from './types'
