import {
  TextbitRoot,
  TextbitEditable,
  DropMarker,
  ContentTools,
  useTextbit,
  usePluginRegistry,
  useAction,
  ContextTools,
  StandardPlugins,
  type PluginRegistryAction,
  TextbitEditableElement,
  ContextMenu,
  useContextMenuHints
} from './components'

import { Gutter as Gutter$1 } from './components/GutterProvider'

export const Textbit = {
  Root: TextbitRoot,
  Editable: TextbitEditable,
  Gutter: Gutter$1.Gutter,
  DropMarker: DropMarker,
  Plugins: StandardPlugins,
  Element: TextbitEditableElement
}
export default Textbit

export { TextbitRoot as Root }
export { TextbitEditable as Editable }
export { DropMarker }
export { StandardPlugins as Plugins }
export const Gutter = Gutter$1.Gutter
export { TextbitEditableElement as Element }

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

export {
  ContextMenu,
  useContextMenuHints
}

export { useTextbit }
export { useAction }
export {
  usePluginRegistry,
  type PluginRegistryAction
}

export * from './types'

export {
  calculateStats,
  TextbitEditor,
  TextbitElement,
  TextbitPlugin,
  consumeFileDropEvent,
  consumeFileInputChangeEvent
} from './lib'
