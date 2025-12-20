import { useState, useRef } from 'react'
import { Editor, Element, Transforms } from 'slate'
import {
  type TBToolComponentProps,
  TextbitElement
} from '@ttab/textbit'
import { isValidLink } from '../lib/isValidLink'
import { ReactEditor, useSlateStatic } from 'slate-react'

export const EditLink = ({ entry }: TBToolComponentProps) => {
  const [node, path] = entry || []

  const [url, seturl] = useState<string>(TextbitElement.isElement(node) && typeof node?.properties?.url === 'string' ? node.properties.url : '')
  const inputRef = useRef<HTMLInputElement>(null)
  const editor = useSlateStatic()

  if (!TextbitElement.isElement(node)) {
    return <></>
  }

  return <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px'
  }}>
    <div
      onMouseDown={(e) => {
        e.preventDefault()
        deleteLink(editor)
      }}
    >
      <span className="text-red-600">X</span>
    </div>

    <input
      id={node.id}
      ref={inputRef}
      type="text"
      value={url}
      onMouseDownCapture={(e) => {
        e.stopPropagation()
        e.preventDefault()
        e.currentTarget.focus()
      }}
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
        if (url === '') {
          deleteLink(editor)
        } else {
          Transforms.setNodes(
            editor,
            { properties: { ...node.properties, url } },
            { at: path }
          )
        }
      }}
    />

    <div
      onMouseDown={(e) => {
        if (!isValidLink(url, true)) {
          e.preventDefault()
          e.stopPropagation()
        }
      }}
    >
      {isValidLink(url, true)
        ? <a href={url} style={{color: 'green', textDecoration: 'none'}} target="_blank" rel="noopener noreferrer">L</a>
        : <span style={{color: 'red', textDecoration: 'line-through'}}>L</span>
      }
    </div>
  </div >
}


const deleteLink = (editor: Editor): void => {
  Transforms.unwrapNodes(editor, {
    match: n => !Editor.isEditor(n) && Element.isElement(n) && n.type === 'core/link'
  })
}
