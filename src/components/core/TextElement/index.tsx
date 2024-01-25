import React from 'react' // Necessary for esbuild
import {
  MdTitle,
  MdTextFields,
  MdOutlineShortText,
  MdRadar
} from 'react-icons/md'

import { BsTextParagraph } from 'react-icons/bs'

import { Plugin } from '../../../types'
import { convertToText } from '@/lib/utils'
import { Element } from 'slate'

import './style.css'

interface TextType {
  tool: Plugin.ToolComponent,
  hotkey?: string,
  title: string,
  type?: string,
  description?: string,
  render: Plugin.Component,
  visibility: (element: Element, rootElement?: Element) => [boolean, boolean, boolean] // visible, enabled, active
}

const textTypes: TextType[] = [
  {
    type: 'h1',
    title: 'Title',
    hotkey: 'mod+1',
    tool: () => <MdTitle />,
    render: ({ children }) => {
      return <div className="textbit-h1">
        {children}
      </div>
    },
    visibility: (element, rootElement) => {
      return [
        element.type === 'core/text',
        true,
        element.type === 'core/text' && element?.properties?.type === 'h1'
      ]
    }
  },
  {
    type: 'h2',
    title: 'Subtitle',
    hotkey: 'mod+2',
    tool: () => <MdTextFields />,
    render: ({ children }) => {
      return <div className="textbit-h2">
        {children}
      </div>
    },
    visibility: (element, rootElement) => {
      return [
        element.type === 'core/text',
        true,
        element.type === 'core/text' && element?.properties?.type === 'h2'
      ]
    }
  },
  {
    type: 'preamble',
    title: 'Preamble',
    hotkey: 'mod+3',
    tool: () => <MdOutlineShortText />,
    render: ({ children }) => {
      return <div className="textbit-preamble">
        {children}
      </div>
    },
    visibility: (element, rootElement) => {
      return [
        element.type === 'core/text',
        true,
        element.type === 'core/text' && element?.properties?.type === 'preamble'
      ]
    }
  },
  {
    type: undefined,
    title: 'Body text',
    hotkey: 'mod+0',
    tool: () => <BsTextParagraph />,
    render: ({ children }) => {
      return <>
        {children}
      </>
    },
    visibility: (element, rootElement) => {
      return [
        element.type === 'core/text',
        true,
        element.type === 'core/text' && !element?.properties?.type
      ]
    }
  },
  {
    type: 'dateline',
    title: 'Datelines',
    hotkey: undefined,
    tool: () => <MdRadar />,
    render: ({ children }) => {
      return <div className="textbit-dateline">
        {children}
      </div>
    },
    visibility: (element, rootElement) => {
      return [
        element.type === 'core/text',
        true,
        element.type === 'core/text' && element?.properties?.type === 'dateline'
      ]
    }
  }
]

const UnknownComponent: Plugin.Component = ({ children }) => {
  return <div className="textbit-unknown">
    {children}
  </div>
}

const TextComponent: Plugin.Component = (props) => {
  const t = textTypes.find(t => t.type === props.element?.properties?.type)
  return t?.render(props) || UnknownComponent(props)
}

export const TextElement: Plugin.Definition = {
  class: 'text',
  name: 'core/text',
  componentEntry: {
    class: 'text',
    component: TextComponent,
    placeholder: '¶' // FIXME: Needs to be a render function for subtypes,
  },
  actions: textTypes.map((t) => {
    return {
      tool: t.tool,
      hotkey: t.hotkey,
      title: t.title,
      description: t.description,
      handler: ({ editor }) => {
        convertToText(editor, 'core/text', t.type)
      },
      visibility: t.visibility
    }
  })
}
