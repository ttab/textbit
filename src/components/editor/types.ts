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

export type RenderElementFunction = (props: RenderElementProps) => JSX.Element
export type RenderLeafFunction = (props: RenderLeafProps) => JSX.Element

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

export interface ConsumerInput {
  source: string
  type: string
  data: any
}

export interface ConsumesProps {
  input: ConsumerInput
}

export interface ConsumerProps {
  input: ConsumerInput | ConsumerInput[]
  editor: Editor
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
    consumes: ConsumesFunction  // Can you consume [data], [true/false, provides `type` as response]
    consume: ConsumeFunction // Consume [data] please
  }
  events?: {
    onInsertText?: (editor: Editor, text: string) => true | void
    onNormalizeNode?: (editor: Editor, entry: NodeEntry) => true | void
  }
  actions?: Array<{
    tool?: JSX.Element | Array<JSX.Element | ToolFunction>
    hotkey?: string
    title?: string
    handler: (props: MimerActionHandlerProps) => boolean | void
  }>
  component?: MimerComponent
}