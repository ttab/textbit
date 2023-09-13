import React from 'react' // Necessary for esbuild
import { MdFormatBold, MdFormatItalic, MdFormatUnderlined } from 'react-icons/md'
import { MimerPlugin } from '../../types'
import './leaf.css'

const Bold: MimerPlugin = {
    class: 'leaf',
    name: 'core/bold',
    actions: [{
        tool: <MdFormatBold />,
        hotkey: 'mod+b',
        handler: () => true
    }]
}

const Italic: MimerPlugin = {
    class: 'leaf',
    name: 'core/italic',
    actions: [{
        tool: <MdFormatItalic />,
        hotkey: 'mod+i',
        handler: () => true
    }]
}

const Underline: MimerPlugin = {
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