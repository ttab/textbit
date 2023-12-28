import React, { PropsWithChildren } from 'react' // Necessary for esbuild
import './style.css'
import { TextbitProvider } from './TextbitContext'

export const Textbit = ({ children }: PropsWithChildren) => {
  return (
    <div className="textbit textbit-editor">
      <TextbitProvider>
        {children}
      </TextbitProvider>
    </div>
  )
}
