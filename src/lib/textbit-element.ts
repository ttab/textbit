import { Ancestor, Element } from "slate"

export interface TextbitElementInterface {
  isBlock: (value: any) => value is Ancestor
  isTextblock: (value: any) => value is Element
  isText: (value: any) => value is Element
  isVoid: (value: any) => value is Element
  isInline: (value: any) => value is Element
  isOfType: <T extends Element>(value: any, type: string) => value is T
  hasId: (value: any, id: string) => value is Element
}

export const TextbitElement: TextbitElementInterface = {
  ...Element,
  isBlock: (value: any): value is Ancestor => {
    return Element.isAncestor(value) && Element.isElement(value) && value.class === 'block'
  },

  isTextblock: (value: any): value is Element => {
    return Element.isElement(value) && value.class === 'textblock'
  },

  isText: (value: any): value is Element => {
    return Element.isElement(value) && value.class === 'text'
  },

  isVoid: (value: any): value is Element => {
    return Element.isElement(value) && value.class === 'void'
  },

  isInline: (value: any): value is Element => {
    return Element.isElement(value) && value.class === 'inline'
  },

  isOfType: <T extends Element>(value: any, type: string): value is T => {
    return Element.isElement(value) && value?.type === type
  },

  hasId: (value: any, id: string): value is Element => {
    return Element.isElement(value) && value?.id === id
  }
}


