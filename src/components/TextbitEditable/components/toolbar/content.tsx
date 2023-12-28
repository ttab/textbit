
import React, { useRef, useEffect, PropsWithChildren } from 'react'
import ReactDOM from 'react-dom'
import { useFocused, useSlate, useSlateSelection } from 'slate-react'
import { Editor, Element as SlateElement } from 'slate'

import { modifier } from '@/lib/modifier'
import { HiDotsVertical } from 'react-icons/hi'
import { MdCheck } from 'react-icons/md'
import { isFromTarget } from '@/lib/target'
import { RegistryAction } from '@/components/Registry'

import './content.css'


const Portal = ({ children }: PropsWithChildren) => {
  return typeof document === 'object'
    ? ReactDOM.createPortal(children, document.body)
    : null
}

type ContentToolbarProps = {
  actions: RegistryAction[]
}

type ContentToolProps = {
  action: RegistryAction
  toggleIsOpen: (newState: boolean) => void
}

export const ContentToolbar = ({ actions = [] }: ContentToolbarProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const inFocus = useFocused()
  const selection = useSlateSelection()

  const toggleIsOpen = () => {
    const cls = ref.current?.classList
    if (cls?.contains('open')) {
      cls?.remove('open')
    }
    else {
      cls?.add('open')
    }
  }

  const isOpen = () => {
    return !!ref.current?.classList.contains('open')
  }

  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (!isFromTarget(e.target as HTMLElement, { className: 'textbit-content-menu-anchor' })) {
        if (isOpen()) {
          toggleIsOpen()
        }
      }
    }

    window.addEventListener('click', clickHandler, { passive: true })
    return () => { window.removeEventListener('click', clickHandler) }
  }, [])

  useEffect(() => {
    const el = ref.current
    const domSelection = window.getSelection()

    if (!el) {
      return
    }

    if (!el || !selection || !inFocus || !domSelection) {
      el.style.display = 'none'
      return
    }

    const domRange = domSelection.getRangeAt(0)
    const originEl: HTMLElement = domRange.commonAncestorContainer.parentElement as HTMLElement
    if (originEl === null) {
      el.style.display = 'none'
      return
    }

    let parentEl: HTMLElement | null = null
    let iteratorEl: HTMLElement | null = originEl as HTMLElement

    while (iteratorEl) {
      iteratorEl = iteratorEl.parentElement
      if (iteratorEl?.classList.contains('textbit-parent')) {
        parentEl = iteratorEl
        break
      }
    }

    if (!parentEl) {
      el.style.display = 'none'
      return
    }

    const originStyle = window.getComputedStyle(originEl)
    const lineHeight = parseFloat(originStyle.lineHeight)
    // Default being 19.2 is derived from most browsers having default 1.2rem.
    // 1rem is mostly 16px, 1.2rem in px are 19.2px
    const offsetHeight = (lineHeight | 19.2 - parseFloat(originStyle.fontSize)) / 2
    const rect = parentEl.getBoundingClientRect()
    const topOffset = parseFloat(window.getComputedStyle(parentEl).paddingTop)
    const newTop = rect.top + window.scrollY + topOffset + offsetHeight

    // Left offset is based on menu button being 2 rem in a 4.2 rem wide column + 1 px border
    const offsetLeft = parseFloat(getComputedStyle(document.documentElement).fontSize) + 1
    const newLeft = rect.left + offsetLeft

    el.style.display = 'block'
    el.style.top = `${newTop}px`
    el.style.left = `${newLeft}px`
  })

  const textActions = actions.filter(action => 'text' === action.plugin.class)
  const textblockActions = actions.filter(action => 'textblock' === action.plugin.class)
  const blockActions = actions.filter(action => 'block' === action.plugin.class)

  return <Portal>
    <div ref={ref} className="textbit-content-menu">
      <a
        className="textbit-content-menu-anchor"
        onMouseDown={(e) => {
          e.preventDefault()
          toggleIsOpen()
        }}
      >
        <HiDotsVertical />
      </a>

      <div className="">
        <>
          {textActions.length > 0 &&
            <ToolGroup>
              {textActions.map((action) => {
                return <MenuItem
                  key={`${action.plugin.class}-${action.plugin.name}-${action.title}`}
                  action={action}
                  toggleIsOpen={toggleIsOpen}
                />
              })}
            </ToolGroup>
          }

          {textblockActions.length > 0 &&
            <ToolGroup>
              {textblockActions.map((action) => {
                return <MenuItem
                  key={`${action.plugin.class}-${action.plugin.name}-${action.title}`}
                  action={action}
                  toggleIsOpen={toggleIsOpen}
                />
              })}
            </ToolGroup>
          }

          {blockActions.length > 0 &&
            <ToolGroup>
              {blockActions.map((action) => {
                return <MenuItem
                  key={`${action.plugin.class}-${action.plugin.name}-${action.title}`}
                  action={action}
                  toggleIsOpen={toggleIsOpen}
                />
              })}
            </ToolGroup>
          }
        </>
      </div>
    </div >
  </Portal>
}

const ToolGroup = ({ children }: PropsWithChildren) => {
  return <div className="textbit-tool-group">
    {children}
  </div>
}

const MenuItem = ({ action, toggleIsOpen }: ContentToolProps) => {
  const editor = useSlate()
  const isActive = isBlockActive(editor, action)
  const tool = React.isValidElement(action.tool) ? action.tool : undefined

  return (
    <a
      className="textbit-content-menu-item"
      onMouseDown={(e) => {
        e.preventDefault()
        toggleIsOpen(false)
        action.handler({ editor })
      }}
    >
      {isActive &&
        <span className="textbit-content-menu-item-icon active"><MdCheck /></span>
      }
      {!isActive && tool &&
        <span className="textbit-content-menu-item-icon">{tool}</span>
      }
      {!isActive && !tool &&
        <span></span>
      }

      <span>{action.title}</span>
      <span className="weaker">{modifier(action?.hotkey || '')}</span>
    </a>
  )
}

const isBlockActive = (editor: Editor, action: any): [boolean, boolean, boolean] => {
  const { selection } = editor
  if (!selection) {
    return [false, false, false]
  }

  // FIXME: This should not be for each tool, it would be enough once
  const [match] = Array.from(
    Editor.nodes(editor, {
      at: Editor.unhangRange(editor, selection),
      match: el => {
        return !Editor.isEditor(el) &&
          SlateElement.isElement(el)
      }
    })
  )

  if (!match.length) {
    return [false, false, false]
  }

  if (!action?.visibility) {
    return [false, false, false]
  }

  const [visible, enabled, active] = action?.visibility(match[0])
  return active
}
