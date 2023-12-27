import React from 'react' // Necessary for esbuild
import {
  MdTitle,
  MdTextFields,
  MdOutlineShortText,
  MdRadar
} from 'react-icons/md'

import { BsTextParagraph } from 'react-icons/bs'

import { TBPlugin, TBRenderElementFunction, TBRenderElementProps } from '../../../../../types/types'
import { convertToText } from '../../../../../lib/utils'
import { Element } from 'slate'

import './style.css'

type TextType = {
  tool: JSX.Element,
  hotkey?: string,
  title: string,
  type?: string,
  description?: string,
  render: TBRenderElementFunction,
  visibility: (element: Element, rootElement?: Element) => [boolean, boolean, boolean] // visible, enabled, active
}

const textTypes: TextType[] = [
  {
    type: 'h1',
    title: 'Title',
    hotkey: 'mod+1',
    tool: <MdTitle />,
    render: ({ children }: TBRenderElementProps) => {
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
    tool: <MdTextFields />,
    render: ({ children }: TBRenderElementProps) => {
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
    tool: <MdOutlineShortText />,
    render: ({ children }: TBRenderElementProps) => {
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
    tool: <BsTextParagraph />,
    render: ({ children }: TBRenderElementProps) => {
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
    tool: <MdRadar />,
    render: ({ children }: TBRenderElementProps) => {
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

const fallbackRender = ({ children }: TBRenderElementProps) => {
  return <div className="textbit-unknown">
    {children}
  </div>
}

const render = (props: TBRenderElementProps) => {
  const t = textTypes.find(t => t.type === props.element?.properties?.type)
  return t?.render(props) || fallbackRender(props)
}

export const Text: TBPlugin = {
  class: 'text',
  name: 'core/text',
  component: {
    class: 'text',
    render,
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
