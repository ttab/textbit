import {
  BaseElement,
  BaseText,
  BaseEditor
} from 'slate'

import {
  ReactEditor,
} from "slate-react"

import {
  HistoryEditor
} from 'slate-history'

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

export interface TBText extends BaseText {
  text: string
  placeholder?: string
  [key: string]: boolean | string | undefined
}

export type TBDescendant = TBElement | TBText

/** Slate module extensions */
declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor & HistoryEditor
    Element: TBElement
    Text: TBText
  }
}
