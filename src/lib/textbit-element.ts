import {
  Ancestor,
  Element as SlateElement,
  Text as SlateText,
  ElementInterface,
} from "slate"

interface TextbitElementInterface extends ElementInterface {
  isBlock: (value: any) => value is Ancestor
  isTextblock: (value: any) => value is SlateElement
  isText: (value: any) => value is SlateElement
  isVoid: (value: any) => value is SlateElement
  isInline: (value: any) => value is SlateElement
  isOfType: <T extends SlateElement>(value: any, type: string) => value is T
  hasId: (value: any, id: string) => value is SlateElement
  isTextLeaf: (value: any) => value is SlateText
}

export const TextbitElement: TextbitElementInterface = {
  isTextLeaf: (value: any): value is SlateText => {
    return SlateText.isText(value)
  },
  ...SlateElement,
  isBlock: (value: any): value is Ancestor => {
    return SlateElement.isAncestor(value) && SlateElement.isElement(value) && value.class === 'block'
  },

  isTextblock: (value: any): value is SlateElement => {
    return SlateElement.isElement(value) && value.class === 'textblock'
  },

  isText: (value: any): value is SlateElement => {
    return SlateElement.isElement(value) && value.class === 'text'
  },

  isVoid: (value: any): value is SlateElement => {
    return SlateElement.isElement(value) && value.class === 'void'
  },

  isInline: (value: any): value is SlateElement => {
    return SlateElement.isElement(value) && value.class === 'inline'
  },

  isOfType: <T extends SlateElement>(value: any, type: string): value is T => {
    return SlateElement.isElement(value) && value?.type === type
  },

  hasId: (value: any, id: string): value is SlateElement => {
    return SlateElement.isElement(value) && value?.id === id
  }
}
