import { type Plugin } from '../types/plugin'

interface TextbitPluginInterface {
  isLeafPlugin: (value: unknown) => value is Plugin.LeafDefinition
  isElementPlugin: (value: unknown) => value is Plugin.ElementDefinition
}

export const TextbitPlugin: TextbitPluginInterface = {
  isLeafPlugin: (value): value is Plugin.LeafDefinition => {
    return (value as Plugin.LeafDefinition)?.class === 'leaf'
  },

  isElementPlugin: (value): value is Plugin.ElementDefinition => {
    return (value as Plugin.ElementDefinition)?.class !== 'leaf'
  }
}
