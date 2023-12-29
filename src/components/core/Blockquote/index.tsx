import React, { JSX } from 'react' // Necessary for esbuild
import { Transforms, Node, Editor, NodeEntry } from 'slate'
import { BsChatQuote } from 'react-icons/bs'
import * as uuid from 'uuid'

import {
  TBActionHandlerProps,
  TBPlugin,
  TBRenderElementProps
} from '@/types'

import { TextbitEditor, TextbitElement } from '@/lib/index'
import { getSelectedText, insertAt } from '@/lib/utils'
import './style.css'

const render = ({ children }: TBRenderElementProps): JSX.Element => {
  return <>
    {children}
  </>
}

const renderBody = ({ children }: TBRenderElementProps) => {
  return <div className="textbit-body">
    {children}
  </div>
}

const renderCaption = ({ children }: TBRenderElementProps) => {
  return <div className="textbit-caption">
    {children}
  </div>
}

const actionHandler = ({ editor }: TBActionHandlerProps) => {
  const text = getSelectedText(editor)
  const node = [{
    id: uuid.v4(),
    class: 'textblock',
    type: 'core/blockquote',
    children: [
      {
        type: 'core/blockquote/body',
        class: 'text',
        children: [{ text: text || '' }]
      },
      {
        type: 'core/blockquote/caption',
        class: 'text',
        children: [{ text: '' }]
      }
    ]
  }]

  const position = TextbitEditor.position(editor) + (!!text ? 0 : 1)
  insertAt(editor, position, node)

  const atChild = !!text ? 0 : 1
  Transforms.select(editor, {
    anchor: { offset: 0, path: [position, atChild, 0] },
    focus: { offset: 0, path: [position, atChild, 0] },
  })
}

const normalizeBlockquote = (editor: Editor, nodeEntry: NodeEntry) => {
  const [node, path] = nodeEntry
  const children = Array.from(Node.children(editor, path))

  if (children.length === 1) {
    // Ensure there is text, or remove the node entirely
    let textFound = false
    for (const [child] of children) {
      for (let textNode of Node.texts(child)) {
        if (textNode[0].text.trim() !== '') {
          textFound = true
        }
      }
    }

    if (!textFound) {
      Transforms.removeNodes(editor, { at: path })
      return true
    }

    // Add missing body or caption
    const [addType, atPos] = TextbitElement.isOfType(children[0][0], 'core/blockquote/caption') ? ['core/blockquote/body', 0] : ['core/blockquote/caption', 1]

    Transforms.insertNodes(
      editor,
      {
        id: uuid.v4(),
        class: 'text',
        type: addType,
        children: [{ text: '' }]
      },
      { at: [...path, atPos] }
    )
    return true
  }

  let n = 1
  for (const [child, childPath] of children) {
    if (TextbitElement.isBlock(child) || TextbitElement.isTextblock(child)) {
      // Unwrap block node children (move text element children upwards in tree)
      Transforms.unwrapNodes(editor, {
        at: childPath,
        split: true
      })
      return true
    }

    if (n < children.length && TextbitElement.isText(child) && !TextbitElement.isOfType(child, 'core/blockquote/body')) {
      // Turn unknown text elements to /core/blockquote/body
      Transforms.setNodes(
        editor,
        { type: 'core/blockquote/body' },
        { at: childPath }
      )
      return true
    }

    // Make sure last element is a caption
    if (n === children.length && !TextbitElement.isOfType(child, 'core/blockquote/caption')) {
      Transforms.setNodes(
        editor,
        { type: 'core/blockquote/caption' },
        { at: childPath }
      )
      return true
    }

    if (n > 2) {
      // Excessive nodes are lifted and transformed to text
      Transforms.setNodes(
        editor,
        { type: 'core/text', properties: {} },
        { at: childPath }
      )
      Transforms.liftNodes(
        editor,
        { at: childPath }
      )
    }
    n++
  }
}

export const Blockquote: TBPlugin = {
  class: 'textblock',
  name: 'core/blockquote',
  actions: [
    {
      title: 'Blockquote',
      tool: <BsChatQuote />,
      hotkey: 'mod+shift+2',
      handler: actionHandler,
      visibility: (element, rootElement) => {
        return [
          true, // Always visible
          true, // Always enabled
          false // Never active
        ]
      }
    }
  ],
  component: {
    class: 'textblock',
    render,
    constraints: {
      normalizeNode: normalizeBlockquote
    },
    children: [
      {
        type: 'body',
        class: 'text',
        render: renderBody
      },
      {
        type: 'caption',
        class: 'text',
        render: renderCaption
      }
    ]
  }
}
