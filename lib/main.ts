export type {
  SpellingError as TBSpellingError,
  PluginDefinition as TBPluginDefinition,
  TextbitEditor as TBEditor,
  TextbitElement as TBElement,
  TextbitText as TBText,
  TextbitRange as TBRange,
  PluginInitFunction as TBPluginInitFunction,
  Resource as TBResource,
  ComponentEntry as TBComponentEntry,
  Component as TBComponent,
  ComponentProps as TBComponentProps,
  ToolComponent as TBToolComponent,
  ToolComponentProps as TBToolComponentProps,
  ActionHandlerArgs as TBActionHandlerArgs,
  ActionHandler as TBActionHandler,
  Action as TBAction,
  ConsumeFunction as TBConsumeFunction,
  ConsumesFunction as TBConsumesFunction,
  Options as TBPluginOptions
} from './types'

export type { PluginRegistryAction as TBPluginRegistryAction } from './contexts/PluginRegistry/lib/types'

// Import the types file to ensure declaration merging happens
import './types'

import { TextbitRoot } from './components/TextbitRoot'
import { TextbitEditable } from './components/TextbitEditable'
import { Gutter as Gutter$1 } from './components/GutterProvider'
import { DropMarker } from './components/DropMarker'
import { StandardPlugins } from './components/core'
import { ContextTools } from './components/ContextTools'
import { ContentTools } from './components/ContentTools'
import { ContextMenu } from './components/ContextMenu/'

// Main library composed exports
export const Textbit = {
  Root: TextbitRoot,
  Editable: TextbitEditable,
  Gutter: Gutter$1.Content,
  DropMarker,
  Plugins: StandardPlugins,
  ContextMenu
}

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

// Direct name exports
export { TextbitRoot as Root }
export { TextbitEditable as Editable }
export { DropMarker }
export { StandardPlugins as Plugins }
export const Gutter = Gutter$1.Content
export { ContextMenu }

// Hooks
export { useAction } from './hooks/useAction'
export { usePluginRegistry } from './hooks/usePluginRegistry'
export { useTextbit } from './hooks/useTextbit'
export { useContextMenuHints } from './components/ContextMenu/useContextMenuHints'
export { useSelectionBounds } from './hooks/useSelectionBounds'
export { useEditor } from './hooks/useEditor'

export {
  pipeFromDrop as consumeFileDropEvent,
  pipeFromFileInput as consumeFileInputChangeEvent
} from './utils/pipes'

export { calculateStats } from './utils/calculateStats'
export { TextbitEditor } from './utils/textbit-editor'
export { TextbitElement } from './utils/textbit-element'
export { TextbitPlugin } from './utils/textbit-plugin'

// Re-export slate types to ensure correct overloaded types are exported
export type {
  BaseEditor,
  BaseElement,
  BaseText,
  BaseRange,
  Descendant,
  Ancestor
} from 'slate'

// Re-export overloaded slate types to ensure correct overloaded types
export {
  Element,
  Text,
  Editor,
  Range,
  Node,
  Transforms
} from 'slate'
