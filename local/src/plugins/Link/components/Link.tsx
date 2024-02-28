import React, { useState, useEffect } from 'react'
import { Plugin } from '../../../../../src'

export const Link = ({ attributes, children, element }: Plugin.ComponentProps): JSX.Element => {
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
      {...attributes}
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


/**
 * Validate that a string is using a allowed scheme or no scheme at all. If enforceScheme is true
 * it will require a valid scheme to be present. This is not 100% foolproof but ensures that some
 * attacks as adding javascript:// scheme to a link is not possible.
 *
 * @param str
 * @param enforceScheme
 * @returns
 */
function isValidLink(link: string, enforceScheme: boolean = false): boolean {
  const allowedSchemes = ['http:', 'https:', 'mailto:', 'tel:']

  if (typeof link !== 'string') {
    return false
  }

  const sanitizedLink = link.trim()
  if (sanitizedLink === '') {
    return false
  }

  try {
    const url = new URL(sanitizedLink)
    return allowedSchemes.includes(url.protocol)
  } catch (ex) {
    if (enforceScheme) {
      return false
    }
  }

  try {
    const url = new URL(sanitizedLink, document.location.origin)
    return url.origin === document.location.origin && allowedSchemes.includes(url.protocol)
  } catch (ex) {
    return false
  }
}
