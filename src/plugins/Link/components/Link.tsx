import { useState, useEffect } from 'react'
import type { TBComponentProps } from '@ttab/textbit'
import { isValidLink } from '../lib/isValidLink'

export const Link = ({ children, element }: TBComponentProps) => {
  const url: string = element.properties?.url as string || ''
  const [isPressed, setIsPressed] = useState<boolean>(false)
  const [isHovering, setIsHovering] = useState<boolean>(false)

  useEffect(() => {
    const keyDownListener = (event: KeyboardEvent): void => {
      if (isPressed !== (event.metaKey || event.ctrlKey)) {
        setIsPressed(true)
      }
    }
    window.document.addEventListener('keydown', keyDownListener)

    const keyUpListener = (event: KeyboardEvent): void => {
      if (isPressed !== (event.metaKey || event.ctrlKey)) {
        setIsPressed(false)
      }
    }
    window.document.addEventListener('keyup', keyUpListener)

    return () => {
      window.document.removeEventListener('keydown', keyDownListener)
      window.document.removeEventListener('keyup', keyUpListener)
    }
  })

  return (
    <a
      className={`underline decoration-2 underline-offset-4 ${isValidLink(url) ? 'decoration-blue-300' : 'decoration-wavy decoration-red-400'}`}
      href={url}
      onClick={(event) => {
        if (event.ctrlKey || event.metaKey) {
          window.open(url, '_blank')
        }
      }}
      onMouseEnter={() => {
        setIsHovering(true)
      }}
      onMouseLeave={() => {
        setIsHovering(false)
      }}
      title={`${element.properties?.title || ''}`}
      style={{
        textDecorationStyle: isValidLink(url) ? 'solid' : 'wavy',
        cursor: isHovering && isPressed ? 'pointer' : 'auto'
      }}
    >
      {children}
    </a>
  )
}
