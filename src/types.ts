import { JSX } from "react"
import {
  Editor,
  Node,
  NodeEntry,
  Element
} from "slate"

import {
  RenderElementProps as SlateRenderElementProps,
  RenderLeafProps as SlateRenderLeafProps
} from "slate-react"


export interface TBRenderElementProps extends SlateRenderElementProps {
  rootNode?: Node,
  children: JSX.Element[]
}

export interface TBRenderLeafProps extends SlateRenderLeafProps {
  children: JSX.Element[]
}

export type TBRenderElementFunction = (props: TBRenderElementProps) => JSX.Element
// export type RenderLeafFunction = (props: RenderLeafProps) => JSX.Element

export interface TBActionHandlerProps {
  editor: Editor
}

export type TBToolFunction = (editor: Editor, node: NodeEntry<Node>) => JSX.Element


export interface TBComponent {
  class: string
  type?: string
  placeholder?: string,
  render: TBRenderElementFunction // | RenderLeafFunction
  children?: TBComponent[]
  constraints?: {
    // minElements?: number
    // maxElements?: number
    // maxLength?: number
    allowBreak?: boolean
    allowSoftBreak?: boolean
    normalizeNode?: (editor: Editor, nodeEntry: NodeEntry) => boolean | void
  }
}

export interface TBConsumerInput {
  source: string
  type: string
  data: any
}

export interface TBConsumesProps {
  input: TBConsumerInput
}

export interface TBConsumerProps {
  input: TBConsumerInput | TBConsumerInput[]
  editor: Editor
}

// Returns [
//   whether it consumes data or not,
//   type produced; undefined if first is false, can be null if nothing is produced,
//   whether it wants to consume items in bulk (true) or individually (default - false/omitted)
// ]
export type TBConsumesFunction = (props: TBConsumesProps) => [boolean, (string | null)?, boolean?]
export type TBConsumeFunction = (props: TBConsumerProps) => Promise<any | undefined>
export interface TBPlugin {
  class: 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'
  name: string
  consumer?: {
    consumes: TBConsumesFunction  // Can you consume [data], [true/false, provides `type` as response]
    consume: TBConsumeFunction // Consume [data] please
  }
  events?: {
    onInsertText?: (editor: Editor, text: string) => true | void
    onNormalizeNode?: (editor: Editor, entry: NodeEntry) => true | void
  }
  actions?: Array<{
    tool?: JSX.Element | Array<JSX.Element | TBToolFunction>
    hotkey?: string
    title?: string
    description?: string
    handler: (props: TBActionHandlerProps) => boolean | void
    visibility?: (element: Element, rootElement?: Element) => [boolean, boolean, boolean] // visible, enabled, active
  }>
  component?: TBComponent
}
