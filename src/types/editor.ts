import {
  BaseElement,
  BaseText,
  BaseEditor
} from "slate"


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
