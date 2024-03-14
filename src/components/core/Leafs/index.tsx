import React from 'react' // Necessary for esbuild
import { Plugin } from '@/types'

const Bold: Plugin.LeafDefinition = {
  class: 'leaf',
  name: 'core/bold',
  actions: [{
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

const Italic: Plugin.LeafDefinition = {
  class: 'leaf',
  name: 'core/italic',
  actions: [{
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

const Underline: Plugin.LeafDefinition = {
  class: 'leaf',
  name: 'core/underline',
  actions: [{
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

export {
  Bold,
  Italic,
  Underline
}
