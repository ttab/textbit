import { Element as SlateElement } from "slate"

export const TextbitElement = {
  ...SlateElement,
  isBlock: (value: any) => {
    return SlateElement.isElement(value) && value.class === 'block'
  },

  isTextblock: (value: any) => {
    return SlateElement.isElement(value) && value.class === 'textblock'
  },

  isText: (value: any) => {
    return SlateElement.isElement(value) && value.class === 'text'
  },

  isVoid: (value: any) => {
    return SlateElement.isElement(value) && value.class === 'void'
  },

  isInline: (value: any) => {
    return SlateElement.isElement(value) && value.class === 'inline'
  },

  isOfType: (value: any, type: string) => {
    return SlateElement.isElement(value) && value?.type === type
  },

  hasId: (value: any, id: string) => {
    return SlateElement.isElement(value) && value?.id === id
  }
}


