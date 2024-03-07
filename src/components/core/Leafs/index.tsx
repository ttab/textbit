import React from 'react' // Necessary for esbuild
import { Plugin } from '@/types'
import './style.css'

const Bold: Plugin.Definition = {
  class: 'leaf',
  name: 'core/bold',
  actions: [{
    tool: () => <div style={{ fontWeight: 'bold' }}>B</div>,
    hotkey: 'mod+b',
    handler: () => true
  }]
}

const Italic: Plugin.Definition = {
  class: 'leaf',
  name: 'core/italic',
  actions: [{
    tool: () => <div style={{ fontStyle: 'italic' }}>I</div>,
    hotkey: 'mod+i',
    handler: () => true
  }]
}

const Underline: Plugin.Definition = {
  class: 'leaf',
  name: 'core/underline',
  actions: [{
    hotkey: 'mod+u',
    tool: () => <div style={{ textDecoration: 'line-through' }}>U</div>,
    handler: () => true
  }]
}

export {
  Bold,
  Italic,
  Underline
}
