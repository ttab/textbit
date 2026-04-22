import type { PropsWithChildren, ReactNode, RefObject } from 'react'
import type { RenderElementProps } from 'slate-react'
import { type NodeEntry, Node, Editor, Element } from 'slate'

/**
 * @interface
 * Textbit component props
 */
export interface ComponentProps<T extends HTMLElement = HTMLElement> extends Omit<RenderElementProps, 'attributes'> {
  rootNode?: Element
  options?: Options
  editor: Editor
  children: React.ReactNode
  ref?: RefObject<T>
  attributes?: Record<string, unknown>
}

/**
 * @interface
 * Textbit component for rendering a TBElement (Slate Element)
 */
export type Component<T extends HTMLElement = HTMLElement, Props = ComponentProps<T>> = {
  (props: Props): ReactNode
}

/**
 * @interface
 * Textbit tool component props
 */
export type ToolComponentProps = {
  editor: Editor
  entry?: NodeEntry<Node>
  active?: boolean
} & PropsWithChildren

/**
 * @type
 * ToolComponent for rendering a tool
 */
export type ToolComponent<Props = ToolComponentProps> = React.ComponentType<Props>


/**
 * @type
 * Defines a generic api function.
 * @todo There must be a better way to expose functionality like this.
 */
export type ActionHandlerAPI = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: (...args: any[]) => any
}


export interface ActionHandlerArgs {
  editor: Editor
  type: string
  options?: Options
  api?: ActionHandlerAPI
  args?: Record<string, unknown>
  event?: React.KeyboardEvent<HTMLElement> | React.MouseEvent<HTMLElement>
}

/**
 * Action handler function that can handle keyboard events, mouse events, or generic actions.
 *
 * @param options - The action handler options
 * @returns `true` to indicate the textbit default action is accepted
 */
export type ActionHandler = (args: ActionHandlerArgs) => boolean | void

/**
 * @interface
 * Action props interface
 */
export interface Action {
  name: string
  title?: string
  description?: string
  hotkey?: string
  tool?: ToolComponent | [ToolComponent, ToolComponent]
  handler: ActionHandler
  visibility?: (element: Element, rootElement?: Element) => [boolean, boolean, boolean] // visible, enabled, active
}


/**
 * Constraints shared by any component entry, regardless of whether it is a
 * top-level entry or a child entry in a parent's `children` array.
 */
interface BaseConstraints {
  /** If true, prevents <enter> from having any effect, default is true */
  allowBreak?: boolean

  /** If true, prevents soft breaks (i.e breaks within one text element, default is true */
  allowSoftBreak?: boolean

  /** If false, prevents <enter> from exiting the top-level block when at the last position, default is true */
  allowExitBreak?: boolean

  /** If false, prevents whitespace at the start and end of a paragraph, default is true */
  allowEdgeWhitespace?: boolean

  /** Normalizer function, optional */
  normalizeNode?: (editor: Editor, nodeEntry: NodeEntry) => boolean | void
}

/**
 * Constraints valid on TOP-LEVEL component entries (e.g. the entry directly
 * on a PluginDefinition). Cardinality constraints (`min`/`max`) are typed
 * `never` so TypeScript rejects them at the plugin definition site — they
 * are only meaningful when the entry appears in a parent's `children` array.
 */
export interface TopLevelConstraints extends BaseConstraints {
  min?: never
  max?: never
}

/**
 * Constraints valid on CHILD component entries (items in a parent's
 * `children` array). Adds the cardinality constraints `min` and `max`.
 */
export interface ChildConstraints extends BaseConstraints {
  /**
   * Minimum number of instances of this child type allowed within the parent.
   * If the count ever falls below `min`, the normalizer inserts a minimal
   * placeholder to restore the invariant. Use `min: 1, max: 1` to model a
   * permanent form-field-like child that always exists and cannot be removed.
   */
  min?: number

  /**
   * Maximum number of instances of this child type allowed within the parent.
   * Excess siblings are removed by the normalizer; Enter is blocked when the
   * count is already at `max`.
   */
  max?: number
}

