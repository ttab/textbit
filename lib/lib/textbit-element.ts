import {
  type Ancestor,
  Element as SlateElement,
  Text as SlateText,
  type ElementInterface
} from 'slate'

interface TextbitElementInterface extends ElementInterface {
  isBlock: (value: unknown) => value is Ancestor
  /** @deprecated */
  isTextblock: (value: unknown) => value is SlateElement
  isText: (value: unknown) => value is SlateElement
  isVoid: (value: unknown) => value is SlateElement
  isInline: (value: unknown) => value is SlateElement
  isOfType: <T extends SlateElement>(value: unknown, type: string) => value is T
  hasId: (value: unknown, id: string) => value is SlateElement
  isTextLeaf: (value: unknown) => value is SlateText
}

export const TextbitElement: TextbitElementInterface = {
  isTextLeaf: (value: unknown): value is SlateText => {
    return SlateText.isText(value)
  },
  ...SlateElement,
  isBlock: (value: unknown): value is Ancestor => {
    return SlateElement.isAncestor(value) && SlateElement.isElement(value) && value.class === 'block'
  },

  /** @deprecated */
  isTextblock: (value: unknown): value is SlateElement => {
    return SlateElement.isElement(value) && value.class === 'textblock'
  },

  isText: (value: unknown): value is SlateElement => {
    return SlateElement.isElement(value) && value.class === 'text'
  },

  isVoid: (value: unknown): value is SlateElement => {
    return SlateElement.isElement(value) && value.class === 'void'
  },

  isInline: (value: unknown): value is SlateElement => {
    return SlateElement.isElement(value) && value.class === 'inline'
  },

  isOfType: <T extends SlateElement>(value: unknown, type: string): value is T => {
    return SlateElement.isElement(value) && value?.type === type
  },

  hasId: (value: unknown, id: string): value is SlateElement => {
    return SlateElement.isElement(value) && value?.id === id
  }
}
