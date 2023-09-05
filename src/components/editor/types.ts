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
export type Action = {
  name: string
  class: string
  hotkey: string
  isHotkey: any // FIXME: Should this really be here?
  tool: JSX.Element | Array<JSX.Element | ToolFunction> | null
  title: string
  handler: (props: MimerActionHandlerProps) => void | boolean
}



export interface MimerComponent {
  class?: string
  type?: string
  placeholder?: string,
  render: RenderElementFunction | RenderLeafFunction
  components?: MimerComponent[]
  constraints?: {
    minElements?: number
    maxElements?: number
    maxLength?: number
    allowBreak?: boolean
    allowSoftBreak?: boolean
  }
}

export interface MimerPlugin {
  class: 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'
  name: string
  events?: {
    // When a file is dropped in the editable area
    onEditorFileDrop?: () => Promise<any[] | false>
    // When a file upload is triggered from a tool
    onEditorFileInput?: () => Promise<any[] | false>
    // When text is inserted, i.e react on spefic text changes
    onEditorInsertText?: () => false | void
    // If this plugin want to hook in 
    onEditorNormalizeNode?: () => false | void
  }
  actions?: Array<{
    tool?: JSX.Element | Array<JSX.Element | ToolFunction>
    hotkey?: string
    title?: string
    handler: (props: MimerActionHandlerProps) => void | boolean
  }>
  component: MimerComponent
}

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