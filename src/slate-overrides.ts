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

export interface TextbitElement extends BaseElement {
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

export interface TextbitText extends BaseText {
  text: string
  placeholder?: string
  [key: string]: boolean | string | undefined
}

export type TextbitDescendant = TextbitElement | TextbitText

/** Slate module extensions */
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: TextbitElement
    Text: TextbitText
  }
}
