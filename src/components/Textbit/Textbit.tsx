import React, { PropsWithChildren } from 'react' // Necessary for esbuild
import './style.css'
import { TextbitContextProvider } from './TextbitContext'

export const Textbit = ({ children }: PropsWithChildren) => {
  return (
    <div className="textbit textbit-editor">
      <TextbitContextProvider>
        {children}
      </TextbitContextProvider>
    </div>
  )
}
