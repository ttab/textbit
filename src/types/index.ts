import { JSX } from "react"
import {
  Node,
  NodeEntry,
  BaseElement,
  BaseText,
  BaseEditor
} from "slate"

import {
  RenderElementProps as SlateRenderElementProps,
  RenderLeafProps as SlateRenderLeafProps
} from "slate-react"

import { ReactEditor } from "slate-react"
import { HistoryEditor } from 'slate-history'

/**
 * @interface
 * TBElement extended from Slates BaseElement
 */
export interface TBElement extends BaseElement {
  id?: string
  class?: string
  type: string
  hotKey?: string
  properties?: {
    [key: string]: string | number
  }
  attributes?: {
    [key: string]: string | number
  }
}

/**
 * @interface
 * TBText extended from Slates BaseText
 */
export interface TBText extends BaseText {
  text: string
  placeholder?: string
  [key: string]: boolean | string | undefined
}

/**
 * @interface
 * TBDescendant
 */
export type TBDescendant = TBElement | TBText

/**
 * @interface
 * TBElditor combined from Slates BaseEditor & ReactEditor & HistoryEditor
 */
export type TBEditor = BaseEditor & ReactEditor & HistoryEditor

/**
 * @module
 * Slate module extensions
*/
declare module 'slate' {
  interface CustomTypes {
    Editor: TBEditor
    Element: TBElement
    Text: TBText
  }
}




/**
 * @interface
 * Textbit component render function props interface.
 */
export interface TBRenderElementProps extends SlateRenderElementProps {
  /**
   * The root node of a child being rendered.
   * Undefined if the node being rendered is a root node.
   * */
  rootNode?: Node,
}


/**
 * @interface
 * Textbit leaf render props interface.
 *
 * FIXME: Investigate if this should be removed.
 */
export interface TBRenderLeafProps extends SlateRenderLeafProps {
  children: JSX.Element[]
}

/**
 * Render element function definition
 * @type TBRenderElementFunction
 */
export type TBRenderElementFunction = (props: TBRenderElementProps) => JSX.Element

/**
 * @interface
 * Action handler props interface
 */
export interface TBActionHandlerProps {
  editor: TBEditor
}

/**
 * Tool rendering function definition
 * @type TBToolFunction
 */
export type TBToolFunction = (editor: TBEditor, node: NodeEntry<Node>) => JSX.Element


/**
 * @interface
 * Textbit component interface.
 */
export interface TBComponent {
  /** Class of the component, inherited from plugin if not specified. ('leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic') */
  class: string

  /**
   * Used to match a custom element to rendering function. Default component
   * should not specify this as it inherits the type from the plugin name.
   * Mandatory for child components.
   */
  type?: string

  /** Placeholder text for an empty text node, optional */
  placeholder?: string,

  /** Render function for the element, mandatory */
  render: TBRenderElementFunction

  /** Child components, optional */
  children?: TBComponent[]

  /** Hard constraints for the component */
  constraints?: {
    // minElements?: number
    // maxElements?: number
    // maxLength?: number

    /** If true, prevents <enter> from having any effect, default is true */
    allowBreak?: boolean

    /** If true, prevents soft breaks (i.e breaks within one text element, default is true */
    allowSoftBreak?: boolean

    /** Normalizer function, optional */
    normalizeNode?: (editor: TBEditor, nodeEntry: NodeEntry) => boolean | void
  }
}

/**
 * @interface
 * Base input to both consume and consumes functions
 */
export interface TBConsumerInput {
  /** Source/name of data as text */
  source: string

  /** Mime type of indata, e.g text/uri-list, text/plain  */
  type: string

  /** Indata to consumer, e.g a File, text, url, etc */
  data: any
}

/**
 * @interface
 * Parameters to a consumes function.
 */
export interface TBConsumesProps {
  input: TBConsumerInput
}

/**
 * @interface
 * Parameters to a consume function.
 */
export interface TBConsumerProps {
  input: TBConsumerInput | TBConsumerInput[]
  editor: TBEditor
}


/**
 * @type TBConsumesFunction
 * Definition of a function that should answer whether the plugin wants to handle input data.
 * Returns an array with one, two or three values.
 * 1: Boolean: whether it consumes data or not
 * 2: string | null: Definition of what consumer function will produce (e.g core/image),
 *  undefined if first value is false, can be null if nothing is produced.
 * 3. Boolean: whether it wants to consume data in bulk (true) or individually (default).
 * @returns Array [boolean, string | null, ?boolean]

 */
export type TBConsumesFunction = (props: TBConsumesProps) => [boolean, (string | null)?, boolean?]

/**
 * @type TBConsumeFunction
 * Consume function definition. An async function which receives and consumes the data,
 * either individually or in bulk depending on what the the consumes function responded.
 *
 * Should return data as specified by the second value of the consumes function response.
 *
 * @returns any | undefined
 */
export type TBConsumeFunction = (props: TBConsumerProps) => Promise<any | undefined>

/**
 * @interface
 * Textbit plugin interface
 */
export interface TBPlugin {
  /**
   * Class of the plugin, inherited to default component. Must be one of
   * 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'
   */
  class: 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'

  /** Name of plugin, should be in the form of <prefix>/<plugin> */
  name: string

  /**
   * Optional consumer definition. One for each consumes() and consume() functions.
   */
  consumer?: {
    consumes: TBConsumesFunction  // Can you consume [data], [true/false, provides `type` as response]
    consume: TBConsumeFunction // Consume [data] please
  }

  /**
   * Event handlers
   */
  events?: {
    onInsertText?: (editor: TBEditor, text: string) => true | void
    onNormalizeNode?: (editor: TBEditor, entry: NodeEntry) => true | void
  }

  /**
   * Action definitions array, specifies tool, hotkey, title, description, handler and visibility.
   */
  actions?: Array<{
    tool?: JSX.Element | Array<JSX.Element | TBToolFunction>
    hotkey?: string
    title?: string
    description?: string
    handler: (props: TBActionHandlerProps) => boolean | void
    visibility?: (element: TBElement, rootElement?: TBElement) => [boolean, boolean, boolean] // visible, enabled, active
  }>

  /** Default component */
  component?: TBComponent
}
