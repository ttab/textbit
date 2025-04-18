import type {
  BaseElement,
  BaseText,
  BaseEditor,
  BaseRange
} from 'slate'


import { ReactEditor } from 'slate-react'
import { HistoryEditor } from 'slate-history'

export type SpellingError = {
  id: string
  text: string
  suggestions: Array<{
    text: string
    description?: string
  }>
}

export type TBEditor = BaseEditor & ReactEditor & HistoryEditor & {
  spellingLookupTable: Map<string, {
    lang: string
    text: string
    errors: SpellingError[]
  }>
  spellcheck: () => void
  lang: string
}

/**
 * @type
 * TBElement extended from Slates BaseElement
 */
export type TBElement = BaseElement & {
  id?: string
  class?: string
  type: string
  hotKey?: string
  lang?: string
  properties?: {
    [key: string]: string | number | boolean
  }
  attributes?: {
    [key: string]: string | number
  }
}

/**
 * @type
 * TBText extended from Slates BaseText
 */
export type TBText = BaseText & {
  text: string
  placeholder?: string
  [key: string]: boolean | string | undefined
}

/**
 * @module
 * Slate module extensions
*/
declare module 'slate' {
  interface CustomTypes {
    Editor: TBEditor
    Element: TBElement
    Text: TBText
    Range: BaseRange & {
      placeholder?: string
      spellingError?: SpellingError
    }
  }
}
