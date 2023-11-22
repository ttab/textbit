import React from 'react' // Necessary for esbuild
import { PropsWithChildren, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useFocused, useSlate } from 'slate-react'
import { Editor, Range, Element as SlateElement, BaseRange, NodeEntry, Node } from 'slate'
import { toggleLeaf } from '../../../../lib/toggleLeaf'
import { isFromTarget } from '../../../../lib/target'
import './inline.css'
import { RegistryAction } from '../../registry'
import { hasMark } from '@/lib/hasMark'

const Portal = ({ children }: PropsWithChildren) => {
  return typeof document === 'object'
    ? ReactDOM.createPortal(children, document.body)
    : null
}

type InlineToolbarProps = {
  actions: RegistryAction[]
}

type InlineToolProps = {
  action: RegistryAction
}

type AlternateInlineToolProps = {
  action: RegistryAction,
  node: NodeEntry<Node>
}

function handleVisibility(el: HTMLDivElement | null, editor: Editor, inFocus: boolean) {
  const selection = editor.selection

  const hide = () => {
    if (!el) { return }
    el.style.opacity = '0'
    el.style.top = '-10000px'
    el.style.left = '-10000px'
  }

  if (!el || !selection) {
    return hide()
  }

  // TODO: Inline/leaf plugins should be able to signal that they need to
  // have the inline menu visible. The link plugin must show it's href
  // etc witouth forcing the user to select the whoe link. This could
  // apply to other plugins as well. Right now this will always show the
  // inline toolbar if the selection is collapsed on an inline node.
  if (Range.isCollapsed(selection)) {
    const nodes = Array.from(Editor.nodes(editor, {
      at: selection,
      match: n => SlateElement.isElement(n) && n.class === 'inline'
    }))

    if (!nodes.length) {
      return hide()
    }
  }
  else if (!inFocus || Editor.string(editor, selection) === '') {
    return hide()
  }

  const domSelection = window.getSelection()
  if (!domSelection) {
    return hide()
  }

  const domRange = domSelection.getRangeAt(0)
  const rect = domRange.getBoundingClientRect()

  const newTop = rect.top + window.pageYOffset - el.offsetHeight
  const newLeft = rect.left + window.pageXOffset - el.offsetWidth / 2 + rect.width / 2

  if (newTop < 0 || newLeft < 0) {
    return
  }

  el.style.opacity = '1'
  el.style.top = `${rect.top + window.pageYOffset - el.offsetHeight}px`
  el.style.left = `${rect.left +
    window.pageXOffset -
    el.offsetWidth / 2 +
    rect.width / 2}px`
}


/**
 * Inline toolbar component
 */
export const InlineToolbar = ({ actions = [] }: InlineToolbarProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const editor = useSlate()
  const inFocus = useFocused()

  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      // Close inline menu when editor content menu is handled
      if (isFromTarget(e.target as HTMLElement, { className: 'editor-content-menu-anchor' })) {
        if (ref.current) {
          ref.current.style.opacity = '0'
        }
      }
    }

    window.addEventListener('click', clickHandler, { passive: true })
    return () => { window.removeEventListener('click', clickHandler) }
  }, [])

  useEffect(() => {
    handleVisibility(ref?.current, editor, inFocus)
  })

  if (!editor.selection) {
    return <></>
  }


  const range = Editor.unhangRange(editor, editor.selection as BaseRange)
  const isCollapsed = Range.isCollapsed(range)

  const [inlineNode] = Array.from(Editor.nodes(editor, {
    at: editor.selection,
    match: n => SlateElement.isElement(n) && n.class === 'inline'
  }))

  const inlineEl = inlineNode && inlineNode.length ? inlineNode[0] : null
  const leafActions = actions.filter((action: RegistryAction) => action.tool && action.plugin.class === 'leaf')
  const inlineActions = actions.filter((action: RegistryAction) => action.tool && action.plugin.class === 'inline')
  const inlineNodeAction = actions.find((action: RegistryAction) => action.tool && SlateElement.isElement(inlineEl) && action.plugin.name === inlineEl?.type)

  const showCurrentTool = !!inlineNodeAction && isCollapsed && Array.isArray(inlineNodeAction?.tool)
  const showInlineTools = !isCollapsed && !inlineNode && inlineActions.length > 0
  const showLeafTools = !isCollapsed && leafActions.length > 0

  return <Portal>
    <div
      ref={ref}
      className="textbit textbit-inline-menu"
      onMouseDown={(e) => {
        // Prevent clicks (between tool groups) taking focus from editor
        e.preventDefault()
      }}
    >
      {(showLeafTools || showInlineTools || showCurrentTool) &&
        <>
          {(!isCollapsed || inlineNode) &&
            <>
              {/* First group contains normal leafs, but only if it is not collapsed */}
              {showLeafTools &&
                <ToolGroup>
                  {leafActions.map((action, idx) =>
                    <ToolButton
                      key={`${action.plugin.class}-${action.plugin.name}--${idx}`}
                      action={action}
                    />
                  )}
                </ToolGroup>
              }

              {/* Second group with normal inline tools if no inline nodes are selected */}
              {showInlineTools &&
                <ToolGroup>
                  {inlineActions.map((action, idx) =>
                    <ToolButton
                      key={`${action.plugin.class}-${action.plugin.name}-${idx}`}
                      action={action}
                    />
                  )}
                </ToolGroup>
              }

              {/* When just one inlime tool (second (del) and third tool (edit)) */}
              {/*should be shown (if it has multiple tools) */}
              {showCurrentTool &&
                <ToolGroup>
                  <InlineTool
                    key={`${inlineNodeAction.plugin.class}-${inlineNodeAction.plugin.name}`}
                    action={inlineNodeAction}
                    node={inlineNode}
                  />
                </ToolGroup>
              }

            </>
          }
        </>}
    </div>
  </Portal>
}

export const ToolGroup = ({ children }: PropsWithChildren) => {
  return <div className="textbit-tool-group">
    {children}
  </div>
}

/**
 * Inline toolbar button component
 */
const ToolButton = ({ action }: InlineToolProps) => {
  const editor = useSlate()
  const isActive = hasMark(editor, action.plugin.name)

  return <div
    className={`textbit-tool`}
    onMouseDown={(e) => {
      e.preventDefault()
      if (true === action.handler({ editor })) {
        toggleLeaf(editor, action.plugin.name)
      }
    }}
  >
    <>
      {!Array.isArray(action.tool) ? action.tool : action.tool[0]}
      <em className={`${isActive ? 'active' : ''}`}></em>
    </>
  </div>
}


/**
 * Alternative inline toolbar button component (handles tool 1 and 2 in tool array)
 */
const InlineTool = ({ action, node }: AlternateInlineToolProps) => {
  const editor = useSlate()

  if (!Array.isArray(action.tool)) {
    return <></>
  }

  return <>
    {action.tool[1] && typeof action.tool[1] === 'function' &&
      <>{action.tool[1](editor, node)}</>
    }
  </>
}
