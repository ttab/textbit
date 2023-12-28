import React from 'react' // Necessary for esbuild
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined } from 'react-icons/md'
import { TBPlugin } from '../../../types/types'
import './style.css'

const Bold: TBPlugin = {
  class: 'leaf',
  name: 'core/bold',
  actions: [{
    tool: <MdFormatBold />,
    hotkey: 'mod+b',
    handler: () => true
  }]
}

const Italic: TBPlugin = {
  class: 'leaf',
  name: 'core/italic',
  actions: [{
    tool: <MdFormatItalic />,
    hotkey: 'mod+i',
    handler: () => true
  }]
}

const Underline: TBPlugin = {
  class: 'leaf',
  name: 'core/underline',
  actions: [{
    hotkey: 'mod+u',
    tool: <MdFormatUnderlined />,
    handler: () => true
  }]
}

export {
  Bold,
  Italic,
  Underline
}
