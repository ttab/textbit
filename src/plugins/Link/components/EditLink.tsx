import { useState, useRef, useEffect } from 'react'
import { Editor, Element, Transforms } from 'slate'
import {
  type TBToolComponentProps,
  TextbitElement
} from '@ttab/textbit'
import { isValidLink } from '../lib/isValidLink'

export const EditLink = ({ editor, entry }: TBToolComponentProps) => {
  const [node, path] = entry || []

  const [url, seturl] = useState<string>(TextbitElement.isElement(node) && typeof node?.properties?.url === 'string' ? node.properties.url : '')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!isValidLink(url, true)) {
      inputRef.current?.focus()
    }
  }, [url])

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
      // onClick={(e) => { e.currentTarget.focus() }}
      onChange={(e) => {
        seturl(e.target.value)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
          e.preventDefault()

          if (url === '') {
            deleteLink(editor)
          }
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
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {isValidLink(url, true)
        ? <span style={{color: 'green'}}>L</span>
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
