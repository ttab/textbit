import { type ElementDefinition, LeafDefinition } from '../types/textbit'

interface TextbitPluginInterface {
  isLeafPlugin: (value: unknown) => value is LeafDefinition
  isElementPlugin: (value: unknown) => value is ElementDefinition
}

export const TextbitPlugin: TextbitPluginInterface = {
  isLeafPlugin: (value): value is LeafDefinition => {
    return (value as LeafDefinition)?.class === 'leaf'
  },

  isElementPlugin: (value): value is ElementDefinition => {
    return (value as ElementDefinition)?.class !== 'leaf'
  }
}
