import { useSlateStatic } from 'slate-react'
import { usePluginRegistry } from './usePluginRegistry'

export function useAction(pluginName: string, actionName: string): ((args?: Record<string, unknown>) => void) | undefined {
  const editor = useSlateStatic()
  const { actions } = usePluginRegistry()

  const name = `${pluginName}/${actionName}`
  const action = actions.find((a) => a.name === name)

  if (!action) {
    return
  }

  return (args) => {
    action.handler({
      editor,
      type: pluginName,
      options: action.plugin.options,
      args
    })
  }
}
