import { Editor, BaseElement, BaseText, Node, NodeEntry, Descendant } from "slate";
import { ReactEditor } from "slate-react";

/**
 * leaf        Leafs inside text or text block elements. Bold, italic, link, etc.
 * text        Simple text element, like paragraph, title
 * textblock   Text element which can include child text elements. Blockquote.
 * block       Block element which can include child text elements. Image, video.
 * void        Void block element, editor does not handle anything inside.
 * generic     Not rendered in editable area. Quote character handling, navigation.
 */
export type MimerPluginClass = 'leaf' | 'inline' | 'text' | 'textblock' | 'block' | 'void' | 'generic'
export type MimerEventTypes = 'input' | 'drop' | 'fileinput'

/** Hooks */
export type HookFunction = (arg: Event | FileList) => Promise<any>
export type Hook = {
    on: string
    for: string | string[]
    handler: HookFunction
}

/** Actions and tools */
export type ToolFunction = (editor: Editor, node: NodeEntry<Node>) => JSX.Element
export type ActionFunction = (editor: Editor) => void | boolean
export type Action = {
    name: string
    class: string
    hotkey: string
    isHotkey: any
    tool: JSX.Element | Array<JSX.Element | ToolFunction> | null
    title: string
    handler: ActionFunction
}

/** Event handlers */
export type InputEventFunction = (editor: Editor, text: string) => void | boolean

export type FileInputEventFunction = (editor: Editor, event: React.ChangeEvent<HTMLInputElement>, objects?: any[]) => Promise<any[]>
export type DropEventFunction = (editor: Editor, event: React.DragEvent<Element>, objects?: any[]) => Promise<any[]>

export type EventMatchFunction = (event: React.DragEvent | React.ChangeEvent) => boolean

export type EventHandler = {
    name: string
    class: string
    on: string
    handler: InputEventFunction | DropEventFunction | FileInputEventFunction,
    match?: EventMatchFunction
}

/** Renderers */
export interface MimerRenderElementProps { parent: Element, children: JSX.Element[] }
export type RenderFunction = (props: MimerRenderElementProps) => JSX.Element | undefined
export type Renderer = {
    type: string
    placeholder?: string
    class?: string
    render: RenderFunction
}

/** Normalizers */
export type NormalizeFunction = (editor: Editor, entry: NodeEntry) => void
export type Normalizer = {
    name: string
    class?: string
    normalize: NormalizeFunction
}

/** Registry */
type MimerRegistry = {
    plugins: MimerPlugin[]
    elementRenderers: Renderer[]
    normalizers: Normalizer[]
    actions: Action[]
    leafRenderers: Renderer[]
    events: EventHandler[]
    hooks: Hook[]
}

/** Plugin structure */
export type MimerPlugin = {
    class: MimerPluginClass
    name: string
    placeholder?: string
    normalize?: NormalizeFunction
    actions?: Array<{
        tool?: JSX.Element | Array<JSX.Element | ToolFunction>
        hotkey?: string
        title?: string
        handler: ActionFunction
    }>
    events?: Array<{
        on: MimerEventTypes,
        handler: InputEventFunction | DropEventFunction | FileInputEventFunction,
        match?: EventMatchFunction
    }>
    components?: Array<{
        type?: string
        class?: string
        render: RenderFunction
    }>
    style?: React.CSSProperties
}

/** Slate module extends */
declare module 'slate' {
    interface CustomTypes {
        Editor: ReactEditor
        Element: BaseElement & {
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
        Text: BaseText & {
            text: string
            formats?: string[]
            placeholder?: string
        }
    }
}