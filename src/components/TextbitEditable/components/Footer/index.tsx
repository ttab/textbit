import React from 'react' // Necessary for esbuild
import './style.css'

type FooterProps = {
  stats: {
    words: number
    characters: number
  }
}

export const Footer = ({ stats }: FooterProps) => {
  return (
    <div
      className="textbit-editor-footer font-ui text-sm"
    >
      <div>
        Words: <strong>{stats.words}</strong>
      </div>
      <div>
        Characters: <strong>{stats.characters}</strong>
      </div>
    </div>
  )
}
