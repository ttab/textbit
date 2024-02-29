import React, { useState, useRef } from 'react'
import { Editor, Element, Transforms } from 'slate'
import { ReactEditor } from 'slate-react'
import {
  Plugin,
  TextbitElement
} from '../../../../../src'
import { BsLink45Deg } from 'react-icons/bs'


export const EditLink = ({ editor, entry }: Plugin.ToolComponentProps): JSX.Element => {
  const [node, path] = entry || []

  const [url, seturl] = useState<string>(TextbitElement.isElement(node) && typeof node?.properties?.url === 'string' ? node.properties.url : '')
  const inputRef = useRef<HTMLInputElement>(null)

  if (!TextbitElement.isElement(node)) {
    return <></>
  }


  return <>
    <span
      className="textbit-tool"
      onMouseDown={(e) => {
        e.preventDefault()
        deleteLink(editor)
      }}
    >
      <BsLink45Deg />
    </span>

    <span className="textbit-tool core/link-input">
      <input
        id={node.id}
        ref={inputRef}
        type="text"
        value={url}
        onClick={(e) => { e.currentTarget.focus() }}
        onChange={(e) => {
          seturl(e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape' || e.key === 'Enter') {
            e.preventDefault()

            if (url === '') {
              deleteLink(editor)
            }
            ReactEditor.focus(editor)
          }
        }}
        onBlur={() => {
          Transforms.setNodes(
            editor,
            {
              properties: {
                ...node.properties,
                url
              }
            },
            { at: path }
          )
        }}
      />
    </span>
  </>
}


const deleteLink = (editor: Editor): void => {
  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'core/link'
  })
}
