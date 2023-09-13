import { JSX } from "react"
import { Editor, Node, NodeEntry } from "slate"
import {
  RenderElementProps as SlateRenderElementProps,
  RenderLeafProps as SlateRenderLeafProps
} from "slate-react"


export interface RenderElementProps extends SlateRenderElementProps {
  rootNode?: Node,
  children: JSX.Element[]
}

export interface RenderLeafProps extends SlateRenderLeafProps {
  children: JSX.Element[]
}

export type RenderElementFunction = (props: RenderElementProps) => null | undefined | JSX.Element | JSX.Element[]
export type RenderLeafFunction = (props: RenderLeafProps) => null | undefined | JSX.Element | JSX.Element[]

export interface MimerActionHandlerProps {
  editor: Editor
}

export type ToolFunction = (editor: Editor, node: NodeEntry<Node>) => JSX.Element


export interface MimerComponent {
  class?: string
  type?: string
  placeholder?: string,
  render: RenderElementFunction | RenderLeafFunction
  children?: MimerComponent[]
  constraints?: {
    minElements?: number
    maxElements?: number
    maxLength?: number
    allowBreak?: boolean
    allowSoftBreak?: boolean
  }
}

export interface ConsumesProps {
  data: any
  intent?: string
}

export interface ConsumerProps {
  data: any
}

// Returns [
//   whether it consumes data or not,
//   type produced; undefined if first is false, can be null if nothing is produced,
//   whether it wants to consume items in bulk (true) or individually (default - false/omitted)
// ]
export type ConsumesFunction = (props: ConsumesProps) => [boolean, (string | null)?, boolean?]
export type ConsumeFunction = (props: ConsumerProps) => Promise<any | undefined>
export interface MimerPlugin {
  class: 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'
  name: string
  consumer?: {
    bulk?: boolean // Default is false (individually)
    consumes: ConsumesFunction  // Can you consume [data], [true/false, provides `type` as response]
    consume: ConsumeFunction // Consume [data] please
  }
  events?: {
    // When a file is dropped in the editable area
    onEditorFileDrop?: () => Promise<any[] | false>
    // When a file upload is triggered from a tool
    onEditorFileInput?: () => Promise<any[] | false>
    // When text is inserted, i.e react on spefic text changes
    onEditorInsertText?: () => false | void
    // If this plugin want to hook in  FIXME: This should maybe not be an event? (with!)
    onEditorNormalizeNode?: () => false | void
  }
  actions?: Array<{
    tool?: JSX.Element | Array<JSX.Element | ToolFunction>
    hotkey?: string
    title?: string
    handler: (props: MimerActionHandlerProps) => void | boolean
  }>
  component?: MimerComponent
}

// const CoreImagePlugin: MimerPlugin = {
//   class: 'block',
//   name: 'core/image2visual',
//   consumes: [
//     [
//       ({ data }: ConsumesProps) => {
//         // Is data a React drop event?
//         if (typeof data !== 'object' || data?.type !== 'drop') {
//           return [false] // No, we don't handle it
//         }

//         // Investigate data.nativeEvent.dataTransfer.files for jpg/png etc
//         // Return false if wrong mime types

//         // Yes we handle it and provides a core/visual as result
//         return [true, 'core/visual']
//       },
//       async ({ data }) => {
//         try {
//           const uploadResult = await uploadAndStoreImages(data)
//           const visualJson = transformDataToVisual(uploadResult)
//           return visualJson
//         }
//         catch (ex) {
//           throw ex
//         }
//       }
//     ]
//   ]
// }
// const Image: MimerPlugin = {
//   class: 'block',
//   name: 'core/image',
//   events: {
//     onEditorFileDrop: () => {
//       return Promise.resolve([])
//     },
//     onEditorFileInput: () => {
//       return Promise.resolve([])
//     },
//     onEditorInsertText: () => {
//       return false
//     },
//     onPluginFileDrop: () => { }
//   },
//   components: [
//     {
//       // type = core/image (derived from plugin name)
//       // class = block (derived from plugin class - should this only be here?)
//       render: () => null,
//       components: [
//         {
//           type: 'image',
//           class: 'void',
//           render: () => {
//             return null
//           },
//           constraints: {
//             maxElements: 1,
//             minElements: 1
//           },
//           onFileDrop: () => { }
//         },
//         {
//           type: 'alttext',
//           // class "text" is default
//           render: () => null,
//           constraints: {
//             maxElements: 1,
//             minElements: 1,
//             allowBreak: false,
//             maxLength: 128
//           }
//         },
//         {
//           type: 'text',
//           // class "text" is default
//           render: () => null,
//           constraints: {
//             maxElements: 1,
//             minElements: 1,
//             allowBreak: false,
//             maxLength: 256
//           }
//         }
//       ]
//     }]
// }