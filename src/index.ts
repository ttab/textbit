import {
  TextbitRoot,
  TextbitEditable,
  DropMarker,
  ContentTools,
  useTextbit,
  usePluginRegistry,
  ContextTools,
  StandardPlugins
} from './components'

import { Gutter as Gutter$1 } from './components/GutterProvider'

export const Textbit = {
  Root: TextbitRoot,
  Editable: TextbitEditable,
  Gutter: Gutter$1.Gutter,
  DropMarker: DropMarker,
  Plugins: StandardPlugins
}
export default Textbit

export { TextbitRoot as Root }
export { TextbitEditable as Editable }
export { DropMarker }
export { StandardPlugins as Plugins }
export const Gutter = Gutter$1.Gutter

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
