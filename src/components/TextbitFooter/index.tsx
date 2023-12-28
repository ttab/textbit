import React from 'react' // Necessary for esbuild
import { useTextbitContext } from '../Textbit'
import './style.css'

export const TextbitFooter = () => {
  const { words, characters } = useTextbitContext()

  return (
    <div
      className="textbit-editor-footer font-ui text-sm"
    >
      <div>
        Words: <strong>{words}</strong>
      </div>
      <div>
        Characters: <strong>{characters}</strong>
      </div>
    </div>
  )
}