/**
 * Fields common to every component entry, independent of whether it is used
 * as a top-level or child entry.
 */
interface BaseComponentEntry<T extends HTMLElement = HTMLElement> {
  /** Class of the component, inherited from plugin if not specified. ('leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic') */
  class: string

  /**
   * Used to match a custom element to rendering function. Default component
   * should not specify this as it inherits the type from the plugin name.
   * Mandatory for child components.
   */
  type?: string

  /** Whether this component accepts drops or not, only applicable to top parent */
  droppable?: boolean

  /** Placeholder text for an empty text node, optional */
  placeholder?: string | ((type: Element) => React.ReactNode)

  /** Render function for the element, mandatory */
  component: Component<T>

  // Children must be able to use any element, not only HTMLElement.
  // Type safety is enforced at the component level through Component<T>.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children?: ChildComponentEntry<any>[]
}

/**
 * @interface
 * A top-level component entry (e.g. the one attached to a PluginDefinition).
 * Accepts every behavior-level constraint but rejects cardinality constraints.
 */
export interface ComponentEntry<T extends HTMLElement = HTMLElement> extends BaseComponentEntry<T> {
  /** Hard constraints for the component */
  constraints?: TopLevelConstraints
}

/**
 * @interface
 * A child component entry — an item in a parent's `children` array. Accepts
 * the behavior-level constraints plus `min`/`max` for cardinality within
 * the parent.
 */
export interface ChildComponentEntry<T extends HTMLElement = HTMLElement> extends BaseComponentEntry<T> {
  /** Hard constraints for the component, including cardinality in the parent */
  constraints?: ChildConstraints
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
  data: unknown
}

/**
 * @type GetLeafStyle
 * Return either React.CSSProperties object or a class name string
 *
 * @return React.CSSProperties | string
 */
export type GetLeafStyle = () => React.CSSProperties | string

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
 */
export type ConsumeFunction = ({ editor, input }: { editor: Editor, input: Resource | Resource[] }) => Promise<Resource | undefined>

/**
 * @type Options
 * Plugin options
 *
 * Generic options object for the plugin, can be extended by specific plugins.
 */
export type Options<T extends Record<string, unknown> = Record<string, unknown>> = T

interface BaseDefinition {
  /**
   * Class of the plugin, inherited to default component. Must be one of
   * 'leaf' | 'inline' | 'text' | 'block' | 'void' | 'generic'
   */
  class: 'leaf' | 'inline' | 'text' | 'block' | 'void' | 'generic'

  /** Name of plugin, should be in the form of <prefix>/<plugin> */
  name: string

  /**
   * Action definitions array, specifies tool, hotkey, title, description, handler and visibility.
   */
  actions?: Action[]

  /**
   * Options object
   */
  options?: Options

  /**
   * Default component entries for elements
   */
  componentEntry?: ComponentEntry
}

/**
 * @interface
 * Textbit element plugin interface
 */
export interface ElementDefinition extends BaseDefinition {
  /**
   * Optional consumer definition. One for each consumes() and consume() functions.
   */
  consumer?: {
    consumes: ConsumesFunction // Can you consume [data], [true/false, provides `type` as response]
    consume: ConsumeFunction // Consume [data] please
  }

  /**
   * Event handlers
   */
  events?: {
    onInsertText?: (editor: Editor, text: string) => true | void
    onNormalizeNode?: (editor: Editor, entry: NodeEntry) => true | void
  }
}

/**
 * @interface
 * Textbit leaf plugin interface
*/
export interface LeafDefinition extends BaseDefinition {
  /** Styling object or class name string for leaf components */
  getStyle: GetLeafStyle
}

/**
 * @interface
 * Textbit plugin definition interface
 */
export type PluginDefinition =
  | ElementDefinition
  | LeafDefinition

/**
 * @type PluginInitFunction
 * Plugin initialization function
 */
export type PluginInitFunction<O extends Options = Options> = (options?: O) => PluginDefinition
