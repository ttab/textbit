// src/types.ts
import type { BaseEditor, BaseElement, BaseRange, BaseText, Element } from 'slate'
import type { ReactEditor } from 'slate-react'
import type { HistoryEditor } from 'slate-history'

export type SpellingError = {
  id: string
  text: string
  level?: 'error' | 'suggestion'
  suggestions: Array<{
    text: string
    description?: string
  }>
}

export type TextbitEditor = BaseEditor & ReactEditor & HistoryEditor & {
  spellingLookupTable: Map<string, {
    lang: string
    text: string
    errors: SpellingError[]
  }>
  spellcheck?: () => void
  onUpdatedDecorations: () => void
  lang: string
  isTextBlock: (value: unknown) => value is Element
  isOfType: <T extends Element>(value: unknown, type: string) => value is T
}

export type TextbitElement = BaseElement & {
  id: string
  class: 'leaf' | 'inline' | 'text' | 'block' | 'void'
  type: string
  hotKey?: string
  lang?: string
  properties?: Record<string, string | number | boolean>
  attributes?: Record<string, string | number>
}

export type TextbitText = BaseText & {
  text: string
  placeholder?: string
  [key: string]: boolean | string | undefined
}

export type TextbitRange = BaseRange & {
  placeholder?: string
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
