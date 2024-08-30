import { useSlateStatic } from 'slate-react'
import { usePluginRegistry } from '../PluginRegistry'

export const useAction = (pluginName: string, actionName: string): ((args?: Record<string, unknown>) => void) | undefined => {
  const editor = useSlateStatic()
  const { actions } = usePluginRegistry()

  const name = `${pluginName}/${actionName}`
  const action = actions.find(a => a.name === name)

  if (!action) {
    return
  }

  return (args) => {
    action.handler({
      editor,
      options: action.plugin.options,
      args
    })
  }
}
