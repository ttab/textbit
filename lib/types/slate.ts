import type { BaseEditor, BaseElement, BaseRange, BaseText, Element } from 'slate'
import type { ReactEditor } from 'slate-react'
import type { HistoryEditor } from 'slate-history'
import { DebounceFunction } from '../utils/debounce'

export type SpellingError = {
  id: string
  text: string
  level?: 'error' | 'suggestion'
  suggestions: Array<{
    text: string
    description?: string
  }>
}

export type SpellcheckLookupTable = Map<string, {
  lang: string
  text: string
  errors: SpellingError[]
}>

export type SpellcheckFunction = {
  (): void
  force: () => void
  cancel: () => void
}

export type TextbitEditor = BaseEditor & ReactEditor & HistoryEditor & {
  spellingLookupTable: Map<string, {
    lang: string
    text: string
    errors: SpellingError[]
  }>
  spellcheck?: DebounceFunction<() => void>
  onSpellcheckComplete: (cb: (lookupTable: SpellcheckLookupTable, updatedNodes: string[]) => void) => void
  lang: string
  isTextBlock: (value: unknown) => value is Element
  isOfType: <T extends Element>(value: unknown, type: string) => value is T
}

type BaseTextbitElement = BaseElement & {
  class: 'leaf' | 'inline' | 'text' | 'block' | 'void'
  type: string
  hotKey?: string
  lang?: string
  attributes?: Record<string, string | number>
}

export type TextbitElement =
  | (BaseTextbitElement & {
      id?: string
      class: 'text'
      type: string
      properties?: {
        role?: string
        [key: string]: string | number | boolean | undefined
      }
    })
  | (BaseTextbitElement & {
      id: string
      class: 'leaf' | 'inline' | 'block' | 'void'
      type: string
      properties?: {
        [key: string]: string | number | boolean | undefined
      }
    })

export type TextbitText = BaseText & {
  text: string
  placeholder?: string
  [key: string]: boolean | string | undefined
}

export type TextbitRange = BaseRange & {
  placeholder?: React.ReactNode
  spellingError?: SpellingError
}

// Declare module augmentation
declare module 'slate' {
  interface CustomTypes {
    Editor: TextbitEditor
    Element: TextbitElement
    Text: TextbitText
    Range: TextbitRange
  }
}
