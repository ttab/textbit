import {
    BaseElement,
    BaseText,
    BaseEditor
} from 'slate'

import {
    ReactEditor,
    RenderElementProps as SlateRenderElementProps,
    RenderLeafProps as SlateRenderLeafProps
} from "slate-react"

import { HistoryEditor } from "slate-history"

export interface MimerElement extends BaseElement {
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

export interface MimerText extends BaseText {
    text: string
    formats?: string[]
    placeholder?: string
}

export type MimerDescendant = MimerElement | MimerText

/** Slate module extensions */
declare module 'slate' {
    interface CustomTypes {
        Editor: BaseEditor & ReactEditor & HistoryEditor
        Element: MimerElement
        Text: MimerText
    }
}