import React from 'react' // Necessary for esbuild
import {
  MdTitle,
  MdTextFields,
  MdOutlineShortText,
  MdRadar
} from 'react-icons/md'

import { BsTextParagraph } from 'react-icons/bs'

import { TextbitPlugin, RenderElementFunction, RenderElementProps } from '../../../../../types'
import { convertToText } from '../../../../../lib/utils'
import { Element } from 'slate'

type TextType = {
  tool: JSX.Element,
  hotkey?: string,
  title: string,
  type?: string,
  description?: string,
  render: RenderElementFunction,
  visibility: (element: Element, rootElement?: Element) => [boolean, boolean, boolean] // visible, enabled, active
}

const textTypes: TextType[] = [
  {
    type: 'h1',
    title: 'Title',
    hotkey: 'mod+1',
    tool: <MdTitle />,
    render: ({ children }: RenderElementProps) => {
      return <div className="text-xl2 font-bold text-sans-serif">
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
    render: ({ children }: RenderElementProps) => {
      return <div className="text-l font-bold text-sans-serif">
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
    render: ({ children }: RenderElementProps) => {
      return <div className="font-bold">
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
    render: ({ children }: RenderElementProps) => {
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
    title: 'Dateline',
    hotkey: undefined,
    tool: <MdRadar />,
    render: ({ children }: RenderElementProps) => {
      return <div className="text-sm font-bold text-sans-serif">
        <span style={{ padding: '3px 9px 2px 9px', display: 'inline-block' }} className="bg-base-focus">{children}</span>
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

const fallbackRender = ({ children }: RenderElementProps) => {
  return <div className="italic line-through weaker text-sans-serif">
    {children}
  </div>
}

const render = (props: RenderElementProps) => {
  const t = textTypes.find(t => t.type === props.element?.properties?.type)
  return t?.render(props) || fallbackRender(props)
}

export const Text: TextbitPlugin = {
  class: 'text',
  name: 'core/text',
  component: {
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