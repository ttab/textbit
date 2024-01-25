import React from 'react' // Necessary for esbuild
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined } from 'react-icons/md'
import { Plugin } from '@/types'
import './style.css'

const Bold: Plugin.Definition = {
  class: 'leaf',
  name: 'core/bold',
  actions: [{
    tool: () => <MdFormatBold />,
    hotkey: 'mod+b',
    handler: () => true
  }]
}

const Italic: Plugin.Definition = {
  class: 'leaf',
  name: 'core/italic',
  actions: [{
    tool: () => <MdFormatItalic />,
    hotkey: 'mod+i',
    handler: () => true
  }]
}

const Underline: Plugin.Definition = {
  class: 'leaf',
  name: 'core/underline',
  actions: [{
    hotkey: 'mod+u',
    tool: () => <MdFormatUnderlined />,
    handler: () => true
  }]
}

export {
  Bold,
  Italic,
  Underline
}
