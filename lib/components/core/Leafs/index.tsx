import type { PluginInitFunction } from '../../../types'

const Bold: PluginInitFunction = () => {
  return {
    class: 'leaf',
    name: 'core/bold',
    actions: [{
      name: 'toggle-bold',
      tool: () => <div style={{ fontWeight: 'bold' }}>B</div>,
      hotkey: 'mod+b',
      handler: () => true
    }],
    getStyle: () => {
      return {
        fontWeight: 'bold'
      }
    }
  }
}

const Italic: PluginInitFunction = () => {
  return {
    class: 'leaf',
    name: 'core/italic',
    actions: [{
      name: 'toggle-italic',
      tool: () => <div style={{ fontStyle: 'italic' }}>I</div>,
      hotkey: 'mod+i',
      handler: () => true
    }],
    getStyle: () => {
      return {
        fontStyle: 'italic'
      }
    }
  }
}

const Underline: PluginInitFunction = () => {
  return {
    class: 'leaf',
    name: 'core/underline',
    actions: [{
      name: 'toggle-underline',
      hotkey: 'mod+u',
      tool: () => <div style={{ textDecoration: 'underline' }}>U</div>,
      handler: () => true
    }],
    getStyle: () => {
      return {
        textDecoration: 'underline'
      }
    }
  }
}

export {
  Bold,
  Italic,
  Underline
}
