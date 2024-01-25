import { ReactNode } from "react"
import { Node, NodeEntry } from "slate"
import { RenderElementProps } from "slate-react"
import { TBEditor, TBElement } from './index'

export namespace Plugin {
  /**
   * @interface
   * Textbit component for rendering a root parent element
   */
  interface Renderable<Props = RenderElementProps> {
    (props: Props): ReactNode
  }

  /**
   * @interface
   * Component for rendering a textbit component
   */
  export interface Component extends Renderable<{
    rootNode?: Node
  } & RenderElementProps> {}

  /**
   * @interface
   * Textbit leaf render props interface
   */
  // export interface TextbitLeafComponent<Props = SlateRenderLeafProps> {
  //   (props: Props): ReactNode;
  // }


  /**
   * @type
   * Tool component type
   */
  export type ToolComponent<Props = {
    editor: TBEditor
    entry?: NodeEntry<Node>
  }> = React.ComponentType<Props>

  /**
   * @interface
   * Action handler props interface
   */
  export interface Action {
    title?: string
    description?: string
    hotkey?: string
    tool?: ToolComponent | [ToolComponent, ToolComponent]
    handler: (options: { editor: TBEditor }) => boolean | void
    visibility?: (element: TBElement, rootElement?: TBElement) => [boolean, boolean, boolean] // visible, enabled, active
  }


  /**
   * @interface
   * Textbit component interface.
   */
  export interface ComponentEntry {
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
    component: Component

    children?: ComponentEntry[]

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
  export interface Resource {
    /** Source/name of data as text */
    source: string

    /** Mime type of indata, e.g text/uri-list, text/plain  */
    type: string

    /** Indata to consumer, e.g a File, text, url, etc */
    data: any
  }


  /**
   * @type ConsumesFunction
   * Definition of a function that should answer whether the plugin wants to handle input data.
   * Returns an array with one, two or three values.
   * 1: Boolean: whether it consumes data or not
   * 2: string | null: Definition of what consumer function will produce (e.g core/image),
   *  undefined if first value is false, can be null if nothing is produced.
   * 3. Boolean: whether it wants to consume data in bulk (true) or individually (default).
   *
   * @returns Array [boolean, string | null, ?boolean]
   */
  export type ConsumesFunction = ({ input }: { input: Resource }) => [boolean, (string | null)?, boolean?]

  /**
   * @type ConsumeFunction
   * Consume function definition. An async function which receives and consumes the data,
   * either individually or in bulk depending on what the the consumes function responded.
   *
   * Should return data as specified by the second value of the consumes function response.
   *
   * @returns any | undefined
   */
  export type ConsumeFunction = ({ editor, input }: { editor: TBEditor, input: Resource | Resource[] }) => Promise<any | undefined>

  /**
   * @interface
   * Textbit plugin interface
   */
  export interface Definition {
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
      consumes: ConsumesFunction  // Can you consume [data], [true/false, provides `type` as response]
      consume: ConsumeFunction // Consume [data] please
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
    actions?: Action[]

    /** Default component */
    componentEntry?: ComponentEntry
  }
}
